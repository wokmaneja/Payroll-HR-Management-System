const sqlite3 = require('sqlite3');
const fs = require('fs');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO = 'Payroll-HR-Management-System';
let GITHUB_PAT = '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';

const MACHINE_ID = machineIdSync({original: true});
const HARDWARE_KEY = crypto.createHash('sha256').update(MACHINE_ID).digest();

function decryptLicense(encryptedObj) {
    try {
        const iv = Buffer.from(encryptedObj.iv, 'hex');
        const authTag = Buffer.from(encryptedObj.authTag, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', HARDWARE_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    } catch (e) {
        return null;
    }
}

const db = new sqlite3.Database('database.sqlite');
db.all("SELECT data FROM docs WHERE id='app_license' AND collection='settings'", (err, rows) => {
    if (!err && rows.length > 0) {
        const lic = decryptLicense(JSON.parse(rows[0].data));
        if (lic) {
            const fetch = require('node-fetch') || global.fetch;
            const issueBody = `**License Key:** ${lic.key}\n**Company:** ${lic.company || 'N/A'}\n**Machine ID:** ${MACHINE_ID}\n**Plan:** ${lic.plan.toUpperCase()}\n**Expires:** ${lic.expires}`;
            fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_PAT}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'WokManeja-App'
                },
                body: JSON.stringify({
                    title: `License Activated: ${lic.key}`,
                    body: issueBody,
                    labels: ['license-activation']
                })
            }).then(r => console.log('Synced code:', r.status)).catch(console.error);
        } else {
            console.log('Failed to decrypt license.');
        }
    } else {
        console.log('No local license found.');
    }
});
