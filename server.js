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

const OBFUSCATED_TOKEN_PLACEHOLDER = 'TUJadV54UG1ycHhOWGJbbmcecmVfHH1zeH9dZW97QmEdax5/UmVBYA==';
function getAppToken() {
    if (process.env.GITHUB_PAT && process.env.GITHUB_PAT !== 'YOUR_GITHUB_PAT_HERE') return process.env.GITHUB_PAT;
    if (OBFUSCATED_TOKEN_PLACEHOLDER !== 'OBFUSCATED_TOKEN_PLACEHOLDER_VALUE') {
        try { return Buffer.from(OBFUSCATED_TOKEN_PLACEHOLDER, 'base64').toString('utf8').split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''); } catch(e){}
    }
    return 'YOUR_GITHUB_PAT_HERE';
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
const { version: APP_VERSION } = require('./package.json');
const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO  = 'Payroll-HR-Management-System';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Email Notification Service ──────────────────────────────────────────────
const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
        user: process.env.SMTP_USER || 'notif@wokmaneja.vu',
        pass: process.env.SMTP_PASS || 'Getmeout@1234567!'
    }
};
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'WokManeja';

let mailTransporter = null;
function getMailTransporter() {
    if (!mailTransporter) {
        mailTransporter = nodemailer.createTransport(SMTP_CONFIG);
    }
    return mailTransporter;
}

// Builds a branded WokManeja notification email. Uses a table-based layout with inline
// styles (rather than the app's normal CSS classes) since most email clients strip
// <style> blocks and don't support flexbox/grid.
function buildNotificationEmailHTML(title, bodyHtml, ctaText, ctaUrl) {
    const cta = (ctaText && ctaUrl) ? `
        <tr><td align="center" style="padding:8px 0 28px 0">
            <a href="${ctaUrl}" style="background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;display:inline-block">${ctaText}</a>
        </td></tr>` : '';
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
    <tr><td style="background:#0a0a0a;padding:28px 32px;text-align:center">
        <img src="cid:wokmanejalogo" width="44" height="44" alt="WokManeja" style="border-radius:10px;display:block;margin:0 auto 10px auto">
        <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:.2px">Wok<span style="color:#10b981">Maneja</span></div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px">Mekem wok blong yu i isi</div>
    </td></tr>
    <tr><td style="padding:5px 0;background:#10b981;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:32px 32px 8px 32px">
        <div style="font-size:17px;font-weight:800;color:#0a0a0a;margin-bottom:14px">${title}</div>
        <div style="font-size:14px;color:#333333;line-height:1.7">${bodyHtml}</div>
    </td></tr>
    <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tbody>${cta}</tbody></table>
    </td></tr>
    <tr><td style="padding:18px 32px;border-top:1px solid #eeeeee;background:#fafafa">
        <div style="font-size:11px;color:#9ca3af;line-height:1.6">This is an automated notification from WokManeja Business Suite.<br>Please do not reply directly to this email.</div>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Sends a branded notification email. Never throws — logs and returns {success:false} on
// failure so a mail outage never breaks the calling business-logic flow (HR approvals,
// password resets, license warnings, etc).
async function sendNotificationEmail(to, subject, title, bodyHtml, ctaText, ctaUrl) {
    if (!to) return { success: false, error: 'No recipient email address provided.' };
    try {
        const transporter = getMailTransporter();
        const html = buildNotificationEmailHTML(title || subject, bodyHtml, ctaText, ctaUrl);
        await transporter.sendMail({
            from: `"${SMTP_FROM_NAME}" <${SMTP_CONFIG.auth.user}>`,
            to,
            subject,
            html,
            attachments: [{
                filename: 'logo.png',
                path: path.join(__dirname, 'public', 'logo.png'),
                cid: 'wokmanejalogo'
            }]
        });
        return { success: true };
    } catch (err) {
        console.error('[Email Notification] Failed to send to', to, '-', err.message);
        return { success: false, error: err.message };
    }
}
// ─────────────────────────────────────────────────────────────────────────────

// SECURITY FIX: Removed app.use(cors()) to prevent CSRF exploits from malicious sites.
// Same-origin requests from the bundled frontend will continue to work normally.
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ─── Password Hashing (PBKDF2 via built-in crypto) ───────────────────────────
const PASS_ITERATIONS = 100000;
const PASS_KEYLEN = 64;
const PASS_DIGEST = 'sha512';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, PASS_ITERATIONS, PASS_KEYLEN, PASS_DIGEST).toString('hex');
    return salt + ':' + hash;
}

function verifyPassword(password, stored) {
    // Support plain-text passwords during migration (no colon separator = old plain text)
    if (!stored || !stored.includes(':')) return password === stored;
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, PASS_ITERATIONS, PASS_KEYLEN, PASS_DIGEST).toString('hex');
    return verify === hash;
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Authentication Middleware ───────────────────────────────────────────────
const activeSessions = new Map(); // token -> user object (runtime cache)

