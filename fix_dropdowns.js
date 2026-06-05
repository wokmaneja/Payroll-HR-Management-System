const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const additions = `
  "opt_admin": { en: "Admin", fr: "Admin", zh: "管理员" },
  "opt_manager": { en: "Manager", fr: "Manager", zh: "经理" },
  "opt_it": { en: "IT", fr: "IT", zh: "IT" },
  "opt_staff": { en: "Staff", fr: "Personnel", zh: "员工" },
  "opt_active": { en: "Active", fr: "Actif", zh: "活跃" },
  "opt_inactive": { en: "Inactive", fr: "Inactif", zh: "不活跃" },
  "opt_weekly": { en: "Weekly", fr: "Hebdomadaire", zh: "每周" },
  "opt_fortnightly": { en: "Fortnightly", fr: "Bihebdomadaire", zh: "每两周" },
  "opt_fortnightly_full": { en: "Fortnightly (Every 2 Weeks)", fr: "Bihebdomadaire (Toutes les 2 semaines)", zh: "每两周" },
  "opt_monthly": { en: "Monthly", fr: "Mensuel", zh: "每月" },
  "opt_daily": { en: "Daily", fr: "Quotidien", zh: "每日" },
  "opt_hourly": { en: "Hourly", fr: "Horaire", zh: "每小时" },
  "opt_jan": { en: "January", fr: "Janvier", zh: "一月" },
  "opt_feb": { en: "February", fr: "Février", zh: "二月" },
  "opt_mar": { en: "March", fr: "Mars", zh: "三月" },
  "opt_apr": { en: "April", fr: "Avril", zh: "四月" },
  "opt_may": { en: "May", fr: "Mai", zh: "五月" },
  "opt_jun": { en: "June", fr: "Juin", zh: "六月" },
  "opt_jul": { en: "July", fr: "Juillet", zh: "七月" },
  "opt_aug": { en: "August", fr: "Août", zh: "八月" },
  "opt_sep": { en: "September", fr: "Septembre", zh: "九月" },
  "opt_oct": { en: "October", fr: "Octobre", zh: "十月" },
  "opt_nov": { en: "November", fr: "Novembre", zh: "十一月" },
  "opt_dec": { en: "December", fr: "Décembre", zh: "十二月" },
`;

html = html.split('"opt_all_months": { en: "All Months", fr: "Tous les mois", zh: "所有月份" },').join('"opt_all_months": { en: "All Months", fr: "Tous les mois", zh: "所有月份" },\\n' + additions);

html = html.split('<option value="admin">Admin</option>').join('<option value="admin" data-i18n="opt_admin">Admin</option>');
html = html.split('<option value="manager">Manager</option>').join('<option value="manager" data-i18n="opt_manager">Manager</option>');
html = html.split('<option value="it">IT</option>').join('<option value="it" data-i18n="opt_it">IT</option>');
html = html.split('<option value="staff" selected="">Staff</option>').join('<option value="staff" selected="" data-i18n="opt_staff">Staff</option>');
html = html.split('<option value="staff" selected>Staff</option>').join('<option value="staff" selected data-i18n="opt_staff">Staff</option>');

html = html.split('<option>Active</option>').join('<option data-i18n="opt_active">Active</option>');
html = html.split('<option>Inactive</option>').join('<option data-i18n="opt_inactive">Inactive</option>');

html = html.split('<option value="weekly">Weekly</option>').join('<option value="weekly" data-i18n="opt_weekly">Weekly</option>');
html = html.split('<option value="Weekly">Weekly</option>').join('<option value="Weekly" data-i18n="opt_weekly">Weekly</option>');
html = html.split('<option value="fortnightly">Fortnightly (Every 2 Weeks)</option>').join('<option value="fortnightly" data-i18n="opt_fortnightly_full">Fortnightly (Every 2 Weeks)</option>');
html = html.split('<option value="Fortnightly">Fortnightly</option>').join('<option value="Fortnightly" data-i18n="opt_fortnightly">Fortnightly</option>');
html = html.split('<option value="monthly">Monthly</option>').join('<option value="monthly" data-i18n="opt_monthly">Monthly</option>');
html = html.split('<option value="Monthly" selected="">Monthly</option>').join('<option value="Monthly" selected="" data-i18n="opt_monthly">Monthly</option>');
html = html.split('<option value="Monthly" selected>Monthly</option>').join('<option value="Monthly" selected data-i18n="opt_monthly">Monthly</option>');

html = html.split('<option>Daily</option>').join('<option data-i18n="opt_daily">Daily</option>');
html = html.split('<option>Hourly</option>').join('<option data-i18n="opt_hourly">Hourly</option>');

html = html.split('<option value="">-- Select Staff --</option>').join('<option value="" data-i18n="opt_select_staff">-- Select Staff --</option>');
html = html.split('<option value="">-- Select Department --</option>').join('<option value="" data-i18n="opt_select_dept">-- Select Department --</option>');
html = html.split('<option value="">-- Not linked --</option>').join('<option value="" data-i18n="opt_not_linked">-- Not linked --</option>');
html = html.split('<option value="">All Months</option>').join('<option value="" data-i18n="opt_all_months">All Months</option>');

html = html.split('<option>January</option>').join('<option data-i18n="opt_jan">January</option>');
html = html.split('<option>February</option>').join('<option data-i18n="opt_feb">February</option>');
html = html.split('<option>March</option>').join('<option data-i18n="opt_mar">March</option>');
html = html.split('<option>April</option>').join('<option data-i18n="opt_apr">April</option>');
html = html.split('<option>May</option>').join('<option data-i18n="opt_may">May</option>');
html = html.split('<option selected="">May</option>').join('<option selected="" data-i18n="opt_may">May</option>');
html = html.split('<option selected>May</option>').join('<option selected data-i18n="opt_may">May</option>');
html = html.split('<option>June</option>').join('<option data-i18n="opt_jun">June</option>');
html = html.split('<option>July</option>').join('<option data-i18n="opt_jul">July</option>');
html = html.split('<option>August</option>').join('<option data-i18n="opt_aug">August</option>');
html = html.split('<option>September</option>').join('<option data-i18n="opt_sep">September</option>');
html = html.split('<option>October</option>').join('<option data-i18n="opt_oct">October</option>');
html = html.split('<option>November</option>').join('<option data-i18n="opt_nov">November</option>');
html = html.split('<option>December</option>').join('<option data-i18n="opt_dec">December</option>');

fs.writeFileSync('public/index.html', html);
console.log('done');
