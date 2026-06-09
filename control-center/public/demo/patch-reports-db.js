const fs = require('fs');
const file = 'c:/WokManeja/WokManeja/public/index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix renderStaffTable toLowerCase bug
content = content.replace(
  /var all=DB.findAll\('staff'\)\.filter\(function\(s\)\{return!search\|\|s\.name\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\|\|s\.empid\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\|\|s\.department\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\}\);/g,
  `var all=DB.findAll('staff').filter(function(s){return!search||(s.name||'').toLowerCase().includes(search.toLowerCase())||(s.empid||'').toLowerCase().includes(search.toLowerCase())||(s.department||'').toLowerCase().includes(search.toLowerCase())});`
);

// 2. Add Bank Report Buttons
content = content.replace(
  /<button class="btn btn-primary" style="background:#185fa5" onclick="renderVNPF\(\)"><i class="ti ti-search"><\/i><span data-i18n="btn_gen_vnpf"> Gen. VNPF &amp; Bank<\/span><\/button>\s*<button class="btn btn-gold" id="cr-vnpf-btn" onclick="downloadVNPFPDF\(\)" style="display:none"><i class="ti ti-file-download"><\/i><span data-i18n="btn_pdf"> PDF<\/span><\/button>/,
  `<button class="btn btn-primary" style="background:#185fa5" onclick="renderVNPF()"><i class="ti ti-search"></i><span data-i18n="btn_gen_vnpf"> Gen. VNPF Report</span></button>
<button class="btn btn-gold" id="cr-vnpf-btn" onclick="downloadVNPFPDF()" style="display:none"><i class="ti ti-file-download"></i><span data-i18n="btn_pdf"> PDF</span></button>
<button class="btn btn-primary" style="background:#20b2aa" onclick="renderBank()"><i class="ti ti-search"></i><span data-i18n="btn_gen_bank"> Gen. Bank Report</span></button>
<button class="btn btn-gold" id="cr-bank-btn" onclick="downloadBankPDF()" style="display:none"><i class="ti ti-file-download"></i><span data-i18n="btn_pdf"> PDF</span></button>`
);

