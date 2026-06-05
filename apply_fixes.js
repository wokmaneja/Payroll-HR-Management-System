const fs = require('fs');

let indexHtml = fs.readFileSync('public/index.html', 'utf8');
const script0 = fs.readFileSync('public/script0.js', 'utf8');

// 1. Replace the first script block in index.html with script0.js
indexHtml = indexHtml.replace(/<script>\s*var I18N_DICT[\s\S]*?updateDBIndicator\(\);\n\}\);\n<\/script>/, '<script>\n' + script0 + '\n</script>');

// 2. Standardise Modals
// dept-modal overlay
indexHtml = indexHtml.replace(
  /<div id="dept-modal" style="[^"]*">/,
  '<div id="dept-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(3px)">'
);
// dept-modal card
indexHtml = indexHtml.replace(
  /<div style="background:#fff;padding:1\.5rem;border-radius:12px;width:350px;max-width:90%;box-shadow:0 15px 35px rgba\(0,0,0,0\.2\)">/,
  '<div class="card" style="width:100%;max-width:380px;padding:2.5rem;animation: scaleIn 0.2s ease-out;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">'
);

// modal-changepw card
indexHtml = indexHtml.replace(
  /<div class="card" style="width:100%;max-width:380px;padding:2rem">/,
  '<div class="card" style="width:100%;max-width:380px;padding:2.5rem;animation: scaleIn 0.2s ease-out;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">'
);

// 3. Add translations to I18N_DICT for dropdowns
const newDictEntries = `
  "opt_select_staff": { en: "-- Select Staff --", fr: "-- Sélectionner l'employé --", zh: "-- 选择员工 --" },
  "opt_select_dept": { en: "-- Select Department --", fr: "-- Sélectionner le département --", zh: "-- 选择部门 --" },
  "opt_all_status": { en: "All Status", fr: "Tous les statuts", zh: "所有状态" },
  "opt_all_types": { en: "All Types", fr: "Tous les types", zh: "所有类型" },
`;
indexHtml = indexHtml.replace(/"language": \{[^\}]+\},/, '"language": { en: "Language", fr: "Langue", zh: "语言" },\n' + newDictEntries);

// 4. Update the JS rendering logic to use these data-i18n tags on options
indexHtml = indexHtml.replace(
  /sel\.innerHTML='<option value="">-- Select Staff --<\/option>';/g,
  `sel.innerHTML='<option value="" data-i18n="opt_select_staff">-- Select Staff --</option>';`
);

indexHtml = indexHtml.replace(
  /var html='<option value="">-- Select Department --<\/option>';/g,
  `var html='<option value="" data-i18n="opt_select_dept">-- Select Department --</option>';`
);

// 5. Update HTML filter dropdowns in index.html for HR page
indexHtml = indexHtml.replace(
  /<option value="">All Status<\/option>/g,
  `<option value="" data-i18n="opt_all_status">All Status</option>`
);

indexHtml = indexHtml.replace(
  /<option value="">All Types<\/option>/g,
  `<option value="" data-i18n="opt_all_types">All Types</option>`
);

// 6. Update HTML dropdown for Archive filter
indexHtml = indexHtml.replace(
  /<option value="">All Collections<\/option>/g,
  `<option value="" data-i18n="opt_all_colls">All Collections</option>`
);
indexHtml = indexHtml.replace(
  /"opt_all_types": \{[^\}]+\},/,
  `"opt_all_types": { en: "All Types", fr: "Tous les types", zh: "所有类型" },\n  "opt_all_colls": { en: "All Collections", fr: "Toutes les collections", zh: "所有集合" },`
);

// 7. Update HTML dropdown for User Roles if there's any?
// The Roles filter in Users page uses `refreshUserDropdowns` or HTML static? Let's assume there are others, we will rely on what exists.

fs.writeFileSync('public/index.html', indexHtml, 'utf8');
console.log("Applied all fixes to index.html successfully!");
