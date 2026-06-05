const fs = require('fs');
let indexHtml = fs.readFileSync('public/index.html', 'utf8');

// Replacements to add value attribute and data-i18n
const replacements = [
  { target: '<option>Annual Leave</option>', replacement: '<option value="Annual Leave" data-i18n="opt_annual_leave">Annual Leave</option>' },
  { target: '<option>Sick Leave</option>', replacement: '<option value="Sick Leave" data-i18n="opt_sick_leave">Sick Leave</option>' },
  { target: '<option>Leave Without Pay</option>', replacement: '<option value="Leave Without Pay" data-i18n="opt_leave_without_pay">Leave Without Pay</option>' },
  { target: '<option>Payment Advance</option>', replacement: '<option value="Payment Advance" data-i18n="opt_payment_advance">Payment Advance</option>' },
  { target: '<option>Pending</option>', replacement: '<option value="Pending" data-i18n="opt_pending">Pending</option>' },
  { target: '<option>Approved</option>', replacement: '<option value="Approved" data-i18n="opt_approved">Approved</option>' },
  { target: '<option>Rejected</option>', replacement: '<option value="Rejected" data-i18n="opt_rejected">Rejected</option>' }
];

for (const r of replacements) {
  // Global replace in case they appear in multiple selects
  indexHtml = indexHtml.split(r.target).join(r.replacement);
}

// Add these to I18N_DICT
const newDictEntries = [
  '"opt_annual_leave": { en: "Annual Leave", fr: "Congés Annuels", zh: "年假" },',
  '"opt_sick_leave": { en: "Sick Leave", fr: "Congés Maladie", zh: "病假" },',
  '"opt_leave_without_pay": { en: "Leave Without Pay", fr: "Congé Sans Solde", zh: "无薪休假" },',
  '"opt_payment_advance": { en: "Payment Advance", fr: "Avance sur salaire", zh: "预支工资" },',
  '"opt_pending": { en: "Pending", fr: "En attente", zh: "待处理" },',
  '"opt_approved": { en: "Approved", fr: "Approuvé", zh: "已批准" },',
  '"opt_rejected": { en: "Rejected", fr: "Rejeté", zh: "已拒绝" },'
].join('\\n');
indexHtml = indexHtml.replace(/"language": \{[^\}]+\},/, '"language": { en: "Language", fr: "Langue", zh: "语言" },\\n' + newDictEntries);

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log("Applied dropdown value and i18n fixes to index.html successfully!");
