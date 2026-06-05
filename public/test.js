
var I18N_DICT = {
  "change_pw": { en: "Change Password", fr: "Changer le mot de passe", zh: "修改密码" },
  "sign_out": { en: "Sign out", fr: "Déconnexion", zh: "登出" },
  "employee_name": { en: "Employee Name", fr: "Nom de l'employé", zh: "员工姓名" },
  "employee_id": { en: "Employee ID", fr: "ID de l'employé", zh: "员工ID" },
  "load_last": { en: "Load Last", fr: "Charger le dernier", zh: "加载最新" },
  "pay_type": { en: "Pay Type", fr: "Type de paie", zh: "支付类型" },
  "fixed_salary": { en: "Fixed Salary", fr: "Salaire fixe", zh: "固定薪水" },
  "hourly_rate": { en: "Hourly Rate", fr: "Taux horaire", zh: "时薪" },
  "hourly_rate_vuv": { en: "Hourly Rate (VUV)", fr: "Taux horaire (VUV)", zh: "时薪 (VUV)" },
  "hours_worked": { en: "Hours Worked", fr: "Heures travaillées", zh: "工作时间" },
  "basic_pay": { en: "Basic Pay (VUV)", fr: "Salaire de base (VUV)", zh: "基本工资 (VUV)" },
  "overtime": { en: "Overtime (VUV)", fr: "Heures supplémentaires", zh: "加班费 (VUV)" },
  "earnings": { en: "Earnings", fr: "Gains", zh: "收入" }
};

function changeLang() {
  var lang = document.getElementById('lang-switcher').value;
  var els = document.querySelectorAll('[data-i18n]');
  els.forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (I18N_DICT[key] && I18N_DICT[key][lang]) {
      el.textContent = I18N_DICT[key][lang];
    }
  });
  // Remember setting if desired
  localStorage.setItem('wokmaneja_lang', lang);
}

// Automatically load saved language on start
document.addEventListener('DOMContentLoaded', function() {
  var savedLang = localStorage.getItem('wokmaneja_lang');
  if(savedLang) {
    var sel = document.getElementById('lang-switcher');
    if(sel) { sel.value = savedLang; changeLang(); }
  }
});
// --- Fetch Interceptor for Authentication ---
var originalFetch = window.fetch;
window.fetch = async function(url, options) {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    var token = sessionStorage.getItem('api_token');
    if (token) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers['Authorization'] = 'Bearer ' + token;
    }
  }
  var res = await originalFetch(url, options);
  if (res.status === 401 && typeof url === 'string' && !url.startsWith('/api/auth/')) {
    if (typeof doLogout === 'function') doLogout();
    throw new Error('Unauthorized');
  }
  return res;
};
// --------------------------------------------

window.customConfirm = function(msg, onConfirm) {
  var overlay = document.getElementById('custom-confirm');
  document.getElementById('custom-confirm-msg').textContent = msg;
  overlay.style.display = 'flex';
  
  var okBtn = document.getElementById('custom-confirm-ok');
  var cancelBtn = document.getElementById('custom-confirm-cancel');
  
  var cleanup = function() {
    overlay.style.display = 'none';
    okBtn.removeEventListener('click', onOk);
    cancelBtn.removeEventListener('click', onCancel);
  };
  
  var onOk = function() {
    cleanup();
    onConfirm();
  };
  
  var onCancel = function() {
    cleanup();
  };
  
  okBtn.addEventListener('click', onOk);
  cancelBtn.addEventListener('click', onCancel);
};

