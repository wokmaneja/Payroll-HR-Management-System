const fs = require('fs');
let indexHtml = fs.readFileSync('public/index.html', 'utf8');

// 1. Translate Section Titles
indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-layout-dashboard" style="color:var\(--gold\)"><\/i> Dashboard<\/p>/,
  '<p class="section-title"><i class="ti ti-layout-dashboard" style="color:var(--gold)"></i> <span data-i18n="menu_dashboard">Dashboard</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-file-invoice" style="color:var\(--gold\)"><\/i> Create Payslip<\/p>/,
  '<p class="section-title"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> <span data-i18n="menu_payslip">Create Payslip</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-table" style="color:var\(--gold\)"><\/i> Bulk Payslip Processing<\/p>/,
  '<p class="section-title"><i class="ti ti-table" style="color:var(--gold)"></i> <span data-i18n="menu_bulk">Bulk Payslip Processing</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-files" style="color:var\(--gold\)"><\/i> Payslip Records<\/p>/,
  '<p class="section-title"><i class="ti ti-files" style="color:var(--gold)"></i> <span data-i18n="menu_records">Payslip Records</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-users" style="color:var\(--gold\)"><\/i> Staff Management<\/p>/,
  '<p class="section-title"><i class="ti ti-users" style="color:var(--gold)"></i> <span data-i18n="menu_staff">Staff Management</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="fa-solid fa-plane-departure" style="color:var\(--gold\)"><\/i> HR Leave &amp; Advance<\/p>/,
  '<p class="section-title"><i class="fa-solid fa-plane-departure" style="color:var(--gold)"></i> <span data-i18n="menu_hr">HR Leave &amp; Advance</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-user-shield" style="color:var\(--gold\)"><\/i> User Management<\/p>/,
  '<p class="section-title"><i class="ti ti-user-shield" style="color:var(--gold)"></i> <span data-i18n="menu_users">User Management</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-shield" style="color:var\(--gold\)"><\/i> Roles &amp; Permissions<\/p>/,
  '<p class="section-title"><i class="ti ti-shield" style="color:var(--gold)"></i> <span data-i18n="nav_admin">Roles &amp; Permissions</span></p>' // Just reuse a translation if it fits, wait, let's add menu_roles
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-report-analytics" style="color:var\(--gold\)"><\/i> Compliance Report<\/p>/,
  '<p class="section-title"><i class="ti ti-report-analytics" style="color:var(--gold)"></i> <span data-i18n="menu_compliance">Compliance Report</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-cloud-download" style="color:var\(--gold\)"><\/i> App Updates<\/p>/,
  '<p class="section-title"><i class="ti ti-cloud-download" style="color:var(--gold)"></i> <span data-i18n="menu_updates">App Updates</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-database" style="color:var\(--gold\)"><\/i> SQLite Database Management<\/p>/,
  '<p class="section-title"><i class="ti ti-database" style="color:var(--gold)"></i> <span data-i18n="menu_database">SQLite Database Management</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-history" style="color:var\(--gold\)"><\/i> Audit Logs<\/p>/,
  '<p class="section-title"><i class="ti ti-history" style="color:var(--gold)"></i> <span data-i18n="menu_audit">Audit Logs</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-building" style="color:var\(--gold\)"><\/i> Company Settings<\/p>/,
  '<p class="section-title"><i class="ti ti-building" style="color:var(--gold)"></i> <span data-i18n="menu_company">Company Settings</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-trash" style="color:var\(--gold\)"><\/i> Trash Bin<\/p>/,
  '<p class="section-title"><i class="ti ti-trash" style="color:var(--gold)"></i> <span data-i18n="menu_archive">Trash Bin</span></p>'
);

indexHtml = indexHtml.replace(
  /<p class="section-title"><i class="ti ti-book" style="color:var\(--gold\)"><\/i> User Guides &amp; Documentation<\/p>/,
  '<p class="section-title"><i class="ti ti-book" style="color:var(--gold)"></i> <span data-i18n="menu_guides">User Guides &amp; Documentation</span></p>'
);

// Add missing menu_... keys to I18N_DICT
const newDictEntries = [
  '"menu_roles": { en: "Roles & Permissions", fr: "Rôles et Permissions", zh: "角色和权限" },',
  '"menu_guides": { en: "User Guides & Documentation", fr: "Guides d\'utilisation", zh: "用户指南与文档" },'
].join('\\n');
// We already have most menu_ keys from script0.js (menu_dashboard, menu_payslip, etc.)
indexHtml = indexHtml.replace(/"language": \{[^\}]+\},/, '"language": { en: "Language", fr: "Langue", zh: "语言" },\\n' + newDictEntries);
indexHtml = indexHtml.replace(/"nav_admin">Roles &amp; Permissions<\/span>/, '"menu_roles">Roles &amp; Permissions</span>');


// 2. Fix the HR summary cards in renderDashboard
indexHtml = indexHtml.replace(
  /var hTypes=\[\['Annual Leave','annual','fa-plane-departure'\],\['Sick Leave','sick','fa-notes-medical'\],\['Leave Without Pay','unpaid','fa-calendar-xmark'\],\['Payment Advance','advance','fa-money-bill-wave'\]\];/,
  "var hTypes=[['Annual Leave','annual','fa-plane-departure','lbl_annual_l'],['Sick Leave','sick','fa-notes-medical','lbl_sick_l'],['Leave Without Pay','unpaid','fa-calendar-xmark','lbl_lwp'],['Payment Advance','advance','fa-money-bill-wave','lbl_advances']];"
);
indexHtml = indexHtml.replace(
  /html\+='<div class="hr-card-info"><p>'\+ht\[0\]\+'<\/p><h3\>'\+cnt\+' request'\+\(cnt!==1\?'s':''\)\+'<\/h3><\/div><\/div>';/g,
  "html+='<div class=\"hr-card-info\"><p><span data-i18n=\"'+ht[3]+'\">'+ht[0]+'</span></p><h3>'+cnt+' <span data-i18n=\"lbl_requests\">requests</span></h3></div></div>';"
);
// Make sure lbl_requests is added
const requestsEntry = '"lbl_requests": { en: "requests", fr: "demandes", zh: "请求" },\\n';
indexHtml = indexHtml.replace(/"language": \{[^\}]+\},/, '"language": { en: "Language", fr: "Langue", zh: "语言" },\\n' + requestsEntry);

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log("Final translations applied.");