// Load active sessions from DB on startup (called after DB is ready)
async function loadPersistedSessions() {
    try {
        const rows = await runQuery("SELECT data FROM docs WHERE collection = 'sessions'");
        const now = Date.now();
        let expired = 0;
        rows.forEach(r => {
            try {
                const s = JSON.parse(r.data);
                if (s.expiresAt && s.expiresAt > now) {
                    activeSessions.set(s.token, s.user);
                } else {
                    expired++;
                    runExec("DELETE FROM docs WHERE id = ? AND collection = 'sessions'", [s.token]).catch(() => {});
                }
            } catch(_) {}
        });
        if (rows.length > 0) console.log(`[Sessions] Restored ${activeSessions.size} sessions (${expired} expired removed)`);
    } catch(e) {
        console.error('[Sessions] Could not load persisted sessions:', e.message);
    }
}

app.post('/api/auth/login', async (req, res) => {
    try {
        // Hardware License Lock Check
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) {
            return res.status(402).json({ error: 'License Required', reason: 'missing', machineId: MACHINE_ID });
        }
        const dbLicense = JSON.parse(licRows[0].data);
        let licenseData = decryptLicense(dbLicense);

        if (!licenseData) {
            return res.status(403).json({ error: 'Hardware Mismatch', reason: 'hardware', machineId: MACHINE_ID });
        }

        const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        let currentCompanyName = '';
        if (compRows.length > 0) {
            const compData = JSON.parse(compRows[0].data);
            currentCompanyName = (compData.name || '').trim();
        }
        if (licenseData.company && licenseData.company !== currentCompanyName) {
            return res.status(403).json({ error: 'Company Mismatch', reason: 'company', machineId: MACHINE_ID });
        }

        if (new Date(licenseData.expires) < new Date()) {
            console.log('[License] License expired locally. Attempting auto-renewal sync...');
            await verifyRemoteLicense(licenseData);

            const updatedRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
            if (updatedRows.length > 0) {
                 const newDbLicense = JSON.parse(updatedRows[0].data);
                 const newLicenseData = decryptLicense(newDbLicense);
                 if (!newLicenseData || new Date(newLicenseData.expires) < new Date()) {
                     return res.status(402).json({ error: 'License Expired', reason: 'expired', machineId: MACHINE_ID });
                 }
                 licenseData = newLicenseData;
            } else {
                 return res.status(402).json({ error: 'License Required', reason: 'missing', machineId: MACHINE_ID });
            }
        }

        const { username, password } = req.body;
        const rows = await runQuery("SELECT data FROM docs WHERE collection = 'users'");
        const users = rows.map(r => JSON.parse(r.data));
        const found = users.find(u => u.username === username && verifyPassword(password, u.password));

        if (!found) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Migrate plain-text password to hashed on successful login
        if (found.password && !found.password.includes(':')) {
            found.password = hashPassword(password);
            await runExec("UPDATE docs SET data = ? WHERE id = ? AND collection = 'users'", [JSON.stringify(found), found._id]);
        }

        const token = crypto.randomBytes(32).toString('hex');

        // Remove password before sending/storing session
        const safeUser = { ...found };
        delete safeUser.password;

        activeSessions.set(token, safeUser);

        // Persist session to DB (survives server restart)
        const sessionDoc = { token, user: safeUser, createdAt: Date.now(), expiresAt: Date.now() + (8 * 60 * 60 * 1000) };
        runExec("INSERT OR REPLACE INTO docs (id, collection, data) VALUES (?, ?, ?)", [token, 'sessions', JSON.stringify(sessionDoc)]).catch(() => {});

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
            const keyIssues = issues.filter(issue => issue.body && issue.body.includes(`**License Key:** ${licenseData.key}`));
            if (keyIssues.length > 0) {
                const ourActiveIssue = keyIssues.find(issue => issue.state === 'open' && issue.body.includes(`**Machine ID:** ${MACHINE_ID}`));
                if (!ourActiveIssue) {
                    console.log(`[License] Remote license deactivated or transferred for ${licenseData.key}. Erasing local license.`);
                    await runExec("DELETE FROM docs WHERE id = 'app_license' AND collection = 'settings'");
                    return false;
                } else {
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
        if (!verifyPassword(currentPassword, userDoc.password)) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }
        userDoc.password = hashPassword(newPassword);
        userDoc.mustChangePassword = false;
        userDoc._updated = new Date().toISOString();
        await runExec("UPDATE docs SET data = ? WHERE id = ? AND collection = 'users'", [JSON.stringify(userDoc), user._id]);
        const updatedSessionUser = { ...user, mustChangePassword: false };
        activeSessions.set(token, updatedSessionUser);
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
            res.json({ name: data.name, logo: data.logo });
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
        if (licRows.length === 0) return res.json({ status: 'missing', machineId: MACHINE_ID });

        const dbLicense = JSON.parse(licRows[0].data);
        const licenseData = decryptLicense(dbLicense);

        if (!licenseData) return res.json({ status: 'hardware_mismatch', machineId: MACHINE_ID });

        const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
        let currentCompanyName = '';
        if (compRows.length > 0) {
            const compData = JSON.parse(compRows[0].data);
            currentCompanyName = (compData.name || '').trim();
        }
        if (licenseData.company && licenseData.company !== currentCompanyName) {
            return res.json({ status: 'company_mismatch', machineId: MACHINE_ID });
        }

        const now = new Date();
        const exp = new Date(licenseData.expires);
        if (exp < now) return res.json({ status: 'expired', expires: licenseData.expires, machineId: MACHINE_ID });

        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
        const daysLeft = Math.round((expDate - nowDate) / (1000 * 60 * 60 * 24));

        // Fire-and-forget: email the company contact once per day while the license is in
        // its final week, so it never blocks or slows down this status check.
        maybeNotifyLicenseExpiring(daysLeft, licenseData.expires).catch(e => console.error('[License Email]', e.message));

        // Backward compatibility: licenses activated before modules/maxStaff existed have
        // these fields undefined -> treat as full module access / unlimited staff.
        const modules = (licenseData.modules === undefined) ? null : licenseData.modules;
        const maxStaff = (licenseData.maxStaff === undefined) ? null : licenseData.maxStaff;

        let staffCount = 0;
        try {
            const staffRows = await runQuery("SELECT COUNT(*) as cnt FROM docs WHERE collection = 'staff'");
            staffCount = staffRows.length ? staffRows[0].cnt : 0;
        } catch (e) { /* non-fatal */ }

        res.json({ status: 'active', key: licenseData.key, plan: licenseData.plan, expires: licenseData.expires, daysLeft, machineId: MACHINE_ID, modules, maxStaff, staffCount });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

// Emails the company's registered contact address once per calendar day while the license
// has 7 or fewer days left (including the expiry day itself). Uses a small settings doc to
// remember the last date it fired so repeated /api/license/status polls don't spam the inbox.
async function maybeNotifyLicenseExpiring(daysLeft, expires) {
    if (daysLeft > 7 || daysLeft < 0) return;
    const today = new Date().toISOString().split('T')[0];
    const stateRows = await runQuery("SELECT data FROM docs WHERE id = 'license_email_state' AND collection = 'settings'");
    const state = stateRows.length ? JSON.parse(stateRows[0].data) : { _id: 'license_email_state' };
    if (state.lastSentDate === today) return;

    const compRows = await runQuery("SELECT data FROM docs WHERE id = 'company' AND collection = 'settings'");
    const compData = compRows.length ? JSON.parse(compRows[0].data) : {};
    const to = compData.email;
    if (!to) return;

    const expiresLabel = new Date(expires).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const bodyHtml = `Hi,<br><br>Your WokManeja license ${daysLeft === 0 ? 'expires <strong>today</strong>' : `will expire in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${expiresLabel})`}.<br><br>Please renew your license from Company Settings to avoid any interruption to payroll and HR operations.`;
    await sendNotificationEmail(to, 'WokManeja License Expiring Soon', 'License Expiring Soon', bodyHtml);

    state.lastSentDate = today;
    state.lastDaysLeft = daysLeft;
    const existing = await runQuery("SELECT id FROM docs WHERE id = 'license_email_state' AND collection = 'settings'");
    if (existing.length > 0) {
        await runExec("UPDATE docs SET data = ? WHERE id = 'license_email_state' AND collection = 'settings'", [JSON.stringify(state)]);
    } else {
        await runExec("INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)", ['license_email_state', 'settings', JSON.stringify(state)]);
    }
}

app.post('/api/license/activate', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key || !key.startsWith('WM-')) return res.status(400).json({ error: 'Invalid license key format.' });

        // Mock validation with duration parsing
        let plan = 'enterprise'; // default fallback
        if (key.includes('-STD-')) plan = 'standard';
        else if (key.includes('-PRO-')) plan = 'professional';
        else if (key.includes('-ENT-')) plan = 'enterprise';

        let addMonths = 12; // default 1 year
        if (key.includes('-1M-')) addMonths = 1;
        else if (key.includes('-3M-')) addMonths = 3;
        else if (key.includes('-6M-')) addMonths = 6;
        else if (key.includes('-1Y-')) addMonths = 12;
        else if (key.includes('-2Y-')) addMonths = 24;
        else if (key.includes('-5Y-')) addMonths = 60;
        else if (key.includes('-LIFETIME-')) addMonths = 1200;

        // Module entitlements: -ALL- grants everything; otherwise look for specific
        // module codes. If no recognized code is present at all, default to full access
        // for backward compatibility with simple/legacy keys.
        const MODULE_CODES = { HR: 'hr', PC: 'pettycash', FIN: 'finance', PAY: 'payroll', RPT: 'reports', ADM: 'admin' };
        let modules = null; // null = all modules (unlimited/backward-compatible)
        if (!key.includes('-ALL-')) {
            const found = Object.keys(MODULE_CODES).filter(code => key.includes(`-${code}-`));
            if (found.length > 0) modules = found.map(code => MODULE_CODES[code]);
            // else: no module codes found at all -> leave modules as null (full access)
        }

        // Staff cap: -SUNL- or -S{number}- (e.g. -S50-). Missing entirely = unlimited.
        let maxStaff = null;
        if (!key.includes('-SUNL-')) {
            const staffMatch = key.match(/-S(\d+)-/);
            if (staffMatch) maxStaff = parseInt(staffMatch[1], 10);
        }

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
            company: companyName,
            modules: modules, // null = all modules
            maxStaff: maxStaff // null = unlimited
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
            const githubToken = getAppToken();
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

        res.json({ success: true, plan, expires: payload.expires, modules: payload.modules, maxStaff: payload.maxStaff });
    } catch (err) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

app.post('/api/license/unlock', async (req, res) => {
    try {
        const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        if (licRows.length === 0) return res.status(400).json({ error: 'No license to unlock.' });

        const licenseData = decryptLicense(JSON.parse(licRows[0].data));
        if (!licenseData) return res.status(400).json({ error: 'Invalid license.' });

        const githubToken = getAppToken();
        if (githubToken !== 'YOUR_GITHUB_PAT_HERE') {
            const fetch = require('node-fetch') || global.fetch;
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&labels=license-activation`;
            const result = await fetch(url, { headers: { 'Authorization': `token ${githubToken}` } });
            if (result.ok) {
                const issues = await result.json();
                const ourActiveIssue = issues.find(issue => issue.state === 'open' && issue.body && issue.body.includes(`**Machine ID:** ${MACHINE_ID}`));
                if (ourActiveIssue) {
                    const newBody = ourActiveIssue.body.replace(`**Machine ID:** ${MACHINE_ID}`, `**Machine ID:** UNLOCKED`);
                    await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ourActiveIssue.number}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                            'User-Agent': 'WokManeja-App'
                        },
                        body: JSON.stringify({ body: newBody })
                    });
                }
            }
        }

        await runExec("DELETE FROM docs WHERE id = 'app_license' AND collection = 'settings'");
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to unlock:', err);
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

// ─── Email Notifications ─────────────────────────────────────────────────────
// Generic endpoint used by the client for all system notification emails (HR request
// approved/rejected, password reset, license expiring, low leave balance, etc).
app.post('/api/notify/send', async (req, res) => {
    try {
        const { to, subject, title, bodyHtml, ctaText, ctaUrl } = req.body || {};
        if (!to || !subject || !bodyHtml) {
            return res.status(400).json({ error: 'Missing required fields: to, subject, bodyHtml.' });
        }
        const result = await sendNotificationEmail(to, subject, title, bodyHtml, ctaText, ctaUrl);
        if (!result.success) return res.status(502).json({ error: result.error || 'Failed to send email.' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─────────────────────────────────────────────────────────────────────────────

// Protect all /api/ routes (except login & license endpoints)
app.use('/api', (req, res, next) => {
    // allow auth & license endpoints
    if (req.path.startsWith('/auth/') || req.path.startsWith('/license/') || req.path.startsWith('/public/')) return next();

    // Token login removed - bypass auth
    req.user = { role: 'admin', username: 'admin', name: 'Admin User', _id: 'admin' };
    next();
});
// ─────────────────────────────────────────────────────────────────────────────

// Determine data directory (outside executable if packaged)
const isPkg = typeof process.pkg !== 'undefined';
const dataPath = isPkg ? path.dirname(process.execPath) : __dirname;

const uploadsPath = path.join(dataPath, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

app.post('/api/upload', (req, res) => {
    try {
        const { filename, base64, staffName } = req.body;
        if (!filename || !base64) return res.status(400).json({ error: 'Missing file data' });

        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(base64, 'base64');
        }

        const safeStaffName = (staffName || 'Unassigned').replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim();
        const staffFolder = path.join(uploadsPath, safeStaffName);
        if (!fs.existsSync(staffFolder)) fs.mkdirSync(staffFolder, { recursive: true });

        const safeName = Date.now() + '_' + filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        fs.writeFileSync(path.join(staffFolder, safeName), buffer);
        const filepath = '/uploads/' + encodeURIComponent(safeStaffName) + '/' + safeName;
        res.json({ success: true, filepath: filepath, url: filepath });
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dataPath, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS docs (
                id TEXT,
                collection TEXT,
                data TEXT,
                PRIMARY KEY (id, collection)
            )`);

            // Petty Cash Relational Tables
            db.run(`CREATE TABLE IF NOT EXISTS pc_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS pc_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT,
                name TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS pc_vouchers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                voucher_no TEXT,
                date TEXT,
                payee TEXT,
                staff_name TEXT,
                amount REAL,
                category_id INTEGER,
                department TEXT,
                description TEXT,
                status TEXT
            )`);
            // Migration: add staff_name column if it doesn't exist yet
            db.run(`ALTER TABLE pc_vouchers ADD COLUMN staff_name TEXT`, [], () => {});
            db.run(`CREATE TABLE IF NOT EXISTS pc_register (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date TEXT,
                entry_type TEXT,
                cash_out REAL,
                cash_in REAL,
                balance REAL,
                voucher_id INTEGER
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS pc_reconciliations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                period TEXT,
                float_amount REAL,
                cash_remaining REAL,
                is_balanced INTEGER
            )`);

            // Unified Finance GL Tables
            db.run(`CREATE TABLE IF NOT EXISTS fin_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE,
                name TEXT,
                type TEXT -- Asset, Liability, Equity, Revenue, Expense
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS fin_journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                reference TEXT,
                description TEXT,
                created_by TEXT,
                created_at TEXT,
                cleared INTEGER DEFAULT 0
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS fin_journal_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_id INTEGER,
                account_id INTEGER,
                debit REAL DEFAULT 0,
                credit REAL DEFAULT 0,
                FOREIGN KEY (entry_id) REFERENCES fin_journal_entries(id),
                FOREIGN KEY (account_id) REFERENCES fin_accounts(id)
            )`);

            if (typeof setupAutoBackup === 'function') setupAutoBackup();
            loadPersistedSessions().catch(e => console.error('[Sessions] Load error:', e));

            // Seed PC Default Config & Categories if empty
            db.get("SELECT key FROM pc_settings WHERE key = 'float'", (err, row) => {
                if (!err && !row) {
                    db.run("INSERT INTO pc_settings (key, value) VALUES ('float', '100000')");
                    db.run("INSERT INTO pc_settings (key, value) VALUES ('limit_super', '2000')");
                    db.run("INSERT INTO pc_settings (key, value) VALUES ('limit_mgr', '10000')");
                    db.run("INSERT INTO pc_settings (key, value) VALUES ('currency', 'VT')");

                    const cats = [
                        ['PC01', 'Office Supplies'], ['PC02', 'Transport'],
                        ['PC03', 'Meals & Entertainment'], ['PC04', 'Repairs & Maintenance'],
                        ['PC05', 'Postage & Courier'], ['PC06', 'Miscellaneous']
                    ];
                    cats.forEach(c => {
                        db.run("INSERT INTO pc_categories (code, name) VALUES (?, ?)", [c[0], c[1]]);
                    });
                    console.log('Seeded Petty Cash defaults and categories.');
                }
            });

            // Seed Finance Accounts if empty
            db.get("SELECT id FROM fin_accounts LIMIT 1", (err, row) => {
                if (!err && !row) {
                    const accs = [
                        ['1000', 'Cash / Bank', 'Asset'],
                        ['1010', 'Petty Cash', 'Asset'],
                        ['1020', 'Employee Advances', 'Asset'],
                        ['2000', 'Accounts Payable', 'Liability'],
                        ['2010', 'VNPF Payable', 'Liability'],
                        ['3000', 'Owner Equity', 'Equity'],
                        ['4000', 'Sales Revenue', 'Revenue'],
                        ['5000', 'Salary Expense', 'Expense'],
                        ['5010', 'VNPF Employer Expense', 'Expense'],
                        ['5020', 'Office Supplies Expense', 'Expense'],
                        ['5030', 'Transport Expense', 'Expense'],
                        ['5040', 'Meals & Entertainment Expense', 'Expense'],
                        ['5050', 'Repairs & Maintenance Expense', 'Expense'],
                        ['5060', 'Miscellaneous Expense', 'Expense']
                    ];
                    accs.forEach(c => {
                        db.run("INSERT INTO fin_accounts (code, name, type) VALUES (?, ?, ?)", [c[0], c[1], c[2]]);
                    });
                    console.log("Seeded default Chart of Accounts.");
                }
            });

            // Seed default admin user if database is completely empty
            db.all("SELECT id FROM docs WHERE collection = 'users'", [], (err, rows) => {
                if (!err && rows.length === 0) {
                    const adminDoc = {
                        _id: 'seed-admin',
                        _created: new Date().toISOString(),
                        name: 'Administrator',
                        username: 'admin',
                        password: hashPassword('admin123'),
                        mustChangePassword: true,
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

// --- GL Automation Functions ---
const getFinAccount = (code) => {
    return new Promise((resolve) => {
        db.get("SELECT id FROM fin_accounts WHERE code = ?", [code], (err, row) => {
            resolve(row ? row.id : null);
        });
    });
};

const insertJournalEntry = async (date, ref, desc, lines, user) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run("INSERT INTO fin_journal_entries (date, reference, description, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
                [date, ref, desc, user, new Date().toISOString()], function(err) {
                if (err) { db.run("ROLLBACK"); return reject(err); }
                const entryId = this.lastID;
                const stmt = db.prepare("INSERT INTO fin_journal_lines (entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?)");
                for (let line of lines) {
                    stmt.run(entryId, line.account_id, line.debit, line.credit);
                }
                stmt.finalize(err => {
                    if (err) { db.run("ROLLBACK"); return reject(err); }
                    db.run("COMMIT", err => {
                        if (err) return reject(err);
                        resolve(entryId);
                    });
                });
            });
        });
    });
};

const autoPostPayslip = async (doc, user) => {
    try {
        const cashAcc = await getFinAccount('1000');
        const vnpfPayableAcc = await getFinAccount('2010');
        const salaryExpAcc = await getFinAccount('5000');
        const vnpfExpAcc = await getFinAccount('5010');
        const advancesAcc = await getFinAccount('1020');
        const apAcc = await getFinAccount('2000');
        if (!cashAcc || !vnpfPayableAcc || !salaryExpAcc || !vnpfExpAcc) return;

        // NOTE: payslip documents use "totalEarn" for gross pay, not "gross".
        const gross = parseFloat(doc.totalEarn) || 0;
        const net = parseFloat(doc.net) || 0;
        const vnpf = parseFloat(doc.vnpf) || 0;
        const employerVnpf = vnpf;
        const totalVnpfPayable = vnpf + employerVnpf;
        const loanDeduction = parseFloat(doc.loan) || 0;
        const otherDeduction = parseFloat(doc.others) || 0;

        // Salary Expense = gross pay only. Employer VNPF is its own expense line below
        // (folding it into Salary Expense as well would double-count it and unbalance the entry).
        const lines = [
            { account_id: salaryExpAcc, debit: gross, credit: 0 },
            { account_id: vnpfExpAcc, debit: employerVnpf, credit: 0 },
            { account_id: vnpfPayableAcc, debit: 0, credit: totalVnpfPayable },
            { account_id: cashAcc, debit: 0, credit: net }
        ];
        if (loanDeduction > 0 && advancesAcc) lines.push({ account_id: advancesAcc, debit: 0, credit: loanDeduction });
        if (otherDeduction > 0 && apAcc) lines.push({ account_id: apAcc, debit: 0, credit: otherDeduction });

        await insertJournalEntry(doc.paydate || new Date().toISOString().split('T')[0], `PAYSLIP-${doc._id}`, `Payroll: ${doc.staff} (${doc.periodStart || ''} - ${doc.periodEnd || ''})`, lines, user);
    } catch (e) {
        console.error("Auto post payslip error:", e);
    }
};

const autoPostHRAdvance = async (doc, user) => {
    try {
        const advAcc = await getFinAccount('1020');
        const cashAcc = await getFinAccount('1000');
        if (!advAcc || !cashAcc) return;

        const amount = parseFloat(doc.amount) || 0;
        const lines = [
            { account_id: advAcc, debit: amount, credit: 0 },
            { account_id: cashAcc, debit: 0, credit: amount }
        ];
        await insertJournalEntry(new Date().toISOString().split('T')[0], `HR-ADV-${doc._id}`, `Payment Advance to ${doc.staff}`, lines, user);
    } catch(e) {
        console.error("Auto post HR advance error:", e);
    }
};

const autoPostPettyCash = async (vid, amount, category_id, date, payee, user) => {
    try {
        const pcAssetAcc = await getFinAccount('1010'); // Petty Cash account
        if (!pcAssetAcc) return;

        // Let's get the category code to map to expense account
        db.get("SELECT code FROM pc_categories WHERE id = ?", [category_id], async (err, row) => {
            if (err || !row) return;
            const code = row.code;
            let expCode = '5060'; // Default to Misc
            if (code === 'PC01') expCode = '5020'; // Office Supplies
            if (code === 'PC02') expCode = '5030'; // Transport
            if (code === 'PC03') expCode = '5040'; // Meals & Entertainment
            if (code === 'PC04') expCode = '5050'; // Repairs & Maint
            if (code === 'PC05') expCode = '5020'; // Postage -> mapped to Office Supplies for simplicity

            const expAcc = await getFinAccount(expCode);
            if (!expAcc) return;

            const lines = [
                { account_id: expAcc, debit: parseFloat(amount), credit: 0 },
                { account_id: pcAssetAcc, debit: 0, credit: parseFloat(amount) }
            ];
            await insertJournalEntry(date, `PC-VOUCHER-${vid}`, `PC Voucher to ${payee}`, lines, user);
        });
    } catch(e) {
        console.error("Auto post Petty Cash error:", e);
    }
};

const autoPostPettyCashReplenish = async (amount, date, user) => {
    try {
        const pcAssetAcc = await getFinAccount('1010'); // Petty Cash account
        const cashAcc = await getFinAccount('1000'); // Main Bank Account
        if (!pcAssetAcc || !cashAcc) return;

        const lines = [
            { account_id: pcAssetAcc, debit: parseFloat(amount), credit: 0 },
            { account_id: cashAcc, debit: 0, credit: parseFloat(amount) }
        ];
        await insertJournalEntry(date, `PC-REPLENISH-${Date.now().toString().slice(-6)}`, `Petty Cash Float Replenishment`, lines, user);
    } catch(e) {
        console.error("Auto post Petty Cash Replenish error:", e);
    }
};
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

            const githubToken = getAppToken();
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

// ─── Petty Cash API ────────────────────────────────────────────────────────────

app.get('/api/pc/settings', (req, res) => {
    db.all("SELECT key, value FROM pc_settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

app.post('/api/pc/settings', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({error: 'Unauthorized'});
    const data = req.body;
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO pc_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
        for (const [k, v] of Object.entries(data)) {
            stmt.run([k, String(v)]);
        }
        stmt.finalize();
        res.json({ success: true });
    });
});

app.get('/api/pc/categories', (req, res) => {
    db.all("SELECT * FROM pc_categories ORDER BY code ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/pc/balance', (req, res) => {
    db.get("SELECT value FROM pc_settings WHERE key = 'float'", [], (err, floatRow) => {
        const floatAmount = floatRow ? parseFloat(floatRow.value) || 0 : 0;
        db.get("SELECT balance FROM pc_register ORDER BY id DESC LIMIT 1", [], (err, regRow) => {
            const currentBalance = regRow ? parseFloat(regRow.balance) : floatAmount;
            res.json({
                openingBalance: floatAmount,
                currentBalance: currentBalance,
                replenishAmount: floatAmount - currentBalance,
                floatUsedPct: floatAmount > 0 ? ((floatAmount - currentBalance) / floatAmount) * 100 : 0
            });
        });
    });
});

app.get('/api/pc/register', (req, res) => {
    db.all("SELECT r.*, v.voucher_no, v.payee, v.description, c.name as category_name FROM pc_register r LEFT JOIN pc_vouchers v ON r.voucher_id = v.id LEFT JOIN pc_categories c ON v.category_id = c.id ORDER BY r.id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/pc/vouchers', (req, res) => {
    db.all("SELECT v.*, c.name as category_name, c.code as category_code FROM pc_vouchers v LEFT JOIN pc_categories c ON v.category_id = c.id ORDER BY v.id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/pc/vouchers', (req, res) => {
    if (req.user.role === 'viewer') return res.status(403).json({error: 'Unauthorized'});
    const { date, payee, staff_name, amount, category_id, department, description } = req.body;

    db.get("SELECT value FROM pc_settings WHERE key = 'float'", [], (err, floatRow) => {
        const floatAmount = floatRow ? parseFloat(floatRow.value) || 0 : 0;

        db.get("SELECT balance FROM pc_register ORDER BY id DESC LIMIT 1", [], (err, regRow) => {
            let currentBalance = 0;
            if (regRow) {
                currentBalance = parseFloat(regRow.balance);
            } else {
                if (floatAmount > 0) {
                    currentBalance = floatAmount;
                } else {
                    return res.status(400).json({ error: 'Float not initialized. Please set opening balance.' });
                }
            }

            if (amount > currentBalance) return res.status(400).json({ error: 'Insufficient funds in Petty Cash float.' });

            const newBalance = currentBalance - parseFloat(amount);
        const vNo = 'PC' + Date.now().toString().slice(-6);

        db.run("INSERT INTO pc_vouchers (voucher_no, date, payee, staff_name, amount, category_id, department, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Approved')",
        [vNo, date, payee, staff_name || null, amount, category_id, department, description], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            const vid = this.lastID;
            db.run("INSERT INTO pc_register (entry_date, entry_type, cash_out, cash_in, balance, voucher_id) VALUES (?, 'Expense', ?, 0, ?, ?)",
            [date, amount, newBalance, vid], function(err) {
                if (err) return res.status(500).json({ error: err.message });

                // GL Automation
                const user = req.user ? req.user.username : 'system';
                autoPostPettyCash(vid, amount, category_id, date, payee, user);

                res.json({ success: true, voucher_id: vid });
            });
        });
        });
    });
});

app.post('/api/pc/register/replenish', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({error: 'Unauthorized'});
    const { amount, date } = req.body;
    db.get("SELECT balance FROM pc_register ORDER BY id DESC LIMIT 1", [], (err, regRow) => {
        const currentBalance = regRow ? parseFloat(regRow.balance) : 0;
        const newBalance = currentBalance + parseFloat(amount);

        db.run("INSERT INTO pc_register (entry_date, entry_type, cash_out, cash_in, balance, voucher_id) VALUES (?, 'Replenishment', 0, ?, ?, NULL)",
        [date, amount, newBalance], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // GL Automation
            const user = req.user ? req.user.username : 'system';
            autoPostPettyCashReplenish(amount, date, user);

            res.json({ success: true });
        });
    });
});

app.get('/api/pc/summary', (req, res) => {
    db.all("SELECT c.name, SUM(v.amount) as total FROM pc_vouchers v JOIN pc_categories c ON v.category_id = c.id GROUP BY c.id", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ─── Finance GL API ────────────────────────────────────────────────────────────

app.get('/api/fin/accounts', (req, res) => {
    db.all("SELECT * FROM fin_accounts ORDER BY code ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fin/accounts', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({error: 'Unauthorized'});
    const { code, name, type } = req.body;
    db.run("INSERT INTO fin_accounts (code, name, type) VALUES (?, ?, ?)", [code, name, type], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.get('/api/fin/journals', (req, res) => {
    const query = `
        SELECT j.id, j.date, j.reference, j.description, j.created_by, j.created_at, j.cleared,
               l.id as line_id, l.debit, l.credit, a.code, a.name as account_name, a.type as account_type
        FROM fin_journal_entries j
        JOIN fin_journal_lines l ON j.id = l.entry_id
        JOIN fin_accounts a ON l.account_id = a.id
        ORDER BY j.date DESC, j.id DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Format them as nested entries
        const entriesMap = {};
        rows.forEach(r => {
            if (!entriesMap[r.id]) {
                entriesMap[r.id] = {
                    id: r.id, date: r.date, reference: r.reference,
                    description: r.description, created_by: r.created_by,
                    cleared: !!r.cleared,
                    lines: []
                };
            }
            entriesMap[r.id].lines.push({
                id: r.line_id, debit: r.debit, credit: r.credit,
                account_code: r.code, account_name: r.account_name, account_type: r.account_type
            });
        });
        res.json(Object.values(entriesMap));
    });
});

// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/fin/journals', async (req, res) => {
    if (!['admin', 'manager', 'it', 'viewer'].includes(req.user.role)) return res.status(403).json({error: 'Unauthorized'});
    if (req.user.role === 'viewer') return res.status(403).json({error: 'Unauthorized'});
    const { reference, description, date, lines } = req.body;

    try {
        // Resolve account names to IDs if needed
        for (let line of lines) {
            if (!line.account_id && line.account_name) {
                let acc = await new Promise(resolve => db.get("SELECT id FROM fin_accounts WHERE name = ? OR name = ? OR code = ?", [line.account_name, line.account_name + ' Expense', line.account_name], (err, row) => resolve(row ? row.id : null)));
                if (!acc) {
                    // Fallback to Miscellaneous Expense
                    acc = await new Promise(resolve => db.get("SELECT id FROM fin_accounts WHERE code = '5060'", [], (err, row) => resolve(row ? row.id : null)));
                }
                if (!acc) throw new Error(`Account not found: ${line.account_name}`);
                line.account_id = acc;
            }
        }

        const entryId = await insertJournalEntry(date, reference, description, lines, req.user.username);
        res.json({ success: true, id: entryId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/fin/journals/:id/clear', (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') return res.status(403).json({error: 'Unauthorized'});
    const { cleared } = req.body;
    db.run("UPDATE fin_journal_entries SET cleared = ? WHERE id = ?", [cleared ? 1 : 0, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Dedicated endpoint to mark a medical claim as paid and auto-post GL
app.post('/api/fin/mark-paid', async (req, res) => {
    if (req.user.role === 'viewer') return res.status(403).json({error: 'Unauthorized'});
    const { hrId } = req.body;
    if (!hrId) return res.status(400).json({ error: 'hrId required' });
    try {
        const rows = await runQuery('SELECT data FROM docs WHERE collection = ? AND id = ?', ['hr_requests', hrId]);
        if (!rows.length) return res.status(404).json({ error: 'HR request not found' });
        const doc = JSON.parse(rows[0].data);
        if (doc.type !== 'Medical Claim') return res.status(400).json({ error: 'Not a Medical Claim' });
        const amount = parseFloat(doc.amount) || 0;

        // Mark as finance paid
        doc.financePaid = true;
        doc.financePaidDate = new Date().toISOString();
        doc._updated = new Date().toISOString();
        await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(doc), hrId, 'hr_requests']);

        // Post to GL
        if (amount > 0) {
            const miscAcc = await getFinAccount('5060'); // Miscellaneous Expense
            const cashAcc = await getFinAccount('1000'); // Cash / Bank
            if (miscAcc && cashAcc) {
                const lines = [
                    { account_id: miscAcc, debit: amount, credit: 0 },
                    { account_id: cashAcc, debit: 0, credit: amount }
                ];
                await insertJournalEntry(
                    new Date().toISOString().split('T')[0],
                    `MED-CLAIM-${hrId.slice(-6)}`,
                    `Medical Claim Reimbursement - ${doc.staff}`,
                    lines,
                    req.user.username
                );
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// -----------------------------

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

        // Hard-block staff creation once the licensed staff cap is reached.
        if (collection === 'staff') {
            try {
                const licRows = await runQuery("SELECT data FROM docs WHERE id = 'app_license' AND collection = 'settings'");
                if (licRows.length > 0) {
                    const licenseData = decryptLicense(JSON.parse(licRows[0].data));
                    const maxStaff = licenseData && licenseData.maxStaff != null ? licenseData.maxStaff : null;
                    if (maxStaff != null) {
                        const cntRows = await runQuery("SELECT COUNT(*) as cnt FROM docs WHERE collection = 'staff'");
                        const currentCount = cntRows.length ? cntRows[0].cnt : 0;
                        if (currentCount >= maxStaff) {
                            return res.status(403).json({ error: `Staff limit reached. Your license allows up to ${maxStaff} staff. Please upgrade your license to add more.` });
                        }
                    }
                }
            } catch (e) {
                console.error('Staff cap check failed:', e);
                // Fail open so a license-check glitch never blocks legitimate staff creation.
            }
        }

        await runExec('INSERT INTO docs (id, collection, data) VALUES (?, ?, ?)', [doc._id, collection, JSON.stringify(doc)]);

        // Automation Hooks
        const user = req.user ? req.user.username : 'system';
        if (collection === 'payslips') {
            await autoPostPayslip(doc, user);
        } else if (collection === 'hr_requests' && doc.type === 'Payment Advance' && doc.status === 'Approved') {
            await autoPostHRAdvance(doc, user);
        }

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

app.get('/api/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const rows = await runQuery('SELECT data FROM docs WHERE collection = ? AND id = ?', [collection, id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(JSON.parse(rows[0].data));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/api/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const update = req.body;

        const rows = await runQuery('SELECT data FROM docs WHERE collection = ? AND id = ?', [collection, id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        let doc = JSON.parse(rows[0].data);
        Object.assign(doc, update);
        doc._updated = new Date().toISOString();

        await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(doc), id, collection]);
        res.json({ success: true, updated: 1 });
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

                // Automation Hook
                if (collection === 'hr_requests' && doc.type === 'Payment Advance' && doc.status === 'Approved' && !doc._gl_posted) {
                    const user = req.user ? req.user.username : 'system';
                    await autoPostHRAdvance(doc, user);
                    doc._gl_posted = true;
                    await runExec('UPDATE docs SET data = ? WHERE id = ? AND collection = ?', [JSON.stringify(doc), doc._id, collection]);
                }

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
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
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
