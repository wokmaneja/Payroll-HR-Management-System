const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

if (fs.existsSync('.env')) {
    const envConfig = fs.readFileSync('.env', 'utf8').split('\n');
    envConfig.forEach(line => {
        const parts = line.split('=');
        if(parts.length >= 2) process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
}

// ─── Hardware License Security ───────────────────────────────────────────────
const MACHINE_ID = machineIdSync({original: true});
const HARDWARE_KEY = crypto.createHash('sha256').update(MACHINE_ID).digest();

function encryptLicense(payload) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', HARDWARE_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag
    };
}

function decryptLicense(encryptedObj) {
    try {
        if (!encryptedObj || !encryptedObj.iv) return null;
        const iv = Buffer.from(encryptedObj.iv, 'hex');
        const authTag = Buffer.from(encryptedObj.authTag, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', HARDWARE_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        return null; // Decryption failed (hardware mismatch or tampered data)
    }
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
const port = process.env.PORT || 5050;

// Global Error Handler to queue errors locally
const logErrorLocally = (errTitle, errStack) => {
    try {
        const errorDoc = {
            _id: 'err-' + Date.now() + Math.floor(Math.random()*1000),
            title: errTitle,
            stack: errStack,
            time: new Date().toISOString()
        };
        if (typeof db !== 'undefined') {
            db.run("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", [errorDoc._id, 'pending_errors', JSON.stringify(errorDoc)], () => {});
        } else {
            console.error("DB not ready, lost error:", errTitle);
        }
    } catch(e) {}
};

process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
    logErrorLocally(err.message, err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logErrorLocally(reason?.message || 'Unhandled Rejection', reason?.stack || String(reason));
});
const host = '0.0.0.0'; // Bind to 0.0.0.0 for local network access (protected by auth middleware)

// ─── Version Info ────────────────────────────────────────────────────────────
const APP_VERSION = '1.0.0';
const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO  = 'Payroll-HR-Management-System';
// ─────────────────────────────────────────────────────────────────────────────

// SECURITY FIX: Removed app.use(cors()) to prevent CSRF exploits from malicious sites. 
// Same-origin requests from the bundled frontend will continue to work normally.
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Authentication Middleware ───────────────────────────────────────────────
const activeSessions = new Map(); // token -> user object

app.post('/api/auth/login', async (req, res) => {
    try {
        // Hardware License Lock Check
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) {
            return res.status(402).json({ error: 'License Required', reason: 'missing' });
        }
        const dbLicense = JSON.parse(licRows[0].data);
        const licenseData = decryptLicense(dbLicense);
        
        if (!licenseData) {
            return res.status(403).json({ error: 'Hardware Mismatch', reason: 'hardware' });
        }
        
        const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        let currentCompanyName = '';
        if (compRows.length > 0) {
            const compData = JSON.parse(compRows[0].data);
            currentCompanyName = (compData.name || '').trim();
        }
        if (licenseData.company && licenseData.company !== currentCompanyName) {
            return res.status(403).json({ error: 'Company Mismatch', reason: 'company' });
        }

        if (new Date(licenseData.expires) < new Date()) {
            console.log('[License] License expired locally. Attempting auto-renewal sync...');
            await verifyRemoteLicense(licenseData);
            
            const updatedRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
            if (updatedRows.length > 0) {
                 const newDbLicense = JSON.parse(updatedRows[0].data);
                 const newLicenseData = decryptLicense(newDbLicense);
                 if (!newLicenseData || new Date(newLicenseData.expires) < new Date()) {
                     return res.status(402).json({ error: 'License Expired', reason: 'expired' });
                 }
                 licenseData = newLicenseData;
            } else {
                 return res.status(402).json({ error: 'License Required', reason: 'missing' });
            }
        }

        const { username, password } = req.body;
        const rows = await runQuery("SELECT data FROM docs WHERE collection = 'users'");
        const users = rows.map(r => JSON.parse(r.data));
        const found = users.find(u => u.username === username && u.password === password);
        
        if (!found) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        
        // Remove password before sending/storing session
        const safeUser = { ...found };
        delete safeUser.password;
        
        activeSessions.set(token, safeUser);

        // Silently verify remote license status in the background
        verifyRemoteLicense(licenseData).catch(e => console.error('[License Check]', e.message));

        res.json({ token, user: safeUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function verifyRemoteLicense(licenseData) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&labels=license-activation`;
        const result = await httpsGet(url);
        if (result.status === 200) {
            const issues = JSON.parse(result.body);
            
            // Find all issues related to our license key
            const keyIssues = issues.filter(issue => issue.body && issue.body.includes(`**License Key:** ${licenseData.key}`));
            
            if (keyIssues.length > 0) {
                // Find if any of these issues is active AND belongs to our machine
                const ourActiveIssue = keyIssues.find(issue => issue.state === 'open' && issue.body.includes(`**Machine ID:** ${MACHINE_ID}`));
                
                if (!ourActiveIssue) {
                    // The license was closed, unlocked, or transferred to another machine
                    console.log(`[License] Remote license deactivated or transferred for ${licenseData.key}. Erasing local license.`);
                    await runExec("DELETE FROM docs WHERE id = 'app_license' AND collection = 'settings'");
                    return false;
                } else {
                    // We have an active issue. Check if it was renewed.
                    const expiresMatch = ourActiveIssue.body.match(/\*\*Expires:\*\* (.*)/);
                    const planMatch = ourActiveIssue.body.match(/\*\*Plan:\*\* (.*)/);
                    if (expiresMatch) {
                        const remoteExpires = new Date(expiresMatch[1].trim());
                        const localExpires = new Date(licenseData.expires);
                        if (remoteExpires > localExpires) {
                            console.log(`[License] Auto-Renewal detected. Updating expiry.`);
                            const newLicenseData = {
                                key: licenseData.key,
                                company: licenseData.company,
                                plan: planMatch ? planMatch[1].trim() : licenseData.plan,
                                expires: remoteExpires.toISOString()
                            };
                            const encrypted = encryptLicense(newLicenseData);
                            await runExec("UPDATE docs SET data = ? WHERE id = 'app_license' AND collection = 'settings'", [JSON.stringify(encrypted)]);
                        }
                    }
                }
            }
        }
    } catch(err) {
        // Silently ignore network errors so offline users aren't locked out
    }
}

app.post('/api/auth/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        if (!activeSessions.has(token)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = activeSessions.get(token);
        const { currentPassword, newPassword } = req.body;
        const rows = await runQuery("SELECT data FROM docs WHERE id = ? AND collection = 'users'", [user._id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const userDoc = JSON.parse(rows[0].data);
        if (userDoc.password !== currentPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }
        userDoc.password = newPassword;
        userDoc._updated = new Date().toISOString();
        await runExec("UPDATE docs SET data = ? WHERE id = ? AND collection = 'users'", [JSON.stringify(userDoc), user._id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/public/company', async (req, res) => {
    try {
        const rows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        if (rows.length > 0) {
            const data = JSON.parse(rows[0].data);
            res.json({ name: data.name });
        } else {
            res.json({ name: '' });
        }
    } catch (err) {
        res.json({ name: '' });
    }
});


// ─── License Endpoints ───────────────────────────────────────────────────────
app.get('/api/license/status', async (req, res) => {
    try {
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) return res.json({ status: 'missing' });
        
        const dbLicense = JSON.parse(licRows[0].data);
        const licenseData = decryptLicense(dbLicense);
        
        if (!licenseData) return res.json({ status: 'hardware_mismatch' });
        
        const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        let currentCompanyName = '';
        if (compRows.length > 0) {
            const compData = JSON.parse(compRows[0].data);
            currentCompanyName = (compData.name || '').trim();
        }
        if (licenseData.company && licenseData.company !== currentCompanyName) {
            return res.json({ status: 'company_mismatch' });
        }
        
        const now = new Date();
        const exp = new Date(licenseData.expires);
        if (exp < now) return res.json({ status: 'expired', expires: licenseData.expires });
        
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
        const daysLeft = Math.round((expDate - nowDate) / (1000 * 60 * 60 * 24));
        res.json({ status: 'active', plan: licenseData.plan, expires: licenseData.expires, daysLeft });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

app.post('/api/license/activate', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key || !key.startsWith('WM-')) return res.status(400).json({ error: 'Invalid license key format.' });
        
        // Mock validation with duration parsing
        const plan = key.includes('-PRO-') ? 'pro' : 'enterprise';
        
        let addMonths = 12; // default 1 year
        if (key.includes('-1M-')) addMonths = 1;
        else if (key.includes('-3M-')) addMonths = 3;
        else if (key.includes('-6M-')) addMonths = 6;
        else if (key.includes('-1Y-')) addMonths = 12;
        else if (key.includes('-2Y-')) addMonths = 24;
        else if (key.includes('-5Y-')) addMonths = 60;
        
        let expires = new Date();
        const existingLic = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (existingLic.length > 0) {
            const oldLic = decryptLicense(JSON.parse(existingLic[0].data));
            if (oldLic && new Date(oldLic.expires) > new Date()) {
                expires = new Date(oldLic.expires); // Extend from current expiry
            }
        }
        expires.setMonth(expires.getMonth() + addMonths);
        
        const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        let companyName = '';
        if (compRows.length > 0) {
            const compData = JSON.parse(compRows[0].data);
            companyName = (compData.name || '').trim();
        }

        const payload = {
            key: key,
            plan: plan,
            expires: expires.toISOString(),
            machineId: MACHINE_ID,
            company: companyName
        };
        
        const encrypted = encryptLicense(payload);
        encrypted._id = 'app_license';
        
        const existing = await runQuery("SELECT id FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (existing.length > 0) {
            await runExec("UPDATE docs SET data = ? WHERE id = 'app_license' AND collection = 'settings'", [JSON.stringify(encrypted)]);
        } else {
            await runExec("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", ['app_license', 'settings', JSON.stringify(encrypted)]);
        }
        // Notify GitHub that this license has been used
        try {
            const githubToken = process.env.GITHUB_PAT || 'YOUR_GITHUB_PAT_HERE';
            if (githubToken !== 'YOUR_GITHUB_PAT_HERE') {
                const issueBody = `**License Key:** ${key}\n**Company:** ${companyName || 'N/A'}\n**Machine ID:** ${MACHINE_ID}\n**Plan:** ${plan.toUpperCase()}\n**Expires:** ${expires.toISOString()}`;
                fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'WokManeja-App'
                    },
                    body: JSON.stringify({
                        title: `License Activated: ${key}`,
                        body: issueBody,
                        labels: ['license-activation']
                    })
                }).catch(err => console.error('Failed to notify GitHub:', err));
            } else {
                console.warn('GITHUB_PAT not set. Skipping GitHub notification.');
            }
        } catch (e) {
            console.error('Error in GitHub notification block:', e);
        }
        
        res.json({ success: true, plan, expires: payload.expires });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

app.post('/api/license/trial', async (req, res) => {
    try {
        const trialRows = await runQuery("SELECT data FROM docs WHERE id = 'app_trial' AND collection = 'settings'");
        if (trialRows.length > 0) {
            return res.status(403).json({ error: 'Trial Already Used', reason: 'You have already activated a trial on this server.' });
        }
        
        const expires = new Date();
        expires.setDate(expires.getDate() + 14); // 14 day trial
        
        const payload = {
            key: 'TRIAL-14-DAYS',
            plan: 'trial',
            expires: expires.toISOString(),
            machineId: MACHINE_ID
        };
        
        const encrypted = encryptLicense(payload);
        encrypted._id = 'app_license';
        
        const existing = await runQuery("SELECT id FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (existing.length > 0) {
            await runExec("UPDATE docs SET data = ? WHERE id = 'app_license' AND collection = 'settings'", [JSON.stringify(encrypted)]);
        } else {
            await runExec("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", ['app_license', 'settings', JSON.stringify(encrypted)]);
        }
        
        // Record that trial was used so they can't do it again
        await runExec("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", ['app_trial', 'settings', JSON.stringify({ _id: 'app_trial', used: true, activatedAt: new Date().toISOString() })]);
        
        res.json({ success: true, plan: 'trial', expires: payload.expires });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────

// Protect all /api/ routes (except login & license endpoints)
app.use('/api', (req, res, next) => {
    // allow auth & license endpoints
    if (req.path.startsWith('/auth/') || req.path.startsWith('/license/') || req.path.startsWith('/public/')) return next();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!activeSessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }
    
    req.user = activeSessions.get(token);
    next();
});
// ─────────────────────────────────────────────────────────────────────────────

// Determine data directory (outside executable if packaged)
const isPkg = typeof process.pkg !== 'undefined';
const dataPath = isPkg ? path.dirname(process.execPath) : __dirname;

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dataPath, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS docs (
            id TEXT,
            collection TEXT,
            data TEXT,
            PRIMARY KEY (id, collection)
        )`, () => {
            if (typeof setupAutoBackup === 'function') setupAutoBackup();
            
            // Install Telemetry
            db.all("SELECT id FROM docs WHERE id = 'install_reported' AND collection = 'settings'", [], (err, rows) => {
                if (!err && rows.length === 0) {
                    try {
                        const githubToken = process.env.GITHUB_PAT || 'YOUR_GITHUB_PAT_HERE';
                        if (githubToken !== 'YOUR_GITHUB_PAT_HERE') {
                            const fetch = require('node-fetch') || global.fetch;
                            fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `token ${githubToken}`,
                                    'Accept': 'application/vnd.github.v3+json',
                                    'Content-Type': 'application/json',
                                    'User-Agent': 'WokManeja-App'
                                },
                                body: JSON.stringify({
                                    title: `App Installed: v${APP_VERSION}`,
                                    body: `**Machine ID:** ${MACHINE_ID}\n**Version:** ${APP_VERSION}\n**Time:** ${new Date().toISOString()}`,
                                    labels: ['app-install']
                                })
                            }).then(r => {
                                if (r.ok) {
                                    db.run("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", ['install_reported', 'settings', JSON.stringify({ reported: true })]);
                                }
                            }).catch(() => {});
                        }
                    } catch(e) {}
                }
            });

            // Telemetry Heartbeat
            const githubTokenForHeartbeat = process.env.GITHUB_PAT || 'YOUR_GITHUB_PAT_HERE';
            if (githubTokenForHeartbeat !== 'YOUR_GITHUB_PAT_HERE') {
                const fetch = require('node-fetch') || global.fetch;
                
                const pingOnline = async () => {
                    try {
                        let issueNum = null;
                        
                        // Check if we already saved the issue number
                        const issueDoc = await new Promise(res => db.get("SELECT data FROM docs WHERE id = 'install_issue' AND collection = 'settings'", [], (err, row) => res(row)));
                        if (issueDoc && issueDoc.data) {
                            issueNum = JSON.parse(issueDoc.data).issueNumber;
                        }

                        if (!issueNum) {
                            // Find it via API
                            const searchRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?labels=app-install&state=all`, {
                                headers: {
                                    'Authorization': `token ${githubTokenForHeartbeat}`,
                                    'User-Agent': 'WokManeja-App'
                                }
                            });
                            if (searchRes.ok) {
                                const issues = await searchRes.json();
                                const myIssue = issues.find(i => i.body && i.body.includes(MACHINE_ID));
                                if (myIssue) {
                                    issueNum = myIssue.number;
                                    db.run("INSERT OR REPLACE INTO docs (id, collection, data) VALUES (?, ?, ?)", ['install_issue', 'settings', JSON.stringify({ issueNumber: issueNum })]);
                                }
                            }
                        }

                        if (issueNum) {
                            // Fetch existing body to preserve it
                            const issueRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNum}`, {
                                headers: {
                                    'Authorization': `token ${githubTokenForHeartbeat}`,
                                    'User-Agent': 'WokManeja-App'
                                }
                            });
                            if (issueRes.ok) {
                                const issue = await issueRes.json();
                                let body = issue.body || '';
                                if (body.includes('**Last Online:**')) {
                                    body = body.replace(/\*\*Last Online:\*\* .*/, `**Last Online:** ${new Date().toISOString()}`);
                                } else {
                                    body += `\n**Last Online:** ${new Date().toISOString()}`;
                                }
                                
                                await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNum}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `token ${githubTokenForHeartbeat}`,
                                        'Accept': 'application/vnd.github.v3+json',
                                        'Content-Type': 'application/json',
                                        'User-Agent': 'WokManeja-App'
                                    },
                                    body: JSON.stringify({ body })
                                });
                            }
                        }
                    } catch (e) {
                        console.error("Heartbeat error", e);
                    }
                };
                
                // Ping immediately, then every 5 minutes
                setTimeout(pingOnline, 5000);
                setInterval(pingOnline, 5 * 60 * 1000);
            }

            // Seed default admin user if database is completely empty
            db.all("SELECT id FROM docs WHERE collection = 'users'", [], (err, rows) => {
                if (!err && rows.length === 0) {
                    const adminDoc = {
                        _id: 'seed-admin',
                        _created: new Date().toISOString(),
                        name: 'Administrator',
                        username: 'admin',
                        password: 'admin123',
                        role: 'admin'
                    };
                    db.run("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", [adminDoc._id, 'users', JSON.stringify(adminDoc)]);
                    console.log('Seeded default admin user (admin / admin123).');
                }
            });
        });
    }
});