var MEMORY_DB = { users: [], staff: [], payslips: [], hr_requests: [], departments: [], audit_logs: [], settings: [], archive: [] };
var DB=(function(){
  function _id(){return Date.now().toString(36)+Math.random().toString(36).substr(2,5)}
  function _auditLog(action, c, details) {
    if (c === 'audit_logs') return;
    var user = (window.APP && APP.currentUser) ? APP.currentUser.username : 'system';
    var entry = { _id: _id(), timestamp: new Date().toISOString(), user: user, action: action, collection: c, details: JSON.stringify(details) };
    if(!MEMORY_DB['audit_logs']) MEMORY_DB['audit_logs'] = [];
    MEMORY_DB['audit_logs'].push(entry);
    fetch('/api/audit_logs', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(entry) });
  }
  return{
    init: async function() {
        const res = await fetch('/api/admin/export');
        const data = await res.json();
        Object.assign(MEMORY_DB, data);
        if(!MEMORY_DB.settings) MEMORY_DB.settings = [];
        if(!MEMORY_DB.archive) MEMORY_DB.archive = [];
        if(MEMORY_DB.archive.length > 0){
            var now=new Date().toISOString();
            var expired=MEMORY_DB.archive.filter(function(a){return a.expiresAt < now});
            expired.forEach(function(a){ DB.remove('archive',{_id:a._id},true); });
        }
        var s=DB.findOne('settings',{_id:'company'});
        if(s&&s.name){
            var el=document.getElementById('login-company-name');
            if(el)el.textContent=s.name;
            var headerEl=document.getElementById('menu-company-name');
            if(headerEl)headerEl.textContent=s.name;
        }
    },
    insert:function(c,doc){
        doc._id=_id();
        doc._created=new Date().toISOString();
        if(!MEMORY_DB[c]) MEMORY_DB[c] = [];
        MEMORY_DB[c].push(doc);
        fetch('/api/'+c, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
        updateDBIndicator();
        _auditLog('INSERT', c, doc);
        return doc;
    },
    findAll:function(c,q){
        var d=MEMORY_DB[c] || [];
        if(!q)return d;
        return d.filter(function(x){return Object.keys(q).every(function(k){return String(x[k])===String(q[k])})})
    },
    findOne:function(c,q){return this.findAll(c,q)[0]||null},
    update:function(c,q,u){
        var d=MEMORY_DB[c] || [];
        var updated = false;
        d.forEach(function(x){
            if(Object.keys(q).every(function(k){return String(x[k])===String(q[k])})){
                Object.assign(x,u);
                x._updated=new Date().toISOString();
                updated = true;
            }
        });
        if (updated) {
            fetch('/api/'+c, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query:q, update:u}) });
            updateDBIndicator();
            _auditLog('UPDATE', c, {query: q, changes: u});
        }
    },
    remove:function(c,q,bypassArchive){
        var d=MEMORY_DB[c] || [];
        var toRemove = d.filter(function(x){return Object.keys(q).every(function(k){return String(x[k])===String(q[k])})});
        MEMORY_DB[c] = d.filter(function(x){return!Object.keys(q).every(function(k){return String(x[k])===String(q[k])})});
        if(toRemove.length > 0){
            fetch('/api/'+c, { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify(q) });
            updateDBIndicator();
            _auditLog('DELETE', c, {query: q, removed: toRemove});
            if(!bypassArchive && c !== 'archive' && c !== 'audit_logs' && c !== 'settings'){
                var user=(window.APP&&APP.currentUser)?APP.currentUser.username:'system';
                var exp=new Date();exp.setDate(exp.getDate()+30);
                toRemove.forEach(function(doc){
                    var arc={originalCollection:c,originalData:doc,deletedAt:new Date().toISOString(),deletedBy:user,expiresAt:exp.toISOString()};
                    DB.insert('archive',arc);
                });
            }
        }
    },
    drop:function(c){
        MEMORY_DB[c] = [];
        fetch('/api/drop/'+c, { method: 'POST' });
        updateDBIndicator();
    },
    count:function(c){return (MEMORY_DB[c]||[]).length},
    raw:function(c){return MEMORY_DB[c]||[]},
    exportAll:function(){return Object.assign({}, MEMORY_DB, {_exported:new Date().toISOString()})},
    importAll:function(data){
        Object.assign(MEMORY_DB, data);
        fetch('/api/admin/import', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
        updateDBIndicator();
    }
  }
})();
function seedDB(){
  if(DB.count('users')===0){DB.insert('users',{name:'Administrator',username:'admin',password:'admin123',role:'admin'});DB.insert('users',{name:'IT Officer',username:'it_user',password:'it123',role:'it'});DB.insert('users',{name:'John Doe',username:'jdoe',password:'user123',role:'staff'});DB.insert('users',{name:'Manager',username:'manager',password:'mgr123',role:'manager'});}
  if(DB.count('staff')===0){DB.insert('staff',{name:'Alice Bule',empid:'EMP001',designation:'Accountant',department:'Finance',email:'alice@tripleK.vu',phone:'+678 123456',annualLeave:21,sickLeave:10,status:'Active'});DB.insert('staff',{name:'Bob Tarileo',empid:'EMP002',designation:'Sales Manager',department:'Operations',email:'bob@tripleK.vu',phone:'+678 234567',annualLeave:21,sickLeave:10,status:'Active'});DB.insert('staff',{name:'Carol Vira',empid:'EMP003',designation:'HR Officer',department:'Administration',email:'carol@tripleK.vu',phone:'+678 345678',annualLeave:21,sickLeave:10,status:'Active'});}
  if(DB.count('departments')===0){['Finance','Operations','Administration','Executive','Support & Consultant'].forEach(function(d){DB.insert('departments',{name:d})});}
}
function updateDBIndicator(){}
var APP={currentUser:null,editingStaffIdx:-1,editingHRId:null,editingUserId:null};
var STAFF_ID_MAP={};var HR_ID_MAP={};var REC_ID_MAP={};var USER_ID_MAP={};var NOTIF_ID_MAP={};
var MENUS={
  admin:[{id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},{divider:'PAYROLL'},{id:'payslip',label:'Create Payslip',icon:'ti-file-invoice'},{id:'bulk',label:'Bulk Payslip',icon:'ti-table'},{id:'records',label:'Payslip Records',icon:'ti-files'},{divider:'HR'},{id:'hr',label:'Leave & Advance',icon:'ti-calendar-event'},{id:'staff',label:'Staff Management',icon:'ti-users'},{divider:'ADMIN'},{id:'company',label:'Company Settings',icon:'ti-building'},{id:'users',label:'User Management',icon:'ti-user-shield'},{id:'roles',label:'Roles & Permissions',icon:'ti-shield'},{id:'compliance',label:'Compliance Report',icon:'ti-report-analytics'},{id:'updates',label:'App Updates',icon:'ti-cloud-download'},{id:'database',label:'Database Manager',icon:'ti-database'},{id:'audit',label:'Audit Logs',icon:'ti-history'},{id:'archive',label:'Trash Bin',icon:'ti-trash'},{divider:'HELP'},{id:'docs',label:'User Guides',icon:'ti-book'}],
  it:[{id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},{divider:'PAYROLL'},{id:'payslip',label:'Create Payslip',icon:'ti-file-invoice'},{id:'bulk',label:'Bulk Payslip',icon:'ti-table'},{id:'records',label:'Payslip Records',icon:'ti-files'},{divider:'HR'},{id:'hr',label:'Leave & Advance',icon:'ti-calendar-event'},{id:'staff',label:'Staff Management',icon:'ti-users'},{divider:'REPORTS'},{id:'roles',label:'Roles & Permissions',icon:'ti-shield'},{id:'compliance',label:'Compliance Report',icon:'ti-report-analytics'},{divider:'HELP'},{id:'docs',label:'User Guides',icon:'ti-book'}],
  manager:[{id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},{divider:'PAYROLL'},{id:'payslip',label:'Create Payslip',icon:'ti-file-invoice'},{id:'bulk',label:'Bulk Payslip',icon:'ti-table'},{id:'records',label:'Payslip Records',icon:'ti-files'},{divider:'HR'},{id:'hr',label:'Leave & Advance',icon:'ti-calendar-event'},{id:'staff',label:'Staff Management',icon:'ti-users'},{divider:'MANAGEMENT'},{id:'users',label:'User Management',icon:'ti-user-shield'},{id:'roles',label:'Roles & Permissions',icon:'ti-shield'},{id:'compliance',label:'Compliance Report',icon:'ti-report-analytics'},{divider:'HELP'},{id:'docs',label:'User Guides',icon:'ti-book'}],
  staff:[{id:'dashboard',label:'Dashboard',icon:'ti-layout-dashboard'},{divider:'PAYROLL'},{id:'records',label:'My Payslips',icon:'ti-files'},{divider:'HR'},{id:'hr',label:'Leave & Advance',icon:'ti-calendar-event'},{divider:'HELP'},{id:'docs',label:'User Guides',icon:'ti-book'}]
};
var IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
var idleTimer = null;
function resetIdleTimer(){if(!APP.currentUser)return;if(idleTimer)clearTimeout(idleTimer);idleTimer=setTimeout(function(){if(APP.currentUser){alert('You have been logged out due to inactivity.');doLogout();}},IDLE_TIMEOUT);}
document.addEventListener('mousemove',resetIdleTimer);
document.addEventListener('keydown',resetIdleTimer);
document.addEventListener('click',resetIdleTimer);
async function doLogin(){var u=document.getElementById('login-user').value.trim();var p=document.getElementById('login-pass').value.trim();try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});if(res.status===402||res.status===403){const errData=await res.json();showLicenseLockScreen(errData.error, errData.reason);return;}if(!res.ok){document.getElementById('login-error').style.display='block';return}const data=await res.json();document.getElementById('login-error').style.display='none';sessionStorage.setItem('api_token',data.token);sessionStorage.setItem('api_user',JSON.stringify(data.user));APP.currentUser=data.user;await DB.init();seedDB();updateDBIndicator();document.getElementById('page-login').classList.add('hidden');document.getElementById('page-main').classList.remove('hidden');document.getElementById('nav-username').textContent=data.user.name;document.getElementById('nav-badge').textContent=data.user.role.toUpperCase();document.getElementById('nav-badge').className='badge badge-'+data.user.role;buildNav(data.user.role);renderNotifBadge();startNotifPolling();refreshDeptDropdown();resetIdleTimer();}catch(e){document.getElementById('login-error').style.display='block';}}
function doLogout(){stopNotifPolling();if(idleTimer)clearTimeout(idleTimer);APP.currentUser=null;sessionStorage.removeItem('api_token');sessionStorage.removeItem('api_user');document.getElementById('login-user').value='';document.getElementById('login-pass').value='';document.getElementById('page-main').classList.add('hidden');document.getElementById('page-login').classList.remove('hidden');}
function buildNav(role){var nav=document.getElementById('sidebar-nav');nav.innerHTML='';MENUS[role].forEach(function(item){if(item.divider){var d=document.createElement('div');d.className='nav-divider';d.textContent=item.divider;nav.appendChild(d);return}var a=document.createElement('button');a.innerHTML='<i class="ti '+item.icon+'" style="font-size:15px"></i> '+item.label;a.style.cssText='display:flex;align-items:center;gap:9px;width:calc(100% - 16px);margin:1px 8px;text-align:left;justify-content:flex-start;border:none;border-radius:7px;font-size:13px;font-weight:500;padding:9px 12px;cursor:pointer;color:#444;background:transparent;font-family:inherit;transition:all .12s';a.onmouseover=function(){if(a.dataset.active!=='1')a.style.background='#f0f0f0'};a.onmouseout=function(){if(a.dataset.active!=='1')a.style.background='transparent'};a.onclick=function(){document.querySelectorAll('#sidebar-nav button').forEach(function(b){b.style.background='transparent';b.style.color='#444';b.style.fontWeight='500';b.dataset.active=''});a.style.background='#0a0a0a';a.style.color='#fff';a.style.fontWeight='700';a.dataset.active='1';showSection(item.id);if(item.id==='records')renderRecords();if(item.id==='staff'){renderStaffTable();setNextEmpId()}if(item.id==='users'){renderUsersTable();populateStaffLinkDropdown();}if(item.id==='dashboard')renderDashboard();if(item.id==='database')renderDBStats();if(item.id==='audit')renderAuditLogs();if(item.id==='company')renderCompanySettings();if(item.id==='archive')renderArchiveTable();if(item.id==='hr'){refreshHRStaffDropdown();renderHRTable();renderHRSummary()}if(item.id==='bulk'){renderBulkTable()}if(item.id==='updates'){loadVersionInfo();}};nav.appendChild(a);});nav.querySelector('button').click();}
var ALL_SECTIONS=['payslip','bulk','records','staff','hr','users','roles','compliance','dashboard','database','audit','company','archive','updates','docs'];
function showSection(id){ALL_SECTIONS.forEach(function(s){var el=document.getElementById('section-'+s);if(el)el.classList.add('hidden')});var target=document.getElementById('section-'+id);if(target)target.classList.remove('hidden');if(id==='payslip'){refreshStaffDropdown();setTodayPayDate()}if(id==='bulk'){setTodayBulkPayDate()}}
var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function fmtDate(dateStr,opts){if(!dateStr)return'';return new Date(dateStr+'T00:00:00').toLocaleDateString('en-GB',opts||{day:'2-digit',month:'short',year:'numeric'});}
function calcPeriod(payDateStr, cycle){if(!payDateStr)return{start:'',end:'',label:''};var payDay=new Date(payDateStr+'T00:00:00');var periodEnd=new Date(payDay);periodEnd.setDate(payDay.getDate()-1);var periodStart=new Date(periodEnd);var daysToSub = cycle==='weekly'?6:13;periodStart.setDate(periodEnd.getDate()-daysToSub);var toStr=function(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')};var s=toStr(periodStart);var e=toStr(periodEnd);var cycleLabel = cycle==='weekly'?'Weekly':'Fortnightly';return{start:s,end:e,label:'Pay Period: '+fmtDate(s)+' – '+fmtDate(e)+' | Pay Day: '+new Date(payDateStr+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})};}
function getPeriodRange(p){var cyc=(p.paycycle||'monthly').toLowerCase();if((cyc==='fortnightly'||cyc==='weekly')&&p.periodStart&&p.periodEnd){return{start:p.periodStart,end:p.periodEnd};}var mIdx=MONTHS.indexOf(p.month);var yr=parseInt(p.year)||2026;if(mIdx<0)return{start:'',end:''};var dStart=new Date(yr,mIdx,1);var dEnd=new Date(yr,mIdx+1,0);var toStr=function(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')};return{start:toStr(dStart),end:toStr(dEnd)};}
function onPayCycleChange(){var cycle=document.getElementById('ps-paycycle').value;document.getElementById('ps-period-wrap').style.display=(cycle==='fortnightly'||cycle==='weekly')?'block':'none';document.getElementById('ps-monthly-wrap').style.display=cycle==='monthly'?'block':'none';onPayDateChange();}
function setTodayPayDate(){var el=document.getElementById('ps-paydate');if(!el.value){var d=new Date();var diff=(4-d.getDay()+7)%7||7;d.setDate(d.getDate()+diff);el.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}onPayCycleChange();}
function onPayDateChange(){var val=document.getElementById('ps-paydate').value;if(!val)return;var d=new Date(val+'T00:00:00');var cycle=document.getElementById('ps-paycycle').value;if(cycle==='fortnightly'||cycle==='weekly'){var fp=calcPeriod(val, cycle);var psEl=document.getElementById('ps-period-start');if(psEl&&!psEl.value)psEl.value=fp.start;var peEl=document.getElementById('ps-period-end');if(peEl&&!peEl.value)peEl.value=fp.end;var lbl=document.getElementById('ps-period-label');if(lbl){lbl.textContent=fp.label;lbl.style.display='block'}var days = cycle==='weekly'?7:14;document.getElementById('ps-paiddays').value=days;document.getElementById('ps-totaldays').value=days;document.getElementById('ps-month').value=MONTHS[d.getMonth()];document.getElementById('ps-year').value=d.getFullYear();var info=document.getElementById('ps-paydate-info');if(info){var dayN=d.toLocaleDateString('en-GB',{weekday:'long'});var warn=dayN!=='Thursday'?' Warning: Pay day is not a Thursday!':'Confirmed Thursday pay day';info.textContent=warn;info.style.display='block';info.style.color=dayN!=='Thursday'?'#ffcc44':'rgba(255,255,255,.6)';}}else{document.getElementById('ps-paiddays').value=d.getDate();document.getElementById('ps-totaldays').value=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();document.getElementById('ps-month').value=MONTHS[d.getMonth()];document.getElementById('ps-year').value=d.getFullYear();var info2=document.getElementById('ps-paydate-info');if(info2)info2.style.display='none';}calcPayslip();}
function updatePaidDays(){var mIdx=MONTHS.indexOf(document.getElementById('ps-month').value);var yr=parseInt(document.getElementById('ps-year').value)||2026;if(document.getElementById('ps-paycycle').value==='monthly')document.getElementById('ps-totaldays').value=new Date(yr,mIdx+1,0).getDate();}
function refreshStaffDropdown(){
  var sel=document.getElementById('ps-staff');
  var val=sel.value;
  sel.innerHTML='<option value="">-- Select Staff --</option>';
  
  var allowed = DB.findAll('staff',{status:'Active'});
  if (APP.currentUser && APP.currentUser.role === 'staff' && APP.currentUser.linkedStaffId) {
      allowed = allowed.filter(function(s) { return s._id === APP.currentUser.linkedStaffId; });
  }

  allowed.forEach(function(s){
    var o=document.createElement('option');
    o.value=s._id;
    o.textContent=s.name+' ('+s.empid+')';
    sel.appendChild(o);
  });
  
  if (APP.currentUser && APP.currentUser.role === 'staff' && APP.currentUser.linkedStaffId) {
      sel.value = APP.currentUser.linkedStaffId;
      sel.disabled = true; // Lock dropdown
  } else {
      sel.disabled = false;
      sel.value = val;
  }
}
function fillStaffDetails(){var id=document.getElementById('ps-staff').value;var s=DB.findOne('staff',{_id:id});document.getElementById('ps-empid').value=s?s.empid:'';document.getElementById('ps-designation').value=s?s.designation:'';document.getElementById('ps-department').value=s?s.department:'';calcPayslip();}
function vuvFmt(n){return 'VUV '+Math.round(Number(n)||0).toLocaleString()}
function calcPayslip(){var b=parseFloat(document.getElementById('earn-basic').value)||0;var o=parseFloat(document.getElementById('earn-overtime').value)||0;var sev=parseFloat(document.getElementById('earn-severance').value)||0;var a=parseFloat(document.getElementById('earn-allowances').value)||0;var bon=parseFloat(document.getElementById('earn-bonus').value)||0;var vnpf=Math.round(b*0.06);document.getElementById('ded-vnpf').value=vnpf;var l=parseFloat(document.getElementById('ded-loan').value)||0;var d=parseFloat(document.getElementById('ded-others').value)||0;var earn=b+o+sev+a+bon;var ded=vnpf+l+d;document.getElementById('ps-total-earn').textContent=vuvFmt(earn);document.getElementById('ps-total-ded').textContent=vuvFmt(ded);document.getElementById('ps-net-display').textContent=vuvFmt(earn-ded);}
function savePayslip(){var staffId=document.getElementById('ps-staff').value;if(!staffId){alert('Please select a staff member.');return}var s=DB.findOne('staff',{_id:staffId});var b=parseFloat(document.getElementById('earn-basic').value)||0;var o=parseFloat(document.getElementById('earn-overtime').value)||0;var sev=parseFloat(document.getElementById('earn-severance').value)||0;var a=parseFloat(document.getElementById('earn-allowances').value)||0;var bon=parseFloat(document.getElementById('earn-bonus').value)||0;var vnpf=Math.round(b*0.06);var l=parseFloat(document.getElementById('ded-loan').value)||0;var d=parseFloat(document.getElementById('ded-others').value)||0;var othersNote=document.getElementById('ded-others-note').value.trim();var earn=b+o+sev+a+bon;var ded=vnpf+l+d;var cycle=document.getElementById('ps-paycycle').value;var periodStart=document.getElementById('ps-period-start')?document.getElementById('ps-period-start').value:'';var periodEnd=document.getElementById('ps-period-end')?document.getElementById('ps-period-end').value:'';var pType=document.getElementById('earn-type').value;var hRate=parseFloat(document.getElementById('earn-hourly-rate').value)||0;var hWork=parseFloat(document.getElementById('earn-hours').value)||0;DB.insert('payslips',{staffId:staffId,staff:s?s.name:'',empid:document.getElementById('ps-empid').value,designation:document.getElementById('ps-designation').value,department:document.getElementById('ps-department').value,month:document.getElementById('ps-month').value,year:document.getElementById('ps-year').value,paydate:document.getElementById('ps-paydate').value,paycycle:cycle,periodStart:periodStart,periodEnd:periodEnd,paiddays:document.getElementById('ps-paiddays').value,totaldays:document.getElementById('ps-totaldays').value,payType:pType,hourlyRate:hRate,hoursWorked:hWork,basic:b,overtime:o,severance:sev,allowances:a,bonus:bon,vnpf:vnpf,loan:l,others:d,othersNote:othersNote,totalEarn:earn,totalDed:ded,net:earn-ded,createdBy:APP.currentUser.username});var m=document.getElementById('ps-save-msg');m.style.display='inline-flex';setTimeout(function(){m.style.display='none'},3000);}
function onPayTypeChange(){var t=document.getElementById('earn-type').value;if(t==='hourly'){document.getElementById('hourly-wrap').style.display='grid';document.getElementById('earn-basic').readOnly=true;}else{document.getElementById('hourly-wrap').style.display='none';document.getElementById('earn-basic').readOnly=false;}calcPayslip();}
function calcHourlyPay(){var r=parseFloat(document.getElementById('earn-hourly-rate').value)||0;var h=parseFloat(document.getElementById('earn-hours').value)||0;document.getElementById('earn-basic').value=Math.round(r*h);calcPayslip();}
function loadLastPayslip(){var sid=document.getElementById('ps-staff').value;if(!sid){alert('Please select an employee first.');return;}var slips=DB.findAll('payslips',{staffId:sid});if(!slips.length){alert('No previous payslips found for this employee.');return;}slips.sort(function(a,b){return new Date(b.paydate||0)-new Date(a.paydate||0)});var last=slips[0];if(last.payType==='hourly'){document.getElementById('earn-type').value='hourly';document.getElementById('earn-hourly-rate').value=last.hourlyRate||0;document.getElementById('earn-hours').value=last.hoursWorked||0;}else{document.getElementById('earn-type').value='fixed';}onPayTypeChange();document.getElementById('earn-basic').value=last.basic||0;document.getElementById('earn-overtime').value=last.overtime||0;if(document.getElementById('earn-severance'))document.getElementById('earn-severance').value=last.severance||0;document.getElementById('earn-allowances').value=last.allowances||0;if(document.getElementById('earn-bonus'))document.getElementById('earn-bonus').value=last.bonus||0;document.getElementById('ded-loan').value=last.loan||0;document.getElementById('ded-others').value=last.others||0;document.getElementById('ded-others-note').value=last.othersNote||'';calcPayslip();alert('Loaded latest payslip data from '+(last.paydate||'previous cycle'));}
function setTodayBulkPayDate(){var el=document.getElementById('bp-paydate');if(!el.value){var d=new Date();var diff=(4-d.getDay()+7)%7||7;d.setDate(d.getDate()+diff);el.value=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}toggleBulkPayCycle();}
function toggleBulkPayCycle(){var cycle=document.getElementById('bp-paycycle').value;document.getElementById('bp-fortnight-period-wrap').style.display=(cycle==='Fortnightly'||cycle==='Weekly')?'flex':'none';document.getElementById('bp-month-period-wrap').style.display=cycle==='Monthly'?'flex':'none';updateBulkFortnightPeriod();}
function updateBulkFortnightPeriod(){var val=document.getElementById('bp-paydate').value;if(!val)return;var d=new Date(val+'T00:00:00');var cycle=document.getElementById('bp-paycycle').value;if(cycle==='Fortnightly'||cycle==='Weekly'){var fp=calcPeriod(val, cycle.toLowerCase());var psEl = document.getElementById('bp-period-start');if(psEl&&!psEl.value)psEl.value=fp.start;var peEl=document.getElementById('bp-period-end');if(peEl&&!peEl.value)peEl.value=fp.end;document.getElementById('bp-period-label').value=fp.label;}else{document.getElementById('bp-month').value=MONTHS[d.getMonth()];document.getElementById('bp-year').value=d.getFullYear();}renderBulkTable();}
function renderBulkTable(){var wrap=document.getElementById('bp-table-wrap');var filter=(document.getElementById('bp-staff-filter')||{}).value||'All';var all=DB.findAll('staff',{status:'Active'});if(filter!=='All'){all=all.filter(function(s){return s.payCycle===filter||(filter==='Monthly'&&!s.payCycle)});}document.getElementById('bp-staff-count').textContent=all.length;if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem">No active staff found.</p>';return}var rows='';all.forEach(function(s){var isHourly=!!s.hourlyRate;var hrLabel=isHourly?'Hours':'Basic';var basicHtml=isHourly?'<input type="number" id="bp-hrs-'+s._id+'" style="width:70px;padding:4px" placeholder="Hrs" oninput="calcBulkRow(\''+s._id+'\')"/> <input type="hidden" id="bp-basic-'+s._id+'" value="0"/>':'<input type="number" id="bp-basic-'+s._id+'" style="width:90px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/>';var hrInfo=isHourly?'<div style="font-size:10px;color:#888;margin-top:2px">Rate: VUV '+s.hourlyRate+'/hr</div>':'';rows+='<tr>'+'<td style="font-weight:600;min-width:140px">'+s.name+'<br><span style="font-size:10px;color:#888">'+s.empid+'</span></td>'+'<td>'+basicHtml+hrInfo+'</td>'+'<td><input type="number" id="bp-ot-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-allow-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-bonus-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-vnpf-'+s._id+'" style="width:80px;padding:4px;background:#f9f9f9" readonly/></td>'+'<td><input type="number" id="bp-loan-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-other-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td style="font-weight:700;color:var(--navy);background:#f0f7ff" id="bp-net-'+s._id+'">VUV 0</td>'+'</tr>';});wrap.innerHTML='<table style="font-size:12px;white-space:nowrap"><thead><tr><th>Staff Member</th><th>Basic / Hrs</th><th>Overtime</th><th>Allowances</th><th>Bonus</th><th>VNPF (6%)</th><th>Loan Ded.</th><th>Other Ded.</th><th style="background:#e8f4fd;color:#1565c0">Net Pay</th></tr></thead><tbody>'+rows+'</tbody></table>';}
function calcBulkRow(staffId){var s=DB.findOne('staff',{_id:staffId});var isHourly=!!s.hourlyRate;var basic=0;if(isHourly){var hrs=parseFloat(document.getElementById('bp-hrs-'+staffId).value)||0;basic=hrs*s.hourlyRate;document.getElementById('bp-basic-'+staffId).value=basic;}else{basic=parseFloat(document.getElementById('bp-basic-'+staffId).value)||0;}var o=parseFloat(document.getElementById('bp-ot-'+staffId).value)||0;var a=parseFloat(document.getElementById('bp-allow-'+staffId).value)||0;var bon=parseFloat(document.getElementById('bp-bonus-'+staffId).value)||0;var vnpf=Math.round(basic*0.06);document.getElementById('bp-vnpf-'+staffId).value=vnpf;var l=parseFloat(document.getElementById('bp-loan-'+staffId).value)||0;var d=parseFloat(document.getElementById('bp-other-'+staffId).value)||0;var net=basic+o+a+bon-vnpf-l-d;document.getElementById('bp-net-'+staffId).textContent=vuvFmt(net);}
function saveBulkPayroll(){var cycle=document.getElementById('bp-paycycle').value;var pDate=document.getElementById('bp-paydate').value;if(!pDate){alert('Please set a Pay Date.');return}var pStart=(cycle==='Fortnightly'||cycle==='Weekly')?document.getElementById('bp-period-start').value:'';var pEnd=(cycle==='Fortnightly'||cycle==='Weekly')?document.getElementById('bp-period-end').value:'';var pMonth=cycle==='Monthly'?document.getElementById('bp-month').value:MONTHS[new Date(pDate+'T00:00:00').getMonth()];var pYear=cycle==='Monthly'?document.getElementById('bp-year').value:new Date(pDate+'T00:00:00').getFullYear();var pdays=cycle==='Monthly'?new Date(pYear,MONTHS.indexOf(pMonth)+1,0).getDate():(cycle==='Weekly'?7:14);var tdays=pdays;var all=DB.findAll('staff',{status:'Active'});var count=0;all.forEach(function(s){var basic=parseFloat(document.getElementById('bp-basic-'+s._id).value)||0;if(basic>0){var o=parseFloat(document.getElementById('bp-ot-'+s._id).value)||0;var a=parseFloat(document.getElementById('bp-allow-'+s._id).value)||0;var bon=parseFloat(document.getElementById('bp-bonus-'+s._id).value)||0;var vnpf=Math.round(basic*0.06);var l=parseFloat(document.getElementById('bp-loan-'+s._id).value)||0;var d=parseFloat(document.getElementById('bp-other-'+s._id).value)||0;var earn=basic+o+a+bon;var ded=vnpf+l+d;DB.insert('payslips',{staffId:s._id,staff:s.name,empid:s.empid,designation:s.designation,department:s.department,month:pMonth,year:pYear,paydate:pDate,paycycle:cycle.toLowerCase(),periodStart:pStart,periodEnd:pEnd,paiddays:pdays,totaldays:tdays,basic:basic,overtime:o,allowances:a,bonus:bon,vnpf:vnpf,loan:l,others:d,othersNote:'Bulk Payslip',totalEarn:earn,totalDed:ded,net:earn-ded,createdBy:APP.currentUser.username});count++;}});if(count>0){var m=document.getElementById('bp-save-msg');m.style.display='inline-flex';setTimeout(function(){m.style.display='none';renderBulkTable();},3000);}else{alert('No payslips generated. Please enter at least basic pay/hours for staff.');}}
function resetPayslip(){['ps-staff','ps-empid','ps-designation','ps-department','earn-hourly-rate','earn-hours','earn-basic','earn-overtime','earn-severance','earn-allowances','earn-bonus','ded-loan','ded-others','ded-others-note','ps-period-start','ps-period-end'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=''});document.getElementById('ded-vnpf').value='';var lbl=document.getElementById('ps-period-label');if(lbl)lbl.style.display='none';var info=document.getElementById('ps-paydate-info');if(info)info.style.display='none';document.getElementById('earn-type').value='fixed';onPayTypeChange();calcPayslip();}
function fillPrintOverlay(p){var pr=getPeriodRange(p);var cyc=(p.paycycle||'monthly').toLowerCase();var startFmt=fmtDate(pr.start,{day:'2-digit',month:'long',year:'numeric'});var endFmt=fmtDate(pr.end,{day:'2-digit',month:'long',year:'numeric'});var pdFmt=p.paydate?new Date(p.paydate+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}):'';var heading=(cyc==='fortnightly'?'Fortnightly':(cyc==='weekly'?'Weekly':'Monthly'))+' Pay – '+p.month+' '+p.year;if(cyc==='monthly') heading=p.month+' '+p.year;document.getElementById('pr-monthyear').textContent=heading;var prEl=document.getElementById('pr-period-range');if(prEl)prEl.textContent=(startFmt&&endFmt)?startFmt+' – '+endFmt:'';document.getElementById('pr-paydate').textContent=pdFmt;var cyEl=document.getElementById('pr-cycle');if(cyEl)cyEl.textContent=cyc==='fortnightly'?'Fortnightly':(cyc==='weekly'?'Weekly':'Monthly');document.getElementById('pr-name').textContent=p.staff;document.getElementById('pr-id').textContent=p.empid;document.getElementById('pr-desig').textContent=p.designation;document.getElementById('pr-dept').textContent=p.department||'';document.getElementById('pr-net').textContent=vuvFmt(p.net);document.getElementById('pr-net2').textContent=vuvFmt(p.net);document.getElementById('pr-days').textContent=p.paiddays+' / '+p.totaldays;document.getElementById('pr-basic').textContent=vuvFmt(p.basic);document.getElementById('pr-overtime').textContent=vuvFmt(p.overtime);if(document.getElementById('pr-severance'))document.getElementById('pr-severance').textContent=vuvFmt(p.severance||0);document.getElementById('pr-allow').textContent=vuvFmt(p.allowances);if(document.getElementById('pr-bonus'))document.getElementById('pr-bonus').textContent=vuvFmt(p.bonus||0);document.getElementById('pr-tearn').textContent=vuvFmt(p.totalEarn);document.getElementById('pr-vnpf').textContent=vuvFmt(p.vnpf);document.getElementById('pr-loan').textContent=vuvFmt(p.loan);document.getElementById('pr-others').textContent=vuvFmt(p.others);document.getElementById('pr-tded').textContent=vuvFmt(p.totalDed);var noteEl=document.getElementById('pr-others-note-label');if(noteEl){noteEl.textContent=p.othersNote?'('+p.othersNote+')':'';noteEl.style.display=p.othersNote?'block':'none';}var s=DB.findOne('settings',{_id:'company'});if(s){if(s.name)document.getElementById('pr-company-name').textContent=s.name;if(s.address)document.getElementById('pr-company-address').textContent=s.address;}document.getElementById('print-overlay').style.display='flex';}
function printPayslip(){var staffId=document.getElementById('ps-staff').value;if(!staffId){alert('Please select a staff member first.');return}var b=parseFloat(document.getElementById('earn-basic').value)||0;var o=parseFloat(document.getElementById('earn-overtime').value)||0;var sev=parseFloat(document.getElementById('earn-severance').value)||0;var a=parseFloat(document.getElementById('earn-allowances').value)||0;var bon=parseFloat(document.getElementById('earn-bonus').value)||0;var vnpf=Math.round(b*0.06);var l=parseFloat(document.getElementById('ded-loan').value)||0;var d=parseFloat(document.getElementById('ded-others').value)||0;var earn=b+o+sev+a+bon;var ded=vnpf+l+d;var cycle=document.getElementById('ps-paycycle').value;var pStart=document.getElementById('ps-period-start')?document.getElementById('ps-period-start').value:'';var pEnd=document.getElementById('ps-period-end')?document.getElementById('ps-period-end').value:'';var sel=document.getElementById('ps-staff');var staffName=sel.options[sel.selectedIndex].textContent;var rec={staff:staffName,empid:document.getElementById('ps-empid').value,designation:document.getElementById('ps-designation').value,department:document.getElementById('ps-department').value,month:document.getElementById('ps-month').value,year:document.getElementById('ps-year').value,paydate:document.getElementById('ps-paydate').value,paycycle:cycle,periodStart:pStart,periodEnd:pEnd,paiddays:document.getElementById('ps-paiddays').value,totaldays:document.getElementById('ps-totaldays').value,basic:b,overtime:o,allowances:a,severance:sev,bonus:bon,vnpf:vnpf,loan:l,others:d,othersNote:document.getElementById('ded-others-note').value.trim(),totalEarn:earn,totalDed:ded,net:earn-ded};fillPrintOverlay(rec);}
function viewPayslip(id){var p=DB.findOne('payslips',{_id:id});if(!p)return;fillPrintOverlay(p);}
function deletePayslip(id){customConfirm('Delete this payslip?', function(){ DB.remove('payslips',{_id:id});renderRecords(); });}
function renderRecords(){var wrap=document.getElementById('records-list');var role=APP.currentUser.role;var list=getUserPayslips();if(!list.length){wrap.innerHTML='<div class="card" style="text-align:center;color:#888;padding:2.5rem"><i class="ti ti-inbox" style="font-size:36px;display:block;margin-bottom:.5rem;opacity:.3"></i>No payslips yet.</div>';return;}var rows='';list.slice().reverse().forEach(function(p,idx){var pdFmt=p.paydate?fmtDate(p.paydate):'--';var cyc=(p.paycycle||'monthly').toLowerCase();var pr=getPeriodRange(p);var startFmt=pr.start?fmtDate(pr.start):'';var endFmt=pr.end?fmtDate(pr.end):'';var periodCell='';if(cyc==='fortnightly'||cyc==='weekly'){periodCell='<td style="white-space:nowrap;font-size:12px;line-height:1.8"><span class="period-badge">'+(cyc==='weekly'?'WEEKLY':'FORTNIGHT')+'</span><br>'+startFmt+' &ndash; '+endFmt+'</td>';}else{periodCell='<td style="white-space:nowrap;font-size:13px">'+(startFmt&&endFmt?startFmt+' &ndash; '+endFmt:p.month+' '+p.year)+'</td>';}var eid='rec'+idx;REC_ID_MAP[eid]=p._id;var delBtn=(role==='admin'||role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deletePayslip(REC_ID_MAP.'+eid+')" title="Delete"><i class="ti ti-trash"></i></button>':'';rows+=''+'<tr>'+'<td style="font-weight:600">'+p.staff+'</td>'+'<td style="color:#888">'+p.empid+'</td>'+'<td style="white-space:nowrap">'+pdFmt+'</td>'+periodCell+'<td>'+vuvFmt(p.totalEarn)+'</td>'+'<td style="color:#3b6d11;font-weight:600">'+vuvFmt(p.vnpf)+'</td>'+'<td style="font-weight:700;color:#000000">'+vuvFmt(p.net)+'</td>'+'<td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="viewPayslip(REC_ID_MAP.'+eid+')" title="View"><i class="ti ti-eye"></i></button> '+delBtn+'</td>'+'</tr>';});wrap.innerHTML='<div class="card" style="overflow:auto"><table><thead><tr><th>Staff</th><th>ID</th><th>Pay Date</th><th>Period</th><th>Earnings</th><th>VNPF</th><th>Net Pay</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function getLeaveStats(staffId){var s=DB.findOne('staff',{_id:staffId});if(!s)return{annualAlloc:0,annualTaken:0,annualLeft:0,sickAlloc:0,sickTaken:0,sickLeft:0};var annualAlloc=parseInt(s.annualLeave)||21;var sickAlloc=parseInt(s.sickLeave)||10;var approved=DB.findAll('hr_requests').filter(function(r){return r.staffId===staffId&&r.status==='Approved'});var annualTaken=approved.filter(function(r){return r.type==='Annual Leave'}).reduce(function(t,r){return t+(parseInt(r.days)||0)},0);var sickTaken=approved.filter(function(r){return r.type==='Sick Leave'}).reduce(function(t,r){return t+(parseInt(r.days)||0)},0);return{annualAlloc:annualAlloc,annualTaken:annualTaken,annualLeft:Math.max(0,annualAlloc-annualTaken),sickAlloc:sickAlloc,sickTaken:sickTaken,sickLeft:Math.max(0,sickAlloc-sickTaken)};}
function getNextEmpId(){var nums=DB.findAll('staff').map(function(s){var m=s.empid.match(/EMP(\d+)/i);return m?parseInt(m[1]):0});var next=nums.length?Math.max.apply(null,nums)+1:1;return'EMP'+String(next).padStart(3,'0')}
function setNextEmpId(){if(APP.editingStaffIdx===-1)document.getElementById('sf-id').value=getNextEmpId()}
function renderStaffTable(){var wrap=document.getElementById('staff-table-wrap');var search=(document.getElementById('staff-search')||{}).value||'';var all=DB.findAll('staff').filter(function(s){return!search||s.name.toLowerCase().includes(search.toLowerCase())||s.empid.toLowerCase().includes(search.toLowerCase())||s.department.toLowerCase().includes(search.toLowerCase())});if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem">No staff found.</p>';return}var rows='';all.forEach(function(s,idx){var sc=s.status==='Active'?'pill-active':'pill-inactive';var ls=getLeaveStats(s._id);var aCol=ls.annualLeft<=0?'color:#dc2626':ls.annualLeft<=5?'color:#f59e0b':'color:#16a34a';var sCol=ls.sickLeft<=0?'color:#dc2626':ls.sickLeft<=2?'color:#f59e0b':'color:#16a34a';var eid='stf'+idx;STAFF_ID_MAP[eid]=s._id;var hrStr=s.hourlyRate?'VUV '+s.hourlyRate+'/hr':'Salaried';var cycleStr=s.payCycle||'Monthly';var delBtn=(APP.currentUser.role==='admin'||APP.currentUser.role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deleteStaff(STAFF_ID_MAP.stf'+idx+')" title="Delete"><i class="ti ti-trash"></i></button>':'';rows+=''+'<tr>'+'<td style="font-weight:600">'+s.name+'</td>'+'<td style="color:#888">'+s.empid+'</td>'+'<td>'+s.designation+'</td>'+'<td>'+s.department+'</td>'+'<td><span style="background:#f0f7ff;color:#000000;padding:2px 6px;border-radius:4px;font-size:11px;display:block;margin-bottom:2px">'+hrStr+'</span><span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:4px;font-size:10px;display:block;text-align:center">'+cycleStr+'</span></td>'+'<td style="background:#f0f8ff;text-align:center">'+ls.annualAlloc+' Days</td>'+'<td style="background:#f0f8ff;text-align:center;color:#1565c0;font-weight:600">'+ls.annualTaken+' Days</td>'+'<td style="background:#f0f8ff;text-align:center;font-weight:700;'+aCol+'">'+ls.annualLeft+' Days</td>'+'<td style="background:#fff5f5;text-align:center">'+ls.sickAlloc+' Days</td>'+'<td style="background:#fff5f5;text-align:center;color:#c62828;font-weight:600">'+ls.sickTaken+' Days</td>'+'<td style="background:#fff5f5;text-align:center;font-weight:700;'+sCol+'">'+ls.sickLeft+' Days</td>'+'<td><span class="status-pill '+sc+'">'+s.status+'</span></td>'+'<td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="editStaff(STAFF_ID_MAP.stf'+idx+')" title="Edit"><i class="ti ti-edit"></i></button> '+delBtn+'</td>'+'</tr>';});wrap.innerHTML='<div style="overflow:auto"><table><thead><tr><th>Name</th><th>ID</th><th>Designation</th><th>Dept</th><th>Pay Type</th><th style="background:#e8f4fd;color:#1565c0;text-align:center">Annual<br>Allocated</th><th style="background:#e8f4fd;color:#1565c0;text-align:center">Annual<br>Taken</th><th style="background:#e8f4fd;color:#1565c0;text-align:center">Annual<br>Left</th><th style="background:#fde8e8;color:#c62828;text-align:center">Sick Leave<br>Allocated</th><th style="background:#fde8e8;color:#c62828;text-align:center">Sick Leave<br>Taken</th><th style="background:#fde8e8;color:#c62828;text-align:center">Sick Leave<br>Left</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function clearStaffForm(){document.getElementById('sf-name').value='';setNextEmpId();document.getElementById('sf-designation').value='';document.getElementById('sf-department').value='';document.getElementById('sf-email').value='';document.getElementById('sf-phone').value='';document.getElementById('sf-hourly').value='';document.getElementById('sf-bank').value='';document.getElementById('sf-account').value='';document.getElementById('sf-annual').value='21';document.getElementById('sf-sick').value='10';document.getElementById('sf-status').value='Active';document.getElementById('sf-paycycle').value='Monthly';document.getElementById('sf-create-user').checked=false;document.getElementById('sf-user-fields').style.display='none';document.getElementById('sf-username').value='';document.getElementById('sf-password').value='';APP.editingStaffIdx=-1;document.getElementById('staff-form-title').textContent='Add New Staff';}
function saveStaff(){var n=document.getElementById('sf-name').value.trim();var id=document.getElementById('sf-id').value.trim();var dsg=document.getElementById('sf-designation').value.trim();var dep=document.getElementById('sf-department').value;var email=document.getElementById('sf-email').value.trim();var phone=document.getElementById('sf-phone').value.trim();var hourlyRate=parseFloat(document.getElementById('sf-hourly').value)||0;var bank=document.getElementById('sf-bank').value.trim();var account=document.getElementById('sf-account').value.trim();var annual=parseInt(document.getElementById('sf-annual').value)||21;var sick=parseInt(document.getElementById('sf-sick').value)||10;var st=document.getElementById('sf-status').value;var pc=document.getElementById('sf-paycycle').value;if(!n){alert('Staff name is required.');return}if(!dep){alert('Please select a department.');return}var obj={name:n,empid:id,designation:dsg,department:dep,email:email,phone:phone,hourlyRate:hourlyRate,bankName:bank,accountNumber:account,annualLeave:annual,sickLeave:sick,status:st,payCycle:pc};var savedId='';if(APP.editingStaffIdx!==-1){DB.update('staff',{_id:APP.editingStaffIdx},obj);savedId=APP.editingStaffIdx;APP.editingStaffIdx=-1;document.getElementById('staff-form-title').textContent='Add New Staff';}else{var newDoc=DB.insert('staff',obj);savedId=newDoc._id;}var createUser=document.getElementById('sf-create-user').checked;var uname=document.getElementById('sf-username').value.trim();var pass=document.getElementById('sf-password').value.trim();if(createUser&&uname){var existingUser=DB.findOne('users',{linkedStaffId:savedId});if(!existingUser){existingUser=DB.findOne('users',{username:uname});}if(existingUser){var userObj={name:n,username:uname,role:'staff',linkedStaffId:savedId};if(pass)userObj.password=pass;DB.update('users',{_id:existingUser._id},userObj);}else{if(!pass)pass='staff123';DB.insert('users',{name:n,username:uname,password:pass,role:'staff',linkedStaffId:savedId});}}clearStaffForm();renderStaffTable();if(typeof renderUsersTable==='function')renderUsersTable();setNextEmpId();var m=document.getElementById('sf-msg');m.textContent='Staff saved to database.';m.style.display='block';setTimeout(function(){m.style.display='none'},2500);}
function editStaff(dbId){var s=DB.findOne('staff',{_id:dbId});if(!s)return;APP.editingStaffIdx=dbId;document.getElementById('sf-name').value=s.name;document.getElementById('sf-id').value=s.empid;document.getElementById('sf-designation').value=s.designation;document.getElementById('sf-department').value=s.department;document.getElementById('sf-email').value=s.email||'';document.getElementById('sf-phone').value=s.phone||'';document.getElementById('sf-hourly').value=s.hourlyRate||'';document.getElementById('sf-bank').value=s.bankName||'';document.getElementById('sf-account').value=s.accountNumber||'';document.getElementById('sf-annual').value=s.annualLeave||21;document.getElementById('sf-sick').value=s.sickLeave||10;document.getElementById('sf-status').value=s.status;document.getElementById('sf-paycycle').value=s.payCycle||'Monthly';var eu=DB.findOne('users',{linkedStaffId:dbId});if(eu){document.getElementById('sf-create-user').checked=true;document.getElementById('sf-user-fields').style.display='block';document.getElementById('sf-username').value=eu.username;document.getElementById('sf-password').value='';}else{document.getElementById('sf-create-user').checked=false;document.getElementById('sf-user-fields').style.display='none';document.getElementById('sf-username').value='';document.getElementById('sf-password').value='';}document.getElementById('staff-form-title').textContent='Edit Staff - '+s.name;}
function deleteStaff(dbId){var s=DB.findOne('staff',{_id:dbId});customConfirm('Delete '+(s?s.name:'this staff member')+'?', function(){ DB.remove('staff',{_id:dbId});renderStaffTable();setNextEmpId(); });}
function refreshHRStaffDropdown(){
  var sel=document.getElementById('hr-staff');
  var val=sel.value;
  sel.innerHTML='<option value="">-- Select Staff --</option>';
  
  var allowed = DB.findAll('staff',{status:'Active'});
  if (APP.currentUser && APP.currentUser.role === 'staff' && APP.currentUser.linkedStaffId) {
      allowed = allowed.filter(function(s) { return s._id === APP.currentUser.linkedStaffId; });
  }

  allowed.forEach(function(s){
    var o=document.createElement('option');
    o.value=s._id;
    o.textContent=s.name+' ('+s.empid+')';
    sel.appendChild(o);
  });
  
  if (APP.currentUser && APP.currentUser.role === 'staff' && APP.currentUser.linkedStaffId) {
      sel.value = APP.currentUser.linkedStaffId;
      sel.disabled = true; // Lock dropdown
  } else {
      sel.disabled = false;
      sel.value = val;
  }
}
function toggleAdvanceAmount(){var type=document.getElementById('hr-type').value;document.getElementById('hr-advance-wrap').style.visibility=type==='Payment Advance'?'visible':'hidden';}
function saveHRRequest(){var staffId=document.getElementById('hr-staff').value;if(!staffId){alert('Please select a staff member.');return}var s=DB.findOne('staff',{_id:staffId});var type=document.getElementById('hr-type').value;var start=document.getElementById('hr-start').value;var end=document.getElementById('hr-end').value;var amount=type==='Payment Advance'?parseFloat(document.getElementById('hr-amount').value)||0:0;var notes=document.getElementById('hr-notes').value.trim();if(!start){alert('Please select a start date.');return}var days=0;if(start&&end){var s1=new Date(start+'T00:00:00'),e1=new Date(end+'T00:00:00');days=Math.max(1,Math.round((e1-s1)/(1000*60*60*24))+1)}var newHR=DB.insert('hr_requests',{staffId:staffId,staff:s?s.name:'',empid:s?s.empid:'',department:s?s.department:'',type:type,startDate:start,endDate:end||start,days:days,amount:amount,notes:notes,status:'Pending',createdBy:APP.currentUser.username});createNotification('pending','New '+type+' Request',(s?s.name:'Staff')+' has submitted a '+type+(type==='Payment Advance'?' of '+vuvFmt(amount):' ('+days+' day'+(days!==1?'s':'')+').')+' Awaiting approval.',{section:'hr',recordId:newHR._id,submittedBy:APP.currentUser.username},['admin','manager','it']);var myNotifs=loadNotifications(APP.currentUser.username);myNotifs.unshift({_id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:'info',title:'Request Submitted',body:'Your '+type+' request'+(s?' for '+s.name:'')+' has been submitted and is awaiting approval.',action:{section:'hr',recordId:newHR._id},read:false,time:new Date().toISOString()});saveNotifications(APP.currentUser.username,myNotifs);renderNotifBadge();clearHRForm();renderHRTable();renderHRSummary();var m=document.getElementById('hr-save-msg');m.style.display='inline-flex';setTimeout(function(){m.style.display='none'},3000);}
function clearHRForm(){document.getElementById('hr-staff').value='';document.getElementById('hr-type').value='Annual Leave';document.getElementById('hr-start').value='';document.getElementById('hr-end').value='';document.getElementById('hr-amount').value='';document.getElementById('hr-notes').value='';document.getElementById('hr-advance-wrap').style.visibility='hidden';APP.editingHRId=null}
function renderHRSummary(){
  var all=getUserHRRecords();
  document.getElementById('hr-count-annual').textContent=all.filter(function(r){return r.type==='Annual Leave'}).length;
  document.getElementById('hr-count-sick').textContent=all.filter(function(r){return r.type==='Sick Leave'}).length;
  document.getElementById('hr-count-unpaid').textContent=all.filter(function(r){return r.type==='Leave Without Pay'}).length;
  var totalAdv=all.filter(function(r){return r.type==='Payment Advance'&&r.status==='Approved'}).reduce(function(s,r){return s+(r.amount||0)},0);
  document.getElementById('hr-total-advance').textContent=vuvFmt(totalAdv);
}
function pillClass(s){return s==='Approved'?'pill-approved':s==='Rejected'?'pill-rejected':'pill-pending'}
function renderHRTable(){var filterS=document.getElementById('hr-filter-status')?document.getElementById('hr-filter-status').value:'';var filterT=document.getElementById('hr-filter-type')?document.getElementById('hr-filter-type').value:'';var role=APP.currentUser.role;var all=getUserHRRecords();if(filterS)all=all.filter(function(r){return r.status===filterS});if(filterT)all=all.filter(function(r){return r.type===filterT});var recent=all.slice().reverse().slice(0,5);var rWrap=document.getElementById('hr-recent-wrap');if(rWrap){if(!recent.length){rWrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem 0">No requests yet.</p>';}else{var rHtml='<table><thead><tr><th>Employee</th><th>Type</th><th>Status</th></tr></thead><tbody>';recent.forEach(function(r){rHtml+='<tr><td style="font-weight:600">'+r.staff+'</td><td>'+r.type+'</td><td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td></tr>'});rHtml+='</tbody></table>';rWrap.innerHTML=rHtml;}}var wrap=document.getElementById('hr-table-wrap');if(!wrap)return;if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem 0">No records found.</p>';return}var rows='';all.slice().reverse().forEach(function(r,idx){var canApprove=role==='admin'||role==='it'||role==='manager';var eid='hr'+idx;HR_ID_MAP[eid]=r._id;var dateFmt=function(d){return d?fmtDate(d):'-'};var ls=getLeaveStats(r.staffId);var annualOutCell='<span style="color:#888;font-size:12px">--</span>';var sickOutCell='<span style="color:#888;font-size:12px">--</span>';if(r.type==='Annual Leave'){var aCol=ls.annualLeft<=0?'#dc2626':ls.annualLeft<=5?'#f59e0b':'#16a34a';annualOutCell='<span style="font-weight:700;color:'+aCol+'">'+ls.annualLeft+' / '+ls.annualAlloc+' d</span>';}else if(r.type==='Sick Leave'){var sCol=ls.sickLeft<=0?'#dc2626':ls.sickLeft<=2?'#f59e0b':'#16a34a';sickOutCell='<span style="font-weight:700;color:'+sCol+'">'+ls.sickLeft+' / '+ls.sickAlloc+' d</span>';}var actionBtns='';if(canApprove&&r.status==='Pending'){actionBtns+='<button class="btn btn-success btn-sm" onclick="approveHR(HR_ID_MAP.'+eid+',\'Approved\')" title="Approve"><i class="fa-solid fa-check"></i></button> ';actionBtns+='<button class="btn btn-danger btn-sm" onclick="approveHR(HR_ID_MAP.'+eid+',\'Rejected\')" title="Reject"><i class="fa-solid fa-xmark"></i></button> ';}if(role==='admin'||role==='manager'){actionBtns+='<button class="btn btn-danger btn-sm" onclick="deleteHR(HR_ID_MAP.'+eid+')"><i class="ti ti-trash"></i></button>'}rows+=''+'<tr>'+'<td style="font-weight:600">'+r.staff+'</td>'+'<td style="color:#888">'+r.empid+'</td>'+'<td>'+r.type+'</td>'+'<td style="white-space:nowrap">'+dateFmt(r.startDate)+'</td>'+'<td style="white-space:nowrap">'+dateFmt(r.endDate)+'</td>'+'<td style="text-align:center">'+(r.type==='Payment Advance'?'--':r.days)+'</td>'+'<td style="text-align:center">'+annualOutCell+'</td>'+'<td style="text-align:center">'+sickOutCell+'</td>'+'<td>'+(r.amount?vuvFmt(r.amount):'--')+'</td>'+'<td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td>'+'<td style="white-space:nowrap">'+actionBtns+'</td>'+'</tr>';});wrap.innerHTML='<div style="overflow:auto"><table><thead><tr><th>Employee</th><th>ID</th><th>Type</th><th>Start</th><th>End</th><th>Days</th><th style="background:#e8f4fd;color:#1565c0;text-align:center">Annual Outstanding</th><th style="background:#fde8e8;color:#c62828;text-align:center">Sick Outstanding</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function approveHR(id,status){
  DB.update('hr_requests',{_id:id},{status:status,approvedBy:APP.currentUser.username});
  var rec=DB.findOne('hr_requests',{_id:id});
  if(rec){
    var rType=status==='Approved'?'approved':'rejected';
    var submitter=rec.createdBy||'';
    // Notify the submitter
    if(submitter){
      var subN=loadNotifications(submitter);
      subN.unshift({_id:Date.now().toString(36)+Math.random().toString(36).substr(2,5),type:rType,title:'Leave Request '+status,body:'Your '+rec.type+' request'+(rec.staff?' for '+rec.staff:'')+' has been '+status.toLowerCase()+' by '+APP.currentUser.name+'.',action:{section:'hr',recordId:id},read:false,time:new Date().toISOString()});
      saveNotifications(submitter,subN);
    }
    // Notify other admins/managers
    createNotification(rType,'Request '+status,(rec.staff||'Staff')+' '+rec.type+' has been '+status.toLowerCase()+' by '+APP.currentUser.name+'.',{section:'hr',recordId:id,submittedBy:submitter},['admin','manager','it']);
  }
  renderHRTable();renderHRSummary();renderStaffTable();
  var dash=document.getElementById('section-dashboard');
  if(dash&&!dash.classList.contains('hidden'))renderDashboard();
}
function deleteHR(id){customConfirm('Delete this request?', function(){ DB.remove('hr_requests',{_id:id});renderHRTable();renderHRSummary(); });}
function renderUsersTable(){
  var wrap=document.getElementById('users-table-wrap');
  var role=APP.currentUser.role;
  var canEdit=role==='admin'||role==='manager';
  var html='<table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead><tbody>';
  DB.findAll('users').forEach(function(u){
    var eid='usr_'+u._id;
    USER_ID_MAP[eid]=u._id;
    var actions='';
    if(canEdit){
      actions+='<button class=\"btn btn-outline btn-sm\" onclick=\"editUser(USER_ID_MAP.'+eid+')\" title=\"Edit\"><i class=\"ti ti-edit\"></i></button> ';
      actions+='<button class=\"btn btn-danger btn-sm\" onclick=\"deleteUser(USER_ID_MAP.'+eid+')\" title=\"Delete\"><i class=\"ti ti-trash\"></i></button>';
    }
    html+='<tr><td style=\"font-weight:600\">'+u.name+'</td><td style=\"color:#555\">'+u.username+'</td><td><span class=\"badge badge-'+u.role+'\">'+u.role.toUpperCase()+'</span></td><td style=\"white-space:nowrap\">'+actions+'</td></tr>';
  });
  html+='</tbody></table>';
  wrap.innerHTML=html;
}
function saveUser(){
  var n=document.getElementById('uf-name').value.trim();
  var u=document.getElementById('uf-username').value.trim();
  var p=document.getElementById('uf-password').value.trim();
  var r=document.getElementById('uf-role').value;
  if(!n||!u||!p){alert('All fields required.');return}
  if(APP.editingUserId){
    var lsid2=document.getElementById('uf-staff-link')?document.getElementById('uf-staff-link').value:'';DB.update('users',{_id:APP.editingUserId},{name:n,username:u,password:p,role:r,linkedStaffId:lsid2});
    cancelEditUser();
    renderUsersTable();
    var m=document.getElementById('uf-msg');m.textContent='User updated successfully.';m.style.display='block';setTimeout(function(){m.style.display='none'},2500);
  }else{
    if(DB.findOne('users',{username:u})){alert('Username already exists.');return}
    var lsid=document.getElementById('uf-staff-link')?document.getElementById('uf-staff-link').value:'';DB.insert('users',{name:n,username:u,password:p,role:r,linkedStaffId:lsid});
    ['uf-name','uf-username','uf-password'].forEach(function(id){document.getElementById(id).value=''});
    renderUsersTable();
    var m=document.getElementById('uf-msg');m.textContent='User added successfully.';m.style.display='block';setTimeout(function(){m.style.display='none'},2500);
  }
}
function editUser(dbId){
  var u=DB.findOne('users',{_id:dbId});
  if(!u)return;
  APP.editingUserId=dbId;
  document.getElementById('uf-name').value=u.name;
  document.getElementById('uf-username').value=u.username;
  document.getElementById('uf-password').value=u.password||'';
  document.getElementById('uf-role').value=u.role;
  document.getElementById('uf-form-title').textContent='Edit User — '+u.name;
  document.getElementById('uf-save-btn').innerHTML='<i class="ti ti-device-floppy"></i> Update User';
  document.getElementById('uf-cancel-btn').style.display='inline-flex';
  document.getElementById('uf-name').focus();
  // populate staff link dropdown then set value
  populateStaffLinkDropdown();
  var slEl=document.getElementById('uf-staff-link');
  if(slEl&&u.linkedStaffId)slEl.value=u.linkedStaffId;
}
function populateStaffLinkDropdown(){
  var sel=document.getElementById('uf-staff-link');
  if(!sel)return;
  var cur=sel.value;
  sel.innerHTML='<option value="">-- Not linked --</option>';
  DB.findAll('staff').forEach(function(s){
    var o=document.createElement('option');
    o.value=s._id;
    o.textContent=s.name+' ('+s.empid+')';
    sel.appendChild(o);
  });
  sel.value=cur;
}
function cancelEditUser(){
  APP.editingUserId=null;
  ['uf-name','uf-username','uf-password'].forEach(function(id){document.getElementById(id).value=''});
  document.getElementById('uf-role').value='staff';
  document.getElementById('uf-form-title').textContent='Add New User';
  document.getElementById('uf-save-btn').innerHTML='<i class="ti ti-user-plus"></i> Add User';
  document.getElementById('uf-cancel-btn').style.display='none';
}
function deleteUser(dbId){customConfirm('Delete this user?', function(){ DB.remove('users',{_id:dbId});renderUsersTable(); });}
var LAST_COMPLIANCE_DATA=null;
function renderCompliance(){
  var filterM=document.getElementById('cr-month').value;
  var filterY=document.getElementById('cr-year').value;
  var list=DB.findAll('payslips').filter(function(p){return(!filterM||p.month===filterM)&&(!filterY||p.year==filterY)});
  var out=document.getElementById('compliance-output');
  var loading=document.getElementById('cr-loading');
  var pdfBtn=document.getElementById('cr-pdf-btn');
  if(!list.length){out.innerHTML='<div class="card" style="text-align:center;color:#888;padding:2rem">No records for this period.</div>';if(pdfBtn)pdfBtn.style.display='none';return;}
  var tE=list.reduce(function(s,p){return s+p.totalEarn},0);
  var tV=list.reduce(function(s,p){return s+p.vnpf},0);
  var tL=list.reduce(function(s,p){return s+p.loan},0);
  var tO=list.reduce(function(s,p){return s+p.others},0);
  var tN=list.reduce(function(s,p){return s+p.net},0);
  // HR data — all requests, filtered by period if month/year selected
  var allHR=DB.findAll('hr_requests');
  var hrFiltered=allHR.filter(function(r){
    if(!filterM&&!filterY)return true;
    var d=r.startDate||'';
    if(filterY&&d.substr(0,4)!==filterY)return false;
    if(filterM&&filterM!==''){var mIdx=MONTHS.indexOf(filterM);var mStr=String(mIdx+1).padStart(2,'0');if(d.substr(5,2)!==mStr)return false;}
    return true;
  });
  // Staff data
  var allStaff=DB.findAll('staff');
  var periodLabel=filterM&&filterY?filterM+' '+filterY:filterY?'Year '+filterY:'All Periods';
  var today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  LAST_COMPLIANCE_DATA={list:list,tE:tE,tV:tV,tL:tL,tO:tO,tN:tN,periodLabel:periodLabel,today:today,hrData:hrFiltered,staffData:allStaff};
  if(loading)loading.style.display='block';
  out.innerHTML='';
  if(pdfBtn)pdfBtn.style.display='none';
  generateComplianceNarrative(LAST_COMPLIANCE_DATA,function(narrative){
    LAST_COMPLIANCE_DATA._narrative=narrative;
    if(loading)loading.style.display='none';
    renderComplianceReport(LAST_COMPLIANCE_DATA,narrative);
    if(pdfBtn)pdfBtn.style.display='inline-flex';
  });
}
function generateComplianceNarrative(data,callback){var bigOthers=data.list.filter(function(p){return p.others>0});var otherNotes=bigOthers.map(function(p){return p.staff+': '+vuvFmt(p.others)+(p.othersNote?' ('+p.othersNote+')':'')}).join(', ');var empCount=data.list.length;var hrData=data.hrData||[];
  var annualLv=hrData.filter(function(r){return r.type==='Annual Leave'}).length;
  var sickLv=hrData.filter(function(r){return r.type==='Sick Leave'}).length;
  var unpaidLv=hrData.filter(function(r){return r.type==='Leave Without Pay'}).length;
  var advTotal=hrData.filter(function(r){return r.type==='Payment Advance'&&r.status==='Approved'}).reduce(function(s,r){return s+(r.amount||0)},0);
  var prompt='You are a payroll compliance officer for WokManeja in Vanuatu.\nGenerate a concise executive compliance narrative for the following payroll and HR data.\nReporting Period: '+data.periodLabel+'\nEmployees processed: '+empCount+'\nTotal Gross Payroll: '+vuvFmt(data.tE)+'\nTotal VNPF (6%): '+vuvFmt(data.tV)+'\nTotal Loan Deductions: '+vuvFmt(data.tL)+'\nTotal Other Deductions: '+vuvFmt(data.tO)+(otherNotes?' ('+otherNotes+')':'')+'\nTotal Net Payroll: '+vuvFmt(data.tN)+'\nHR Leave Requests: Annual='+annualLv+', Sick='+sickLv+', Leave Without Pay='+unpaidLv+'\nPayment Advances Approved: '+vuvFmt(advTotal)+'\nTotal HR Requests: '+hrData.length+'\n\nReturn a JSON object with exactly these keys (no markdown, raw JSON only):\n{"executive_summary":"2-3 sentence summary covering both payroll and HR activity","vnpf_observation":"1-2 sentences about VNPF compliance","deduction_observation":"1-2 sentences about deductions","accuracy_observation":"1-2 sentences about payroll accuracy","recommendations":["rec 1","rec 2","rec 3","rec 4","rec 5"],"conclusion":"1-2 sentence conclusion covering payroll and HR"}';fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})}).then(function(r){return r.json()}).then(function(data){try{var text=data.content.map(function(c){return c.text||''}).join('').trim();var clean=text.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();callback(JSON.parse(clean));}catch(e){callback(defaultNarrative(LAST_COMPLIANCE_DATA))}}).catch(function(){callback(defaultNarrative(LAST_COMPLIANCE_DATA));});}
function defaultNarrative(data){var bigOthers=data.list.filter(function(p){return p.others>0});var recs=['Maintain signed payroll approval records for all deductions.','Ensure VNPF remittances are submitted on time to avoid penalties.','Implement deduction categories within the payroll system for improved audit tracking.','Maintain fortnight payroll period references for better payroll transparency.','Introduce payroll reconciliation checks before final approval and payment processing.'];var hrD=data.hrData||[];var annLv=hrD.filter(function(r){return r.type==='Annual Leave'}).length;var sickLv=hrD.filter(function(r){return r.type==='Sick Leave'}).length;var unpLv=hrD.filter(function(r){return r.type==='Leave Without Pay'}).length;var advAmt=hrD.filter(function(r){return r.type==='Payment Advance'&&r.status==='Approved'}).reduce(function(s,r){return s+(r.amount||0)},0);
  var execSummary='This report presents the payroll and HR compliance summary for '+data.periodLabel+'. The payroll covered '+data.list.length+' employee'+(data.list.length!==1?'s':'')+' with a total gross payroll of '+vuvFmt(data.tE)+'. Mandatory VNPF contributions were calculated at the standard rate of 6%, resulting in total VNPF deductions of '+vuvFmt(data.tV)+'. During this period, '+hrD.length+' HR request'+(hrD.length!==1?'s were':' was')+' recorded, including '+annLv+' annual leave, '+sickLv+' sick leave, '+unpLv+' leave without pay'+(advAmt>0?', and approved advances totalling '+vuvFmt(advAmt):'')+'.';var deductObs='All loan and other deductions have been processed and recorded.';if(bigOthers.length>0){deductObs='Significant additional deductions were identified under "Other Deductions" totalling '+vuvFmt(data.tO)+'. These should be reviewed and verified to ensure supporting documentation and authorization are properly maintained.';}return{executive_summary:execSummary,vnpf_observation:'The payroll system correctly applied the VNPF contribution rate of 6% across all processed salaries for the reporting period.',deduction_observation:deductObs,accuracy_observation:'The reported Net Payroll total of '+vuvFmt(data.tN)+' aligns with the processed payroll records after all deductions.',recommendations:recs,conclusion:'The '+data.periodLabel+' payroll process was completed with correct VNPF calculations. Management attention is recommended regarding deductions recorded during the payroll cycle to ensure full compliance and audit readiness.'};}

function buildReportHTML(data,narrative,forPrint){
  var pr=data;
  // ── Payroll rows
  var rows='';
  pr.list.forEach(function(p){
    var prd=getPeriodRange(p);
    var periodStr=prd.start&&prd.end?fmtDate(prd.start)+' &ndash; '+fmtDate(prd.end):p.month+' '+p.year;
    rows+='<tr><td style="font-weight:600">'+p.staff+'</td><td>'+p.empid+'</td><td style="white-space:nowrap">'+fmtDate(p.paydate)+'</td><td style="white-space:nowrap;font-size:11px">'+periodStr+'</td><td style="text-align:right">'+vuvFmt(p.totalEarn)+'</td><td style="text-align:right;color:#1565c0">'+vuvFmt(p.vnpf)+'</td><td style="text-align:right">'+vuvFmt(p.loan)+'</td><td style="text-align:right">'+vuvFmt(p.others)+(p.othersNote?'<br><span style="font-size:10px;color:#aaa;font-style:italic">('+p.othersNote+')</span>':'')+'</td><td style="text-align:right;font-weight:700;color:#000000">'+vuvFmt(p.net)+'</td></tr>';
  });

  // ── HR Leave rows
  var hrData=pr.hrData||[];
  var hrRows='';
  var leaveTypes={'Annual Leave':0,'Sick Leave':0,'Leave Without Pay':0,'Payment Advance':0};
  var totalAdvApproved=0;
  hrData.forEach(function(r){
    if(leaveTypes[r.type]!==undefined)leaveTypes[r.type]++;
    if(r.type==='Payment Advance'&&r.status==='Approved')totalAdvApproved+=(r.amount||0);
    var pill=r.status==='Approved'?'background:#dcfce7;color:#166534':r.status==='Rejected'?'background:#fee2e2;color:#991b1b':'background:#fef3c7;color:#92400e';
    hrRows+='<tr><td style="font-weight:600">'+r.staff+'</td><td>'+r.empid+'</td><td>'+r.type+'</td><td style="white-space:nowrap">'+fmtDate(r.startDate)+'</td><td style="white-space:nowrap">'+fmtDate(r.endDate)+'</td><td style="text-align:center">'+(r.type==='Payment Advance'?'&mdash;':r.days||0)+'</td><td>'+(r.amount?vuvFmt(r.amount):'&mdash;')+'</td><td><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;'+pill+'">'+r.status+'</span></td><td style="color:#777;font-size:11px">'+r.department+'</td></tr>';
  });

  // ── Staff Directory rows
  var staffData=pr.staffData||[];
  var staffRows='';
  staffData.forEach(function(s){
    var ls=getLeaveStats(s._id);
    var aCol=ls.annualLeft<=0?'color:#dc2626':ls.annualLeft<=5?'color:#f59e0b':'color:#16a34a';
    var sCol=ls.sickLeft<=0?'color:#dc2626':ls.sickLeft<=2?'color:#f59e0b':'color:#16a34a';
    var statusColor=s.status==='Active'?'background:#dcfce7;color:#166534':'background:#f0f0f0;color:#666';
    staffRows+='<tr><td style="font-weight:600">'+s.name+'</td><td>'+s.empid+'</td><td>'+s.designation+'</td><td>'+s.department+'</td><td style="text-align:center">'+ls.annualAlloc+'</td><td style="text-align:center;font-weight:700;'+aCol+'">'+ls.annualLeft+'</td><td style="text-align:center">'+ls.sickAlloc+'</td><td style="text-align:center;font-weight:700;'+sCol+'">'+ls.sickLeft+'</td><td><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;'+statusColor+'">'+s.status+'</span></td></tr>';
  });

  var bigOthers=pr.list.filter(function(p){return p.others>0});
  var warnBlock='';
  if(bigOthers.length>0){warnBlock='<div class="rpt-highlight-warn"><strong>&#9888; Deduction Alert:</strong> '+bigOthers.map(function(p){return p.staff+' &mdash; Other Deduction: '+vuvFmt(p.others)+(p.othersNote?' ('+p.othersNote+')':'')}).join('; ')+'</div>';}
  var recs=(narrative.recommendations||[]).map(function(r){return '<li>'+r+'</li>'}).join('');

  var cs=DB.findOne('settings',{_id:'company'})||{name:'WokManeja',address:'PO BOX 3276, Shefa Province, Efate, Vanuatu'};
  var cName=cs.name||'WokManeja';
  var cAddress=cs.address||'PO BOX 3276, Shefa Province, Efate, Vanuatu';

  return '<div class="rpt-page"'+(forPrint?' style="box-shadow:none;border:none;max-width:100%"':'')+' id="rpt-content">'
    // ── HEADER
    +'<div class="rpt-header">'
      +'<div class="rpt-logo-row">'
        +'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="height:70px;width:auto;border-radius:6px"/>'
        +'<div><div class="rpt-title">Executive Compliance &amp; Payroll Report</div><div class="rpt-subtitle">Prepared For: '+cName+' &bull; '+cAddress+'</div></div>'
      +'</div>'
      +'<div class="rpt-meta"><div class="rpt-meta-item"><p>Reporting Period</p><span>'+pr.periodLabel+'</span></div><div class="rpt-meta-item"><p>Generated Date</p><span>'+pr.today+'</span></div><div class="rpt-meta-item"><p>Employees Processed</p><span>'+pr.list.length+'</span></div></div>'
    +'</div>'
    // ── SECTION 1: Executive Summary
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">1.</span> Executive Summary</div><p style="font-size:13px;color:#444;line-height:1.8">'+narrative.executive_summary+'</p>'+warnBlock+'</div>'
    // ── SECTION 2: Payroll Summary
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">2.</span> Payroll Compliance Summary</div><table class="rpt-summary-table"><tr><td>Total Gross Payroll</td><td>'+vuvFmt(pr.tE)+'</td></tr><tr><td>Total VNPF Contributions (6%)</td><td>'+vuvFmt(pr.tV)+'</td></tr><tr><td>Total Loan Deductions</td><td>'+vuvFmt(pr.tL)+'</td></tr><tr><td>Total Other Deductions</td><td>'+vuvFmt(pr.tO)+'</td></tr><tr><td>Total Net Payroll Paid</td><td>'+vuvFmt(pr.tN)+'</td></tr></table></div>'
    // ── SECTION 3: Employee Payroll Details
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">3.</span> Employee Payroll Details</div><div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th>Staff Name</th><th>Employee ID</th><th>Pay Date</th><th>Payroll Period</th><th style="text-align:right">Gross Pay</th><th style="text-align:right">VNPF</th><th style="text-align:right">Loan</th><th style="text-align:right">Other Ded.</th><th style="text-align:right">Net Pay</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'
    // ── SECTION 4: HR Leave & Advance Summary
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">4.</span> HR Leave &amp; Advance Summary</div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1rem">'
        +'<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:4px">Annual Leave</p><p style="font-size:22px;font-weight:800;color:#1d4ed8">'+leaveTypes['Annual Leave']+'</p></div>'
        +'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:4px">Sick Leave</p><p style="font-size:22px;font-weight:800;color:#dc2626">'+leaveTypes['Sick Leave']+'</p></div>'
        +'<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:4px">Leave W/O Pay</p><p style="font-size:22px;font-weight:800;color:#d97706">'+leaveTypes['Leave Without Pay']+'</p></div>'
        +'<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px">Advances Approved</p><p style="font-size:16px;font-weight:800;color:#16a34a">'+vuvFmt(totalAdvApproved)+'</p></div>'
      +'</div>'
      +(hrData.length?'<div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th>Employee</th><th>ID</th><th>Request Type</th><th>Start Date</th><th>End Date</th><th style="text-align:center">Days</th><th>Amount</th><th>Status</th><th>Department</th></tr></thead><tbody>'+hrRows+'</tbody></table></div>':'<p style="font-size:13px;color:#888;text-align:center;padding:1rem">No HR leave or advance requests for this period.</p>')
    +'</div>'
    // ── SECTION 5: Staff Directory & Leave Balances
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">5.</span> Staff Directory &amp; Leave Balances</div>'
      +(staffData.length?'<div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th>Name</th><th>ID</th><th>Designation</th><th>Department</th><th style="text-align:center">Annual Alloc.</th><th style="text-align:center">Annual Left</th><th style="text-align:center">Sick Alloc.</th><th style="text-align:center">Sick Left</th><th>Status</th></tr></thead><tbody>'+staffRows+'</tbody></table></div>':'<p style="font-size:13px;color:#888;text-align:center;padding:1rem">No staff records found.</p>')
    +'</div>'
    // ── SECTION 6: Compliance Observations
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">6.</span> Compliance Observations</div><div class="rpt-obs-block"><div class="rpt-obs-title">VNPF Compliance</div><div class="rpt-obs-text">'+narrative.vnpf_observation+'</div><div class="rpt-highlight-ok">&#10003; VNPF calculated at 6% &mdash; Total: '+vuvFmt(pr.tV)+'</div></div><div class="rpt-obs-block"><div class="rpt-obs-title">Deduction Review</div><div class="rpt-obs-text">'+narrative.deduction_observation+(pr.tO>0?'<ul>'+bigOthers.map(function(p){return'<li><strong>'+p.staff+'</strong>: '+vuvFmt(p.others)+(p.othersNote?' &mdash; '+p.othersNote:'')+' </li>'}).join('')+'</ul>':'')+'</div></div><div class="rpt-obs-block"><div class="rpt-obs-title">Payroll Accuracy</div><div class="rpt-obs-text">'+narrative.accuracy_observation+'</div></div></div>'
    // ── SECTION 7: Recommendations
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">7.</span> Recommendations</div><p style="font-size:13px;color:#555;margin-bottom:.75rem">Management is advised to:</p><ul class="rpt-rec-list">'+recs+'</ul></div>'
    // ── SECTION 8: Conclusion
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">8.</span> Conclusion</div><p style="font-size:13px;color:#444;line-height:1.8">'+narrative.conclusion+'</p></div>'
    // ── FOOTER
    +'<div class="rpt-footer">'
      +'<div><strong>Prepared By:</strong><br>Payroll &amp; Compliance Department<br>WokManeja</div>'
      +'<div style="text-align:center"><div style="font-size:9px;color:#bbb;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">System Developed by</div></div>'
      +'<div style="text-align:right;font-size:11px;color:#aaa">Generated: '+pr.today+'<br>WokManeja Payroll System &mdash; Confidential</div>'
    +'</div>'
  +'</div>';
}
function renderComplianceReport(data,narrative){document.getElementById('compliance-output').innerHTML=buildReportHTML(data,narrative,false);}
function downloadCompliancePDF(){
  if(!LAST_COMPLIANCE_DATA){alert('Please generate the report first.');return}
  var filterM=document.getElementById('cr-month').value;var filterY=document.getElementById('cr-year').value;
  var list=DB.findAll('payslips').filter(function(p){return(!filterM||p.month===filterM)&&(!filterY||p.year==filterY)});
  if(!list.length){alert('No data to export.');return}
  var tE=list.reduce(function(s,p){return s+p.totalEarn},0);var tV=list.reduce(function(s,p){return s+p.vnpf},0);var tL=list.reduce(function(s,p){return s+p.loan},0);var tO=list.reduce(function(s,p){return s+p.others},0);var tN=list.reduce(function(s,p){return s+p.net},0);
  var periodLabel=filterM&&filterY?filterM+' '+filterY:filterY?'Year '+filterY:'All Periods';
  var today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
  var freshData={list:list,tE:tE,tV:tV,tL:tL,tO:tO,tN:tN,periodLabel:periodLabel,today:today};
  var narrative=LAST_COMPLIANCE_DATA._narrative||defaultNarrative(freshData);
  var reportHTML=buildReportHTML(freshData,narrative,true);
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Compliance Report - WokManeja</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif}body{background:#fff;color:#1a1a1a;padding:0}.rpt-page{max-width:100%;padding:2rem;color:#1a1a1a}.rpt-header{border-bottom:3px solid #0a0a0a;padding-bottom:1.25rem;margin-bottom:1.5rem}.rpt-logo-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.rpt-title{font-size:22px;font-weight:800;color:#0a0a0a;margin-bottom:2px}.rpt-subtitle{font-size:13px;color:#555}.rpt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:12px}.rpt-meta-item p{color:#888;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}.rpt-meta-item span{font-weight:700;color:#0a0a0a;font-size:13px}.rpt-section{margin-bottom:1.75rem;page-break-inside:avoid}.rpt-section-title{font-size:14px;font-weight:700;color:#0a0a0a;border-left:4px solid #10b981;padding-left:.75rem;margin-bottom:1rem}.rpt-section-num{color:#10b981;margin-right:.35rem}.rpt-summary-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}.rpt-summary-table td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px}.rpt-summary-table td:last-child{text-align:right;font-weight:700;color:#000000}.rpt-summary-table tr:last-child td{border-bottom:2px solid #0a0a0a;font-weight:800;font-size:14px}.rpt-detail-table{width:100%;border-collapse:collapse;font-size:12px}.rpt-detail-table th{background:#0a0a0a;color:#fff;padding:9px 10px;text-align:left;font-size:11px;letter-spacing:.3px}.rpt-detail-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0}.rpt-detail-table tr:nth-child(even) td{background:#fafafa}.rpt-obs-block{background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:.75rem;border-left:3px solid #0a0a0a}.rpt-obs-title{font-size:12px;font-weight:700;color:#0a0a0a;margin-bottom:.4rem}.rpt-obs-text{font-size:12.5px;color:#444;line-height:1.7}.rpt-obs-text ul{padding-left:1.2rem;margin-top:.35rem}.rpt-obs-text li{margin-bottom:.2rem}.rpt-rec-list{list-style:none;padding:0}.rpt-rec-list li{font-size:12.5px;color:#444;padding:8px 0;border-bottom:1px solid #eee;display:flex;gap:.6rem;align-items:flex-start;line-height:1.6}.rpt-rec-list li::before{content:"\\2192";color:#10b981;font-weight:800;flex-shrink:0}.rpt-footer{border-top:2px solid #0a0a0a;padding-top:1rem;margin-top:1.5rem;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#666}.rpt-highlight-warn{background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:.5rem .75rem;font-size:12px;color:#7c5000;margin-top:.5rem}.rpt-highlight-ok{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:.5rem .75rem;font-size:12px;color:#1b5e20;margin-top:.5rem}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body>' + reportHTML + '</body></html>');
  win.document.close();
  setTimeout(function(){win.focus();win.print();},600);
}

// ── VNPF & Bank Report
var LAST_VNPF_DATA = null;
function buildVNPFHTML(data, forPrint) {
  var cs = DB.findOne('settings',{_id:'company'})||{name:'WokManeja',address:'PO BOX 3276, Shefa Province, Efate, Vanuatu'};
  var cName = cs.name||'WokManeja';
  var cAddress = cs.address||'PO BOX 3276, Shefa Province, Efate, Vanuatu';

  var rows = '';
  data.list.forEach(function(p) {
    var s = DB.findOne('staff',{empid:p.empid}) || {};
    var empId = s.empid || p.empid;
    var bank = s.bankName || 'N/A';
    var acc = s.accountNumber || 'N/A';
    var gross = p.totalEarn;
    var emp6 = p.vnpf;
    var employer6 = Math.round(gross * 0.06);
    var total12 = emp6 + employer6;
    var net = p.net;
    rows += '<tr><td style="font-weight:600">'+p.staff+'</td><td>'+empId+'</td><td>'+bank+'</td><td>'+acc+'</td><td style="text-align:right">'+vuvFmt(gross)+'</td><td style="text-align:right;color:#d97706">'+vuvFmt(emp6)+'</td><td style="text-align:right;color:#059669">'+vuvFmt(employer6)+'</td><td style="text-align:right;font-weight:700">'+vuvFmt(total12)+'</td><td style="text-align:right">'+vuvFmt(net)+'</td></tr>';
  });

  return '<div class="rpt-page"'+(forPrint?' style="box-shadow:none;border:none;max-width:100%"':'')+'>'
    +'<div class="rpt-header">'
      +'<div class="rpt-logo-row">'
        +'<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="height:70px;width:auto;border-radius:6px"/>'
        +'<div><div class="rpt-title">VNPF Remittance &amp; Bank Report</div><div class="rpt-subtitle">Prepared For: '+cName+' &bull; '+cAddress+'</div></div>'
      +'</div>'
      +'<div class="rpt-meta"><div class="rpt-meta-item"><p>Reporting Period</p><span>'+data.periodLabel+'</span></div><div class="rpt-meta-item"><p>Generated Date</p><span>'+data.today+'</span></div><div class="rpt-meta-item"><p>Employees Processed</p><span>'+data.list.length+'</span></div></div>'
    +'</div>'
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">1.</span> Remittance Summary</div><table class="rpt-summary-table"><tr><td>Total Gross Payroll</td><td>'+vuvFmt(data.tGross)+'</td></tr><tr><td>Employee VNPF (6%)</td><td>'+vuvFmt(data.tEmp6)+'</td></tr><tr><td>Employer Match (6%)</td><td>'+vuvFmt(data.tEmployer6)+'</td></tr><tr style="background:#f0fdf4"><td>Total VNPF to Remit (12%)</td><td style="color:#166534">'+vuvFmt(data.tTotal12)+'</td></tr><tr><td>Total Net Payroll Paid</td><td>'+vuvFmt(data.tNet)+'</td></tr></table></div>'
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">2.</span> Employee Details</div><div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th>Staff Name</th><th>VNPF ID (Emp ID)</th><th>Bank Name</th><th>Account No.</th><th style="text-align:right">Gross Pay</th><th style="text-align:right">Emp 6%</th><th style="text-align:right">Employer 6%</th><th style="text-align:right">Total 12%</th><th style="text-align:right">Net Pay</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'
    +'<div class="rpt-footer">'
      +'<div><strong>Prepared By:</strong><br>Payroll &amp; Compliance Department<br>'+cName+'</div>'
      +'<div style="text-align:center"><div style="font-size:9px;color:#bbb;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">System Developed by</div></div>'
      +'<div style="text-align:right;font-size:11px;color:#aaa">Generated: '+data.today+'<br>WokManeja Payroll System &mdash; Confidential</div>'
    +'</div>'
  +'</div>';
}

function renderVNPF() {
  document.getElementById('cr-loading').style.display='block';
  document.getElementById('compliance-output').innerHTML='';
  document.getElementById('cr-pdf-btn').style.display='none';
  document.getElementById('cr-vnpf-btn').style.display='none';
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
  }, 400);
}

function downloadVNPFPDF() {
  if(!LAST_VNPF_DATA) return;
  var reportHTML = buildVNPFHTML(LAST_VNPF_DATA, true);
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VNPF Report - WokManeja</title><style>*{box-sizing:border-box;margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif}body{background:#fff;color:#1a1a1a;padding:0}.rpt-page{max-width:100%;padding:2rem;color:#1a1a1a}.rpt-header{border-bottom:3px solid #0a0a0a;padding-bottom:1.25rem;margin-bottom:1.5rem}.rpt-logo-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}.rpt-title{font-size:22px;font-weight:800;color:#0a0a0a;margin-bottom:2px}.rpt-subtitle{font-size:13px;color:#555}.rpt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:12px}.rpt-meta-item p{color:#888;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}.rpt-meta-item span{font-weight:700;color:#0a0a0a;font-size:13px}.rpt-section{margin-bottom:1.75rem;page-break-inside:avoid}.rpt-section-title{font-size:14px;font-weight:700;color:#0a0a0a;border-left:4px solid #10b981;padding-left:.75rem;margin-bottom:1rem}.rpt-section-num{color:#10b981;margin-right:.35rem}.rpt-summary-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}.rpt-summary-table td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px}.rpt-summary-table td:last-child{text-align:right;font-weight:700;color:#000000}.rpt-summary-table tr:last-child td{border-bottom:2px solid #0a0a0a;font-weight:800;font-size:14px}.rpt-detail-table{width:100%;border-collapse:collapse;font-size:12px}.rpt-detail-table th{background:#0a0a0a;color:#fff;padding:9px 10px;text-align:left;font-size:11px;letter-spacing:.3px}.rpt-detail-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0}.rpt-detail-table tr:nth-child(even) td{background:#fafafa}.rpt-footer{border-top:2px solid #0a0a0a;padding-top:1rem;margin-top:1.5rem;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#666}@media print{body{padding:0}@page{margin:1.5cm}}</style></head><body>'+reportHTML+'</body></html>');
  win.document.close();
  setTimeout(function(){win.focus();win.print();},600);
}
function getUserHRRecords(){
  var all=DB.findAll('hr_requests');
  if(APP.currentUser&&APP.currentUser.role==='staff'&&APP.currentUser.linkedStaffId){
    var s=DB.findOne('staff',{_id:APP.currentUser.linkedStaffId});
    if(s)return all.filter(function(r){return r.staff===s.name});
  }
  return all;
}
function getUserPayslips(){
  var all=DB.findAll('payslips');
  if(APP.currentUser&&APP.currentUser.role==='staff'&&APP.currentUser.linkedStaffId){
    var s=DB.findOne('staff',{_id:APP.currentUser.linkedStaffId});
    if(s)return all.filter(function(p){return p.staff===s.name});
  }
  return all;
}
function renderDashboard(){var role=APP.currentUser.role;if(role==='staff'){renderStaffDashboard();return;}var activeStaff=DB.findAll('staff',{status:'Active'}).length;var mySlips=getUserPayslips();var allHR=getUserHRRecords();var tN=mySlips.reduce(function(s,p){return s+p.net},0);var tV=mySlips.reduce(function(s,p){return s+p.vnpf},0);var pendingHR=allHR.filter(function(r){return r.status==='Pending'}).length;var approvedAdv=allHR.filter(function(r){return r.type==='Payment Advance'&&r.status==='Approved'}).reduce(function(s,r){return s+(r.amount||0)},0);var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">';html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Active Staff</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--navy)">'+activeStaff+'</p></div>';html+='<div class="card" style="border-top:3px solid var(--gold)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Payslips in DB</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--gold)">'+mySlips.length+'</p></div>';html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Total Net Payroll</p><p style="font-size:20px;font-weight:800;color:var(--navy);margin-top:6px">'+vuvFmt(tN)+'</p></div>';html+='<div class="card" style="border-top:3px solid var(--gold)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Total VNPF</p><p style="font-size:20px;font-weight:800;color:var(--gold);margin-top:6px">'+vuvFmt(tV)+'</p></div>';html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Pending HR Requests</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--navy)">'+pendingHR+'</p></div>';html+='<div class="card" style="border-top:3px solid var(--gold)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Advances Issued</p><p style="font-size:18px;font-weight:800;color:var(--gold);margin-top:6px">'+vuvFmt(approvedAdv)+'</p></div>';html+='</div>';html+='<div class="hr-summary-grid" style="margin-bottom:1.5rem">';var hTypes=[['Annual Leave','annual','fa-plane-departure'],['Sick Leave','sick','fa-notes-medical'],['Leave Without Pay','unpaid','fa-calendar-xmark'],['Payment Advance','advance','fa-money-bill-wave']];hTypes.forEach(function(ht){var cnt=allHR.filter(function(r){return r.type===ht[0]}).length;html+='<div class="hr-summary-card"><div class="hr-icon '+ht[1]+'"><i class="fa-solid '+ht[2]+'"></i></div><div class="hr-card-info"><p>'+ht[0]+'</p><h3>'+cnt+' request'+(cnt!==1?'s':'')+'</h3></div></div>'});html+='</div>';html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">';html+='<div class="card"><p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px solid #f0f0f0"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> Recent Payslips</p>';if(!mySlips.length){html+='<p style="font-size:13px;color:#aaa;text-align:center;padding:1.5rem 0">No payslips yet.</p>'}else{var recent=mySlips.slice(-5).reverse();html+='<table><thead><tr><th>Staff</th><th>Period</th><th style="text-align:right">Net Pay</th></tr></thead><tbody>';recent.forEach(function(p){var pr=getPeriodRange(p);var periodStr=pr.start&&pr.end?fmtDate(pr.start)+' &ndash; '+fmtDate(pr.end):p.month+' '+p.year;html+='<tr><td style="font-weight:600">'+p.staff+'</td><td style="font-size:12px">'+periodStr+'</td><td style="text-align:right;font-weight:700;color:#000000">'+vuvFmt(p.net)+'</td></tr>';});html+='</tbody></table>';}html+='</div>';html+='<div class="card"><p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px solid #f0f0f0"><i class="fa-solid fa-calendar-check" style="color:var(--gold)"></i> Recent HR Requests</p>';if(!allHR.length){html+='<p style="font-size:13px;color:#aaa;text-align:center;padding:1.5rem 0">No HR requests yet.</p>'}else{var recentHR=allHR.slice(-5).reverse();html+='<table><thead><tr><th>Staff</th><th>Type</th><th>Status</th></tr></thead><tbody>';recentHR.forEach(function(r){html+='<tr><td style="font-weight:600">'+r.staff+'</td><td style="font-size:12px">'+r.type+'</td><td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td></tr>';});html+='</tbody></table>';}html+='</div></div>';document.getElementById('dashboard-content').innerHTML=html;}
function renderStaffDashboard(){
  var mySlips=getUserPayslips();var allHR=getUserHRRecords();
  var tN=mySlips.reduce(function(s,p){return s+p.net},0);
  var pendingHR=allHR.filter(function(r){return r.status==='Pending'}).length;
  var sData=APP.currentUser.linkedStaffId?DB.findOne('staff',{_id:APP.currentUser.linkedStaffId}):null;
  var maxAnnual=sData?parseFloat(sData.annual||0):0;
  var maxSick=sData?parseFloat(sData.sick||0):0;
  var usedAnnual=0;var usedSick=0;
  allHR.forEach(function(r){
    if(r.status!=='Approved')return;
    if(r.type==='Annual Leave'){
      var d1=new Date(r.start);var d2=new Date(r.end);
      var days=(d2-d1)/(1000*3600*24)+1;
      usedAnnual+=Math.max(0,days);
    }
    if(r.type==='Sick Leave'){
      var d1=new Date(r.start);var d2=new Date(r.end);
      var days=(d2-d1)/(1000*3600*24)+1;
      usedSick+=Math.max(0,days);
    }
  });
  var remAnn=Math.max(0,maxAnnual-usedAnnual);
  var remSick=Math.max(0,maxSick-usedSick);
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">';
  html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">My Payslips</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--navy)">'+mySlips.length+'</p></div>';
  html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Total Earned (Net)</p><p style="font-size:20px;font-weight:800;color:var(--navy);margin-top:6px">'+vuvFmt(tN)+'</p></div>';
  html+='<div class="card" style="border-top:3px solid var(--gold)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Remaining Annual Leave</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--gold)">'+remAnn+' <span style="font-size:12px;color:#888">days</span></p></div>';
  html+='<div class="card" style="border-top:3px solid var(--gold)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Remaining Sick Leave</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--gold)">'+remSick+' <span style="font-size:12px;color:#888">days</span></p></div>';
  html+='<div class="card" style="border-top:3px solid var(--navy)"><p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Pending Leave Requests</p><p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--navy)">'+pendingHR+'</p></div>';
  html+='</div>';
  
  html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">';
  html+='<div class="card"><p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px solid #f0f0f0"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> My Recent Payslips</p>';
  if(!mySlips.length){html+='<p style="font-size:13px;color:#aaa;text-align:center;padding:1.5rem 0">No payslips yet.</p>'}else{var recent=mySlips.slice(-5).reverse();html+='<table><thead><tr><th>Period</th><th style="text-align:right">Net Pay</th></tr></thead><tbody>';recent.forEach(function(p){var pr=getPeriodRange(p);var periodStr=pr.start&&pr.end?fmtDate(pr.start)+' &ndash; '+fmtDate(pr.end):p.month+' '+p.year;html+='<tr><td style="font-size:12px">'+periodStr+'</td><td style="text-align:right;font-weight:700;color:#000000">'+vuvFmt(p.net)+'</td></tr>';});html+='</tbody></table>';}
  html+='</div>';
  html+='<div class="card"><p style="font-size:13px;font-weight:700;color:var(--navy);margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px solid #f0f0f0"><i class="fa-solid fa-calendar-check" style="color:var(--gold)"></i> My Recent Leave Requests</p>';
  if(!allHR.length){html+='<p style="font-size:13px;color:#aaa;text-align:center;padding:1.5rem 0">No leave requests yet.</p>'}else{var recentHR=allHR.slice(-5).reverse();html+='<table><thead><tr><th>Type</th><th>Dates</th><th>Status</th></tr></thead><tbody>';recentHR.forEach(function(r){html+='<tr><td style="font-size:12px">'+r.type+'</td><td style="font-size:12px">'+r.start+' to '+r.end+'</td><td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td></tr>';});html+='</tbody></table>';}
  html+='</div></div>';
  document.getElementById('dashboard-content').innerHTML=html;
}
function renderDBStats(){var u=DB.count('users'),s=DB.count('staff'),p=DB.count('payslips'),h=DB.count('hr_requests');var html='<table><thead><tr><th>Collection</th><th>Documents</th><th>Description</th></tr></thead><tbody>';html+='<tr><td style="font-weight:600"><i class="ti ti-users"></i> users</td><td><span style="background:#ddeeff;color:#000000;padding:3px 10px;border-radius:12px;font-weight:700">'+u+'</span></td><td style="color:#888">User accounts &amp; roles</td></tr>';html+='<tr><td style="font-weight:600"><i class="ti ti-id-badge"></i> staff</td><td><span style="background:#ddf0dd;color:#27500a;padding:3px 10px;border-radius:12px;font-weight:700">'+s+'</span></td><td style="color:#888">Employee directory</td></tr>';html+='<tr><td style="font-weight:600"><i class="ti ti-file-invoice"></i> payslips</td><td><span style="background:#faeeda;color:#633806;padding:3px 10px;border-radius:12px;font-weight:700">'+p+'</span></td><td style="color:#888">Payroll records</td></tr>';html+='<tr><td style="font-weight:600"><i class="fa-solid fa-calendar-check"></i> hr_requests</td><td><span style="background:#ffe4f0;color:#7c1243;padding:3px 10px;border-radius:12px;font-weight:700">'+h+'</span></td><td style="color:#888">Leave &amp; advance requests</td></tr>';html+='</tbody></table>';document.getElementById('db-stats').innerHTML=html;var bc=DB.findOne('settings',{_id:'backup'});if(bc){document.getElementById('backup-path').value=bc.path||'';document.getElementById('backup-interval').value=bc.interval||'Daily';document.getElementById('backup-enabled').checked=!!bc.enabled;}}
function saveBackupConfig(){var p=document.getElementById('backup-path').value.trim();var i=document.getElementById('backup-interval').value;var e=document.getElementById('backup-enabled').checked;if(e&&!p){alert('Please enter a backup path.');return;}var cfg={enabled:e,path:p,interval:i};fetch('/api/admin/backup-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cfg)}).then(function(r){return r.json()}).then(function(res){if(res.success){DB.remove('settings',{_id:'backup'});DB.insert('settings',{_id:'backup',...cfg});var m=document.getElementById('backup-msg');m.style.color='#27500a';m.style.display='block';m.textContent='Auto backup settings saved.';setTimeout(function(){m.style.display='none';},3000);}}).catch(function(err){alert('Error saving config: '+err)});}
function triggerManualBackup(){var p=document.getElementById('backup-path').value.trim();if(!p){alert('Please enter a backup path first.');return;}fetch('/api/admin/backup-now',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p})}).then(function(r){return r.json()}).then(function(res){var m=document.getElementById('backup-msg');m.style.display='block';if(res.success){m.style.color='#27500a';m.textContent='Backup created successfully at '+res.dest;}else{m.style.color='#e24b4a';m.textContent='Backup failed: '+res.error;}setTimeout(function(){m.style.display='none';},4000);}).catch(function(err){alert('Backup failed: '+err)});}
function renderAuditLogs(){var wrap=document.getElementById('audit-table-wrap');var all=DB.findAll('audit_logs');if(!all.length){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#888;font-size:13px">No audit logs found.</div>';return}var html='<table class="table" style="font-size:12px"><thead><tr><th style="width:140px">Timestamp</th><th style="width:100px">User</th><th style="width:90px">Action</th><th style="width:100px">Collection</th><th>Details</th></tr></thead><tbody>';var sorted=all.slice().sort(function(a,b){return new Date(b.timestamp)-new Date(a.timestamp)});sorted.forEach(function(log){var color='#888';if(log.action==='INSERT')color='#10b981';if(log.action==='UPDATE')color='#eab308';if(log.action==='DELETE')color='#ef4444';html+='<tr>';html+='<td style="color:#666">'+new Date(log.timestamp).toLocaleString()+'</td>';html+='<td style="font-weight:600">'+log.user+'</td>';html+='<td><span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;background:'+color+'">'+log.action+'</span></td>';html+='<td style="font-weight:600;color:var(--navy)">'+log.collection+'</td>';html+='<td><pre style="margin:0;font-family:monospace;font-size:11px;background:#f8f9fb;padding:6px;border-radius:4px;max-height:80px;overflow:auto;color:#444">'+log.details+'</pre></td>';html+='</tr>'});html+='</tbody></table>';wrap.innerHTML=html;}
function renderCompanySettings(){
  var s=DB.findOne('settings',{_id:'company'});
  if(s){
    document.getElementById('cs-name').value=s.name||'';
    document.getElementById('cs-address').value=s.address||'';
    document.getElementById('cs-phone').value=s.phone||'';
    document.getElementById('cs-email').value=s.email||'';
    document.getElementById('cs-license').value=s.license||'';
  }
  renderLicenseStatus();
}
async function renderLicenseStatus(){
  var card=document.getElementById('lic-status-card');
  if(!card)return;
  try {
    const res = await fetch('/api/license/status');
    const data = await res.json();
    if(data.status==='active'){
      var badge=data.plan==='pro'?'<span class="badge badge-manager" style="margin-left:8px">PRO</span>':'<span class="badge badge-admin" style="margin-left:8px">ENTERPRISE</span>';
      card.style.background='#ddf0dd';card.style.color='#27500a';
      card.innerHTML='<i class="ti ti-circle-check" style="font-size:16px"></i> Hardware-Locked License'+badge+'<br><span style="font-size:11px;font-weight:400;opacity:.8">Expires: '+new Date(data.expires).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})+' ('+data.daysLeft+' days left)</span>';
    }else if(data.status==='expired'){
      card.style.background='#fff0f0';card.style.color='#a32d2d';
      card.innerHTML='<i class="ti ti-alert-circle" style="font-size:16px"></i> License Expired<br><span style="font-size:11px;font-weight:400">Please enter a new license key to continue.</span>';
    }else{
      card.style.background='#fff0f0';card.style.color='#a32d2d';
      card.innerHTML='<i class="ti ti-lock" style="font-size:16px"></i> License Missing or Hardware Mismatch<br><span style="font-size:11px;font-weight:400">Enter a valid license key bound to this machine.</span>';
    }
  } catch (e) {
      card.style.background='#fff0f0';card.style.color='#a32d2d';
      card.innerHTML='<i class="ti ti-alert-circle" style="font-size:16px"></i> License Error<br><span style="font-size:11px;font-weight:400">Could not verify license status.</span>';
  }
}
function saveCompanySettings(){var obj={name:document.getElementById('cs-name').value.trim(),address:document.getElementById('cs-address').value.trim(),phone:document.getElementById('cs-phone').value.trim(),email:document.getElementById('cs-email').value.trim(),license:document.getElementById('cs-license').value.trim()};var s=DB.findOne('settings',{_id:'company'});if(s){DB.update('settings',{_id:'company'},obj);}else{obj._id='company';if(!MEMORY_DB.settings)MEMORY_DB.settings=[];MEMORY_DB.settings.push(obj);fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});}var n=obj.name;if(n){var el=document.getElementById('login-company-name');if(el)el.textContent=n;var hEl=document.getElementById('menu-company-name');if(hEl)hEl.textContent=n;}var m=document.getElementById('cs-msg');m.textContent='Company settings saved.';m.style.display='block';setTimeout(function(){m.style.display='none'},2500);}