// 3. Update translations
content = content.replace(
  /const TRANSLATIONS = \{/,
  `const TRANSLATIONS = {\n  "btn_gen_bank": { en: " Gen. Bank Report", fr: " Générer Rapport Bancaire", zh: " 生成银行报告" },`
);

// We need to inject the new logic for `renderBank()`, `downloadBankPDF()`, and `buildBankHTML()`.
// And rewrite `renderVNPF()`, `downloadVNPFPDF()`, `buildVNPFHTML()` to exclude bank stuff.

// Let's remove the Salary Banking stuff from buildVNPFHTML.
const vnpfHtmlReplacement = `
function renderVNPF() {
  document.getElementById('cr-loading').style.display='block';
  document.getElementById('compliance-output').innerHTML='';
  document.getElementById('cr-pdf-btn').style.display='none';
  document.getElementById('cr-vnpf-btn').style.display='none';
  if(document.getElementById('cr-bank-btn')) document.getElementById('cr-bank-btn').style.display='none';
  setTimeout(function(){
    var filterM=document.getElementById('cr-month').value;var filterY=document.getElementById('cr-year').value;
    var list=DB.findAll('payslips').filter(function(p){return(!filterM||p.month===filterM)&&(!filterY||p.year==filterY)});
    if(!list.length){
      document.getElementById('cr-loading').style.display='none';
      document.getElementById('compliance-output').innerHTML='<p style="text-align:center;color:#666;padding:2rem">No payroll data found for the selected period.</p>';
      return;
    }
    var tGross=0, tEmp6=0, tEmployer6=0, tTotal12=0, tNet=0;
    list.forEach(function(p){
      tGross += p.totalEarn;
      tEmp6 += p.vnpf;
      var empMatch = Math.round(p.totalEarn * 0.06);
      tEmployer6 += empMatch;
      tTotal12 += p.vnpf + empMatch;
      tNet += p.net;
    });
    var periodLabel=filterM&&filterY?filterM+' '+filterY:filterY?'Year '+filterY:'All Periods';
    var today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
    LAST_VNPF_DATA = {list:list, tGross:tGross, tEmp6:tEmp6, tEmployer6:tEmployer6, tTotal12:tTotal12, tNet:tNet, periodLabel:periodLabel, today:today};
    document.getElementById('cr-loading').style.display='none';
    document.getElementById('cr-vnpf-btn').style.display='inline-flex';
    document.getElementById('compliance-output').innerHTML=buildVNPFHTML(LAST_VNPF_DATA, false);
    translateUI();
  }, 400);
}

function renderBank() {
  document.getElementById('cr-loading').style.display='block';
  document.getElementById('compliance-output').innerHTML='';
  document.getElementById('cr-pdf-btn').style.display='none';
  document.getElementById('cr-vnpf-btn').style.display='none';
  if(document.getElementById('cr-bank-btn')) document.getElementById('cr-bank-btn').style.display='none';
  setTimeout(function(){
    var filterM=document.getElementById('cr-month').value;var filterY=document.getElementById('cr-year').value;
    var list=DB.findAll('payslips').filter(function(p){return(!filterM||p.month===filterM)&&(!filterY||p.year==filterY)});
    if(!list.length){
      document.getElementById('cr-loading').style.display='none';
      document.getElementById('compliance-output').innerHTML='<p style="text-align:center;color:#666;padding:2rem">No payroll data found for the selected period.</p>';
      return;
    }
    var periodLabel=filterM&&filterY?filterM+' '+filterY:filterY?'Year '+filterY:'All Periods';
    var today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
    LAST_BANK_DATA = {list:list, periodLabel:periodLabel, today:today};
    document.getElementById('cr-loading').style.display='none';
    document.getElementById('cr-bank-btn').style.display='inline-flex';
    document.getElementById('compliance-output').innerHTML=buildBankHTML(LAST_BANK_DATA, false);
    translateUI();
  }, 400);
}

function downloadVNPFPDF() {
  if(!LAST_VNPF_DATA) return;
  var reportHTML = buildVNPFHTML(LAST_VNPF_DATA, true);
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VNPF Report - WokManeja</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif}body{background:#fff;color:#1a1a1a;padding:0}.rpt-page{max-width:100%;padding:2rem;color:#1a1a1a}.rpt-header{border-bottom:3px solid #0a0a0a;padding-bottom:1.25rem;margin-bottom:1.5rem}.rpt-logo-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.rpt-title{font-size:22px;font-weight:800;color:#0a0a0a;margin-bottom:2px}.rpt-subtitle{font-size:13px;color:#555}.rpt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:12px}.rpt-meta-item p{color:#888;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}.rpt-meta-item span{font-weight:700;color:#0a0a0a;font-size:13px}.rpt-section{margin-bottom:1.75rem;page-break-inside:avoid}.rpt-section-title{font-size:14px;font-weight:700;color:#0a0a0a;border-left:4px solid #10b981;padding-left:.75rem;margin-bottom:1rem}.rpt-section-num{color:#10b981;margin-right:.35rem}.rpt-summary-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}.rpt-summary-table td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px}.rpt-summary-table td:last-child{text-align:right;font-weight:700;color:#000000}.rpt-summary-table tr:last-child td{border-bottom:2px solid #0a0a0a;font-weight:800;font-size:14px}.rpt-detail-table{width:100%;border-collapse:collapse;font-size:12px}.rpt-detail-table th{background:#0a0a0a;color:#fff;padding:9px 10px;text-align:left;font-size:11px;letter-spacing:.3px}.rpt-detail-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0}.rpt-detail-table tr:nth-child(even) td{background:#fafafa}.rpt-footer{border-top:2px solid #0a0a0a;padding-top:1rem;margin-top:1.5rem;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#666}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body>'+reportHTML+'</body></html>');
  win.document.close();
  setTimeout(function(){ win.print(); win.close(); }, 500);
}

function downloadBankPDF() {
  if(!LAST_BANK_DATA) return;
  var reportHTML = buildBankHTML(LAST_BANK_DATA, true);
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Salary Banking List - WokManeja</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif}body{background:#fff;color:#1a1a1a;padding:0}.rpt-page{max-width:100%;padding:2rem;color:#1a1a1a}.rpt-header{border-bottom:3px solid #0a0a0a;padding-bottom:1.25rem;margin-bottom:1.5rem}.rpt-logo-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.rpt-title{font-size:22px;font-weight:800;color:#0a0a0a;margin-bottom:2px}.rpt-subtitle{font-size:13px;color:#555}.rpt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:12px}.rpt-meta-item p{color:#888;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}.rpt-meta-item span{font-weight:700;color:#0a0a0a;font-size:13px}.rpt-section{margin-bottom:1.75rem;page-break-inside:avoid}.rpt-section-title{font-size:14px;font-weight:700;color:#0a0a0a;border-left:4px solid #10b981;padding-left:.75rem;margin-bottom:1rem}.rpt-section-num{color:#10b981;margin-right:.35rem}.rpt-summary-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}.rpt-summary-table td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px}.rpt-summary-table td:last-child{text-align:right;font-weight:700;color:#000000}.rpt-summary-table tr:last-child td{border-bottom:2px solid #0a0a0a;font-weight:800;font-size:14px}.rpt-detail-table{width:100%;border-collapse:collapse;font-size:12px}.rpt-detail-table th{background:#0a0a0a;color:#fff;padding:9px 10px;text-align:left;font-size:11px;letter-spacing:.3px}.rpt-detail-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0}.rpt-detail-table tr:nth-child(even) td{background:#fafafa}.rpt-footer{border-top:2px solid #0a0a0a;padding-top:1rem;margin-top:1.5rem;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#666}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body>'+reportHTML+'</body></html>');
  win.document.close();
  setTimeout(function(){ win.print(); win.close(); }, 500);
}

function buildVNPFHTML(d, forPrint) {
  var s=DB.findOne('settings',{_id:'company'})||{};
  var cName=s.name||'WokManeja';
  var logoHtml = '<div style="width:40px;height:40px;background:#0a0a0a;border-radius:10px;display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 300 80"><rect x="0" y="10" width="60" height="60" rx="16" fill="#0a0a0a"></rect><path d="M 15 45 L 25 30 L 35 40 L 48 25" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M 38 25 L 48 25 L 48 35" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
  var rows='';
  d.list.forEach(function(p){
    var empMatch = Math.round(p.totalEarn * 0.06);
    var tot = p.vnpf + empMatch;
    var sRec = DB.findOne('staff',{empid:p.empid})||{};
    var vnpfNum = sRec.vnpfNumber||'N/A';
    rows+='<tr>'+
      '<td>'+p.staff+'</td>'+
      '<td style="color:#666">'+p.empid+'</td>'+
      '<td style="font-weight:600;color:#185fa5">'+vnpfNum+'</td>'+
      '<td style="text-align:right">'+vuvFmt(p.totalEarn)+'</td>'+
      '<td style="text-align:right;color:#a32d2d">'+vuvFmt(p.vnpf)+'</td>'+
      '<td style="text-align:right;color:#a32d2d">'+vuvFmt(empMatch)+'</td>'+
      '<td style="text-align:right;font-weight:700;color:#0a0a0a">'+vuvFmt(tot)+'</td>'+
    '</tr>';
  });
  return '<div class="rpt-page">'+
    '<div class="rpt-header">'+
      '<div class="rpt-logo-row">'+logoHtml+'<div><p class="rpt-title"><span data-i18n="doc_vnpf_remittance">VNPF Remittance Report</span></p><p class="rpt-subtitle">'+cName+'</p></div></div>'+
    '</div>'+
    '<div class="rpt-meta">'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_period">Period</span></p><span>'+d.periodLabel+'</span></div>'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_generated_on">Generated On</span></p><span>'+d.today+'</span></div>'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_status">Status</span></p><span style="color:#10b981"><span data-i18n="lbl_finalized">Finalized</span></span></div>'+
    '</div>'+
    '<div class="rpt-section">'+
      '<p class="rpt-section-title"><span class="rpt-section-num">1.</span> <span data-i18n="lbl_vnpf_remit_sum">Remittance Summary</span></p>'+
      '<table class="rpt-summary-table">'+
        '<tr><td><span data-i18n="lbl_total_gross_pay">Total Gross Subject to VNPF</span></td><td>'+vuvFmt(d.tGross)+'</td></tr>'+
        '<tr><td><span data-i18n="lbl_emp_deduction">Employee Deduction (6%)</span></td><td>'+vuvFmt(d.tEmp6)+'</td></tr>'+
        '<tr><td><span data-i18n="lbl_employer_contribution">Employer Contribution (6%)</span></td><td>'+vuvFmt(d.tEmployer6)+'</td></tr>'+
        '<tr style="background:#f8f9fb"><td><span data-i18n="lbl_total_vnpf_payable">Total VNPF Payable</span></td><td>'+vuvFmt(d.tTotal12)+'</td></tr>'+
      '</table>'+
    '</div>'+
    '<div class="rpt-section">'+
      '<p class="rpt-section-title"><span class="rpt-section-num">2.</span> <span data-i18n="lbl_vnpf_breakdown">Staff VNPF Breakdown</span></p>'+
      '<table class="rpt-detail-table">'+
        '<thead><tr><th><span data-i18n="tbl_staff">Staff</span></th><th><span data-i18n="tbl_id">ID</span></th><th><span data-i18n="lbl_vnpf_num">VNPF Number</span></th><th style="text-align:right"><span data-i18n="tbl_gross_pay">Gross Pay</span></th><th style="text-align:right"><span data-i18n="lbl_emp_6">Emp. 6%</span></th><th style="text-align:right"><span data-i18n="lbl_empr_6">Empr. 6%</span></th><th style="text-align:right"><span data-i18n="tbl_total_12">Total 12%</span></th></tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table>'+
    '</div>'+
    '<div class="rpt-footer">'+
      '<p><span data-i18n="txt_generated_by_wokmaneja">Generated by WokManeja</span></p>'+
      '<p><span data-i18n="lbl_page_1_of_1">Page 1 of 1</span></p>'+
    '</div>'+
  '</div>';
}

function buildBankHTML(d, forPrint) {
  var s=DB.findOne('settings',{_id:'company'})||{};
  var cName=s.name||'WokManeja';
  var logoHtml = '<div style="width:40px;height:40px;background:#0a0a0a;border-radius:10px;display:flex;align-items:center;justify-content:center"><svg width="24" height="24" viewBox="0 0 300 80"><rect x="0" y="10" width="60" height="60" rx="16" fill="#0a0a0a"></rect><path d="M 15 45 L 25 30 L 35 40 L 48 25" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M 38 25 L 48 25 L 48 35" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
  var bankRows='';
  d.list.forEach(function(p){
    var sRec = DB.findOne('staff',{empid:p.empid})||{};
    var bankName = sRec.bankName||'N/A';
    var accNum = sRec.accountNumber||'N/A';
    var priorityInput = forPrint 
      ? '<span data-i18n="txt_standard">Standard</span>' 
      : '<select class="form-select" style="padding:2px;font-size:12px;border:none;background:transparent;"><option value="Standard" data-i18n="txt_standard">Standard</option><option value="Urgent" data-i18n="txt_urgent">Urgent</option></select>';
    var periodDesc = 'Salary ' + p.month + ' ' + p.year;

    bankRows+='<tr>'+
      '<td>'+p.staff+'</td>'+
      '<td style="color:#666">'+bankName+'</td>'+
      '<td style="font-family:monospace;color:#185fa5">'+accNum+'</td>'+
      '<td style="text-align:right;font-weight:700;color:#1a1a1a">'+p.net+'</td>'+
      '<td>'+periodDesc+'</td>'+
      '<td>'+priorityInput+'</td>'+
    '</tr>';
  });
  return '<div class="rpt-page">'+
    '<div class="rpt-header">'+
      '<div class="rpt-logo-row">'+logoHtml+'<div><p class="rpt-title"><span data-i18n="tbl_salary_banking">Salary Banking List</span></p><p class="rpt-subtitle">'+cName+'</p></div></div>'+
    '</div>'+
    '<div class="rpt-meta">'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_period">Period</span></p><span>'+d.periodLabel+'</span></div>'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_generated_on">Generated On</span></p><span>'+d.today+'</span></div>'+
      '<div class="rpt-meta-item"><p><span data-i18n="lbl_status">Status</span></p><span style="color:#10b981"><span data-i18n="lbl_finalized">Finalized</span></span></div>'+
    '</div>'+
    '<div class="rpt-section">'+
      '<table class="rpt-detail-table">'+
        '<thead><tr><th><span data-i18n="tbl_name">Name</span></th><th><span data-i18n="lbl_bank_name">Bank</span></th><th><span data-i18n="lbl_account_num">Account</span></th><th style="text-align:right"><span data-i18n="lbl_amount_vt">Amount Vt</span></th><th><span data-i18n="lbl_to_account_desc">To Account Description</span></th><th><span data-i18n="lbl_transfer_priority">Transfer Priority</span></th></tr></thead>'+
        '<tbody>'+bankRows+'</tbody>'+
      '</table>'+
    '</div>'+
    '<div class="rpt-footer">'+
      '<p><span data-i18n="txt_generated_by_wokmaneja">Generated by WokManeja</span></p>'+
      '<p><span data-i18n="lbl_page_1_of_1">Page 1 of 1</span></p>'+
    '</div>'+
  '</div>';
}
`;

const startIndex = content.indexOf('function renderVNPF() {');
const endIndex = content.indexOf('function generateReportData(periodLabel, list)');
content = content.substring(0, startIndex) + vnpfHtmlReplacement + '\n' + content.substring(endIndex);

fs.writeFileSync('c:/WokManeja/WokManeja/public/index.html', content);
console.log("Patched successfully!");
