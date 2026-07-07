const fs = require('fs');
let code = fs.readFileSync('public/index.html', 'utf8');

// 1. Add bank input
code = code.replace(
    '<input type="email" id="cs-email" placeholder="info@triplek.vu" data-i18n-placeholder="ph_email_info"></div><div style="margin-bottom:1.5rem">',
    '<input type="email" id="cs-email" placeholder="info@triplek.vu" data-i18n-placeholder="ph_email_info\"></div><div style="margin-bottom:1rem"><label><span>Bank Account Details (For Invoices)</span></label><input type="text" id="cs-bank" placeholder="e.g. Bank Name - Acc 12345678"></div><div style="margin-bottom:1.5rem">'
);

// 2. saveCompanySettings
code = code.replace(
    'email:document.getElementById(\'cs-email\').value.trim(),license:',
    'email:document.getElementById(\'cs-email\').value.trim(),bank:document.getElementById(\'cs-bank\').value.trim(),license:'
);

// 3. renderCompanySettings
code = code.replace(
    'document.getElementById(\'cs-email\').value=s.email||\'\';',
    'document.getElementById(\'cs-email\').value=s.email||\'\';\n    if(document.getElementById(\'cs-bank\')) document.getElementById(\'cs-bank\').value=s.bank||\'\';'
);

// 4. invoice-print-overlay
code = code.replace(
    '<div id="inv-print-email" style="color:#666;font-size:13px"></div>',
    '<div id="inv-print-email" style="color:#666;font-size:13px"></div><div id="inv-print-bank" style="color:#666;font-size:13px;margin-top:8px;font-weight:600"></div>'
);

fs.writeFileSync('public/index.html', code);
console.log('Modified index.html settings successfully!');