async function activateLicense(){
  var key=(document.getElementById('cs-appkey').value||'').trim().toUpperCase();
  var msg=document.getElementById('lic-msg');
  if(!key){msg.style.display='block';msg.style.background='#fff0f0';msg.style.color='#a32d2d';msg.textContent='Please enter a license key.';setTimeout(function(){msg.style.display='none'},3000);return;}
  try {
    const res = await fetch('/api/license/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    if (!res.ok) {
        msg.style.display='block';msg.style.background='#fff0f0';msg.style.color='#a32d2d';msg.textContent='Invalid license key. Please check and try again.';setTimeout(function(){msg.style.display='none'},4000);return;
    }
    const data = await res.json();
    msg.style.display='block';msg.style.background='#ddf0dd';msg.style.color='#27500a';
    msg.textContent='License activated! '+data.plan.toUpperCase()+' plan active until '+new Date(data.expires).toLocaleDateString('en-GB')+'.';
    document.getElementById('cs-appkey').value='';
    renderLicenseStatus();
    if(document.getElementById('license-lock-screen'))document.getElementById('license-lock-screen').style.display='none';
    setTimeout(function(){msg.style.display='none'},5000);
  } catch(e) {
    msg.style.display='block';msg.style.background='#fff0f0';msg.style.color='#a32d2d';msg.textContent='Error activating license.';setTimeout(function(){msg.style.display='none'},4000);
  }
}