// Helper function to query
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const runExec = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// API: Insert
app.post('/api/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const doc = req.body;
        
        if (!doc._id) {
            doc._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        }
        if (!doc._created) {
            doc._created = new Date().toISOString();
        }
        
        await runExec('INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)', [doc._id, collection, JSON.stringify(doc)]);
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Find All / Find with query
app.get('/api/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const query = req.query;
        
        const rows = await runQuery('SELECT data FROM docs WHERE collection = ?', [collection]);
        let docs = rows.map(r => JSON.parse(r.data));
        
        if (Object.keys(query).length > 0) {
            docs = docs.filter(x => {
                return Object.keys(query).every(k => String(x[k]) === String(query[k]));
            });
        }
        
        res.json(docs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Update
app.put('/api/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const { query, update } = req.body;
        
        const rows = await runQuery('SELECT id, data FROM docs WHERE collection = ?', [collection]);
        let docs = rows.map(r => JSON.parse(r.data));
        
        let updatedCount = 0;
        for (let doc of docs) {
            if (Object.keys(query).every(k => String(doc[k]) === String(query[k]))) {
                Object.assign(doc, update);
                doc._updated = new Date().toISOString();
                await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(doc), doc._id, collection]);
                updatedCount++;
            }
        }
        
        res.json({ success: true, updated: updatedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Remove
app.delete('/api/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const query = req.body;
        
        const rows = await runQuery('SELECT id, data FROM docs WHERE collection = ?', [collection]);
        let docs = rows.map(r => JSON.parse(r.data));
        
        let deletedCount = 0;
        for (let doc of docs) {
            if (Object.keys(query).every(k => String(doc[k]) === String(query[k]))) {
                await runExec('DELETE FROM docs WHERE id = ? AND collection = ?', [doc._id, collection]);
                deletedCount++;
            }
        }
        
        res.json({ success: true, deleted: deletedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Drop collection
app.post('/api/drop/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        await runExec('DELETE FROM docs WHERE collection = ?', [collection]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Count
app.get('/api/count/:collection', async (req, res) => {
    try {
        const collection = req.params.collection;
        const rows = await runQuery('SELECT COUNT(*) as cnt FROM docs WHERE collection = ?', [collection]);
        res.json(rows[0].cnt);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: Export/Import
app.get('/api/admin/export', async (req, res) => {
    try {
        const rows = await runQuery('SELECT id, collection, data FROM docs');
        const exportData = { _exported: new Date().toISOString() };
        rows.forEach(r => {
            if (!exportData[r.collection]) exportData[r.collection] = [];
            exportData[r.collection].push(JSON.parse(r.data));
        });
        res.json(exportData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/admin/import', async (req, res) => {
    try {
        const data = req.body;
        for (const col of Object.keys(data)) {
            if (col === '_exported') continue;
            if (data[col] && Array.isArray(data[col])) {
                for (const doc of data[col]) {
                    if (!doc._id) doc._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                    const existing = await runQuery('SELECT id FROM docs WHERE id = ? AND collection = ?', [doc._id, col]);
                    if (existing.length > 0) {
                        await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(doc), doc._id, col]);
                    } else {
                        await runExec('INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)', [doc._id, col, JSON.stringify(doc)]);
                    }
                }
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── Backup ───────────────────────────────────────────────────────────────────
function performBackup(backupPath, cb) {
    try {
        if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dest = path.join(backupPath, `backup_${stamp}.sqlite`);
        fs.copyFileSync(path.join(dataPath, 'database.sqlite'), dest);
        cb(null, dest);
    } catch (e) { cb(e); }
}

function setupAutoBackup() {
    if (global._backupTimer) clearInterval(global._backupTimer);
    runQuery("SELECT data FROM docs WHERE id = 'backup' AND collection = 'settings'").then(rows => {
        if (!rows.length) return;
        const cfg = JSON.parse(rows[0].data);
        if (!cfg.enabled || !cfg.path) return;
        const ms = cfg.interval === 'hourly' ? 3600000 : cfg.interval === 'weekly' ? 604800000 : 86400000;
        global._backupTimer = setInterval(() => performBackup(cfg.path, () => {}), ms);
        console.log(`Auto-backup enabled every ${cfg.interval} to ${cfg.path}`);
    }).catch(err => console.error("Backup check skipped on first run."));
}
// Initial call moved to DB init callback

app.post('/api/admin/backup-now', (req, res) => {
    const backupPath = req.body.path;
    if (!backupPath) return res.status(400).json({ error: 'Backup path is required.' });
    performBackup(backupPath, (err, dest) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, dest });
    });
});

app.post('/api/admin/backup-config', async (req, res) => {
    try {
        const config = req.body;
        const col = 'settings';
        const docId = 'backup';
        config._id = docId;
        const existing = await runQuery('SELECT id FROM docs WHERE id = ? AND collection = ?', [docId, col]);
        if (existing.length > 0) {
            await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(config), docId, col]);
        } else {
            await runExec('INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)', [docId, col, JSON.stringify(config)]);
        }
        setupAutoBackup();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── Update Management ────────────────────────────────────────────────────────

// Helper: fetch URL via https (no external deps)
function httpsGet(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'WokManeja-Updater', ...opts.headers } };
        https.get(url, options, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                return httpsGet(res.headers.location, opts).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        }).on('error', reject);
    });
}

// Helper: download binary file
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const get = (u) => {
            https.get(u, { headers: { 'User-Agent': 'WokManeja-Updater' } }, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) return get(res.headers.location);
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
        };
        get(url);
    });
}

// GET current version
app.get('/api/admin/version', (req, res) => {
    res.json({ version: APP_VERSION, repo: `${GITHUB_OWNER}/${GITHUB_REPO}` });
});

// Telemetry/Errors endpoints
app.get('/api/admin/pending-errors', async (req, res) => {
    try {
        const rows = await runQuery("SELECT data FROM docs WHERE collection = 'pending_errors'");
        res.json(rows.map(r => JSON.parse(r.data)));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/resolve-errors', async (req, res) => {
    const { action } = req.body; // 'send' or 'discard'
    try {
        const rows = await runQuery("SELECT data FROM docs WHERE collection = 'pending_errors'");
        const errors = rows.map(r => JSON.parse(r.data));
        
        if (action === 'send' && errors.length > 0) {
            // Verify active license before sending
            const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
            if (licRows.length === 0) return res.status(402).json({ error: 'Active License Required' });
            const dbLicense = JSON.parse(licRows[0].data);
            const licenseData = decryptLicense(dbLicense);
            if (!licenseData || new Date(licenseData.expires) < new Date()) {
                return res.status(402).json({ error: 'License Expired' });
            }

            const githubToken = process.env.GITHUB_PAT || 'YOUR_GITHUB_PAT_HERE';
            if (githubToken !== 'YOUR_GITHUB_PAT_HERE') {
                const fetch = require('node-fetch') || global.fetch;
                for (const err of errors) {
                    await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                            'User-Agent': 'WokManeja-App'
                        },
                        body: JSON.stringify({
                            title: `App Error: ${err.title}`,
                            body: `**Machine ID:** ${MACHINE_ID}\n**Time:** ${err.time}\n\n\`\`\`\n${err.stack}\n\`\`\``,
                            labels: ['error-log']
                        })
                    }).catch(console.error);
                }
            }
        }
        
        // Clear all pending errors locally regardless of send or discard
        await runExec("DELETE FROM docs WHERE collection = 'pending_errors'");
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET list of releases from GitHub
app.get('/api/admin/releases', async (req, res) => {
    try {
        // Enforce active license for updates
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) return res.status(402).json({ error: 'Active License Required for Updates' });
        const dbLicense = JSON.parse(licRows[0].data);
        const licenseData = decryptLicense(dbLicense);
        if (!licenseData || new Date(licenseData.expires) < new Date()) {
            return res.status(402).json({ error: 'License Expired. Renew to receive updates.' });
        }

        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
        const result = await httpsGet(url);
        if (result.status !== 200) return res.status(502).json({ error: 'Could not reach GitHub. Check internet connection.' });
        const releases = JSON.parse(result.body);
        // Return simplified list
        const list = releases.map(r => ({
            id: r.id,
            tag: r.tag_name,
            name: r.name || r.tag_name,
            body: r.body || '',
            published: r.published_at,
            prerelease: r.prerelease,
            draft: r.draft,
            zipball_url: r.zipball_url,
            assets: (r.assets || []).map(a => ({ name: a.name, url: a.browser_download_url, size: a.size }))
        }));
        res.json({ current: APP_VERSION, releases: list });
    } catch (err) {
        console.error('Release check error:', err);
        res.status(500).json({ error: 'Failed to fetch releases: ' + err.message });
    }
});

// POST approve and apply an update
app.post('/api/admin/apply-update', async (req, res) => {
    // Enforce active license for updates
    try {
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) return res.status(402).json({ error: 'Active License Required for Updates' });
        const dbLicense = JSON.parse(licRows[0].data);
        const licenseData = decryptLicense(dbLicense);
        if (!licenseData || new Date(licenseData.expires) < new Date()) {
            return res.status(402).json({ error: 'License Expired. Renew to receive updates.' });
        }
    } catch(e) {
        return res.status(500).json({ error: 'Internal Error checking license' });
    }

    const { tag, zipball_url } = req.body;
    if (!tag || !zipball_url) return res.status(400).json({ error: 'Missing tag or zipball_url' });

    // SECURITY FIX: Validate that the zipball URL belongs to the official GitHub repository
    const validUrl1 = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/`;
    const validUrl2 = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/`;
    if (!zipball_url.startsWith(validUrl1) && !zipball_url.startsWith(validUrl2)) {
        console.error('[Updater] Blocked attempt to download from untrusted URL:', zipball_url);
        return res.status(403).json({ error: 'Forbidden: Invalid update source URL' });
    }

    const tmpDir  = path.join(__dirname, '_update_tmp');
    const zipPath = path.join(__dirname, '_update.zip');

    try {
        // 1. Backup database first
        const backupDir = path.join(__dirname, '_update_backups');
        performBackup(backupDir, () => {});

        res.json({ success: true, message: `Downloading update ${tag}...` });

        // 2. Download the zipball
        console.log(`[Updater] Downloading ${tag} from ${zipball_url}`);
        await downloadFile(zipball_url, zipPath);

        // 3. Extract zip using built-in (no adm-zip needed — use child_process on Windows)
        const { execSync } = require('child_process');
        if (fs.existsSync(tmpDir)) execSync(`rmdir /s /q "${tmpDir}"`, { shell: 'cmd.exe' });
        fs.mkdirSync(tmpDir, { recursive: true });
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force"`, { shell: 'cmd.exe' });

        // 4. Find extracted root folder (GitHub zips create a subfolder)
        const entries = fs.readdirSync(tmpDir);
        const extractedRoot = path.join(tmpDir, entries[0]);

        // 5. Copy public/ and server.js (preserve database.sqlite and node_modules)
        const srcPublic = path.join(extractedRoot, 'public');
        const dstPublic = path.join(__dirname, 'public');
        const srcServer = path.join(extractedRoot, 'server.js');

        if (fs.existsSync(srcPublic)) {
            execSync(`xcopy /E /Y /I "${srcPublic}" "${dstPublic}"`, { shell: 'cmd.exe' });
        }
        if (fs.existsSync(srcServer)) {
            fs.copyFileSync(srcServer, path.join(__dirname, 'server.js'));
        }

        // 6. Copy package.json and install new deps if needed
        const srcPkg = path.join(extractedRoot, 'package.json');
        if (fs.existsSync(srcPkg)) {
            fs.copyFileSync(srcPkg, path.join(__dirname, 'package.json'));
            execSync('npm install --omit=dev', { cwd: __dirname, shell: 'cmd.exe' });
        }

        // 7. Cleanup
        execSync(`rmdir /s /q "${tmpDir}"`, { shell: 'cmd.exe' });
        fs.unlinkSync(zipPath);

        console.log(`[Updater] Update ${tag} applied. Restarting...`);
        setTimeout(() => {
            const { spawn } = require('child_process');
            const child = spawn(process.argv[0], process.argv.slice(1), {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            process.exit(0);
        }, 1500);

    } catch (err) {
        console.error('[Updater] Error applying update:', err);
        // Cleanup on failure
        try { if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath); } catch(_){}
    }
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, host, () => {
    console.log(`WokManeja v${APP_VERSION} running at http://${host}:${port}`);
    // Automatically open browser on start
    try {
        const url = `http://localhost:${port}`;
        if (process.platform === 'win32') {
            require('child_process').exec(`start ${url}`);
        } else if (process.platform === 'darwin') {
            require('child_process').exec(`open ${url}`);
        } else {
            require('child_process').exec(`xdg-open ${url}`);
        }
    } catch (e) {
        // Ignore errors if browser can't be opened automatically
    }
});