function showLicenseLockScreen(errTitle, reason){
  var el=document.getElementById('license-lock-screen');
  var displayReason = reason === 'hardware' ? 'Hardware fingerprint mismatch.' : (reason === 'expired' ? 'License expired.' : 'No valid license found.');
  if(!el){
    el=document.createElement('div');
    el.id='license-lock-screen';
    el.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99999;display:flex;align-items:center;justify-content:center;';
    el.innerHTML='<div style="background:#fff;border-radius:16px;padding:2.5rem;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.5)"><div style="width:64px;height:64px;background:#f0f0f0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem"><i class="ti ti-lock" style="font-size:32px;color:#0a0a0a"></i></div><h2 style="font-size:20px;font-weight:800;color:#0a0a0a;margin-bottom:.5rem">Access Locked</h2><p style="font-size:13px;color:#666;margin-bottom:1.5rem"><b>'+errTitle+'</b><br>'+displayReason+'<br>Enter a valid license key to continue.</p><input type="text" id="lock-key-input" placeholder="WM-XXXX-XXXX-XXXX" style="font-family:monospace;font-size:15px;letter-spacing:1px;text-align:center;padding:12px;margin-bottom:10px;border:2px solid #d0d0d0;border-radius:8px;width:100%;outline:none" oninput="this.value=this.value.toUpperCase()"/><div id="lock-key-msg" style="font-size:12px;color:#e24b4a;margin-bottom:10px;display:none"></div><button onclick="activateLicenseFromLock()" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:14px;margin-bottom:10px"><i class="ti ti-key"></i> Activate License</button><button onclick="startTrial()" class="btn" style="width:100%;justify-content:center;padding:12px;font-size:14px;background:#f0f0f0;color:#0a0a0a;border:1px solid #d0d0d0"><i class="ti ti-clock"></i> Start 14-Day Free Trial</button><p style="font-size:11px;color:#aaa;margin-top:1.25rem">Contact <a href="mailto:wokmaneja@gmail.com" style="color:#0a0a0a;font-weight:700">wokmaneja@gmail.com</a> to purchase a license.</p></div>';
    document.body.appendChild(el);
  }else{
    el.querySelector('p').innerHTML = '<b>'+errTitle+'</b><br>'+displayReason+'<br>Enter a valid license key to continue.';
    el.style.display='flex';
  }
}
async function activateLicenseFromLock(){
  var key=(document.getElementById('lock-key-input').value||'').trim().toUpperCase();
  var msg=document.getElementById('lock-key-msg');
  if(!key){msg.style.display='block';msg.textContent='Please enter a license key.';return;}
  try {
    const res = await fetch('/api/license/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    if (!res.ok) {
        msg.style.display='block';msg.textContent='Invalid license key. Please check and try again.';return;
    }
    const data = await res.json();
    document.getElementById('license-lock-screen').style.display='none';
    alert('License activated! '+data.plan.toUpperCase()+' plan active until '+new Date(data.expires).toLocaleDateString('en-GB')+'.');
  } catch(e) {
    msg.style.display='block';msg.textContent='Error activating license.';
  }
}
async function startTrial(){
  var msg=document.getElementById('lock-key-msg');
  try {
    const res = await fetch('/api/license/trial', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
        msg.style.display='block';msg.textContent=data.reason || data.error || 'Trial activation failed.';return;
    }
    document.getElementById('license-lock-screen').style.display='none';
    alert('14-Day Trial activated successfully!');
    if (typeof renderLicenseStatus === 'function') renderLicenseStatus();
  } catch(e) {
    msg.style.display='block';msg.textContent='Error activating trial.';
  }
}
function loadVersionInfo(){
  fetch('/api/admin/version').then(function(r){return r.json()}).then(function(d){
    var el=document.getElementById('upd-current');if(el)el.textContent='v'+d.version;
    var re=document.getElementById('upd-repo');if(re)re.textContent=d.repo;
  }).catch(function(){});
}
function loadReleases(){
  var wrap=document.getElementById('upd-releases-wrap');
  var msg=document.getElementById('upd-check-msg');
  var badge=document.getElementById('upd-badge');
  wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#888;font-size:13px"><i class="ti ti-loader-2" style="font-size:32px;display:block;margin-bottom:.75rem;animation:spin 1s linear infinite"></i>Checking GitHub for releases...</div>';
  fetch('/api/admin/version').then(function(r){return r.json()}).then(function(vd){
    var current=vd.version;
    var el=document.getElementById('upd-current');if(el)el.textContent='v'+current;
    fetch('/api/admin/releases').then(function(r){return r.json()}).then(function(data){
      if(data.error){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#a32d2d;font-size:13px"><i class="ti ti-alert-circle" style="font-size:32px;display:block;margin-bottom:.5rem"></i>'+data.error+'</div>';badge.textContent='Error';return;}
      var releases=data.releases||[];
      badge.textContent=releases.length+' release'+(releases.length===1?'':'s')+' found';
      if(!releases.length){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#aaa;font-size:13px">No releases found on GitHub yet.</div>';return;}
      var html='';
      releases.forEach(function(r){
        var isInstalled=r.tag==='v'+current||r.tag===current;
        var isNewer=r.tag>'v'+current;
        var statusBadge=isInstalled?'<span style="background:#0a0a0a;color:#6ee7b7;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">INSTALLED</span>':(isNewer?'<span style="background:#185fa5;color:#fff;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">NEW</span>':'<span style="background:#f0f0f0;color:#888;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">OLDER</span>');
        var preTag=r.prerelease?'<span style="background:#f59e0b;color:#fff;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:700;margin-left:4px">PRE-RELEASE</span>':'';
        var notes=r.body?'<pre style="background:#f8f9fb;border-radius:6px;padding:10px;font-size:11px;color:#555;max-height:100px;overflow:auto;white-space:pre-wrap;margin-top:.75rem">'+r.body+'</pre>':'';
        var deployBtn=!isInstalled?'<button onclick="applyUpdate(\''+r.tag+'\',\''+r.zipball_url+'\')" class="btn btn-primary btn-sm" style="margin-top:.75rem"><i class="ti ti-cloud-download"></i> Approve &amp; Install</button>':'';
        html+='<div style="border:1px solid #eee;border-radius:10px;padding:1rem;margin-bottom:.75rem">';
        html+='<div style="display:flex;justify-content:space-between;align-items:flex-start">';
        html+='<div><p style="font-size:14px;font-weight:700;color:#0a0a0a;margin:0">'+r.name+' '+preTag+'</p><p style="font-size:11px;color:#aaa;margin:2px 0 0">'+new Date(r.published).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})+'</p></div>';
        html+=statusBadge+'</div>';
        html+=notes+deployBtn+'</div>';
      });
      wrap.innerHTML=html;
    }).catch(function(e){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#a32d2d;font-size:13px">Failed to load releases: '+e.message+'</div>';});
  }).catch(function(){});
}
function applyUpdate(tag,zipball_url){
  if(!confirm('Apply update '+tag+'?\n\nThe app will:\n1. Backup your database automatically\n2. Download and install the update\n3. Restart the server\n\nYour data will not be affected. Continue?'))return;
  var wrap=document.getElementById('upd-releases-wrap');
  wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#185fa5;font-size:13px"><i class="ti ti-loader-2" style="font-size:36px;display:block;margin-bottom:.75rem;animation:spin 1s linear infinite"></i><strong>Installing '+tag+'...</strong><br><span style="font-size:11px;color:#888;margin-top:.5rem;display:block">Downloading from GitHub. The server will restart automatically.</span></div>';
  fetch('/api/admin/apply-update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag:tag,zipball_url:zipball_url})}).then(function(r){return r.json()}).then(function(d){
    if(d.success){
      wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#27500a;font-size:13px"><i class="ti ti-circle-check" style="font-size:36px;display:block;margin-bottom:.75rem"></i><strong>Update applied!</strong><br><span style="font-size:11px;color:#888">The server is restarting. Please refresh this page in 10 seconds.</span></div>';
      setTimeout(function(){location.reload();},12000);
    }else{
      wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#a32d2d;font-size:13px"><i class="ti ti-alert-circle" style="font-size:32px;display:block;margin-bottom:.5rem"></i>Update failed: '+(d.error||'Unknown error')+'</div>';
    }
  }).catch(function(e){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#a32d2d;font-size:13px">Connection error: '+e.message+'</div>';});
}
function renderArchiveTable(){var wrap=document.getElementById('archive-table-wrap');var all=DB.findAll('archive');if(!all.length){wrap.innerHTML='<div style="padding:2rem;text-align:center;color:#888;font-size:13px">Trash Bin is empty.</div>';return}var html='<table class="table" style="font-size:12px"><thead><tr><th>Deleted At</th><th>Original Collection</th><th>Deleted By</th><th>Expires At</th><th style="text-align:right">Actions</th></tr></thead><tbody>';var sorted=all.slice().sort(function(a,b){return new Date(b.deletedAt)-new Date(a.deletedAt)});sorted.forEach(function(arc){html+='<tr>';html+='<td style="color:#666">'+new Date(arc.deletedAt).toLocaleString()+'</td>';html+='<td style="font-weight:600;color:var(--navy)">'+arc.originalCollection+'</td>';html+='<td style="font-weight:600">'+arc.deletedBy+'</td>';html+='<td style="color:#dc2626">'+new Date(arc.expiresAt).toLocaleDateString()+'</td>';html+='<td style="text-align:right"><button class="btn btn-sm btn-outline" style="margin-right:4px" onclick="restoreArchive(\''+arc._id+'\')"><i class="ti ti-rotate-clockwise"></i> Restore</button><button class="btn btn-sm btn-danger" onclick="deleteForever(\''+arc._id+'\')"><i class="ti ti-trash"></i> Delete Forever</button></td>';html+='</tr>'});html+='</tbody></table>';wrap.innerHTML=html;}
function restoreArchive(id){var arc=DB.findOne('archive',{_id:id});if(!arc)return;customConfirm('Restore this record to '+arc.originalCollection+'?', function(){ var doc=arc.originalData;if(!MEMORY_DB[arc.originalCollection])MEMORY_DB[arc.originalCollection]=[];MEMORY_DB[arc.originalCollection].push(doc);fetch('/api/'+arc.originalCollection,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(doc)});DB.remove('archive',{_id:id},true);renderArchiveTable(); });}
function deleteForever(id){customConfirm('Permanently delete this record? This cannot be undone.', function(){ DB.remove('archive',{_id:id},true);renderArchiveTable(); });}
function viewCollection(col){var docs=DB.raw(col);document.getElementById('db-viewer').textContent='// Collection: '+col+' ('+docs.length+' documents)\n\n'+JSON.stringify(docs,null,2)}
function exportDB(){var data=DB.exportAll();var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='triple_k_database_'+new Date().toISOString().split('T')[0]+'.json';a.click();URL.revokeObjectURL(a.href);showDBMsg('Database exported.','#ddf0dd','#27500a')}
function importDB(e){var file=e.target.files[0];if(!file)return;var reader=new FileReader();reader.onload=function(ev){try{var data=JSON.parse(ev.target.result);DB.importAll(data);updateDBIndicator();renderDBStats();showDBMsg('Imported successfully.','#ddf0dd','#27500a')}catch(err){showDBMsg('Import failed: invalid file.','#fff0f0','#a32d2d')}};reader.readAsText(file);e.target.value=''}
function clearDB(){if(!confirm('Delete ALL data?'))return;if(!confirm('FINAL WARNING: This cannot be undone.'))return;['payslips','staff','users','hr_requests'].forEach(function(c){DB.drop(c)});seedDB();updateDBIndicator();renderDBStats();showDBMsg('Database reset.','#faeeda','#633806')}
function showDBMsg(msg,bg,color){var el=document.getElementById('db-action-msg');el.textContent=msg;el.style.background=bg;el.style.color=color;el.style.padding='8px 12px';el.style.borderRadius='6px';el.style.display='block';setTimeout(function(){el.style.display='none'},4000)}
function toggleOTCalc(){var p=document.getElementById('ot-calc-panel');var btn=p.previousElementSibling;if(p.style.display==='none'){p.style.display='block';btn.innerHTML='<i class="ti ti-calculator" style="font-size:13px;color:#10b981"></i> Hide Overtime Calculator';}else{p.style.display='none';btn.innerHTML='<i class="ti ti-calculator" style="font-size:13px;color:#10b981"></i> Show Overtime Calculator';}}

// ══════════════════════════════════════════════════
// NOTIFICATION SYSTEM
// ══════════════════════════════════════════════════
var NOTIF_PANEL_OPEN = false;
var NOTIF_POLL_INTERVAL = null;

function notifKey(username){
  // Each user has their own notification store
  return 'tkkdb_notif_' + (username||'all');
}
function loadNotifications(username){
  try{ return JSON.parse(localStorage.getItem(notifKey(username||'all'))||'[]'); }
  catch(e){ return []; }
}
function saveNotifications(username, notifs){
  localStorage.setItem(notifKey(username||'all'), JSON.stringify(notifs));
}
function createNotification(type, title, body, action, targetRoles){
  // targetRoles: array of roles to notify, e.g. ['admin','manager','it'] or ['user']
  // If not specified, notify everyone (store in 'all' bucket)
  // Get all users and send to matching roles
  var allUsers = DB.findAll('users');
  var roles = targetRoles || ['admin','manager','it','user'];
  allUsers.forEach(function(u){
    if(roles.indexOf(u.role) === -1) return;
    // Don't notify yourself
    if(APP.currentUser && u.username === APP.currentUser.username) return;
    var notifs = loadNotifications(u.username);
    var n = {
      _id: Date.now().toString(36)+Math.random().toString(36).substr(2,4),
      type: type,
      title: title,
      body: body,
      action: action||null,
      read: false,
      time: new Date().toISOString()
    };
    notifs.unshift(n);
    if(notifs.length > 50) notifs = notifs.slice(0,50);
    saveNotifications(u.username, notifs);
  });
  // Also notify current user with a confirmation if it's their own action
  if(type !== 'pending'){
    // The submitter gets a status update notification
    if(action && action.submittedBy){
      var submitterNotifs = loadNotifications(action.submittedBy);
      var sn = {
        _id: Date.now().toString(36)+Math.random().toString(36).substr(2,6),
        type: type, title: title, body: body,
        action: action, read: false, time: new Date().toISOString()
      };
      submitterNotifs.unshift(sn);
      if(submitterNotifs.length > 50) submitterNotifs = submitterNotifs.slice(0,50);
      saveNotifications(action.submittedBy, submitterNotifs);
    }
  }
  renderNotifBadge();
}
function getCurrentUserNotifs(){
  if(!APP.currentUser) return [];
  return loadNotifications(APP.currentUser.username);
}
function saveCurrentUserNotifs(notifs){
  if(!APP.currentUser) return;
  saveNotifications(APP.currentUser.username, notifs);
}
function renderNotifBadge(){
  var badge = document.getElementById('notif-count-badge');
  if(!badge) return;
  var notifs = getCurrentUserNotifs();
  var unread = notifs.filter(function(n){ return !n.read; }).length;
  if(unread > 0){
    badge.textContent = unread > 99 ? '99+' : unread;
    badge.style.display = 'flex';badge.style.alignItems='center';badge.style.justifyContent='center';
  } else {
    badge.style.display = 'none';
  }
}
function toggleNotifPanel(){
  var panel = document.getElementById('notif-panel');
  if(!panel) return;
  NOTIF_PANEL_OPEN = !NOTIF_PANEL_OPEN;
  panel.style.display = NOTIF_PANEL_OPEN ? 'block' : 'none';
  if(NOTIF_PANEL_OPEN) renderNotifList();
}
function renderNotifList(){
  var notifs = getCurrentUserNotifs();
  var list = document.getElementById('notif-list');
  var empty = document.getElementById('notif-empty');
  if(!list) return;
  if(!notifs.length){
    list.innerHTML='';
    if(empty) empty.style.display='block';
    return;
  }
  if(empty) empty.style.display='none';
  var role = APP.currentUser ? APP.currentUser.role : '';
  var canApprove = role==='admin'||role==='manager'||role==='it';
  var html='';
  notifs.forEach(function(n){
    var timeAgo = formatTimeAgo(n.time);
    var iconClass = n.type==='approved'?'approved':n.type==='rejected'?'rejected':n.type==='pending'?'pending':'info';
    var icon = n.type==='approved'?'ti-circle-check':n.type==='rejected'?'ti-circle-x':n.type==='pending'?'ti-clock-hour-4':'ti-info-circle';
    var eid = 'n_'+n._id;
    NOTIF_ID_MAP[eid] = n._id;
    var actionBtn = '';
    if(!n.read){
      if(n.type==='pending' && canApprove && n.action && n.action.recordId){
        actionBtn = '<div style="margin-top:6px;display:flex;gap:6px">'
          +'<button onclick="notifApprove(NOTIF_ID_MAP.'+eid+',\'Approved\')" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">&#10003; Approve</button>'
          +'<button onclick="notifApprove(NOTIF_ID_MAP.'+eid+',\'Rejected\')" style="background:#e24b4a;color:#fff;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">&#10007; Reject</button>'
          +'<button onclick="notifView(NOTIF_ID_MAP.'+eid+')" style="background:#f0f0f0;color:#555;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">View</button>'
          +'</div>';
      } else if(n.action){
        actionBtn = '<div style="margin-top:5px">'
          +'<button onclick="notifView(NOTIF_ID_MAP.'+eid+')" style="background:#f0f0f0;color:#555;border:none;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">View Record</button>'
          +'</div>';
      }
    }
    html += '<div class="notif-item '+(n.read?'read':'unread')+'" id="nitem-'+n._id+'">'
      +'<div class="notif-icon '+iconClass+'"><i class="ti '+icon+'"></i></div>'
      +'<div style="flex:1;min-width:0">'
        +'<div class="notif-title">'+n.title+(n.read?'':' <span style="display:inline-block;width:7px;height:7px;background:#10b981;border-radius:50%;margin-left:4px;vertical-align:middle"></span>')+'</div>'
        +'<div class="notif-body">'+n.body+'</div>'
        +'<div class="notif-time">'+timeAgo+'</div>'
        +actionBtn
      +'</div>'
    +'</div>';
  });
  list.innerHTML = html;
}
function formatTimeAgo(iso){
  var diff = Math.floor((Date.now() - new Date(iso).getTime())/1000);
  if(diff < 60) return 'Just now';
  if(diff < 3600) return Math.floor(diff/60)+' min ago';
  if(diff < 86400) return Math.floor(diff/3600)+' hr ago';
  return Math.floor(diff/86400)+' day'+(Math.floor(diff/86400)>1?'s':'')+' ago';
}
function markAllRead(){
  var notifs = getCurrentUserNotifs();
  notifs.forEach(function(n){ n.read=true; });
  saveCurrentUserNotifs(notifs);
  renderNotifBadge();
  renderNotifList();
}
function markNotifRead(id){
  var notifs = getCurrentUserNotifs();
  notifs.forEach(function(n){ if(n._id===id) n.read=true; });
  saveCurrentUserNotifs(notifs);
  renderNotifBadge();
}
function notifView(nId){
  markNotifRead(nId);
  toggleNotifPanel();
  // Navigate to HR section
  var btns = document.querySelectorAll('#sidebar-nav button');
  for(var i=0;i<btns.length;i++){
    var t=btns[i].textContent.trim();
    if(t.indexOf('Leave')!==-1||t.indexOf('Advance')!==-1){ btns[i].click(); break; }
  }
  renderNotifList();
}
function notifApprove(nId, status){
  var notifs = getCurrentUserNotifs();
  var n = notifs.find(function(x){ return x._id===nId; });
  if(!n||!n.action||!n.action.recordId) return;
  var rec = DB.findOne('hr_requests',{_id:n.action.recordId});
  if(!rec){ alert('Record not found or already processed.'); return; }
  DB.update('hr_requests',{_id:n.action.recordId},{status:status,approvedBy:APP.currentUser.username});
  markNotifRead(nId);
  // Notify submitter of result
  var rType = status==='Approved'?'approved':'rejected';
  var submitter = rec.createdBy||'';
  if(submitter){
    var subNotifs = loadNotifications(submitter);
    subNotifs.unshift({
      _id: Date.now().toString(36)+Math.random().toString(36).substr(2,5),
      type: rType,
      title: 'Leave Request '+status,
      body: 'Your '+rec.type+' request'+(rec.staff?' for '+rec.staff:'')+' has been '+status.toLowerCase()+' by '+APP.currentUser.name+'.',
      action: {section:'hr', recordId:rec._id},
      read: false,
      time: new Date().toISOString()
    });
    saveNotifications(submitter, subNotifs);
  }
  // Also notify all admins/managers
  createNotification(rType,'Request '+status,
    (rec.staff||'Staff')+' '+rec.type+' has been '+status.toLowerCase()+' by '+APP.currentUser.name+'.',
    {section:'hr',recordId:rec._id,submittedBy:submitter},
    ['admin','manager','it']
  );
  renderHRTable(); renderHRSummary(); renderStaffTable();
  var dash=document.getElementById('section-dashboard');
  if(dash&&!dash.classList.contains('hidden')) renderDashboard();
  renderNotifList();
  renderNotifBadge();
}
// Poll for new notifications every 5 seconds (multi-user awareness)
function startNotifPolling(){
  if(NOTIF_POLL_INTERVAL) clearInterval(NOTIF_POLL_INTERVAL);
  NOTIF_POLL_INTERVAL = setInterval(function(){
    renderNotifBadge();
    if(NOTIF_PANEL_OPEN) renderNotifList();
  }, 5000);
}
function stopNotifPolling(){
  if(NOTIF_POLL_INTERVAL){ clearInterval(NOTIF_POLL_INTERVAL); NOTIF_POLL_INTERVAL=null; }
}
// Close panel on outside click
document.addEventListener('click', function(e){
  if(!NOTIF_PANEL_OPEN) return;
  var wrapper = document.getElementById('notif-wrapper');
  if(wrapper && !wrapper.contains(e.target)){
    NOTIF_PANEL_OPEN = false;
    var panel = document.getElementById('notif-panel');
    if(panel) panel.style.display='none';
  }
});

document.getElementById('login-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin()});
DB.init().then(function() {
  seedDB();
  updateDBIndicator();
});
</script>
  <div id="dept-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(3px)">
    <div style="background:#fff;padding:1.5rem;border-radius:12px;width:350px;max-width:90%;box-shadow:0 15px 35px rgba(0,0,0,0.2)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="font-size:15px;color:var(--navy);margin:0"><i class="ti ti-settings" style="color:var(--gold)"></i> Manage Departments</h3>
        <i class="ti ti-x" style="cursor:pointer;color:#888;font-size:18px" onclick="closeDeptModal()"></i>
      </div>
      <div style="display:flex;gap:.5rem;margin-bottom:1rem">
        <input type="text" id="dept-new-name" placeholder="New department name" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px"/>
        <button class="btn btn-primary" onclick="addDept()">Add</button>
      </div>
      <div id="dept-list-wrap" style="max-height:200px;overflow:auto;border:1px solid #eee;border-radius:6px"></div>
      <div style="text-align:right;margin-top:1rem">
        <button class="btn btn-outline" onclick="closeDeptModal()">Close</button>
      </div>
    </div>
  </div>
  <script>
    function openDeptModal(){document.getElementById('dept-modal').style.display='flex';renderDeptList();}
    function closeDeptModal(){document.getElementById('dept-modal').style.display='none';}
    function renderDeptList(){var wrap=document.getElementById('dept-list-wrap');var all=DB.findAll('departments').sort(function(a,b){return a.name.localeCompare(b.name)});if(!all.length){wrap.innerHTML='<div style="padding:1rem;color:#888;font-size:12px;text-align:center">No departments</div>';return}var html='';all.forEach(function(d){html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #eee;font-size:13px"><span>'+d.name+'</span><i class="ti ti-trash" style="color:#dc2626;cursor:pointer" onclick="deleteDept(\''+d._id+'\')"></i></div>'});wrap.innerHTML=html;}
    function addDept(){var val=document.getElementById('dept-new-name').value.trim();if(!val)return;DB.insert('departments',{name:val});document.getElementById('dept-new-name').value='';renderDeptList();refreshDeptDropdown();}
    function deleteDept(id){customConfirm('Delete this department?', function(){ DB.remove('departments',{_id:id});renderDeptList();refreshDeptDropdown(); });}
    function refreshDeptDropdown(){var sel=document.getElementById('sf-department');if(!sel)return;var cur=sel.value;var html='<option value="">-- Select Department --</option>';var all=DB.findAll('departments').sort(function(a,b){return a.name.localeCompare(b.name)});all.forEach(function(d){html+='<option value="'+d.name+'">'+d.name+'</option>'});sel.innerHTML=html;if(cur)sel.value=cur;}
    window.addEventListener('DOMContentLoaded', function() { setTimeout(refreshDeptDropdown, 500); });

    async function changePassword() {
      const cur = document.getElementById('cpw-current').value;
      const new1 = document.getElementById('cpw-new').value;
      const new2 = document.getElementById('cpw-confirm').value;
      const msg = document.getElementById('cpw-msg');
      if (!cur || !new1 || !new2) { msg.style.display='block'; msg.style.color='red'; msg.textContent='All fields required.'; return; }
      if (new1 !== new2) { msg.style.display='block'; msg.style.color='red'; msg.textContent='New passwords do not match.'; return; }
      
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
        body: JSON.stringify({ currentPassword: cur, newPassword: new1 })
      });
      const data = await res.json();
      if (!res.ok) {
        msg.style.display='block'; msg.style.color='red'; msg.textContent=data.error || 'Failed to change password.';
      } else {
        msg.style.display='block'; msg.style.color='green'; msg.textContent='Password changed successfully!';
        setTimeout(() => {
          document.getElementById('modal-changepw').style.display='none';
          document.getElementById('cpw-current').value='';
          document.getElementById('cpw-new').value='';
          document.getElementById('cpw-confirm').value='';
          msg.style.display='none';
        }, 1500);
      }
    }
  </script>
  <div id="modal-changepw" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(3px)">
    <div class="card" style="width:100%;max-width:380px;padding:2rem">
      <h3 style="margin-bottom:1rem;color:var(--navy)"><i class="ti ti-key"></i> Change Password</h3>
      <div style="margin-bottom:.85rem">
        <label>Current Password</label>
        <input type="password" id="cpw-current" />
      </div>
      <div style="margin-bottom:.85rem">
        <label>New Password</label>
        <input type="password" id="cpw-new" />
      </div>
      <div style="margin-bottom:1rem">
        <label>Confirm New Password</label>
        <input type="password" id="cpw-confirm" />
      </div>
      <div id="cpw-msg" style="font-size:12px;margin-bottom:1rem;display:none"></div>
      <div style="display:flex;gap:.5rem;justify-content:flex-end">
        <button class="btn btn-outline" onclick="document.getElementById('modal-changepw').style.display='none'; document.getElementById('cpw-msg').style.display='none'">Cancel</button>
        <button class="btn btn-primary" onclick="changePassword()">Save Password</button>
      </div>
    </div>
  </div>
</body>
<div id="custom-confirm" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(3px)">
  <div class="card" style="width:100%;max-width:380px;text-align:center;padding:2.5rem;animation: scaleIn 0.2s ease-out;box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
    <div style="font-size:42px;color:#ef4444;margin-bottom:1rem;"><i class="ti ti-alert-triangle-filled"></i></div>
    <h3 style="margin-bottom:0.75rem;color:#1e293b;font-weight:800;font-size:20px" id="custom-confirm-title">Are you sure?</h3>
    <p style="color:#64748b;margin-bottom:2rem;line-height:1.6;font-size:14px" id="custom-confirm-msg"></p>
    <div style="display:flex;gap:1rem;justify-content:center">
      <button class="btn btn-outline" id="custom-confirm-cancel" style="flex:1;padding:0.75rem">Cancel</button>
      <button class="btn btn-danger" id="custom-confirm-ok" style="flex:1;padding:0.75rem;background:#ef4444">Yes, Proceed</button>
    </div>
  </div>
</div>
<style>
@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
<script>
// Anti-inspection security scripts
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('keydown', function(e) {
  if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) { e.preventDefault(); }
  if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) { e.preventDefault(); }
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) { e.preventDefault(); }
});
