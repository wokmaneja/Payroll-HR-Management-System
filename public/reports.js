<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WokManeja — Payroll &amp; HR System</title>
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f0f0f0;color:#1a1a1a;min-height:100vh}
:root{--navy:#0a0a0a;--gold:#10b981;--gold-light:#6ee7b7;--border:#d8d8d8;--bg:#fff;--bg2:#f7f7f7;--bg3:#f0f0f0;--text:#1a1a1a;--text2:#555;--text3:#888;--radius:8px;--radius-lg:12px}
.hidden{display:none!important}
input,select,textarea{font-family:inherit;font-size:14px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text);width:100%;outline:none;transition:border-color .15s}
input:focus,select:focus,textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(16,185,129,.12)}
input[readonly]{background:#f5f5f5;color:#777;cursor:default}
input[readonly]:focus{border-color:var(--border);box-shadow:none}
label{font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}
.btn{cursor:pointer;border:none;border-radius:var(--radius);font-size:13px;font-weight:600;padding:9px 18px;transition:all .15s;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--navy);color:#fff}.btn-primary:hover{background:#1a1a1a}
.btn-gold{background:var(--gold);color:#fff}.btn-gold:hover{background:#059669}
.btn-outline{background:#fff;border:1px solid var(--border);color:var(--text)}.btn-outline:hover{background:#f5f5f5}
.btn-danger{background:#e24b4a;color:#fff}.btn-danger:hover{background:#c93b3a}
.btn-success{background:#16a34a;color:#fff}.btn-success:hover{background:#15803d}
.btn-sm{padding:5px 11px;font-size:12px}
.card{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.badge{display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.badge-admin{background:#ddeeff;color:#000000}.badge-it{background:#ddf0dd;color:#27500a}.badge-user{background:#faeeda;color:#633806}.badge-manager{background:#f0e6ff;color:#5b21b6}
.vnpf-auto{background:#ddf0dd!important;color:#27500a!important;font-weight:600}
.hint{font-size:11px;color:var(--text3);margin-top:3px}
.section-title{font-size:17px;font-weight:700;margin-bottom:1.25rem;color:var(--navy);display:flex;align-items:center;gap:8px}
table{border-collapse:collapse;width:100%}
th{text-align:left;padding:9px 12px;font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.4px;border-bottom:2px solid var(--border)}
td{padding:9px 12px;font-size:13px;border-bottom:1px solid #f0f0f0}
tr:last-child td{border-bottom:none}
tr:hover td{background:#fafafa}
.db-indicator{position:fixed;bottom:12px;right:12px;background:#1a1a1a;color:#fff;font-size:11px;padding:6px 12px;border-radius:20px;display:flex;align-items:center;gap:6px;z-index:9999;opacity:.75}
.db-dot{width:8px;height:8px;border-radius:50%;background:#4caf50;flex-shrink:0}
.hr-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem}
.hr-summary-card{background:#fff;border-radius:14px;padding:1.25rem;box-shadow:0 2px 8px rgba(0,0,0,.07);display:flex;align-items:center;gap:1rem;border:1px solid var(--border)}
.hr-icon{width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0}
.hr-icon.annual{background:var(--navy)}.hr-icon.sick{background:var(--gold)}.hr-icon.unpaid{background:var(--navy)}.hr-icon.advance{background:var(--gold)}
.hr-card-info p{font-size:11px;color:var(--text3);margin-bottom:2px;text-transform:uppercase;letter-spacing:.4px;font-weight:600}
.hr-card-info h3{font-size:20px;font-weight:800;color:var(--navy)}
.status-pill{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
.pill-approved{background:#dcfce7;color:#166534}.pill-pending{background:#fef3c7;color:#92400e}.pill-rejected{background:#fee2e2;color:#991b1b}
.pill-active{background:#dcfce7;color:#166534}.pill-inactive{background:#f0f0f0;color:#666}
.nav-divider{font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.8px;padding:10px 20px 4px;margin-top:4px}
.period-badge{background:#e8f4fd;color:#1565c0;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px;display:inline-block;margin-bottom:2px}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.rpt-page{background:#fff;max-width:800px;margin:0 auto;padding:2.5rem;border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:0 2px 8px rgba(0,0,0,.08);font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1a1a1a}
.rpt-header{border-bottom:3px solid #0a0a0a;padding-bottom:1.25rem;margin-bottom:1.5rem}
.rpt-logo-row{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}
.rpt-title{font-size:22px;font-weight:800;color:#0a0a0a;margin-bottom:2px}
.rpt-subtitle{font-size:13px;color:#555}
.rpt-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:1.5rem;font-size:12px}
.rpt-meta-item p{color:#888;margin-bottom:2px;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.rpt-meta-item span{font-weight:700;color:#0a0a0a;font-size:13px}
.rpt-section{margin-bottom:1.75rem}
.rpt-section-title{font-size:14px;font-weight:700;color:#0a0a0a;border-left:4px solid #10b981;padding-left:.75rem;margin-bottom:1rem}
.rpt-section-num{color:#10b981;margin-right:.35rem}
.rpt-summary-table{width:100%;border-collapse:collapse;margin-bottom:.5rem}
.rpt-summary-table td{padding:10px 14px;border-bottom:1px solid #eee;font-size:13px}
.rpt-summary-table td:last-child{text-align:right;font-weight:700;color:#000000}
.rpt-summary-table tr:last-child td{border-bottom:2px solid #0a0a0a;font-weight:800;font-size:14px}
.rpt-detail-table{width:100%;border-collapse:collapse;font-size:12px}
.rpt-detail-table th{background:#0a0a0a;color:#fff;padding:9px 10px;text-align:left;font-size:11px;letter-spacing:.3px}
.rpt-detail-table td{padding:9px 10px;border-bottom:1px solid #f0f0f0}
.rpt-detail-table tr:nth-child(even) td{background:#fafafa}
.rpt-obs-block{background:#f8f9fb;border-radius:8px;padding:1rem;margin-bottom:.75rem;border-left:3px solid #0a0a0a}
.rpt-obs-title{font-size:12px;font-weight:700;color:#0a0a0a;margin-bottom:.4rem}
.rpt-obs-text{font-size:12.5px;color:#444;line-height:1.7}
.rpt-obs-text ul{padding-left:1.2rem;margin-top:.35rem}
.rpt-obs-text li{margin-bottom:.2rem}
.rpt-rec-list{list-style:none;padding:0}
.rpt-rec-list li{font-size:12.5px;color:#444;padding:8px 0;border-bottom:1px solid #eee;display:flex;gap:.6rem;align-items:flex-start;line-height:1.6}
.rpt-rec-list li::before{content:"→";color:#10b981;font-weight:800;flex-shrink:0}
.rpt-footer{border-top:2px solid #0a0a0a;padding-top:1rem;margin-top:1.5rem;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#666}
.rpt-highlight-warn{background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:.5rem .75rem;font-size:12px;color:#7c5000;margin-top:.5rem}
.rpt-highlight-ok{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:.5rem .75rem;font-size:12px;color:#1b5e20;margin-top:.5rem}
.notif-item{padding:12px 16px;border-bottom:1px solid #f0f0f0;cursor:pointer;transition:background .12s;display:flex;gap:12px;align-items:flex-start}
.notif-item:hover{background:#f8f9fb}
.notif-item.unread{background:#fffbf0;border-left:3px solid #10b981}
.notif-item.unread:hover{background:#fff5e0}
.notif-item.read{opacity:.7}
.notif-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.notif-icon.pending{background:#fef3c7;color:#d97706}
.notif-icon.approved{background:#dcfce7;color:#16a34a}
.notif-icon.rejected{background:#fee2e2;color:#dc2626}
.notif-icon.info{background:#ddeeff;color:#000000}
.notif-title{font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:2px}
.notif-body{font-size:12px;color:#666;line-height:1.5}
.notif-time{font-size:10px;color:#bbb;margin-top:3px}
@keyframes notif-pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
@media print{
  @page{margin:0.4cm;size:A4 portrait}
  body{margin:0;padding:0;background:#fff!important}
  #page-login,#db-indicator,#page-main,.db-indicator{display:none!important}
  #print-overlay{position:static!important;background:none!important;padding:0!important;display:block!important;width:100%!important;height:auto!important}
  #print-overlay>div{width:100%!important;max-height:none!important;border-radius:0!important;box-shadow:none!important;padding:0.6cm 0.8cm!important;border:none!important;overflow:visible!important}
  .btn{display:none!important}
  * {-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
  /* Scale everything down to fit one page */
  #print-overlay>div{font-size:11px!important}
  #print-overlay h1,#print-overlay h2{font-size:13px!important}
  /* Header row */
  #print-overlay>div>div:first-child img{height:45px!important}
  /* Net payable display */
  #pr-net{font-size:22px!important}
  #pr-net2{font-size:18px!important}
  /* Employee summary & net card grid */
  #print-overlay>div>div:nth-child(2){gap:0.6rem!important}
  /* Earnings & deductions grid */
  #print-overlay>div>div:nth-child(3){gap:0.6rem!important}
  /* Table cells tighter */
  #print-overlay td{padding:2px 6px!important;font-size:11px!important}
  /* Net payable bar */
  #print-overlay>div>div:nth-child(4){padding:0.6rem!important;margin-bottom:0.6rem!important}
  /* Footer */
  #print-overlay>div>div:last-child{margin-top:0.3rem!important}
  /* Hide the OT calculator panel */
  #ot-calc-panel{display:none!important}
}
</style>
</head>
<body>

<div id="app">

<!-- LOGIN -->
<div id="page-login" style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem 1rem;background:#d6d6d6">
  <div style="width:100%;max-width:320px;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center">
    <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="width:240px;height:auto;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 20px rgba(0,0,0,.25);margin-bottom:1rem">
    <div id="login-company-name" style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;font-size:26px;font-weight:800;color:var(--navy);margin-bottom:1.25rem;text-align:center;letter-spacing:-0.5px"></div>
    <div class="card" style="padding:2rem;width:100%">
      <div style="margin-bottom:1.25rem"><label><span data-i18n="lbl_username">Username</span></label><input id="login-user" type="text" placeholder="Enter username" autocomplete="username" data-i18n-placeholder="ph_enter_username"></div>
      <div style="margin-bottom:1.25rem"><label><span data-i18n="lbl_password">Password</span></label><input id="login-pass" type="password" placeholder="Enter password" autocomplete="current-password" data-i18n-placeholder="ph_enter_password"></div>
      <div id="login-error" style="color:#e24b4a;font-size:12px;margin-bottom:.85rem;display:none;background:#fff0f0;padding:8px 12px;border-radius:6px;border:1px solid #f5c0c0"><i class="ti ti-alert-circle"></i><span data-i18n="msg_invalid_login"> Invalid username or password.</span></div>
      <button class="btn btn-primary" onclick="doLogin()" style="width:100%;font-size:15px;padding:13px;justify-content:center;border-radius:10px"><i class="ti ti-login"></i><span data-i18n="btn_sign_in"> Sign In</span></button>
    </div>
  </div>
  <!-- MeleTech Footer -->
  <div style="width:100%;max-width:320px;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid rgba(0,0,0,.12)">
    <p style="text-align:center;font-size:12px;color:#666;margin-bottom:.85rem"><span data-i18n="txt_copyright">© 2026 WokManeja. All rights reserved.</span><br><span data-i18n="txt_support">Support: </span><a href="mailto:wokmaneja@gmail.com" style="color:var(--navy);font-weight:600;text-decoration:none">wokmaneja@gmail.com</a></p>
    
    
  </div>
</div>
<!-- MAIN APP -->
<div id="page-main" class="hidden">
  <div style="background:var(--navy);padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between;height:58px;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.25)">
    <div style="display:flex;align-items:center;gap:12px">
      <div><div style="display:flex;align-items:baseline;gap:8px"><div style="color:#fff;font-weight:800;font-size:16px;line-height:1.2;font-family:'Segoe UI', Tahoma, sans-serif"><span data-i18n="txt_wok">Wok</span><span style="color:#10b981"><span data-i18n="txt_maneja">Maneja</span></span></div><div id="menu-company-name" style="color:#ccc;font-size:13px;font-weight:600;padding-left:8px;border-left:1px solid rgba(255,255,255,.2);font-family:'Segoe UI', Tahoma, sans-serif"></div></div><div style="color:rgba(255,255,255,.5);font-size:11px"><span data-i18n="txt_system_desc">Payroll &amp; HR Management System</span></div></div>
    </div>
    <div style="display:flex;align-items:center;gap:1rem">
      <span id="nav-badge" class="badge badge-admin"></span>
      <!-- Notification Bell -->
      <div style="position:relative" id="notif-wrapper">
        <button onclick="toggleNotifPanel()" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.18)'" onmouseout="this.style.background='rgba(255,255,255,.08)'">
          <i class="ti ti-bell" style="font-size:18px;color:#fff"></i>
          <span id="notif-count-badge" style="display:none;position:absolute;top:-5px;right:-5px;background:#e24b4a;color:#fff;font-size:10px;font-weight:800;min-width:18px;height:18px;border-radius:10px;align-items:center;justify-content:center;padding:0 4px;line-height:1"><span data-i18n="txt_0">0</span></span>
        </button>
        <!-- Notification Panel -->
        <div id="notif-panel" style="display:none;position:absolute;top:44px;right:0;width:380px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.22);z-index:999;overflow:hidden;border:1px solid #e0e0e0">
          <div style="padding:12px 16px;background:#0a0a0a;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:13px;font-weight:700;color:#fff"><i class="ti ti-bell" style="margin-right:6px"></i><span data-i18n="lbl_notifications">Notifications</span></span>
            <div style="display:flex;gap:8px;align-items:center">
              <button onclick="markAllRead()" style="background:rgba(255,255,255,.15);border:none;color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:inherit"><span data-i18n="btn_mark_read">Mark all read</span></button>
              <button onclick="toggleNotifPanel()" style="background:none;border:none;color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;line-height:1;padding:0 2px">×</button>
            </div>
          </div>
          <div id="notif-list" style="max-height:400px;overflow-y:auto"></div>
          <div id="notif-empty" style="padding:2rem;text-align:center;color:#aaa;font-size:13px;display:none"><i class="ti ti-bell-off" style="font-size:28px;display:block;margin-bottom:.5rem;opacity:.3"></i><span data-i18n="txt_no_notif">No notifications</span></div>
        </div>
      </div>
      <!-- User Dropdown -->
      <div style="position:relative" id="user-dropdown-wrapper">
        <button onclick="document.getElementById('user-dropdown-panel').style.display = document.getElementById('user-dropdown-panel').style.display === 'none' ? 'block' : 'none'" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.3);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;padding:7px 12px;border-radius:8px;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.18)'" onmouseout="this.style.background='rgba(255,255,255,.08)'">
          <span id="nav-username" style="font-weight:600;color:#fff"></span>
          <i class="ti ti-chevron-down" style="font-size:14px;color:rgba(255,255,255,.6)"></i>
        </button>
        <div id="user-dropdown-panel" style="display:none;position:absolute;top:44px;right:0;width:180px;background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:1000;overflow:hidden;border:1px solid #e0e0e0">
          <div style="padding:10px 14px;border-bottom:1px solid #f0f0f0">
            <label style="font-size:11px;color:#888;margin-bottom:4px;display:block" data-i18n="language">Language</label>
            <select id="lang-switcher" onchange="changeLang()" style="width:100%;background:#f8f9fb;border:1px solid #e0e0e0;border-radius:6px;padding:4px 8px;font-size:12px;outline:none;cursor:pointer;color:#333"><option value="en">English (EN)</option><option value="fr">Français (FR)</option><option value="zh">中文 (ZH)</option></select>
          </div>
          <button onclick="document.getElementById('modal-changepw').style.display='flex';document.getElementById('user-dropdown-panel').style.display='none'" style="width:100%;background:none;border:none;text-align:left;padding:10px 14px;font-size:13px;color:#333;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;transition:background .15s" onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background='transparent'"><i class="ti ti-key" style="color:#666"></i> <span data-i18n="change_pw">Change Password</span></button>
          <button onclick="doLogout();document.getElementById('user-dropdown-panel').style.display='none'" style="width:100%;background:none;border:none;text-align:left;padding:10px 14px;font-size:13px;color:#d32f2f;cursor:pointer;display:flex;align-items:center;gap:8px;font-family:inherit;transition:background .15s" onmouseover="this.style.background='#fff0f0'" onmouseout="this.style.background='transparent'"><i class="ti ti-logout" style="color:#d32f2f"></i> <span data-i18n="sign_out">Sign out</span></button>
        </div>
      </div>
    </div>
  </div>
  <div style="display:flex;height:calc(100vh - 58px)">
    <div style="width:225px;background:var(--bg);border-right:1px solid var(--border);padding:.75rem 0;flex-shrink:0;overflow-y:auto">
      <nav id="sidebar-nav"></nav>

    </div>
    <div id="content-area" style="flex:1;overflow-y:auto;background:var(--bg3);display:flex;flex-direction:column">
      <div style="flex:1;padding:1.75rem">
      <!-- DASHBOARD -->
      <div id="section-dashboard" class="hidden"><p class="section-title"><i class="ti ti-layout-dashboard" style="color:var(--gold)"></i> <span data-i18n="menu_dashboard">Dashboard</span></p><div id="dashboard-content"></div></div>
      <!-- PAYSLIP -->
      <div id="section-payslip" class="hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
          <p class="section-title"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> <span data-i18n="menu_payslip">Create Payslip</span></p>
          <button class="btn btn-gold" onclick="printPayslip()"><i class="ti ti-download"></i><span data-i18n="btn_dl_print"> Download / Print</span></button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div class="card">
            <p style="font-size:11px;font-weight:700;letter-spacing:.6px;color:var(--text2);margin-bottom:1rem;text-transform:uppercase"><span data-i18n="lbl_emp_summary">Employee Summary</span></p>
            <div style="margin-bottom:.85rem"><label data-i18n="employee_name">Employee Name</label><div style="display:flex;gap:8px"><select id="ps-staff" onchange="fillStaffDetails()" style="flex:1"><option value="">-- Select Staff --</option></select><button class="btn btn-outline btn-sm" onclick="loadLastPayslip()" title="Load Last Payslip Template"><i class="ti ti-history"></i> <span data-i18n="load_last">Load Last</span></button></div></div>
            <div style="margin-bottom:.85rem"><label data-i18n="employee_id">Employee ID</label><input id="ps-empid" type="text" readonly=""></div>
            <div style="margin-bottom:.85rem"><label><span data-i18n="lbl_designation">Designation</span></label><input id="ps-designation" type="text" readonly=""></div>
            <div style="margin-bottom:.85rem"><label><span data-i18n="lbl_department">Department</span></label><input id="ps-department" type="text" readonly=""></div>
            <div style="margin-bottom:.85rem"><label><span data-i18n="lbl_pay_cycle">Pay Cycle</span></label><select id="ps-paycycle" onchange="onPayCycleChange()"><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly (Every 2 Weeks)</option><option value="monthly">Monthly</option></select></div>
            <div id="ps-period-wrap"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.5rem"><div><label><span data-i18n="lbl_period_start">Period Start</span></label><input id="ps-period-start" type="date"></div><div><label><span data-i18n="lbl_period_end">Period End</span></label><input id="ps-period-end" type="date"></div></div><div id="ps-period-label" style="font-size:12px;color:#000000;background:#f0f7ff;border-radius:6px;padding:7px 10px;border:1px solid #c0d8f0;display:none;margin-bottom:.5rem"></div></div>
            <div id="ps-monthly-wrap" style="display:none"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem"><div><label><span data-i18n="lbl_month">Month</span></label><select id="ps-month" onchange="updatePaidDays()"><option>January</option><option>February</option><option>March</option><option>April</option><option selected="">May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option></select></div><div><label><span data-i18n="lbl_year">Year</span></label><input id="ps-year" type="number" value="2026" onchange="updatePaidDays()"></div></div></div>
          </div>
          <div class="card" style="background:var(--navy);border-color:var(--navy)">
            <p style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:4px"><span data-i18n="lbl_net_payable">Net Payable Amount</span></p>
            <div id="ps-net-display" style="font-size:32px;font-weight:800;color:var(--gold-light);margin-bottom:1rem"><span data-i18n="txt_vuv_0">VUV 0</span></div>
            <div style="margin-bottom:.85rem"><p style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.4px"><span data-i18n="lbl_pay_day_thurs">Pay Day (Thursday Pay Date)</span></p><input id="ps-paydate" type="date" onchange="onPayDateChange()" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;padding:8px 12px;font-size:13px;border-radius:8px"><div id="ps-paydate-info" style="font-size:11px;color:rgba(255,255,255,.55);margin-top:6px;background:rgba(255,255,255,.07);border-radius:6px;padding:6px 8px;display:none"></div></div>
            <div><p style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.4px"><span data-i18n="lbl_paid_days">Paid Days</span></p><div style="display:flex;align-items:center;gap:8px"><input id="ps-paiddays" type="number" value="0" min="0" max="31" onchange="calcPayslip()" style="width:60px;padding:6px;font-size:14px;text-align:center;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px"><span style="color:rgba(255,255,255,.4);font-size:16px">/</span><input id="ps-totaldays" type="number" value="0" readonly="" style="width:60px;padding:6px;font-size:14px;text-align:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.5);border-radius:8px"><span style="color:rgba(255,255,255,.4);font-size:12px"><span data-i18n="lbl_days">days</span></span></div></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy);border-bottom:2px solid #f0f0f0;padding-bottom:.75rem"><i class="ti ti-trending-up" style="color:#3b6d11"></i> <span data-i18n="earnings">Earnings</span></p>
          <div style="margin-bottom:.85rem"><label data-i18n="pay_type">Pay Type</label><select id="earn-type" onchange="onPayTypeChange()"><option value="fixed" data-i18n="fixed_salary">Fixed Salary</option><option value="hourly" data-i18n="hourly_rate">Hourly Rate</option></select></div>
          <div id="hourly-wrap" style="display:none;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem"><div><label data-i18n="hourly_rate_vuv">Hourly Rate (VUV)</label><input id="earn-hourly-rate" type="number" placeholder="0" oninput="calcHourlyPay()" data-i18n-placeholder="txt_0"></div><div><label data-i18n="hours_worked">Hours Worked</label><input id="earn-hours" type="number" placeholder="0" oninput="calcHourlyPay()" data-i18n-placeholder="txt_0"></div></div>
          <div style="margin-bottom:.85rem"><label data-i18n="basic_pay">Basic Pay (VUV)</label><input id="earn-basic" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0"></div>
<div style="margin-bottom:.85rem">
  <label data-i18n="overtime">Overtime (VUV)</label>
  <input id="earn-overtime" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0">
  <div style="margin-top:6px">
    <button type="button" onclick="toggleOTCalc()" style="background:none;border:none;color:#0a0a0a;font-size:11px;font-weight:600;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;font-family:inherit"><i class="ti ti-calculator" style="font-size:13px;color:#10b981"></i><span data-i18n="btn_show_ot"> Show Overtime Calculator</span></button>
    <div id="ot-calc-panel" style="display:none;margin-top:8px;background:#f8f9fb;border:1px solid #d0d8e8;border-radius:8px;padding:12px">
      <p style="font-size:11px;font-weight:700;color:#0a0a0a;margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px"><i class="ti ti-info-circle" style="color:#10b981"></i><span data-i18n="lbl_ot_example"> Overtime Example Calculation</span></p>
      <div style="overflow:auto">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#0a0a0a;color:#fff">
              <th style="padding:7px 10px;text-align:left;font-weight:700"><span data-i18n="lbl_type">Type</span></th>
              <th style="padding:7px 10px;text-align:center;font-weight:700"><span data-i18n="lbl_hours">Hours</span></th>
              <th style="padding:7px 10px;text-align:center;font-weight:700"><span data-i18n="lbl_rate_mult">Rate Multiplier</span></th>
              <th style="padding:7px 10px;text-align:left;font-weight:700"><span data-i18n="lbl_formula">Formula</span></th>
              <th style="padding:7px 10px;text-align:right;font-weight:700"><span data-i18n="lbl_amount">Amount</span></th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e8edf4">
              <td style="padding:7px 10px;font-weight:600;color:#1a1a1a"><span data-i18n="lbl_weekday_ot">Weekday OT</span></td>
              <td style="padding:7px 10px;text-align:center;color:#555">5</td>
              <td style="padding:7px 10px;text-align:center"><span style="background:#ddeeff;color:#000000;padding:2px 8px;border-radius:10px;font-weight:700">1.5×</span></td>
              <td style="padding:7px 10px;color:#555;font-family:monospace;font-size:10px">5 × 454.55 × 1.5</td>
              <td style="padding:7px 10px;text-align:right;font-weight:700;color:#000000">3,409</td>
            </tr>
            <tr style="border-bottom:1px solid #e8edf4;background:#fafbfc">
              <td style="padding:7px 10px;font-weight:600;color:#1a1a1a"><span data-i18n="lbl_weekend_ot">Weekend OT</span></td>
              <td style="padding:7px 10px;text-align:center;color:#555">4</td>
              <td style="padding:7px 10px;text-align:center"><span style="background:#faeeda;color:#633806;padding:2px 8px;border-radius:10px;font-weight:700">2.0×</span></td>
              <td style="padding:7px 10px;color:#555;font-family:monospace;font-size:10px">4 × 454.55 × 2.0</td>
              <td style="padding:7px 10px;text-align:right;font-weight:700;color:#633806">3,636</td>
            </tr>
            <tr style="background:#fff8f0">
              <td style="padding:7px 10px;font-weight:600;color:#1a1a1a"><span data-i18n="lbl_public_holiday">Public Holiday</span></td>
              <td style="padding:7px 10px;text-align:center;color:#555">2</td>
              <td style="padding:7px 10px;text-align:center"><span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-weight:700">2.5×</span></td>
              <td style="padding:7px 10px;color:#555;font-family:monospace;font-size:10px">2 × 454.55 × 2.5</td>
              <td style="padding:7px 10px;text-align:right;font-weight:700;color:#991b1b">2,273</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="font-size:10px;color:#999;margin-top:8px;font-style:italic"><i class="ti ti-info-circle"></i><span data-i18n="txt_ot_help"> Example based on hourly rate of VUV 454.55 (approx. VUV 100,000/month ÷ 220 working hours). Enter your calculated OT total in the field above.</span></p>
    </div>
  </div>
</div>
<div style="margin-bottom:.85rem">
  <label><span data-i18n="lbl_severance_pkg">Severance Package (VUV)</span></label>
  <input id="earn-severance" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0">
  <div style="margin-top:6px">
    <button type="button" onclick="toggleSevCalc()" style="background:none;border:none;color:#0a0a0a;font-size:11px;font-weight:600;cursor:pointer;padding:0;display:flex;align-items:center;gap:4px;font-family:inherit"><i class="ti ti-calculator" style="font-size:13px;color:#10b981"></i><span data-i18n="btn_calc_sev"> Calculate Severance</span></button>
    <div id="sev-calc-panel" style="display:none;margin-top:8px;background:#f8f9fb;border:1px solid #d0d8e8;border-radius:8px;padding:12px">
      <p style="font-size:11px;font-weight:700;color:#0a0a0a;margin-bottom:8px;text-transform:uppercase;letter-spacing:.4px"><i class="ti ti-info-circle" style="color:#10b981"></i><span data-i18n="lbl_sev_calc"> Severance Calculation</span></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label style="font-size:10px;margin-bottom:2px"><span data-i18n="lbl_monthly_remun">Monthly Remuneration</span></label>
          <input type="number" id="sev-monthly" placeholder="VUV" oninput="doSevCalc()" style="padding:4px 8px;font-size:12px" data-i18n-placeholder="lbl_vuv">
        </div>
        <div>
          <label style="font-size:10px;margin-bottom:2px"><span data-i18n="lbl_yrs_service">Years of Service</span></label>
          <input type="number" id="sev-years" placeholder="e.g. 2.5" step="0.1" oninput="doSevCalc()" style="padding:4px 8px;font-size:12px" data-i18n-placeholder="ph_2_5">
        </div>
      </div>
      <div style="background:#e8edf4;padding:8px;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px;font-weight:600"><span data-i18n="lbl_calculated">Calculated:</span></span>
        <span id="sev-result" style="font-size:14px;font-weight:800;color:#185fa5"><span data-i18n="txt_vuv_0">VUV 0</span></span>
      </div>
      <button type="button" onclick="applySevCalc()" class="btn btn-primary btn-sm" style="margin-top:10px;width:100%;justify-content:center"><span data-i18n="btn_apply_payslip">Apply to Payslip</span></button>
      <p style="font-size:10px;color:#999;margin-top:8px;font-style:italic"><i class="ti ti-info-circle"></i><span data-i18n="txt_sev_formula"> Formula: 1 month remuneration for each year of service.</span></p>
    </div>
  </div>
</div>
<div style="margin-bottom:.85rem"><label><span data-i18n="lbl_allowances">Allowances (VUV)</span></label><input id="earn-allowances" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_bonus">Bonus (VUV)</span></label><input id="earn-bonus" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0"></div><div style="background:#f0f7ff;border-radius:8px;padding:.75rem;display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;font-weight:700;color:#000000"><span data-i18n="lbl_total_earnings">Total Earnings</span></span><span id="ps-total-earn" style="font-size:16px;font-weight:800;color:#000000"><span data-i18n="txt_vuv_0">VUV 0</span></span></div></div>
          <div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy);border-bottom:2px solid #f0f0f0;padding-bottom:.75rem"><i class="ti ti-trending-down" style="color:#a32d2d"></i><span data-i18n="lbl_deductions"> Deductions</span></p><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_vnpf">VNPF — Vanuatu National Provident Fund (VUV)</span></label><input id="ded-vnpf" type="number" readonly="" class="vnpf-auto" placeholder="Auto: 6% of Basic Pay" data-i18n-placeholder="txt_auto_6_percent"><p class="hint"><i class="ti ti-calculator" style="font-size:12px"></i><span data-i18n="txt_auto_calc"> Auto-calculated at 6% of Basic Pay</span></p></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_staff_loan">Staff Loan (VUV)</span></label><input id="ded-loan" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_others">Others (VUV)</span></label><input id="ded-others" type="number" placeholder="0" oninput="calcPayslip()" data-i18n-placeholder="txt_0"><input id="ded-others-note" type="text" placeholder="Note / Reference (e.g. Union Fee, Court Order, Overpayment...)" style="margin-top:6px;font-size:12px;" data-i18n-placeholder="lbl_note_ref"><p class="hint"><i class="ti ti-notes" style="font-size:12px"></i><span data-i18n="ph_opt_desc"> Optional — describe what this deduction is for</span></p></div><div style="background:#fff0f0;border-radius:8px;padding:.75rem;display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;font-weight:700;color:#a32d2d"><span data-i18n="lbl_total_deductions">Total Deductions</span></span><span id="ps-total-ded" style="font-size:16px;font-weight:800;color:#a32d2d"><span data-i18n="txt_vuv_0">VUV 0</span></span></div></div>
        </div>
        <div style="display:flex;gap:.75rem;align-items:center"><button class="btn btn-primary" onclick="savePayslip()"><i class="ti ti-device-floppy"></i><span data-i18n="btn_save_db"> Save to Database</span></button><button class="btn btn-outline" onclick="resetPayslip()"><i class="ti ti-refresh"></i><span data-i18n="btn_reset"> Reset</span></button><span id="ps-save-msg" style="font-size:13px;color:#27500a;background:#ddf0dd;padding:7px 14px;border-radius:6px;display:none"><i class="ti ti-check"></i><span data-i18n="msg_saved_db"> Saved to SQLite Database.</span></span></div>
      </div>
      <!-- BULK PAYSLIP -->
      <div id="section-bulk" class="hidden">
        <p class="section-title"><i class="ti ti-table" style="color:var(--gold)"></i> <span data-i18n="menu_bulk">Bulk Payslip Processing</span></p>
        <div class="card" style="margin-bottom:1rem">
          <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_global_pay_settings">Global Pay Period Settings</span></p>
          <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
            <div>
              <label><span data-i18n="lbl_pay_cycle">Pay Cycle</span></label>
              <select id="bp-paycycle" onchange="toggleBulkPayCycle()">
                <option value="Weekly">Weekly</option>
                <option value="Fortnightly">Fortnightly (14 Days)</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label><span data-i18n="lbl_pay_date">Pay Date</span></label>
              <input id="bp-paydate" type="date" onchange="updateBulkFortnightPeriod()">
            </div>
            <div id="bp-fortnight-period-wrap" style="flex:1;display:flex;gap:1rem">
              <div style="flex:1">
                <label><span data-i18n="lbl_period_start">Period Start</span></label>
                <input id="bp-period-start" type="date">
              </div>
              <div style="flex:1">
                <label><span data-i18n="lbl_period_end">Period End</span></label>
                <input id="bp-period-end" type="date">
              </div>
              <input id="bp-period-label" type="hidden">
            </div>
            <div id="bp-month-period-wrap" style="display:none;gap:1rem;flex:1">
              <div style="flex:1">
                <label><span data-i18n="lbl_month">Month</span></label>
                <select id="bp-month">
                  <option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option>
                </select>
              </div>
              <div style="flex:1">
                <label><span data-i18n="lbl_year">Year</span></label>
                <input id="bp-year" type="number" value="2026">
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <div style="display:flex;align-items:center;gap:1rem">
              <p style="font-size:13px;font-weight:700;color:var(--navy);margin:0"><span data-i18n="lbl_active_staff">Active Staff (</span><span id="bp-staff-count"><span data-i18n="txt_0">0</span></span>)</p>
              <select id="bp-staff-filter" onchange="renderBulkTable()" style="padding:4px 8px;font-size:12px;width:auto;min-height:auto;margin:0">
                <option value="All">All Active Staff</option>
                <option value="Weekly">Weekly Only</option>
                <option value="Fortnightly">Fortnightly Only</option>
                <option value="Monthly">Monthly Only</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:.5rem">
              <select id="bp-template-select" style="padding:4px 8px;font-size:12px;width:150px;min-height:auto;margin:0">
                <option value="">-- Templates --</option>
              </select>
              <button class="btn btn-outline btn-sm" onclick="loadBulkTemplate()" style="padding:4px 8px"><i class="ti ti-download"></i> <span data-i18n="lbl_load_template">Load</span></button>
            </div>
          </div>
          <div id="bp-table-wrap" style="overflow:auto;margin-bottom:1rem">
            <!-- Table goes here -->
          </div>
          <div style="display:flex;gap:.75rem;align-items:center">
            <button class="btn btn-primary" onclick="saveBulkPayroll()"><i class="ti ti-device-floppy"></i><span data-i18n="btn_save"> Save</span></button>
            <button class="btn btn-outline" onclick="saveBulkTemplate()"><i class="ti ti-template"></i><span data-i18n="btn_save_template"> Save Template</span></button>
            <span id="bp-save-msg" style="font-size:13px;color:#27500a;background:#ddf0dd;padding:7px 14px;border-radius:6px;display:none"><i class="ti ti-check"></i><span data-i18n="msg_bulk_saved"> Bulk Payslip Saved.</span></span>
          </div>
        </div>
      </div>
      <!-- RECORDS -->
      <div id="section-records" class="hidden"><p class="section-title"><i class="ti ti-files" style="color:var(--gold)"></i> <span data-i18n="menu_records">Payslip Records</span></p><div id="records-list"></div></div>
      <!-- STAFF -->
      <div id="section-staff" class="hidden"><p class="section-title"><i class="ti ti-users" style="color:var(--gold)"></i> <span data-i18n="menu_staff">Staff Management</span></p><div style="display:grid;grid-template-columns:350px 1fr;gap:1rem"><div class="card" style="height:fit-content"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)" id="staff-form-title"><span data-i18n="lbl_add_staff">Add New Staff</span></p><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_full_name">Full Name</span></label><input id="sf-name" type="text" placeholder="e.g. John Smith" data-i18n-placeholder="ph_john_smith"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_emp_id">Employee ID </span><span style="font-weight:400;text-transform:none;letter-spacing:0;color:#aaa"><span data-i18n="lbl_auto_gen">(auto-generated)</span></span></label><input id="sf-id" type="text" readonly=""><p class="hint"><span data-i18n="txt_next_id">Next available ID auto-filled</span></p></div><div><label><span data-i18n="lbl_vnpf_num">VNPF Number</span></label><input id="sf-vnpf" type="text" placeholder="e.g. 123456" data-i18n-placeholder="ph_vnpf_num"><p class="hint"><span data-i18n="txt_opt_vnpf">For reports</span></p></div></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_job_title">Designation / Job Title</span></label><input id="sf-designation" type="text" placeholder="e.g. Accountant" data-i18n-placeholder="ph_accountant"></div><div style="margin-bottom:.85rem"><label style="display:flex;justify-content:space-between;align-items:center"><span><span data-i18n="lbl_department">Department</span></span><button class="btn btn-sm" style="padding:2px 6px;font-size:10px;background:#e2e8f0;color:#333;border:none" onclick="openDeptModal()"><i class="ti ti-settings"></i><span data-i18n="btn_manage"> Manage</span></button></label><select id="sf-department"><option value="">-- Select Department --</option></select></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_email">Email Address</span></label><input id="sf-email" type="email" placeholder="staff@email.com" data-i18n-placeholder="ph_email"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_phone">Phone Number</span></label><input id="sf-phone" type="text" placeholder="+678 000000" data-i18n-placeholder="ph_phone"></div><div><label><span data-i18n="lbl_hourly_rate">Hourly Rate (VUV)</span></label><input id="sf-hourly" type="number" placeholder="0 (Salaried)" data-i18n-placeholder="ph_salaried"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_bank_name">Bank Name</span></label><input id="sf-bank" type="text" placeholder="e.g. BSP" data-i18n-placeholder="ph_bsp"></div><div><label><span data-i18n="lbl_account_num">Account Number</span></label><input id="sf-account" type="text" placeholder="e.g. 12345678" data-i18n-placeholder="ph_account"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_annual_leave">Annual Leave (days)</span></label><input id="sf-annual" type="number" value="21"></div><div><label><span data-i18n="lbl_sick_leave">Sick Leave (days)</span></label><input id="sf-sick" type="number" value="10"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:1rem"><div style="margin-bottom:0"><label><span data-i18n="lbl_pay_cycle">Pay Cycle</span></label><select id="sf-paycycle"><option value="Weekly">Weekly</option><option value="Fortnightly">Fortnightly</option><option value="Monthly" selected="">Monthly</option></select></div><div style="margin-bottom:0"><label><span data-i18n="lbl_status">Status</span></label><select id="sf-status"><option>Active</option><option>Inactive</option></select></div></div><div style="margin-bottom:1rem; border:1px solid var(--border); padding:1rem; border-radius:6px; background:#f8f9fa;"><div style="margin-bottom:.85rem;display:flex;align-items:center;gap:.5rem"><input type="checkbox" id="sf-create-user" style="width:auto;margin:0" onchange="document.getElementById('sf-user-fields').style.display=this.checked?'block':'none'"><label for="sf-create-user" style="margin-bottom:0;font-weight:700;color:var(--navy)"><span data-i18n="lbl_enable_portal">Enable Staff Portal Access</span></label></div><div id="sf-user-fields" style="display:none"><div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem"><div><label><span data-i18n="lbl_username">Username</span></label><input id="sf-username" type="text" placeholder="e.g. jsmith" data-i18n-placeholder="ph_jsmith"></div><div><label><span data-i18n="lbl_password">Password</span></label><input id="sf-password" type="password" placeholder="Leave blank to keep same" data-i18n-placeholder="ph_leave_blank"></div></div><p class="hint" style="margin-top:5px;font-size:10px"><span data-i18n="txt_create_user">Creates/Updates a user account with the 'Staff' role.</span></p></div></div><div style="display:flex;gap:.5rem"><button class="btn btn-primary" onclick="saveStaff()"><i class="ti ti-device-floppy"></i><span data-i18n="btn_save_staff"> Save Staff</span></button><button class="btn btn-outline" onclick="clearStaffForm()"><i class="ti ti-x"></i><span data-i18n="btn_clear"> Clear</span></button></div><div id="sf-msg" style="margin-top:.75rem;font-size:12px;color:#27500a;background:#ddf0dd;padding:7px 12px;border-radius:6px;display:none"></div></div><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_staff_dir">Staff Directory</span></p><input type="text" id="staff-search" placeholder="Search staff..." oninput="renderStaffTable()" style="max-width:280px;margin-bottom:1rem" data-i18n-placeholder="ph_search_staff"><div id="staff-table-wrap" style="overflow:auto"></div></div></div></div>
      <!-- HR -->
      <div id="section-hr" class="hidden"><p class="section-title"><i class="fa-solid fa-plane-departure" style="color:var(--gold)"></i> <span data-i18n="menu_hr">HR Leave &amp; Advance</span></p><div class="hr-summary-grid"><div class="hr-summary-card"><div class="hr-icon annual"><i class="fa-solid fa-plane-departure"></i></div><div class="hr-card-info"><p><span data-i18n="lbl_annual_l">Annual Leave</span></p><h3 id="hr-count-annual"><span data-i18n="txt_0">0</span></h3></div></div><div class="hr-summary-card"><div class="hr-icon sick"><i class="fa-solid fa-notes-medical"></i></div><div class="hr-card-info"><p><span data-i18n="lbl_sick_l">Sick Leave</span></p><h3 id="hr-count-sick"><span data-i18n="txt_0">0</span></h3></div></div><div class="hr-summary-card"><div class="hr-icon unpaid"><i class="fa-solid fa-calendar-xmark"></i></div><div class="hr-card-info"><p><span data-i18n="lbl_lwp">Leave Without Pay</span></p><h3 id="hr-count-unpaid"><span data-i18n="txt_0">0</span></h3></div></div><div class="hr-summary-card"><div class="hr-icon advance"><i class="fa-solid fa-money-bill-wave"></i></div><div class="hr-card-info"><p><span data-i18n="lbl_advances">Advances Issued</span></p><h3 id="hr-total-advance"><span data-i18n="txt_vuv_0">VUV 0</span></h3></div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem"><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)" id="hr-form-title"><i class="fa-solid fa-paper-plane" style="color:var(--gold)"></i><span data-i18n="lbl_submit_req"> Submit Leave / Advance Request</span></p><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_employee">Employee</span></label><select id="hr-staff"><option value="">-- Select Staff --</option></select></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_req_type">Request Type</span></label><select id="hr-type" onchange="toggleAdvanceAmount()"><option>Annual Leave</option><option>Sick Leave</option><option>Leave Without Pay</option><option>Payment Advance</option></select></div><div id="hr-advance-wrap" style="visibility:hidden"><label><span data-i18n="lbl_adv_amount">Advance Amount (VUV)</span></label><input id="hr-amount" type="number" placeholder="0" data-i18n-placeholder="txt_0"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem"><div><label><span data-i18n="lbl_start_date">Start Date</span></label><input id="hr-start" type="date"></div><div><label><span data-i18n="lbl_end_date">End Date</span></label><input id="hr-end" type="date"></div></div><div style="margin-bottom:1rem"><label><span data-i18n="lbl_reason">Reason / Notes</span></label><textarea id="hr-notes" placeholder="Enter reason here..." style="min-height:80px;resize:none" data-i18n-placeholder="ph_reason"></textarea></div><div style="display:flex;gap:.5rem;align-items:center"><button class="btn btn-primary" onclick="saveHRRequest()"><i class="fa-solid fa-paper-plane"></i><span data-i18n="btn_submit_req"> Submit Request</span></button><button class="btn btn-outline" onclick="clearHRForm()"><i class="ti ti-refresh"></i><span data-i18n="btn_clear"> Clear</span></button><span id="hr-save-msg" style="font-size:12px;color:#27500a;background:#ddf0dd;padding:6px 12px;border-radius:6px;display:none"><i class="ti ti-check"></i><span data-i18n="msg_saved"> Saved.</span></span></div></div><div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem"><p style="font-size:13px;font-weight:700;color:var(--navy)"><i class="fa-solid fa-clock-rotate-left" style="color:var(--gold)"></i><span data-i18n="lbl_recent_req"> Recent Requests</span></p><select id="hr-filter-status" onchange="renderHRTable()" style="width:auto;font-size:12px;padding:5px 8px"><option value="">All Status</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div><div id="hr-recent-wrap" style="overflow:auto;max-height:380px"></div></div></div><div class="card"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem"><p style="font-size:13px;font-weight:700;color:var(--navy)"><i class="ti ti-table" style="color:var(--gold)"></i><span data-i18n="lbl_all_records"> All Leave &amp; Advance Records</span></p><select id="hr-filter-type" onchange="renderHRTable()" style="width:auto;font-size:12px;padding:5px 8px"><option value="">All Types</option><option>Annual Leave</option><option>Sick Leave</option><option>Leave Without Pay</option><option>Payment Advance</option></select></div><div id="hr-table-wrap" style="overflow:auto"></div></div></div>
      <!-- USERS -->
      <div id="section-users" class="hidden"><p class="section-title"><i class="ti ti-user-shield" style="color:var(--gold)"></i> <span data-i18n="menu_users">User Management</span></p><div style="display:grid;grid-template-columns:350px 1fr;gap:1rem"><div class="card" style="height:fit-content"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)" id="uf-form-title"><span data-i18n="lbl_add_user">Add New User</span></p><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_full_name">Full Name</span></label><input id="uf-name" type="text" placeholder="Full name" data-i18n-placeholder="ph_full_name"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_username">Username</span></label><input id="uf-username" type="text" placeholder="Username" data-i18n-placeholder="lbl_username"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_password">Password</span></label><input id="uf-password" type="password" placeholder="Password" data-i18n-placeholder="lbl_password"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_assign_role">Assign Role</span></label><select id="uf-role"><option value="admin">Admin</option><option value="manager">Manager</option><option value="it">IT</option><option value="staff" selected="">Staff</option></select></div>
<div style="margin-bottom:1rem"><label><span data-i18n="lbl_link_staff">Link to Staff Record </span><span style="font-weight:400;text-transform:none;letter-spacing:0;color:#aaa;font-size:11px"><span data-i18n="txt_opt_hr">(optional — for HR leave tracking)</span></span></label><select id="uf-staff-link"><option value="">-- Not linked --</option></select><p class="hint"><i class="ti ti-link"></i><span data-i18n="txt_link_desc"> Links this user to a staff record so they can view their own HR leave records</span></p></div><button class="btn btn-primary" id="uf-save-btn" onclick="saveUser()"><i class="ti ti-user-plus"></i><span data-i18n="btn_add_user"> Add User</span></button> <button class="btn btn-outline" id="uf-cancel-btn" onclick="cancelEditUser()" style="display:none"><i class="ti ti-x"></i><span data-i18n="btn_cancel"> Cancel</span></button><div id="uf-msg" style="margin-top:.75rem;font-size:12px;color:#27500a;background:#ddf0dd;padding:7px 12px;border-radius:6px;display:none"><span data-i18n="msg_user_added">User added successfully.</span></div></div><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_users_roles">Users &amp; Roles</span></p><div id="users-table-wrap"></div></div></div></div>
      <!-- ROLES -->
      <div id="section-roles" class="hidden"><p class="section-title"><i class="ti ti-shield" style="color:var(--gold)"></i> <span data-i18n="menu_roles">Roles &amp; Permissions</span></p><div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1rem"><div class="card" style="border-top:4px solid #185fa5"><div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem"><i class="ti ti-shield-check" style="font-size:22px;color:#185fa5"></i><span style="font-size:15px;font-weight:700;color:#000000"><span data-i18n="lbl_admin">Admin</span></span><span class="badge badge-admin"><span data-i18n="lbl_admin">Admin</span></span></div><ul style="font-size:13px;color:var(--text2);line-height:2.2;padding-left:1.1rem"><li>Full system access</li><li>Create &amp; manage users</li><li>Assign roles</li><li>All payslip rights</li><li>Manage staff directory</li><li>All reports &amp; compliance</li><li>HR leave &amp; advance management</li><li>Delete any record</li></ul></div><div class="card" style="border-top:4px solid #5b21b6"><div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem"><i class="ti ti-shield-star" style="font-size:22px;color:#5b21b6"></i><span style="font-size:15px;font-weight:700;color:#5b21b6"><span data-i18n="lbl_manager">Manager</span></span><span class="badge badge-manager"><span data-i18n="lbl_manager">Manager</span></span></div><ul style="font-size:13px;color:var(--text2);line-height:2.2;padding-left:1.1rem"><li>Create &amp; manage users</li><li>Assign roles</li><li>All payslip rights</li><li>Manage staff directory</li><li>All reports &amp; compliance</li><li>HR leave &amp; advance management</li><li>Delete any record</li></ul></div><div class="card" style="border-top:4px solid #3b6d11"><div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem"><i class="ti ti-shield-half" style="font-size:22px;color:#3b6d11"></i><span style="font-size:15px;font-weight:700;color:#27500a"><span data-i18n="lbl_it">IT</span></span><span class="badge badge-it"><span data-i18n="lbl_it">IT</span></span></div><ul style="font-size:13px;color:var(--text2);line-height:2.2;padding-left:1.1rem"><li>All payslip rights</li><li>Compliance report access</li><li>Manage staff directory</li><li>HR leave &amp; advance access</li><li>Approve/reject leave requests</li><li>Cannot create/delete users</li><li>Cannot delete records</li></ul></div><div class="card" style="border-top:4px solid #854f0b"><div style="display:flex;align-items:center;gap:8px;margin-bottom:1rem"><i class="ti ti-shield" style="font-size:22px;color:#854f0b"></i><span style="font-size:15px;font-weight:700;color:#633806"><span data-i18n="lbl_staff">Staff</span></span><span class="badge badge-staff"><span data-i18n="lbl_staff">Staff</span></span></div><ul style="font-size:13px;color:var(--text2);line-height:2.2;padding-left:1.1rem"><li>Access to Staff Portal Dashboard</li><li>View own leave balances</li><li>View own payslips</li><li>Submit own leave/advance requests</li><li>No user/staff management</li><li>Cannot approve/delete records</li></ul></div></div></div>
      <!-- COMPLIANCE -->
      <div id="section-compliance" class="hidden"><p class="section-title"><i class="ti ti-report-analytics" style="color:var(--gold)"></i> <span data-i18n="menu_compliance">Compliance Report</span></p><div class="card" style="margin-bottom:1rem"><div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap"><div style="flex:1;min-width:140px"><label><span data-i18n="lbl_month">Month</span></label><select id="cr-month"><option value="">All Months</option><option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option></select></div><div style="flex:1;min-width:100px"><label><span data-i18n="lbl_year">Year</span></label><input id="cr-year" type="number" value="2026"></div><button class="btn btn-primary" onclick="renderCompliance()"><i class="ti ti-search"></i><span data-i18n="btn_gen_payroll"> Gen. Payroll Report</span></button><button class="btn btn-gold" id="cr-pdf-btn" onclick="downloadCompliancePDF()" style="display:none"><i class="ti ti-file-download"></i><span data-i18n="btn_pdf"> PDF</span></button><button class="btn btn-primary" style="background:#185fa5" onclick="renderVNPF()"><i class="ti ti-search"></i><span data-i18n="btn_gen_vnpf"> Gen. VNPF &amp; Bank</span></button><button class="btn btn-gold" id="cr-vnpf-btn" onclick="downloadVNPFPDF()" style="display:none"><i class="ti ti-file-download"></i><span data-i18n="btn_pdf"> PDF</span></button></div></div><div id="cr-loading" style="display:none;text-align:center;padding:2rem;color:#888"><i class="ti ti-loader-2" style="font-size:28px;animation:spin 1s linear infinite;display:block;margin-bottom:.5rem"></i><span data-i18n="msg_gen_report">Generating report...</span></div><div id="compliance-output"></div></div>
      <!-- DATABASE -->
      <!-- UPDATES -->
      <div id="section-updates" class="hidden"><p class="section-title"><i class="ti ti-cloud-download" style="color:var(--gold)"></i> <span data-i18n="menu_updates">App Updates</span></p><div style="display:grid;grid-template-columns:320px 1fr;gap:1rem;align-items:start"><div class="card" style="border-top:4px solid #0a0a0a"><div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;padding-bottom:.85rem;border-bottom:2px solid #f0f0f0"><i class="ti ti-brand-github" style="font-size:24px;color:#0a0a0a"></i><div><p style="font-size:14px;font-weight:800;color:#0a0a0a;margin:0"><span data-i18n="lbl_wokmaneja">WokManeja</span></p><p style="font-size:11px;color:#888;margin:0" id="upd-repo"><span data-i18n="lbl_repo">wokmaneja/Payroll-HR-Management-System</span></p></div></div><div style="background:#f8f9fb;border-radius:8px;padding:12px;margin-bottom:1rem"><p style="font-size:11px;color:#888;margin-bottom:4px;font-weight:600;text-transform:uppercase"><span data-i18n="lbl_installed_ver">Installed Version</span></p><p style="font-size:22px;font-weight:800;color:#0a0a0a;margin:0" id="upd-current"><span data-i18n="lbl_v100">v1.0.0</span></p></div><button class="btn btn-primary" onclick="loadReleases()" style="width:100%;justify-content:center"><i class="ti ti-refresh"></i><span data-i18n="btn_check_upd"> Check for Updates</span></button><div id="upd-check-msg" style="margin-top:.75rem;font-size:12px;display:none"></div></div><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><p style="font-size:13px;font-weight:700;color:var(--navy);margin:0"><span data-i18n="lbl_avail_releases">Available Releases</span></p><span id="upd-badge" style="font-size:11px;font-weight:600;color:#888"><span data-i18n="txt_click_check">Click "Check for Updates" to load</span></span></div><div id="upd-releases-wrap"><div style="padding:2rem;text-align:center;color:#aaa;font-size:13px"><i class="ti ti-cloud-off" style="font-size:36px;display:block;margin-bottom:.75rem"></i><span data-i18n="txt_not_checked">Not checked yet</span></div></div></div></div></div>
      <!-- DATABASE -->
      <div id="section-database" class="hidden"><p class="section-title"><i class="ti ti-database" style="color:var(--gold)"></i> <span data-i18n="menu_database">SQLite Database Management</span></p><div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:1rem;margin-bottom:1rem"><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_sqlite_coll">SQLite Collections</span></p><div id="db-stats"></div></div><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_actions">Actions</span></p><div style="display:flex;flex-direction:column;gap:.75rem"><button class="btn btn-outline" onclick="exportDB()" style="justify-content:flex-start"><i class="ti ti-download"></i><span data-i18n="btn_export_db"> Export Full Database (JSON)</span></button><button class="btn btn-outline" onclick="document.getElementById('import-file').click()" style="justify-content:flex-start"><i class="ti ti-upload"></i><span data-i18n="btn_import_db"> Import Database (JSON)</span></button><input type="file" id="import-file" accept=".json" style="display:none" onchange="importDB(event)"><button class="btn btn-danger" onclick="clearDB()" style="justify-content:flex-start"><i class="ti ti-trash"></i><span data-i18n="btn_reset_db"> Reset Database</span></button></div><div id="db-action-msg" style="margin-top:.75rem;font-size:12px;display:none"></div></div><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_auto_backup">Auto Backup Config</span></p><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_backup_path">Backup Path (Local Path)</span></label><input id="backup-path" type="text" placeholder="C:\backups\wokmaneja\" data-i18n-placeholder="ph_backup_path"></div><div style="margin-bottom:.85rem"><label><span data-i18n="lbl_interval">Interval</span></label><select id="backup-interval"><option>Daily</option><option>Weekly</option><option>Hourly</option></select></div><div style="margin-bottom:1rem;display:flex;align-items:center;gap:.5rem"><input type="checkbox" id="backup-enabled" style="width:auto"><label for="backup-enabled" style="margin-bottom:0"><span data-i18n="lbl_enable_backup">Enable Auto Backup</span></label></div><div style="display:flex;gap:.5rem"><button class="btn btn-primary" onclick="saveBackupConfig()"><i class="ti ti-device-floppy"></i><span data-i18n="btn_save_config"> Save Config</span></button><button class="btn btn-outline" onclick="triggerManualBackup()"><i class="ti ti-database-export"></i><span data-i18n="btn_backup_now"> Backup Now</span></button></div><div id="backup-msg" style="margin-top:.75rem;font-size:12px;display:none"></div></div></div><div class="card"><p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><span data-i18n="lbl_live_db">Live Database Viewer</span></p><div style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap"><button class="btn btn-outline btn-sm" onclick="viewCollection('users')"><span data-i18n="btn_users">users</span></button><button class="btn btn-outline btn-sm" onclick="viewCollection('staff')"><span data-i18n="btn_staff">staff</span></button><button class="btn btn-outline btn-sm" onclick="viewCollection('payslips')"><span data-i18n="btn_payslips">payslips</span></button><button class="btn btn-outline btn-sm" onclick="viewCollection('hr_requests')"><span data-i18n="btn_hr_req">hr_requests</span></button><button class="btn btn-outline btn-sm" onclick="viewCollection('audit_logs')"><span data-i18n="btn_audit_logs">audit_logs</span></button></div><pre id="db-viewer" style="background:#1a1a1a;color:#4cff8a;padding:1rem;border-radius:8px;font-size:12px;overflow:auto;max-height:320px;line-height:1.6">// Select a collection above to view documents</pre></div></div>
      <!-- AUDIT LOGS -->
      <div id="section-audit" class="hidden"><p class="section-title"><i class="ti ti-history" style="color:var(--gold)"></i> <span data-i18n="menu_audit">Audit Logs</span></p><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><p style="font-size:13px;font-weight:700;color:var(--navy)"><span data-i18n="lbl_sys_activity">System Activity</span></p><button class="btn btn-sm btn-outline" onclick="renderAuditLogs()"><i class="ti ti-refresh"></i><span data-i18n="btn_refresh"> Refresh</span></button></div><div id="audit-table-wrap" style="overflow:auto;max-height:600px"></div></div></div>
      <!-- COMPANY SETTINGS -->
      <div id="section-company" class="hidden"><p class="section-title"><i class="ti ti-building" style="color:var(--gold)"></i> <span data-i18n="menu_company">Company Settings</span></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start"><div class="card"><div style="margin-bottom:1rem"><label><span data-i18n="lbl_company_name">Company Name</span></label><input type="text" id="cs-name" placeholder="Triple K Company" data-i18n-placeholder="ph_triple_k"></div><div style="margin-bottom:1rem"><label><span data-i18n="lbl_address">Address</span></label><input type="text" id="cs-address" placeholder="Port Vila, Vanuatu" data-i18n-placeholder="ph_port_vila"></div><div style="margin-bottom:1rem"><label><span data-i18n="lbl_phone">Phone Number</span></label><input type="text" id="cs-phone" placeholder="+678 12345" data-i18n-placeholder="ph_phone_12345"></div><div style="margin-bottom:1rem"><label><span data-i18n="lbl_email">Email Address</span></label><input type="email" id="cs-email" placeholder="info@triplek.vu" data-i18n-placeholder="ph_email_info"></div><div style="margin-bottom:1.5rem"><label><span data-i18n="lbl_bus_license">Business License</span></label><input type="text" id="cs-license" placeholder="e.g. BL-123456" data-i18n-placeholder="ph_bl_123456"></div><button class="btn btn-primary" onclick="saveCompanySettings()"><i class="ti ti-device-floppy"></i><span data-i18n="btn_save_settings"> Save Settings</span></button><div id="cs-msg" style="margin-top:.75rem;font-size:12px;color:#27500a;background:#ddf0dd;padding:7px 12px;border-radius:6px;display:none"></div></div><div class="card" style="border-top:4px solid #0a0a0a"><div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:2px solid #f0f0f0"><i class="ti ti-license" style="font-size:24px;color:#0a0a0a"></i><div><p style="font-size:14px;font-weight:800;color:#0a0a0a;margin:0"><span data-i18n="lbl_soft_license">Software License</span></p><p style="font-size:12px;color:#888;margin:0"><span data-i18n="lbl_wm_sys">WokManeja Payroll System</span></p></div></div><div id="lic-status-card" style="padding:10px 14px;border-radius:8px;margin-bottom:1.25rem;font-size:13px;font-weight:600"></div><div style="margin-bottom:1rem"><label><span data-i18n="lbl_license_key">License Key</span></label><input type="text" id="cs-appkey" placeholder="WM-XXXX-XXXX-XXXX" style="font-family:monospace;font-size:14px;letter-spacing:1px" oninput="this.value=this.value.toUpperCase()" data-i18n-placeholder="ph_wm_key"><p class="hint" style="margin-top:4px"><i class="ti ti-info-circle"></i><span data-i18n="txt_enter_key"> Enter your Monthly (WM-MTH...) or Yearly (WM-YR...) license key</span></p></div><button class="btn btn-primary" onclick="activateLicense()" style="width:100%;justify-content:center"><i class="ti ti-key"></i><span data-i18n="btn_activate_lic"> Activate License</span></button><div id="lic-msg" style="margin-top:.75rem;font-size:12px;padding:7px 12px;border-radius:6px;display:none"></div><hr style="margin:1.25rem 0;border:none;border-top:1px solid #eee"><p style="font-size:11px;color:#aaa;text-align:center"><span data-i18n="txt_need_lic">Need a license? Contact </span><a href="mailto:wokmaneja@gmail.com" style="color:#0a0a0a;font-weight:700">wokmaneja@gmail.com</a></p></div></div></div>
      <!-- ARCHIVE -->
      <div id="section-docs" class="hidden">
        <p class="section-title"><i class="ti ti-book" style="color:var(--gold)"></i> <span data-i18n="menu_docs">User Guides &amp; Documentation</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;padding-bottom:.85rem;border-bottom:2px solid #f0f0f0">
              <i class="ti ti-file-text" style="font-size:24px;color:var(--navy)"></i>
              <div>
                <p style="font-size:14px;font-weight:800;color:var(--navy);margin:0"><span data-i18n="lbl_ref_manual">Reference Manual</span></p>
                <p style="font-size:11px;color:#888;margin:0"><span data-i18n="lbl_comp_op">Complete Operations Handbook</span></p>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text2);margin-bottom:1.5rem"><span data-i18n="txt_covers_sys">Covers system architecture, security policies, and administrative details.</span></p>
            <a href="/WokManeja_User_Guide.pdf" target="_blank" class="btn btn-primary" style="text-decoration:none;display:inline-flex;width:100%;justify-content:center"><i class="ti ti-external-link"></i> Open PDF Guide</a>
          </div>
          <div class="card">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;padding-bottom:.85rem;border-bottom:2px solid #f0f0f0">
              <i class="ti ti-list-check" style="font-size:24px;color:var(--gold)"></i>
              <div>
                <p style="font-size:14px;font-weight:800;color:var(--navy);margin:0"><span data-i18n="lbl_how_to">How-To Use Guide</span></p>
                <p style="font-size:11px;color:#888;margin:0"><span data-i18n="lbl_step_tuto">Step-by-step Tutorial</span></p>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text2);margin-bottom:1.5rem"><span data-i18n="txt_learn_how">Learn how to manage staff, run payroll, and approve HR leave step-by-step.</span></p>
            <a href="/WokManeja_How_To_Use.pdf" target="_blank" class="btn btn-gold" style="text-decoration:none;display:inline-flex;width:100%;justify-content:center"><i class="ti ti-external-link"></i> Open PDF Tutorial</a>
          </div>
        </div>
      </div>
      <div id="section-archive" class="hidden"><p class="section-title"><i class="ti ti-trash" style="color:var(--gold)"></i> <span data-i18n="menu_archive">Trash Bin</span></p><div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><p style="font-size:13px;font-weight:700;color:var(--navy)"><span data-i18n="lbl_archived_records">Archived Records (Deleted automatically after 30 days)</span></p><button class="btn btn-sm btn-outline" onclick="renderArchiveTable()"><i class="ti ti-refresh"></i><span data-i18n="btn_refresh"> Refresh</span></button></div><div id="archive-table-wrap" style="overflow:auto;max-height:600px"></div></div></div>
      </div>
      <!-- App Footer -->
      <div style="position:sticky;bottom:0;z-index:10;background:#fff;border-top:1px solid #e0e0e0;padding:10px 1.75rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem">
        <p style="font-size:11px;color:#aaa;margin:0"><span data-i18n="txt_copyright">© 2026 WokManeja. All rights reserved.</span><br><span data-i18n="txt_support">Support: </span><a href="mailto:wokmaneja@gmail.com" style="color:#aaa;text-decoration:underline">wokmaneja@gmail.com</a></p>
        <div style="display:flex;align-items:center;gap:.5rem">
          <span style="font-size:10px;color:#999;white-space:nowrap"><span data-i18n="txt_designed_by">Designed &amp; Developed by WokManeja</span></span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PRINT OVERLAY -->
<div id="print-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:999;align-items:center;justify-content:center;padding:1rem">
  <div style="background:#fff;width:660px;max-height:92vh;overflow:auto;border-radius:14px;padding:2.25rem;color:#111;font-family:'Segoe UI',sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.4)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.75rem;padding-bottom:1.25rem;border-bottom:2px solid #0a0a0a">
      <div><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="height:60px;width:auto;border-radius:4px;display:block;margin-bottom:4px"><div id="pr-company-name" style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:2px"><span data-i18n="lbl_wokmaneja">WokManeja</span></div><div id="pr-company-address" style="font-size:11px;color:#111;font-weight:500"><span data-i18n="txt_po_box">PO BOX 3276, Shefa Province, Efate, Vanuatu</span></div></div>
      <div style="text-align:right"><div style="font-size:12px;color:#111;font-weight:700;text-transform:uppercase;letter-spacing:.5px"><span data-i18n="lbl_payslip">Payslip</span></div><div style="font-size:16px;font-weight:800;color:#0a0a0a" id="pr-monthyear"></div><div style="font-size:12px;color:#111;margin-top:2px" id="pr-period-range"></div><div style="font-size:11px;color:#111;margin-top:2px"><span data-i18n="lbl_pay_day_colon">Pay Day: </span><span id="pr-paydate" style="font-weight:600;color:#111"></span></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" id="pr-grid-top">
      <div style="background:#f8f9fb;border-radius:10px;padding:1rem"><div style="font-size:11px;color:#aaa;margin-bottom:.75rem;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:#111"><span data-i18n="lbl_emp_summary">Employee Summary</span></div><table style="font-size:13px;width:100%"><tbody><tr><td style="color:#333;font-weight:700;font-size:13px;padding:5px 10px 5px 0;width:130px"><span data-i18n="lbl_emp_name">Employee Name</span></td><td style="font-weight:800;font-size:13px;padding:5px 0" id="pr-name"></td></tr><tr><td style="color:#333;font-weight:700;font-size:13px;padding:5px 10px 5px 0"><span data-i18n="lbl_emp_id">Employee ID</span></td><td style="font-weight:700;font-size:13px;padding:5px 0" id="pr-id"></td></tr><tr><td style="color:#333;font-weight:700;font-size:13px;padding:5px 10px 5px 0"><span data-i18n="lbl_vnpf_num">VNPF Number</span></td><td style="font-weight:700;font-size:13px;padding:5px 0" id="pr-vnpf-num"></td></tr><tr><td style="color:#333;font-weight:700;font-size:13px;padding:5px 10px 5px 0"><span data-i18n="lbl_designation">Designation</span></td><td style="font-weight:700;font-size:13px;padding:5px 0" id="pr-desig"></td></tr><tr><td style="color:#333;font-weight:700;font-size:13px;padding:5px 10px 5px 0"><span data-i18n="lbl_department">Department</span></td><td style="font-weight:700;font-size:13px;padding:5px 0" id="pr-dept"></td></tr></tbody></table></div>
      <div style="background:#0a0a0a;border-radius:10px;padding:1.25rem;color:#fff"><div style="font-size:11px;color:#fff;font-weight:600;text-transform:uppercase;letter-spacing:.5px"><span data-i18n="lbl_net_payable">Net Payable Amount</span></div><div style="font-size:28px;font-weight:800;color:#6ee7b7;margin:6px 0" id="pr-net"></div><div style="font-size:12px;color:#fff"><span data-i18n="lbl_pay_cycle_colon">Pay Cycle: </span><span id="pr-cycle" style="font-weight:700;color:#fff"></span></div><div style="font-size:12px;color:#fff"><span data-i18n="lbl_paid_days_colon">Paid Days: </span><span id="pr-days" style="font-weight:700;color:#fff"></span></div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-bottom:0.85rem" id="pr-grid-earn">
      <div style="border:1px solid #eee;border-radius:10px;padding:1.1rem"><div style="font-weight:700;font-size:13px;margin-bottom:.85rem;padding-bottom:.6rem;border-bottom:2px solid #f0f0f0;color:#0a0a0a"><span data-i18n="lbl_earnings">Earnings</span></div><table style="width:100%;font-size:13px"><tbody><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_basic_pay">Basic Pay</span></td><td style="text-align:right;font-weight:600" id="pr-basic"></td></tr><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_overtime">Overtime</span></td><td style="text-align:right;font-weight:600" id="pr-overtime"></td></tr><tr id="pr-severance-row"><td style="padding:4px 0;color:#555"><span data-i18n="lbl_severance">Severance</span></td><td style="text-align:right;font-weight:600" id="pr-severance"></td></tr><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_allowances_n">Allowances</span></td><td style="text-align:right;font-weight:600" id="pr-allow"></td></tr><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_bonus_n">Bonus</span></td><td style="text-align:right;font-weight:600" id="pr-bonus"></td></tr></tbody></table><div style="border-top:2px solid #eee;margin-top:.6rem;padding-top:.6rem;display:flex;justify-content:space-between;font-weight:800;font-size:13px;color:#000000"><span><span data-i18n="lbl_total_earnings">Total Earnings</span></span><span id="pr-tearn"></span></div></div>
      <div style="border:1px solid #eee;border-radius:10px;padding:1.1rem"><div style="font-weight:700;font-size:13px;margin-bottom:.85rem;padding-bottom:.6rem;border-bottom:2px solid #f0f0f0;color:#0a0a0a"><span data-i18n="lbl_deductions">Deductions</span></div><table style="width:100%;font-size:13px"><tbody><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_vnpf_6">VNPF (6%)</span></td><td style="text-align:right;font-weight:600" id="pr-vnpf"></td></tr><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_staff_loan_n">Staff Loan</span></td><td style="text-align:right;font-weight:600" id="pr-loan"></td></tr><tr><td style="padding:4px 0;color:#555"><span data-i18n="lbl_others_n">Others</span><span id="pr-others-note-label" style="display:none;font-size:10px;color:#aaa;font-style:italic;display:block"></span></td><td style="text-align:right;font-weight:600" id="pr-others"></td></tr></tbody></table><div style="border-top:2px solid #eee;margin-top:.6rem;padding-top:.6rem;display:flex;justify-content:space-between;font-weight:800;font-size:13px;color:#a32d2d"><span><span data-i18n="lbl_total_deductions">Total Deductions</span></span><span id="pr-tded"></span></div></div>
    </div>
    <div style="background:#0a0a0a;border-radius:10px;padding:0.85rem 1.1rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem"><div><div style="font-weight:800;font-size:14px;color:#fff"><span data-i18n="lbl_total_net">TOTAL NET PAYABLE</span></div><div style="font-size:11px;color:#fff;margin-top:2px;opacity:.85"><span data-i18n="lbl_gross_minus_ded">Gross Earnings — Total Deductions</span></div></div><div style="font-size:24px;font-weight:800;color:#6ee7b7" id="pr-net2"></div></div>
    <!-- Confidentiality Notice -->
    <div style="margin-top:1rem;border-top:1px solid #e0e0e0;padding-top:.85rem">
      <div style="background:#f8f9fb;border:1px solid #dce3ee;border-radius:8px;padding:.85rem 1rem;margin-bottom:.85rem">
        <p style="font-size:10px;font-weight:800;color:#0a0a0a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px"><span data-i18n="lbl_confidential">🔒 Confidentiality Notice</span></p>
        <p style="font-size:10.5px;color:#444;line-height:1.7"><span data-i18n="txt_conf_notice">This payslip contains private and confidential information intended solely for the employee named above. Unauthorized use, disclosure, or distribution is strictly prohibited.</span></p>
        <p style="font-size:10px;font-weight:800;color:#0a0a0a;text-transform:uppercase;letter-spacing:.5px;margin-top:8px;margin-bottom:4px"><span data-i18n="lbl_emp_ack">✅ Employee Acknowledgment</span></p>
        <p style="font-size:10.5px;color:#444;line-height:1.7"><span data-i18n="txt_emp_ack">By receiving this payslip, the employee confirms that the information provided has been reviewed and is correct to the best of their knowledge, and agrees with the details of earnings and deductions.</span></p>
      </div>

      <!-- Employee Declaration & Signature -->
      <div style="border:1px solid #d0d8e8;border-radius:8px;padding:.85rem 1rem;margin-bottom:.85rem">
        <p style="font-size:10px;font-weight:800;color:#0a0a0a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px"><span data-i18n="lbl_emp_decl">✎ Employee Declaration</span></p>
        <p style="font-size:10.5px;color:#444;margin-bottom:12px;line-height:1.6"><span data-i18n="txt_emp_decl">I confirm that the details in this payslip are correct and agreed.</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:.5rem">
          <div>
            <p style="font-size:10px;color:#888;margin-bottom:4px;font-weight:600"><span data-i18n="lbl_emp_sig">Employee Signature</span></p>
            <div style="border-bottom:1.5px solid #333;height:28px;margin-bottom:2px"></div>
            <p style="font-size:9px;color:#bbb;text-align:center"><span data-i18n="lbl_signature">Signature</span></p>
          </div>
          <div>
            <p style="font-size:10px;color:#888;margin-bottom:4px;font-weight:600"><span data-i18n="lbl_date">Date</span></p>
            <div style="border-bottom:1.5px solid #333;height:28px;margin-bottom:2px"></div>
            <p style="font-size:9px;color:#bbb;text-align:center"><span data-i18n="ph_date">DD / MM / YYYY</span></p>
          </div>
        </div>
      </div>

      <!-- MeleTech credit + action buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem">
        
        <div style="display:flex;gap:.75rem">
          <button class="btn btn-outline" onclick="document.getElementById('print-overlay').style.display='none'"><i class="ti ti-x"></i><span data-i18n="btn_close"> Close</span></button>
          <button class="btn btn-primary" onclick="window.print()"><i class="ti ti-printer"></i><span data-i18n="btn_print"> Print</span></button>
        </div>
      </div>
    </div>
  </div>
</div>
</div>

<script>
var I18N_DICT = {
  "txt_0": { en: "0", fr: "0", zh: "0" },
  "lbl_username": { en: "Username", fr: "Nom d'utilisateur", zh: "用户名" },
  "ph_enter_username": { en: "Enter username", fr: "Entrez le nom d'utilisateur", zh: "输入用户名" },
  "lbl_password": { en: "Password", fr: "Mot de passe", zh: "密码" },
  "ph_enter_password": { en: "Enter password", fr: "Entrez le mot de passe", zh: "输入密码" },
  "msg_invalid_login": { en: "Invalid username or password.", fr: "Nom d'utilisateur ou mot de passe invalide.", zh: "用户名或密码无效。" },
  "btn_sign_in": { en: "Sign In", fr: "Se connecter", zh: "登录" },
  "txt_copyright": { en: "© 2026 WokManeja. All rights reserved.", fr: "© 2026 WokManeja. Tous droits réservés.", zh: "© 2026 WokManeja. 版权所有." },
  "txt_support": { en: "Support:", fr: "Assistance:", zh: "支持:" },
  "txt_wok": { en: "Wok", fr: "Wok", zh: "Wok" },
  "txt_maneja": { en: "Maneja", fr: "Maneja", zh: "Maneja" },
  "txt_system_desc": { en: "Payroll & HR Management System", fr: "Système de gestion de la paie et des RH", zh: "工资与人力资源管理系统" },
  "lbl_notifications": { en: "Notifications", fr: "Notifications", zh: "通知" },
  "btn_mark_read": { en: "Mark all read", fr: "Tout marquer comme lu", zh: "全部标为已读" },
  "txt_no_notif": { en: "No notifications", fr: "Aucune notification", zh: "没有通知" },
  "btn_dl_print": { en: "Download / Print", fr: "Télécharger / Imprimer", zh: "下载 / 打印" },
  "lbl_emp_summary": { en: "Employee Summary", fr: "Résumé de l'employé", zh: "员工摘要" },
  "lbl_designation": { en: "Designation", fr: "Désignation", zh: "职务" },
  "lbl_department": { en: "Department", fr: "Département", zh: "部门" },
  "lbl_pay_cycle": { en: "Pay Cycle", fr: "Cycle de paie", zh: "发薪周期" },
  "lbl_period_start": { en: "Period Start", fr: "Début de la période", zh: "周期开始" },
  "lbl_period_end": { en: "Period End", fr: "Fin de la période", zh: "周期结束" },
  "lbl_month": { en: "Month", fr: "Mois", zh: "月" },
  "lbl_year": { en: "Year", fr: "Année", zh: "年" },
  "lbl_net_payable": { en: "Net Payable Amount", fr: "Montant net à payer", zh: "应付净额" },
  "txt_vuv_0": { en: "VUV 0", fr: "VUV 0", zh: "VUV 0" },
  "lbl_pay_day_thurs": { en: "Pay Day (Thursday Pay Date)", fr: "Jour de paie (Jeudi)", zh: "发薪日 (周四)" },
  "lbl_paid_days": { en: "Paid Days", fr: "Jours payés", zh: "带薪天数" },
  "lbl_days": { en: "days", fr: "jours", zh: "天" },
  "btn_show_ot": { en: "Show Overtime Calculator", fr: "Afficher la calculatrice", zh: "显示加班计算器" },
  "lbl_ot_example": { en: "Overtime Example Calculation", fr: "Exemple de calcul des heures supp.", zh: "加班计算示例" },
  "lbl_type": { en: "Type", fr: "Type", zh: "类型" },
  "lbl_hours": { en: "Hours", fr: "Heures", zh: "小时" },
  "lbl_rate_mult": { en: "Rate Multiplier", fr: "Multiplicateur", zh: "费率倍数" },
  "lbl_formula": { en: "Formula", fr: "Formule", zh: "公式" },
  "lbl_amount": { en: "Amount", fr: "Montant", zh: "金额" },
  "lbl_weekday_ot": { en: "Weekday OT", fr: "Heures supp. en semaine", zh: "工作日加班" },
  "lbl_weekend_ot": { en: "Weekend OT", fr: "Heures supp. week-end", zh: "周末加班" },
  "lbl_public_holiday": { en: "Public Holiday", fr: "Jour férié", zh: "公共假期" },
  "txt_ot_help": { en: "Example based on hourly rate of VUV 454.55 (approx. VUV 100,000/month ÷ 220 working hours). Enter your calculated OT total in the field above.", fr: "Exemple basé sur un taux horaire de 454,55 VUV. Entrez le total dans le champ ci-dessus.", zh: "基于每小时454.55 VUV的示例。在上面的字段中输入计算的加班总额。" },
  "lbl_severance_pkg": { en: "Severance Package (VUV)", fr: "Indemnité de départ (VUV)", zh: "遣散费 (VUV)" },
  "btn_calc_sev": { en: "Calculate Severance", fr: "Calculer l'indemnité", zh: "计算遣散费" },
  "lbl_sev_calc": { en: "Severance Calculation", fr: "Calcul de l'indemnité", zh: "遣散费计算" },
  "lbl_monthly_remun": { en: "Monthly Remuneration", fr: "Rémunération mensuelle", zh: "月薪" },
  "lbl_vuv": { en: "VUV", fr: "VUV", zh: "VUV" },
  "lbl_yrs_service": { en: "Years of Service", fr: "Années de service", zh: "服务年限" },
  "ph_2_5": { en: "e.g. 2.5", fr: "ex. 2.5", zh: "例如 2.5" },
  "lbl_calculated": { en: "Calculated:", fr: "Calculé:", zh: "计算结果:" },
  "btn_apply_payslip": { en: "Apply to Payslip", fr: "Appliquer à la fiche", zh: "应用于工资单" },
  "txt_sev_formula": { en: "Formula: 1 month remuneration for each year of service.", fr: "Formule : 1 mois par année de service.", zh: "公式：服务每满一年发一个月薪水。" },
  "lbl_allowances": { en: "Allowances (VUV)", fr: "Allocations (VUV)", zh: "津贴 (VUV)" },
  "lbl_bonus": { en: "Bonus (VUV)", fr: "Prime (VUV)", zh: "奖金 (VUV)" },
  "lbl_total_earnings": { en: "Total Earnings", fr: "Gains totaux", zh: "总收入" },
  "lbl_deductions": { en: "Deductions", fr: "Déductions", zh: "扣除额" },
  "lbl_vnpf": { en: "VNPF — Vanuatu National Provident Fund (VUV)", fr: "VNPF — Fonds national de prévoyance", zh: "VNPF — 瓦努阿图国家公积金" },
  "txt_auto_6_percent": { en: "Auto: 6% of Basic Pay", fr: "Auto: 6% du salaire de base", zh: "自动：基本工资的6%" },
  "txt_auto_calc": { en: "Auto-calculated at 6% of Basic Pay", fr: "Calcul automatique à 6%", zh: "按基本工资的6%自动计算" },
  "lbl_staff_loan": { en: "Staff Loan (VUV)", fr: "Prêt au personnel (VUV)", zh: "员工贷款 (VUV)" },
  "lbl_others": { en: "Others (VUV)", fr: "Autres (VUV)", zh: "其他 (VUV)" },
  "lbl_note_ref": { en: "Note / Reference (e.g. Union Fee, Court Order, Overpayment...)", fr: "Note (ex: Frais syndicaux, etc.)", zh: "备注 (例如工会费，法院命令等)" },
  "ph_opt_desc": { en: "Optional — describe what this deduction is for", fr: "Optionnel — décrivez cette déduction", zh: "可选 — 描述此扣除的用途" },
  "lbl_total_deductions": { en: "Total Deductions", fr: "Déductions totales", zh: "总扣除额" },
  "btn_save_db": { en: "Save to Database", fr: "Enregistrer dans la base", zh: "保存到数据库" },
  "btn_reset": { en: "Reset", fr: "Réinitialiser", zh: "重置" },
  "msg_saved_db": { en: "Saved to SQLite Database.", fr: "Enregistré dans SQLite.", zh: "已保存到 SQLite 数据库。" },
  "lbl_global_pay_settings": { en: "Global Pay Period Settings", fr: "Paramètres globaux de la période", zh: "全局发薪期设置" },
  "lbl_pay_date": { en: "Pay Date", fr: "Date de paie", zh: "发薪日期" },
  "lbl_active_staff": { en: "Active Staff (", fr: "Personnel actif (", zh: "在职员工 (" },
  "btn_save_all": { en: "Save All to Database", fr: "Tout enregistrer", zh: "全部保存到数据库" },
  "btn_save": { en: "Save", fr: "Enregistrer", zh: "保存" },
  "btn_save_template": { en: "Save Template", fr: "Enregistrer le modèle", zh: "保存模板" },
      "lbl_recent_hr": { en: "Recent HR Requests", fr: "Demandes RH Récentes", zh: "最近人事请求" },
    "status_active": { en: "Active", fr: "Actif", zh: "在职" },
  "status_inactive": { en: "Inactive", fr: "Inactif", zh: "离职" },
  "status_pending": { en: "Pending", fr: "En attente", zh: "待处理" },
  "status_approved": { en: "Approved", fr: "Approuvé", zh: "已批准" },
  "status_rejected": { en: "Rejected", fr: "Rejeté", zh: "已拒绝" },
    "tbl_salary_banking": { en: "Salary Banking List", fr: "Liste Bancaire", zh: "工资银行列表" },
  "tbl_name_col": { en: "Name", fr: "Nom", zh: "姓名" },
  "tbl_bank_col": { en: "Bank", fr: "Banque", zh: "银行" },
  "tbl_account_col": { en: "Account", fr: "Compte", zh: "账号" },
  "tbl_amount_vt": { en: "Amount Vt", fr: "Montant Vt", zh: "金额 Vt" },
  "tbl_account_desc": { en: "To account description", fr: "Description", zh: "转账说明" },
  "tbl_transfer_priority": { en: "Transfer priority", fr: "Priorité", zh: "转账优先级" },
  "txt_standard": { en: "Standard", fr: "Standard", zh: "标准" },
  "txt_salary": { en: "Salary", fr: "Salaire", zh: "工资" },
    "txt_urgent": { en: "Urgent", fr: "Urgent", zh: "紧急" },
  "lbl_load_template": { en: "Load", fr: "Charger", zh: "加载" },
  "tbl_staff_member": { en: "Staff Member", fr: "Employé", zh: "员工" },
  "tbl_basic_hrs": { en: "Basic / Hrs", fr: "Base / Heures", zh: "基本/小时" },
  "tbl_overtime": { en: "Overtime", fr: "Heures suppl.", zh: "加班" },
  "tbl_allowances": { en: "Allowances", fr: "Indemnités", zh: "津贴" },
  "tbl_bonus": { en: "Bonus", fr: "Prime", zh: "奖金" },
  "tbl_vnpf_6": { en: "VNPF (6%)", fr: "VNPF (6%)", zh: "VNPF (6%)" },
  "tbl_loan_ded": { en: "Loan Ded.", fr: "Prêt (Déduc.)", zh: "贷款扣除" },
  "tbl_other_ded": { en: "Other Ded.", fr: "Autres (Déduc.)", zh: "其他扣除" },
  "tbl_net_pay": { en: "Net Pay", fr: "Salaire Net", zh: "实发工资" },
  "msg_no_active_staff": { en: "No active staff found.", fr: "Aucun employé actif trouvé.", zh: "未找到在职员工。" },
  "msg_no_payslips": { en: "No payslips yet.", fr: "Pas encore de fiche de paie.", zh: "暂无工资单。" },
  "msg_no_staff": { en: "No staff found.", fr: "Aucun employé trouvé.", zh: "未找到员工。" },
  "msg_no_requests": { en: "No requests yet.", fr: "Aucune demande pour l'instant.", zh: "暂无请求。" },
  "msg_no_records": { en: "No records found.", fr: "Aucun enregistrement trouvé.", zh: "未找到记录。" },
  "msg_no_leave_req": { en: "No leave requests yet.", fr: "Pas encore de demande de congé.", zh: "暂无请假记录。" },
  "msg_no_hr_req": { en: "No HR requests yet.", fr: "Pas de demandes RH pour le moment.", zh: "暂无人事请求。" },
  "msg_no_audit": { en: "No audit logs found.", fr: "Aucun journal d'audit trouvé.", zh: "未找到审计日志。" },
  "msg_trash_empty": { en: "Trash Bin is empty.", fr: "La corbeille est vide.", zh: "回收站为空。" },
  "msg_no_dept": { en: "No departments", fr: "Aucun département", zh: "无部门" },
  "msg_no_hr_rpt": { en: "No HR leave or advance requests for this period.", fr: "Aucune demande RH pour cette période.", zh: "此期间无请假或预支请求。" },
  "msg_no_staff_rpt": { en: "No staff records found.", fr: "Aucun dossier du personnel trouvé.", zh: "未找到员工记录。" },
  "tbl_staff": { en: "Staff", fr: "Employé", zh: "员工" },
  "tbl_id": { en: "ID", fr: "ID", zh: "ID" },
  "tbl_pay_date": { en: "Pay Date", fr: "Date de paiement", zh: "发薪日期" },
  "tbl_period": { en: "Period", fr: "Période", zh: "周期" },
  "tbl_earnings": { en: "Earnings", fr: "Revenus", zh: "收入" },
  "tbl_vnpf": { en: "VNPF", fr: "VNPF", zh: "VNPF" },
  "tbl_name": { en: "Name", fr: "Nom", zh: "姓名" },
  "tbl_designation": { en: "Designation", fr: "Désignation", zh: "职务" },
  "tbl_dept": { en: "Dept", fr: "Départ.", zh: "部门" },
  "tbl_pay_type": { en: "Pay Type", fr: "Type de paie", zh: "工资类型" },
  "tbl_annual_alloc": { en: "Annual<br>Allocated", fr: "Annuel<br>Alloué", zh: "年假<br>分配" },
  "tbl_annual_taken": { en: "Annual<br>Taken", fr: "Annuel<br>Pris", zh: "年假<br>已休" },
  "tbl_annual_left": { en: "Annual<br>Left", fr: "Annuel<br>Restant", zh: "年假<br>剩余" },
  "tbl_sick_alloc": { en: "Sick Leave<br>Allocated", fr: "Maladie<br>Alloué", zh: "病假<br>分配" },
  "tbl_sick_taken": { en: "Sick Leave<br>Taken", fr: "Maladie<br>Pris", zh: "病假<br>已休" },
  "tbl_sick_left": { en: "Sick Leave<br>Left", fr: "Maladie<br>Restant", zh: "病假<br>剩余" },
  "tbl_status": { en: "Status", fr: "Statut", zh: "状态" },
  "tbl_actions": { en: "Actions", fr: "Actions", zh: "操作" },
  "tbl_employee": { en: "Employee", fr: "Employé", zh: "员工" },
  "tbl_type": { en: "Type", fr: "Type", zh: "类型" },
  "tbl_start": { en: "Start", fr: "Début", zh: "开始" },
  "tbl_end": { en: "End", fr: "Fin", zh: "结束" },
  "tbl_days": { en: "Days", fr: "Jours", zh: "天数" },
  "tbl_amount": { en: "Amount", fr: "Montant", zh: "金额" },
  "tbl_annual_out": { en: "Annual Outstanding", fr: "Solde Annuel", zh: "年假结余" },
  "tbl_sick_out": { en: "Sick Outstanding", fr: "Solde Maladie", zh: "病假结余" },
  "tbl_username": { en: "Username", fr: "Nom d'utilisateur", zh: "用户名" },
  "tbl_role": { en: "Role", fr: "Rôle", zh: "角色" },
  "tbl_staff_name": { en: "Staff Name", fr: "Nom de l'employé", zh: "员工姓名" },
  "tbl_emp_id": { en: "Employee ID", fr: "ID Employé", zh: "员工号" },
  "tbl_payroll_period": { en: "Payroll Period", fr: "Période de paie", zh: "发薪周期" },
  "tbl_gross_pay": { en: "Gross Pay", fr: "Salaire Brut", zh: "税前工资" },
  "tbl_emp_6": { en: "Emp 6%", fr: "Emp 6%", zh: "员工 6%" },
  "tbl_employer_6": { en: "Employer 6%", fr: "Employeur 6%", zh: "雇主 6%" },
  "tbl_total_12": { en: "Total 12%", fr: "Total 12%", zh: "总计 12%" },
  "tbl_vnpf_number": { en: "VNPF Number", fr: "Numéro VNPF", zh: "VNPF号" },
  "tbl_total_12_amount": { en: "Total 12% Amount", fr: "Montant Total 12%", zh: "总计 12% 金额" },
  "tbl_bank_name": { en: "Bank Name", fr: "Nom de la Banque", zh: "银行名称" },
  "tbl_account_no": { en: "Account No.", fr: "Numéro de Compte", zh: "账号" },
  "tbl_collection": { en: "Collection", fr: "Collection", zh: "集合" },
  "tbl_documents": { en: "Documents", fr: "Documents", zh: "文档" },
  "tbl_description": { en: "Description", fr: "Description", zh: "描述" },
  "tbl_timestamp": { en: "Timestamp", fr: "Horodatage", zh: "时间戳" },
  "tbl_user": { en: "User", fr: "Utilisateur", zh: "用户" },
  "tbl_action": { en: "Action", fr: "Action", zh: "操作" },
  "tbl_details": { en: "Details", fr: "Détails", zh: "详情" },
  "tbl_deleted_at": { en: "Deleted At", fr: "Supprimé le", zh: "删除时间" },
  "tbl_original_coll": { en: "Original Collection", fr: "Collection d'origine", zh: "原集合" },
  "tbl_deleted_by": { en: "Deleted By", fr: "Supprimé par", zh: "删除者" },
  "tbl_expires_at": { en: "Expires At", fr: "Expire le", zh: "过期时间" },
  "btn_restore": { en: "Restore", fr: "Restaurer", zh: "恢复" },
  "btn_delete_forever": { en: "Delete Forever", fr: "Supprimer Définitivement", zh: "永久删除" },
  "lbl_recent_payslips": { en: "Recent Payslips", fr: "Dernières Fiches", zh: "最近工资单" },
  "txt_active_staff": { en: "Active Staff", fr: "Personnel Actif", zh: "在职员工" },
  "txt_payslips_db": { en: "Payslips in DB", fr: "Fiches dans la BD", zh: "数据库工资单" },
  "txt_total_net_payroll": { en: "Total Net Payroll", fr: "Paie Nette Totale", zh: "净工资总额" },
  "txt_total_vnpf": { en: "Total VNPF", fr: "Total VNPF", zh: "VNPF总额" },
  "txt_pending_hr": { en: "Pending HR Requests", fr: "Demandes RH en Attente", zh: "待处理人事请求" },
  "txt_advances_issued": { en: "Advances Issued", fr: "Avances Émises", zh: "已发预支款" },
  "msg_empty_dept": { en: "No departments", fr: "Aucun département", zh: "无部门" },
  "lbl_save_template_name": { en: "Save Template", fr: "Enregistrer le modèle", zh: "保存模板" },
  "lbl_template_name": { en: "Template Name", fr: "Nom du modèle", zh: "模板名称" },
  "ph_template_name": { en: "e.g. October Fixed Pay", fr: "ex. Paie fixe d'octobre", zh: "例如 十月份固定工资" },
  "msg_bulk_saved": { en: "Bulk Payslip Saved.", fr: "Fiches enregistrées en masse.", zh: "批量工资单已保存。" },
  "lbl_add_staff": { en: "Add New Staff", fr: "Ajouter un employé", zh: "添加新员工" },
  "lbl_full_name": { en: "Full Name", fr: "Nom complet", zh: "全名" },
  "ph_john_smith": { en: "e.g. John Smith", fr: "ex. John Smith", zh: "例如 John Smith" },
  "lbl_emp_id": { en: "Employee ID", fr: "ID de l'employé", zh: "员工ID" },
  "lbl_vnpf_num": { en: "VNPF Number", fr: "Numéro VNPF", zh: "VNPF号码" },
  "ph_vnpf_num": { en: "e.g. 123456", fr: "ex. 123456", zh: "例如 123456" },
  "txt_opt_vnpf": { en: "For reports", fr: "Pour les rapports", zh: "用于报告" },
  "lbl_auto_gen": { en: "(auto-generated)", fr: "(généré automatiquement)", zh: "(自动生成)" },
  "txt_next_id": { en: "Next available ID auto-filled", fr: "Prochain ID rempli auto.", zh: "自动填充下一个可用ID" },
  "lbl_job_title": { en: "Designation / Job Title", fr: "Titre du poste", zh: "职位 / 职称" },
  "ph_accountant": { en: "e.g. Accountant", fr: "ex. Comptable", zh: "例如 会计" },
  "btn_manage": { en: "Manage", fr: "Gérer", zh: "管理" },
  "lbl_email": { en: "Email Address", fr: "Adresse e-mail", zh: "电子邮件" },
  "ph_email": { en: "staff@email.com", fr: "staff@email.com", zh: "staff@email.com" },
  "lbl_phone": { en: "Phone Number", fr: "Numéro de téléphone", zh: "电话号码" },
  "ph_phone": { en: "+678 000000", fr: "+678 000000", zh: "+678 000000" },
  "lbl_hourly_rate": { en: "Hourly Rate (VUV)", fr: "Taux horaire (VUV)", zh: "时薪 (VUV)" },
  "ph_salaried": { en: "0 (Salaried)", fr: "0 (Salarié)", zh: "0 (月薪)" },
  "lbl_bank_name": { en: "Bank Name", fr: "Nom de la banque", zh: "银行名称" },
  "ph_bsp": { en: "e.g. BSP", fr: "ex. BSP", zh: "例如 BSP" },
  "lbl_account_num": { en: "Account Number", fr: "Numéro de compte", zh: "账号" },
  "ph_account": { en: "e.g. 12345678", fr: "ex. 12345678", zh: "例如 12345678" },
  "lbl_annual_leave": { en: "Annual Leave (days)", fr: "Congés annuels (jours)", zh: "年假 (天)" },
  "lbl_sick_leave": { en: "Sick Leave (days)", fr: "Congés maladie (jours)", zh: "病假 (天)" },
  "lbl_status": { en: "Status", fr: "Statut", zh: "状态" },
  "lbl_enable_portal": { en: "Enable Staff Portal Access", fr: "Activer l'accès au portail", zh: "启用员工门户访问" },
  "ph_jsmith": { en: "e.g. jsmith", fr: "ex. jsmith", zh: "例如 jsmith" },
  "ph_leave_blank": { en: "Leave blank to keep same", fr: "Laisser vide pour conserver", zh: "留空以保持不变" },
  "txt_create_user": { en: "Creates/Updates a user account with the 'Staff' role.", fr: "Crée/met à jour un compte utilisateur (rôle Staff).", zh: "创建/更新具有“员工”角色的用户帐户。" },
  "btn_save_staff": { en: "Save Staff", fr: "Enregistrer l'employé", zh: "保存员工" },
  "btn_clear": { en: "Clear", fr: "Effacer", zh: "清除" },
  "lbl_staff_dir": { en: "Staff Directory", fr: "Annuaire du personnel", zh: "员工目录" },
  "ph_search_staff": { en: "Search staff...", fr: "Rechercher...", zh: "搜索员工..." },
  "lbl_annual_l": { en: "Annual Leave", fr: "Congés annuels", zh: "年假" },
  "lbl_sick_l": { en: "Sick Leave", fr: "Congés maladie", zh: "病假" },
  "lbl_lwp": { en: "Leave Without Pay", fr: "Congé sans solde", zh: "无薪假" },
  "lbl_advances": { en: "Advances Issued", fr: "Avances émises", zh: "预支发放" },
  "lbl_submit_req": { en: "Submit Leave / Advance Request", fr: "Soumettre une demande", zh: "提交请假/预支申请" },
  "lbl_employee": { en: "Employee", fr: "Employé", zh: "员工" },
  "lbl_req_type": { en: "Request Type", fr: "Type de demande", zh: "申请类型" },
  "lbl_adv_amount": { en: "Advance Amount (VUV)", fr: "Montant de l'avance (VUV)", zh: "预支金额 (VUV)" },
  "lbl_start_date": { en: "Start Date", fr: "Date de début", zh: "开始日期" },
  "lbl_end_date": { en: "End Date", fr: "Date de fin", zh: "结束日期" },
  "lbl_reason": { en: "Reason / Notes", fr: "Motif / Notes", zh: "原因 / 备注" },
  "ph_reason": { en: "Enter reason here...", fr: "Entrez le motif ici...", zh: "在此输入原因..." },
  "btn_submit_req": { en: "Submit Request", fr: "Soumettre", zh: "提交申请" },
  "msg_saved": { en: "Saved.", fr: "Enregistré.", zh: "已保存。" },
  "lbl_recent_req": { en: "Recent Requests", fr: "Demandes récentes", zh: "最近申请" },
  "lbl_all_records": { en: "All Leave & Advance Records", fr: "Tous les enregistrements", zh: "所有请假与预支记录" },
  "lbl_add_user": { en: "Add New User", fr: "Ajouter un utilisateur", zh: "添加新用户" },
  "ph_full_name": { en: "Full name", fr: "Nom complet", zh: "全名" },
  "lbl_assign_role": { en: "Assign Role", fr: "Attribuer un rôle", zh: "分配角色" },
  "lbl_link_staff": { en: "Link to Staff Record", fr: "Lier au dossier", zh: "关联员工记录" },
  "txt_opt_hr": { en: "(optional — for HR leave tracking)", fr: "(optionnel — suivi RH)", zh: "(可选 — 用于人力资源请假跟踪)" },
  "txt_link_desc": { en: "Links this user to a staff record so they can view their own HR leave records", fr: "Lie cet utilisateur à un dossier pour afficher ses congés.", zh: "将此用户链接到员工记录，以便他们查看自己的请假记录" },
  "btn_add_user": { en: "Add User", fr: "Ajouter l'utilisateur", zh: "添加用户" },
  "btn_cancel": { en: "Cancel", fr: "Annuler", zh: "取消" },
  "msg_user_added": { en: "User added successfully.", fr: "Utilisateur ajouté.", zh: "用户添加成功。" },
  "lbl_users_roles": { en: "Users & Roles", fr: "Utilisateurs et rôles", zh: "用户与角色" },
  "lbl_admin": { en: "Admin", fr: "Admin", zh: "管理员" },
  "lbl_manager": { en: "Manager", fr: "Gérant", zh: "经理" },
  "lbl_it": { en: "IT", fr: "Informatique", zh: "IT" },
  "lbl_staff": { en: "Staff", fr: "Personnel", zh: "员工" },
  "btn_gen_payroll": { en: "Gen. Payroll Report", fr: "Rapport de paie", zh: "生成工资单报告" },
  "btn_pdf": { en: "PDF", fr: "PDF", zh: "PDF" },
  "btn_gen_vnpf": { en: "Gen. VNPF & Bank", fr: "Rapport VNPF & Banque", zh: "生成VNPF与银行报告" },
  "msg_gen_report": { en: "Generating report...", fr: "Génération du rapport...", zh: "正在生成报告..." },
  "lbl_wokmaneja": { en: "WokManeja", fr: "WokManeja", zh: "WokManeja" },
  "lbl_repo": { en: "wokmaneja/Payroll-HR-Management-System", fr: "wokmaneja/Payroll-HR-Management-System", zh: "wokmaneja/Payroll-HR-Management-System" },
  "lbl_installed_ver": { en: "Installed Version", fr: "Version installée", zh: "已安装版本" },
  "lbl_v100": { en: "v1.0.0", fr: "v1.0.0", zh: "v1.0.0" },
  "btn_check_upd": { en: "Check for Updates", fr: "Vérifier les MAJ", zh: "检查更新" },
  "lbl_avail_releases": { en: "Available Releases", fr: "Versions disponibles", zh: "可用版本" },
  "txt_click_check": { en: "Click \"Check for Updates\" to load", fr: "Cliquez pour charger", zh: "点击“检查更新”以加载" },
  "txt_not_checked": { en: "Not checked yet", fr: "Non vérifié", zh: "尚未检查" },
  "lbl_sqlite_coll": { en: "SQLite Collections", fr: "Collections SQLite", zh: "SQLite 集合" },
  "lbl_actions": { en: "Actions", fr: "Actions", zh: "操作" },
  "btn_export_db": { en: "Export Full Database (JSON)", fr: "Exporter la BD (JSON)", zh: "导出完整数据库 (JSON)" },
  "btn_import_db": { en: "Import Database (JSON)", fr: "Importer la BD (JSON)", zh: "导入数据库 (JSON)" },
  "btn_reset_db": { en: "Reset Database", fr: "Réinitialiser la BD", zh: "重置数据库" },
  "lbl_auto_backup": { en: "Auto Backup Config", fr: "Configuration de sauvegarde auto", zh: "自动备份配置" },
  "lbl_backup_path": { en: "Backup Path (Local Path)", fr: "Chemin de sauvegarde", zh: "备份路径 (本地路径)" },
  "ph_backup_path": { en: "C:\\backups\\wokmaneja\\", fr: "C:\\backups\\wokmaneja\\", zh: "C:\\backups\\wokmaneja\\" },
  "lbl_interval": { en: "Interval", fr: "Intervalle", zh: "间隔" },
  "lbl_enable_backup": { en: "Enable Auto Backup", fr: "Activer la sauvegarde", zh: "启用自动备份" },
  "btn_save_config": { en: "Save Config", fr: "Enregistrer config", zh: "保存配置" },
  "btn_backup_now": { en: "Backup Now", fr: "Sauvegarder mnt.", zh: "立即备份" },
  "lbl_live_db": { en: "Live Database Viewer", fr: "Visionneuse de BD en direct", zh: "实时数据库查看器" },
  "btn_users": { en: "users", fr: "users", zh: "users" },
  "btn_staff": { en: "staff", fr: "staff", zh: "staff" },
  "btn_payslips": { en: "payslips", fr: "payslips", zh: "payslips" },
  "btn_hr_req": { en: "hr_requests", fr: "hr_requests", zh: "hr_requests" },
  "btn_audit_logs": { en: "audit_logs", fr: "audit_logs", zh: "audit_logs" },
  "lbl_sys_activity": { en: "System Activity", fr: "Activité du système", zh: "系统活动" },
  "btn_refresh": { en: "Refresh", fr: "Actualiser", zh: "刷新" },
  "lbl_company_name": { en: "Company Name", fr: "Nom de la société", zh: "公司名称" },
  "ph_triple_k": { en: "Triple K Company", fr: "Triple K Company", zh: "Triple K Company" },
  "lbl_address": { en: "Address", fr: "Adresse", zh: "地址" },
  "ph_port_vila": { en: "Port Vila, Vanuatu", fr: "Port Vila, Vanuatu", zh: "Port Vila, Vanuatu" },
  "ph_phone_12345": { en: "+678 12345", fr: "+678 12345", zh: "+678 12345" },
  "ph_email_info": { en: "info@triplek.vu", fr: "info@triplek.vu", zh: "info@triplek.vu" },
  "lbl_bus_license": { en: "Business License", fr: "Licence commerciale", zh: "营业执照" },
  "ph_bl_123456": { en: "e.g. BL-123456", fr: "ex. BL-123456", zh: "例如 BL-123456" },
  "btn_save_settings": { en: "Save Settings", fr: "Enregistrer param.", zh: "保存设置" },
  "lbl_soft_license": { en: "Software License", fr: "Licence logicielle", zh: "软件许可" },
  "lbl_wm_sys": { en: "WokManeja Payroll System", fr: "Système WokManeja", zh: "WokManeja 工资系统" },
  "lbl_license_key": { en: "License Key", fr: "Clé de licence", zh: "许可证密钥" },
  "ph_wm_key": { en: "WM-XXXX-XXXX-XXXX", fr: "WM-XXXX-XXXX-XXXX", zh: "WM-XXXX-XXXX-XXXX" },
  "txt_enter_key": { en: "Enter your Monthly (WM-MTH...) or Yearly (WM-YR...) license key", fr: "Entrez votre clé mensuelle ou annuelle", zh: "输入您的月度或年度密钥" },
  "btn_activate_lic": { en: "Activate License", fr: "Activer licence", zh: "激活许可证" },
  "txt_need_lic": { en: "Need a license? Contact", fr: "Besoin d'une licence ? Contactez", zh: "需要许可证吗？联系" },
  "lbl_ref_manual": { en: "Reference Manual", fr: "Manuel de référence", zh: "参考手册" },
  "lbl_comp_op": { en: "Complete Operations Handbook", fr: "Manuel complet des opérations", zh: "完整操作手册" },
  "txt_covers_sys": { en: "Covers system architecture, security policies, and administrative details.", fr: "Couvre l'architecture et la sécurité.", zh: "涵盖系统架构，安全策略和管理细节。" },
  "lbl_how_to": { en: "How-To Use Guide", fr: "Guide d'utilisation", zh: "使用指南" },
  "lbl_step_tuto": { en: "Step-by-step Tutorial", fr: "Tutoriel pas à pas", zh: "分步教程" },
  "txt_learn_how": { en: "Learn how to manage staff, run payroll, and approve HR leave step-by-step.", fr: "Apprenez à gérer le personnel et la paie.", zh: "学习如何一步一步地管理员工，运行工资单和批准人力资源休假。" },
  "lbl_archived_records": { en: "Archived Records (Deleted automatically after 30 days)", fr: "Archives (Supprimées après 30 jours)", zh: "归档记录 (30天后自动删除)" },
  "txt_designed_by": { en: "Designed & Developed by WokManeja", fr: "Conçu et développé par WokManeja", zh: "由 WokManeja 设计与开发" },
  "txt_po_box": { en: "PO BOX 3276, Shefa Province, Efate, Vanuatu", fr: "PO BOX 3276, Province de Shefa, Éfaté, Vanuatu", zh: "PO BOX 3276, 埃法特岛, 瓦努阿图" },
  "lbl_payslip": { en: "Payslip", fr: "Fiche de paie", zh: "工资单" },
  "lbl_pay_day_colon": { en: "Pay Day:", fr: "Jour de paie :", zh: "发薪日 :" },
  "lbl_emp_name": { en: "Employee Name", fr: "Nom de l'employé", zh: "员工姓名" },
  "lbl_pay_cycle_colon": { en: "Pay Cycle:", fr: "Cycle de paie :", zh: "发薪周期 :" },
  "lbl_paid_days_colon": { en: "Paid Days:", fr: "Jours payés :", zh: "带薪天数 :" },
  "lbl_earnings": { en: "Earnings", fr: "Gains", zh: "收入" },
  "lbl_basic_pay": { en: "Basic Pay", fr: "Salaire de base", zh: "基本工资" },
  "lbl_overtime": { en: "Overtime", fr: "Heures supp.", zh: "加班费" },
  "lbl_severance": { en: "Severance", fr: "Indemnité", zh: "遣散费" },
  "lbl_allowances_n": { en: "Allowances", fr: "Allocations", zh: "津贴" },
  "lbl_bonus_n": { en: "Bonus", fr: "Prime", zh: "奖金" },
  "lbl_vnpf_6": { en: "VNPF (6%)", fr: "VNPF (6%)", zh: "VNPF (6%)" },
  "lbl_staff_loan_n": { en: "Staff Loan", fr: "Prêt au personnel", zh: "员工贷款" },
  "lbl_others_n": { en: "Others", fr: "Autres", zh: "其他" },
  "lbl_total_net": { en: "TOTAL NET PAYABLE", fr: "TOTAL NET À PAYER", zh: "应付净额总计" },
  "lbl_gross_minus_ded": { en: "Gross Earnings — Total Deductions", fr: "Gains bruts — Déductions totales", zh: "总收入 — 总扣除" },
  "lbl_confidential": { en: "🔒 Confidentiality Notice", fr: "🔒 Avis de confidentialité", zh: "🔒 保密通知" },
  "txt_conf_notice": { en: "This payslip contains private and confidential information intended solely for the employee named above. Unauthorized use, disclosure, or distribution is strictly prohibited.", fr: "Cette fiche de paie contient des informations confidentielles.", zh: "此工资单包含仅供上述员工使用的私人和机密信息。严禁未经授权的使用、披露或分发。" },
  "lbl_emp_ack": { en: "✅ Employee Acknowledgment", fr: "✅ Accusé de réception", zh: "✅ 员工确认" },
  "txt_emp_ack": { en: "By receiving this payslip, the employee confirms that the information provided has been reviewed and is correct to the best of their knowledge, and agrees with the details of earnings and deductions.", fr: "L'employé confirme l'exactitude des informations.", zh: "通过接收此工资单，员工确认所提供的信息已经过审核并在其所知范围内是正确的，并同意收入和扣除的详细信息。" },
  "lbl_emp_decl": { en: "✎ Employee Declaration", fr: "✎ Déclaration de l'employé", zh: "✎ 员工声明" },
  "txt_emp_decl": { en: "I confirm that the details in this payslip are correct and agreed.", fr: "Je confirme que les détails sont corrects.", zh: "我确认此工资单中的细节正确无误并同意。" },
  "lbl_emp_sig": { en: "Employee Signature", fr: "Signature de l'employé", zh: "员工签名" },
  "lbl_signature": { en: "Signature", fr: "Signature", zh: "签名" },
  "lbl_date": { en: "Date", fr: "Date", zh: "日期" },
  "ph_date": { en: "DD / MM / YYYY", fr: "JJ / MM / AAAA", zh: "日 / 月 / 年" },
  "btn_close": { en: "Close", fr: "Fermer", zh: "关闭" },
  "btn_print": { en: "Print", fr: "Imprimer", zh: "打印" },
  "lbl_manage_dept": { en: "Manage Departments", fr: "Gérer les départements", zh: "管理部门" },
  "ph_new_dept": { en: "New department name", fr: "Nouveau nom", zh: "新部门名称" },
  "btn_add": { en: "Add", fr: "Ajouter", zh: "添加" },
  "lbl_change_pwd": { en: "Change Password", fr: "Changer mot de passe", zh: "修改密码" },
  "lbl_curr_pwd": { en: "Current Password", fr: "Mot de passe actuel", zh: "当前密码" },
  "lbl_new_pwd": { en: "New Password", fr: "Nouveau mot de passe", zh: "新密码" },
  "lbl_confirm_pwd": { en: "Confirm New Password", fr: "Confirmer le mot de passe", zh: "确认新密码" },
  "btn_save_pwd": { en: "Save Password", fr: "Enregistrer mot de passe", zh: "保存密码" },
  "lbl_are_you_sure": { en: "Are you sure?", fr: "Êtes-vous sûr ?", zh: "你确定吗？" },
  "btn_yes_proceed": { en: "Yes, Proceed", fr: "Oui, Continuer", zh: "是的，继续" },

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
  "earnings": { en: "Earnings", fr: "Gains", zh: "收入" },
  "menu_dashboard": { en: "Dashboard", fr: "Tableau de bord", zh: "仪表板" },
  "menu_payslip": { en: "Create Payslip", fr: "Créer une fiche de paie", zh: "创建工资单" },
  "menu_bulk": { en: "Bulk Payslip", fr: "Fiche de paie en vrac", zh: "批量工资单" },
  "menu_records": { en: "Payslip Records", fr: "Registres de paie", zh: "工资单记录" },
  "menu_hr": { en: "Leave & Advance", fr: "Congés et Avances", zh: "请假与预支" },
  "menu_staff": { en: "Staff Management", fr: "Gestion du personnel", zh: "员工管理" },
  "menu_company": { en: "Company Settings", fr: "Paramètres de l'entreprise", zh: "公司设置" },
  "menu_users": { en: "User Management", fr: "Gestion des utilisateurs", zh: "用户管理" },
  "menu_roles": { en: "Roles & Permissions", fr: "Rôles et Permissions", zh: "角色与权限" },
  "menu_compliance": { en: "Compliance Report", fr: "Rapport de conformité", zh: "合规报告" },
  "menu_updates": { en: "App Updates", fr: "Mises à jour de l'app", zh: "应用更新" },
  "menu_database": { en: "Database Manager", fr: "Gestionnaire de base", zh: "数据库管理" },
  "menu_audit": { en: "Audit Logs", fr: "Journaux d'audit", zh: "审计日志" },
  "menu_archive": { en: "Trash Bin", fr: "Corbeille", zh: "回收站" },
  "menu_docs": { en: "User Guides", fr: "Guides d'utilisation", zh: "用户指南" },
  "nav_payroll": { en: "PAYROLL", fr: "PAIE", zh: "工资单" },
  "nav_hr": { en: "HR", fr: "RH", zh: "人力资源" },
  "nav_admin": { en: "ADMIN", fr: "ADMIN", zh: "管理" },
  "nav_reports": { en: "REPORTS", fr: "RAPPORTS", zh: "报告" },
  "nav_management": { en: "MANAGEMENT", fr: "GESTION", zh: "管理" },
  "nav_help": { en: "HELP", fr: "AIDE", zh: "帮助" },
  "language": { en: "Language", fr: "Langue", zh: "语言" }
};

function changeLang() {
  var lang = document.getElementById('lang-switcher').value;
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key = el.getAttribute('data-i18n');
    if (I18N_DICT[key] && I18N_DICT[key][lang]) {
      el.innerHTML = I18N_DICT[key][lang];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
    var key = el.getAttribute('data-i18n-placeholder');
    if (I18N_DICT[key] && I18N_DICT[key][lang]) {
      el.setAttribute('placeholder', I18N_DICT[key][lang]);
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

var MEMORY_DB = { users: [], staff: [], payslips: [], hr_requests: [], departments: [], audit_logs: [], settings: [], archive: [], bulk_templates: [] };
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
async function doLogin(){var u=document.getElementById('login-user').value.trim();var p=document.getElementById('login-pass').value.trim();try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});if(res.status===402||res.status===403){const errData=await res.json();showLicenseLockScreen(errData.error, errData.reason);return;}if(!res.ok){document.getElementById('login-error').style.display='block';return}const data=await res.json();document.getElementById('login-error').style.display='none';sessionStorage.setItem('api_token',data.token);sessionStorage.setItem('api_user',JSON.stringify(data.user));APP.currentUser=data.user;await DB.init();seedDB();updateDBIndicator();document.getElementById('page-login').classList.add('hidden');document.getElementById('page-main').classList.remove('hidden');document.getElementById('nav-username').textContent=data.user.name;document.getElementById('nav-badge').textContent=data.user.role.toUpperCase();document.getElementById('nav-badge').className='badge badge-'+data.user.role;buildNav(data.user.role);changeLang();renderNotifBadge();startNotifPolling();refreshDeptDropdown();resetIdleTimer();}catch(e){document.getElementById('login-error').style.display='block';}}
function doLogout(){stopNotifPolling();if(idleTimer)clearTimeout(idleTimer);APP.currentUser=null;sessionStorage.removeItem('api_token');sessionStorage.removeItem('api_user');document.getElementById('login-user').value='';document.getElementById('login-pass').value='';document.getElementById('page-main').classList.add('hidden');document.getElementById('page-login').classList.remove('hidden');}
function buildNav(role){var nav=document.getElementById('sidebar-nav');nav.innerHTML='';MENUS[role].forEach(function(item){if(item.divider){var d=document.createElement('div');d.className='nav-divider';d.innerHTML='<span data-i18n="nav_'+item.divider.toLowerCase()+'">'+item.divider+'</span>';nav.appendChild(d);return}var a=document.createElement('button');a.innerHTML='<i class="ti '+item.icon+'" style="font-size:15px"></i> <span data-i18n="menu_'+item.id+'">'+item.label+'</span>';a.style.cssText='display:flex;align-items:center;gap:9px;width:calc(100% - 16px);margin:1px 8px;text-align:left;justify-content:flex-start;border:none;border-radius:7px;font-size:13px;font-weight:500;padding:9px 12px;cursor:pointer;color:#444;background:transparent;font-family:inherit;transition:all .12s';a.onmouseover=function(){if(a.dataset.active!=='1')a.style.background='#f0f0f0'};a.onmouseout=function(){if(a.dataset.active!=='1')a.style.background='transparent'};a.onclick=function(){document.querySelectorAll('#sidebar-nav button').forEach(function(b){b.style.background='transparent';b.style.color='#444';b.style.fontWeight='500';b.dataset.active=''});a.style.background='#0a0a0a';a.style.color='#fff';a.style.fontWeight='700';a.dataset.active='1';showSection(item.id);if(item.id==='records')renderRecords();if(item.id==='staff'){renderStaffTable();setNextEmpId()}if(item.id==='users'){renderUsersTable();populateStaffLinkDropdown();}if(item.id==='dashboard')renderDashboard();if(item.id==='database')renderDBStats();if(item.id==='audit')renderAuditLogs();if(item.id==='company')renderCompanySettings();if(item.id==='archive')renderArchiveTable();if(item.id==='hr'){refreshHRStaffDropdown();renderHRTable();renderHRSummary()}if(item.id==='bulk'){renderBulkTable()}if(item.id==='updates'){loadVersionInfo();}};nav.appendChild(a);});nav.querySelector('button').click();}
var ALL_SECTIONS=['payslip','bulk','records','staff','hr','users','roles','compliance','dashboard','database','audit','company','archive','updates','docs'];
function showSection(id){ALL_SECTIONS.forEach(function(s){var el=document.getElementById('section-'+s);if(el)el.classList.add('hidden')});var target=document.getElementById('section-'+id);if(target)target.classList.remove('hidden');if(id==='payslip'){refreshStaffDropdown();setTodayPayDate()}if(id==='bulk'){setTodayBulkPayDate();renderBulkTemplates();}}
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
function renderBulkTable(){var wrap=document.getElementById('bp-table-wrap');var filter=(document.getElementById('bp-staff-filter')||{}).value||'All';var all=DB.findAll('staff',{status:'Active'});if(filter!=='All'){all=all.filter(function(s){return s.payCycle===filter||(filter==='Monthly'&&!s.payCycle)});}document.getElementById('bp-staff-count').textContent=all.length;if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem"><span data-i18n="msg_no_active_staff">No active staff found.</span></p>';return}var rows='';all.forEach(function(s){var isHourly=!!s.hourlyRate;var hrLabel=isHourly?'Hours':'Basic';var basicHtml=isHourly?'<input type="number" id="bp-hrs-'+s._id+'" style="width:70px;padding:4px" placeholder="Hrs" oninput="calcBulkRow(\''+s._id+'\')"/> <input type="hidden" id="bp-basic-'+s._id+'" value="0"/>':'<input type="number" id="bp-basic-'+s._id+'" style="width:90px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/>';var hrInfo=isHourly?'<div style="font-size:10px;color:#888;margin-top:2px">Rate: VUV '+s.hourlyRate+'/hr</div>':'';rows+='<tr>'+'<td style="font-weight:600;min-width:140px">'+s.name+'<br><span style="font-size:10px;color:#888">'+s.empid+'</span></td>'+'<td>'+basicHtml+hrInfo+'</td>'+'<td><input type="number" id="bp-ot-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-allow-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-bonus-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-vnpf-'+s._id+'" style="width:80px;padding:4px;background:#f9f9f9" readonly/></td>'+'<td><input type="number" id="bp-loan-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td><input type="number" id="bp-other-'+s._id+'" style="width:80px;padding:4px" placeholder="VUV" oninput="calcBulkRow(\''+s._id+'\')"/></td>'+'<td style="font-weight:700;color:var(--navy);background:#f0f7ff" id="bp-net-'+s._id+'">VUV 0</td>'+'</tr>'; setTimeout(translateUI, 10); });wrap.innerHTML='<table style="font-size:12px;white-space:nowrap"><thead><tr><th><span data-i18n="tbl_staff_member">Staff Member</span></th><th><span data-i18n="tbl_basic_hrs">Basic / Hrs</span></th><th><span data-i18n="tbl_overtime">Overtime</span></th><th><span data-i18n="tbl_allowances">Allowances</span></th><th><span data-i18n="tbl_bonus">Bonus</span></th><th><span data-i18n="tbl_vnpf_6">VNPF (6%)</span></th><th><span data-i18n="tbl_loan_ded">Loan Ded.</span></th><th><span data-i18n="tbl_other_ded">Other Ded.</span></th><th style="background:#e8f4fd;color:#1565c0"><span data-i18n="tbl_net_pay">Net Pay</span></th></tr></thead><tbody>'+rows+'</tbody></table>';}
function calcBulkRow(staffId){var s=DB.findOne('staff',{_id:staffId});var isHourly=!!s.hourlyRate;var basic=0;if(isHourly){var hrs=parseFloat(document.getElementById('bp-hrs-'+staffId).value)||0;basic=hrs*s.hourlyRate;document.getElementById('bp-basic-'+staffId).value=basic;}else{basic=parseFloat(document.getElementById('bp-basic-'+staffId).value)||0;}var o=parseFloat(document.getElementById('bp-ot-'+staffId).value)||0;var a=parseFloat(document.getElementById('bp-allow-'+staffId).value)||0;var bon=parseFloat(document.getElementById('bp-bonus-'+staffId).value)||0;var vnpf=Math.round(basic*0.06);document.getElementById('bp-vnpf-'+staffId).value=vnpf;var l=parseFloat(document.getElementById('bp-loan-'+staffId).value)||0;var d=parseFloat(document.getElementById('bp-other-'+staffId).value)||0;var net=basic+o+a+bon-vnpf-l-d;document.getElementById('bp-net-'+staffId).textContent=vuvFmt(net);}
function saveBulkPayroll(){var cycle=document.getElementById('bp-paycycle').value;var pDate=document.getElementById('bp-paydate').value;if(!pDate){alert('Please set a Pay Date.');return}var pStart=(cycle==='Fortnightly'||cycle==='Weekly')?document.getElementById('bp-period-start').value:'';var pEnd=(cycle==='Fortnightly'||cycle==='Weekly')?document.getElementById('bp-period-end').value:'';var pMonth=cycle==='Monthly'?document.getElementById('bp-month').value:MONTHS[new Date(pDate+'T00:00:00').getMonth()];var pYear=cycle==='Monthly'?document.getElementById('bp-year').value:new Date(pDate+'T00:00:00').getFullYear();var pdays=cycle==='Monthly'?new Date(pYear,MONTHS.indexOf(pMonth)+1,0).getDate():(cycle==='Weekly'?7:14);var tdays=pdays;var all=DB.findAll('staff',{status:'Active'});var count=0;all.forEach(function(s){var basic=parseFloat(document.getElementById('bp-basic-'+s._id).value)||0;if(basic>0){var o=parseFloat(document.getElementById('bp-ot-'+s._id).value)||0;var a=parseFloat(document.getElementById('bp-allow-'+s._id).value)||0;var bon=parseFloat(document.getElementById('bp-bonus-'+s._id).value)||0;var vnpf=Math.round(basic*0.06);var l=parseFloat(document.getElementById('bp-loan-'+s._id).value)||0;var d=parseFloat(document.getElementById('bp-other-'+s._id).value)||0;var earn=basic+o+a+bon;var ded=vnpf+l+d;DB.insert('payslips',{staffId:s._id,staff:s.name,empid:s.empid,designation:s.designation,department:s.department,month:pMonth,year:pYear,paydate:pDate,paycycle:cycle.toLowerCase(),periodStart:pStart,periodEnd:pEnd,paiddays:pdays,totaldays:tdays,basic:basic,overtime:o,allowances:a,bonus:bon,vnpf:vnpf,loan:l,others:d,othersNote:'Bulk Payslip',totalEarn:earn,totalDed:ded,net:earn-ded,createdBy:APP.currentUser.username});count++;}});if(count>0){var m=document.getElementById('bp-save-msg');m.style.display='inline-flex';setTimeout(function(){m.style.display='none';renderBulkTable();},3000);}else{alert('No payslips generated. Please enter at least basic pay/hours for staff.');}}
function renderBulkTemplates(){var wrap=document.getElementById('bp-template-select');if(!wrap)return;var html='<option value="">-- Templates --</option>';var all=DB.findAll('bulk_templates');all.forEach(function(t){html+='<option value="'+t._id+'">'+t.name+'</option>'});wrap.innerHTML=html;}
function saveBulkTemplate(){document.getElementById('modal-template').style.display='flex';document.getElementById('bp-template-name').value='';document.getElementById('bp-template-name').focus();}
function confirmSaveBulkTemplate(){var name=document.getElementById('bp-template-name').value.trim();if(!name){alert('Please enter a name.');return}var data={};var all=DB.findAll('staff',{status:'Active'});var hasData=false;all.forEach(function(s){var basic=parseFloat(document.getElementById('bp-basic-'+s._id).value)||0;var o=parseFloat(document.getElementById('bp-ot-'+s._id).value)||0;var a=parseFloat(document.getElementById('bp-allow-'+s._id).value)||0;var bon=parseFloat(document.getElementById('bp-bonus-'+s._id).value)||0;var l=parseFloat(document.getElementById('bp-loan-'+s._id).value)||0;var d=parseFloat(document.getElementById('bp-other-'+s._id).value)||0;if(basic>0||o>0||a>0||bon>0||l>0||d>0){data[s._id]={basic:basic,ot:o,allow:a,bonus:bon,loan:l,other:d};hasData=true}});if(!hasData){alert('No input data found to save in template.');return}DB.insert('bulk_templates',{name:name,data:data});renderBulkTemplates();document.getElementById('modal-template').style.display='none';var m=document.getElementById('bp-save-msg');m.innerHTML='<i class="ti ti-check"></i> Template Saved.';m.style.display='inline-flex';setTimeout(function(){m.style.display='none';m.innerHTML='<i class="ti ti-check"></i> <span data-i18n="msg_bulk_saved"> Bulk Payslip Saved.</span>';translateUI();},3000);}
function loadBulkTemplate(){var tid=document.getElementById('bp-template-select').value;if(!tid)return;var t=DB.findOne('bulk_templates',{_id:tid});if(!t)return;var data=t.data;for(var sid in data){if(document.getElementById('bp-basic-'+sid)){document.getElementById('bp-basic-'+sid).value=data[sid].basic||'';document.getElementById('bp-ot-'+sid).value=data[sid].ot||'';document.getElementById('bp-allow-'+sid).value=data[sid].allow||'';document.getElementById('bp-bonus-'+sid).value=data[sid].bonus||'';document.getElementById('bp-loan-'+sid).value=data[sid].loan||'';document.getElementById('bp-other-'+sid).value=data[sid].other||'';calcBulkRow(sid)}}var m=document.getElementById('bp-save-msg');m.innerHTML='<i class="ti ti-check"></i> Template Loaded.';m.style.display='inline-flex';setTimeout(function(){m.style.display='none';m.innerHTML='<i class="ti ti-check"></i> <span data-i18n="msg_bulk_saved"> Bulk Payslip Saved.</span>';translateUI();},3000);}
function resetPayslip(){['ps-staff','ps-empid','ps-designation','ps-department','earn-hourly-rate','earn-hours','earn-basic','earn-overtime','earn-severance','earn-allowances','earn-bonus','ded-loan','ded-others','ded-others-note','ps-period-start','ps-period-end'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=''});document.getElementById('ded-vnpf').value='';var lbl=document.getElementById('ps-period-label');if(lbl)lbl.style.display='none';var info=document.getElementById('ps-paydate-info');if(info)info.style.display='none';document.getElementById('earn-type').value='fixed';onPayTypeChange();calcPayslip();}
function fillPrintOverlay(p){var pr=getPeriodRange(p);var cyc=(p.paycycle||'monthly').toLowerCase();var startFmt=fmtDate(pr.start,{day:'2-digit',month:'long',year:'numeric'});var endFmt=fmtDate(pr.end,{day:'2-digit',month:'long',year:'numeric'});var pdFmt=p.paydate?new Date(p.paydate+'T00:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}):'';var heading=(cyc==='fortnightly'?'Fortnightly':(cyc==='weekly'?'Weekly':'Monthly'))+' Pay – '+p.month+' '+p.year;if(cyc==='monthly') heading=p.month+' '+p.year;document.getElementById('pr-monthyear').textContent=heading;var prEl=document.getElementById('pr-period-range');if(prEl)prEl.textContent=(startFmt&&endFmt)?startFmt+' – '+endFmt:'';document.getElementById('pr-paydate').textContent=pdFmt;var cyEl=document.getElementById('pr-cycle');if(cyEl)cyEl.textContent=cyc==='fortnightly'?'Fortnightly':(cyc==='weekly'?'Weekly':'Monthly');document.getElementById('pr-name').textContent=p.staff;document.getElementById('pr-id').textContent=p.empid;var sRec=DB.findOne('staff',{empid:p.empid});var vnpfNum=sRec&&sRec.vnpfNumber?sRec.vnpfNumber:'N/A';if(document.getElementById('pr-vnpf-num')){document.getElementById('pr-vnpf-num').textContent=vnpfNum;}document.getElementById('pr-desig').textContent=p.designation;document.getElementById('pr-dept').textContent=p.department||'';document.getElementById('pr-net').textContent=vuvFmt(p.net);document.getElementById('pr-net2').textContent=vuvFmt(p.net);document.getElementById('pr-days').textContent=p.paiddays+' / '+p.totaldays;document.getElementById('pr-basic').textContent=vuvFmt(p.basic);document.getElementById('pr-overtime').textContent=vuvFmt(p.overtime);if(document.getElementById('pr-severance-row')){document.getElementById('pr-severance-row').style.display=(p.severance&&p.severance>0)?'table-row':'none';}if(document.getElementById('pr-severance')){document.getElementById('pr-severance').textContent=vuvFmt(p.severance||0);}document.getElementById('pr-allow').textContent=vuvFmt(p.allowances);if(document.getElementById('pr-bonus'))document.getElementById('pr-bonus').textContent=vuvFmt(p.bonus||0);document.getElementById('pr-tearn').textContent=vuvFmt(p.totalEarn);document.getElementById('pr-vnpf').textContent=vuvFmt(p.vnpf);document.getElementById('pr-loan').textContent=vuvFmt(p.loan);document.getElementById('pr-others').textContent=vuvFmt(p.others);document.getElementById('pr-tded').textContent=vuvFmt(p.totalDed);var noteEl=document.getElementById('pr-others-note-label');if(noteEl){noteEl.textContent=p.othersNote?'('+p.othersNote+')':'';noteEl.style.display=p.othersNote?'block':'none';}var s=DB.findOne('settings',{_id:'company'});if(s){if(s.name)document.getElementById('pr-company-name').textContent=s.name;if(s.address)document.getElementById('pr-company-address').textContent=s.address;}document.getElementById('print-overlay').style.display='flex';}
function printPayslip(){var staffId=document.getElementById('ps-staff').value;if(!staffId){alert('Please select a staff member first.');return}var b=parseFloat(document.getElementById('earn-basic').value)||0;var o=parseFloat(document.getElementById('earn-overtime').value)||0;var sev=parseFloat(document.getElementById('earn-severance').value)||0;var a=parseFloat(document.getElementById('earn-allowances').value)||0;var bon=parseFloat(document.getElementById('earn-bonus').value)||0;var vnpf=Math.round(b*0.06);var l=parseFloat(document.getElementById('ded-loan').value)||0;var d=parseFloat(document.getElementById('ded-others').value)||0;var earn=b+o+sev+a+bon;var ded=vnpf+l+d;var cycle=document.getElementById('ps-paycycle').value;var pStart=document.getElementById('ps-period-start')?document.getElementById('ps-period-start').value:'';var pEnd=document.getElementById('ps-period-end')?document.getElementById('ps-period-end').value:'';var sel=document.getElementById('ps-staff');var staffName=sel.options[sel.selectedIndex].textContent;var rec={staff:staffName,empid:document.getElementById('ps-empid').value,designation:document.getElementById('ps-designation').value,department:document.getElementById('ps-department').value,month:document.getElementById('ps-month').value,year:document.getElementById('ps-year').value,paydate:document.getElementById('ps-paydate').value,paycycle:cycle,periodStart:pStart,periodEnd:pEnd,paiddays:document.getElementById('ps-paiddays').value,totaldays:document.getElementById('ps-totaldays').value,basic:b,overtime:o,allowances:a,severance:sev,bonus:bon,vnpf:vnpf,loan:l,others:d,othersNote:document.getElementById('ded-others-note').value.trim(),totalEarn:earn,totalDed:ded,net:earn-ded};fillPrintOverlay(rec);}
function viewPayslip(id){var p=DB.findOne('payslips',{_id:id});if(!p)return;fillPrintOverlay(p);}
function deletePayslip(id){customConfirm('Delete this payslip?', function(){ DB.remove('payslips',{_id:id});renderRecords(); });}
function renderRecords(){var wrap=document.getElementById('records-list');var role=APP.currentUser.role;var list=getUserPayslips();if(!list.length){wrap.innerHTML='<div class="card" style="text-align:center;color:#888;padding:2.5rem"><i class="ti ti-inbox" style="font-size:36px;display:block;margin-bottom:.5rem;opacity:.3"></i><span data-i18n="msg_no_payslips">No payslips yet.</span></div>';return; setTimeout(translateUI, 10); }var rows='';list.slice().reverse().forEach(function(p,idx){var pdFmt=p.paydate?fmtDate(p.paydate):'--';var cyc=(p.paycycle||'monthly').toLowerCase();var pr=getPeriodRange(p);var startFmt=pr.start?fmtDate(pr.start):'';var endFmt=pr.end?fmtDate(pr.end):'';var periodCell='';if(cyc==='fortnightly'||cyc==='weekly'){periodCell='<td style="white-space:nowrap;font-size:12px;line-height:1.8"><span class="period-badge">'+(cyc==='weekly'?'WEEKLY':'FORTNIGHT')+'</span><br>'+startFmt+' &ndash; '+endFmt+'</td>';}else{periodCell='<td style="white-space:nowrap;font-size:13px">'+(startFmt&&endFmt?startFmt+' &ndash; '+endFmt:p.month+' '+p.year)+'</td>';}var eid='rec'+idx;REC_ID_MAP[eid]=p._id;var delBtn=(role==='admin'||role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deletePayslip(REC_ID_MAP.'+eid+')" title="Delete"><i class="ti ti-trash"></i></button>':'';rows+=''+'<tr>'+'<td style="font-weight:600">'+p.staff+'</td>'+'<td style="color:#888">'+p.empid+'</td>'+'<td style="white-space:nowrap">'+pdFmt+'</td>'+periodCell+'<td>'+vuvFmt(p.totalEarn)+'</td>'+'<td style="color:#3b6d11;font-weight:600">'+vuvFmt(p.vnpf)+'</td>'+'<td style="font-weight:700;color:#000000">'+vuvFmt(p.net)+'</td>'+'<td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="viewPayslip(REC_ID_MAP.'+eid+')" title="View"><i class="ti ti-eye"></i></button> '+delBtn+'</td>'+'</tr>';});wrap.innerHTML='<div class="card" style="overflow:auto"><table><thead><tr><th><span data-i18n="tbl_staff">Staff</span></th><th><span data-i18n="tbl_id">ID</span></th><th><span data-i18n="tbl_pay_date">Pay Date</span></th><th><span data-i18n="tbl_period">Period</span></th><th><span data-i18n="tbl_earnings">Earnings</span></th><th><span data-i18n="tbl_vnpf">VNPF</span></th><th><span data-i18n="tbl_net_pay">Net Pay</span></th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function getLeaveStats(staffId){var s=DB.findOne('staff',{_id:staffId});if(!s)return{annualAlloc:0,annualTaken:0,annualLeft:0,sickAlloc:0,sickTaken:0,sickLeft:0};var annualAlloc=parseInt(s.annualLeave)||21;var sickAlloc=parseInt(s.sickLeave)||10;var approved=DB.findAll('hr_requests').filter(function(r){return r.staffId===staffId&&r.status==='Approved'});var annualTaken=approved.filter(function(r){return r.type==='Annual Leave'}).reduce(function(t,r){return t+(parseInt(r.days)||0)},0);var sickTaken=approved.filter(function(r){return r.type==='Sick Leave'}).reduce(function(t,r){return t+(parseInt(r.days)||0)},0);return{annualAlloc:annualAlloc,annualTaken:annualTaken,annualLeft:Math.max(0,annualAlloc-annualTaken),sickAlloc:sickAlloc,sickTaken:sickTaken,sickLeft:Math.max(0,sickAlloc-sickTaken)};}
function getNextEmpId(){var nums=DB.findAll('staff').map(function(s){var m=s.empid.match(/EMP(\d+)/i);return m?parseInt(m[1]):0});var next=nums.length?Math.max.apply(null,nums)+1:1;return'EMP'+String(next).padStart(3,'0')}
function setNextEmpId(){if(APP.editingStaffIdx===-1)document.getElementById('sf-id').value=getNextEmpId()}
function renderStaffTable(){var wrap=document.getElementById('staff-table-wrap');var search=(document.getElementById('staff-search')||{}).value||'';var all=DB.findAll('staff').filter(function(s){return!search||s.name.toLowerCase().includes(search.toLowerCase())||s.empid.toLowerCase().includes(search.toLowerCase())||s.department.toLowerCase().includes(search.toLowerCase())});if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem"><span data-i18n="msg_no_staff">No staff found.</span></p>';return}var rows='';all.forEach(function(s,idx){var sc=s.status==='Active'?'pill-active':'pill-inactive';var ls=getLeaveStats(s._id);var aCol=ls.annualLeft<=0?'color:#dc2626':ls.annualLeft<=5?'color:#f59e0b':'color:#16a34a';var sCol=ls.sickLeft<=0?'color:#dc2626':ls.sickLeft<=2?'color:#f59e0b':'color:#16a34a';var eid='stf'+idx;STAFF_ID_MAP[eid]=s._id;var hrStr=s.hourlyRate?'VUV '+s.hourlyRate+'/hr':'Salaried';var cycleStr=s.payCycle||'Monthly';var delBtn=(APP.currentUser.role==='admin'||APP.currentUser.role==='manager')?'<button class="btn btn-danger btn-sm" onclick="deleteStaff(STAFF_ID_MAP.stf'+idx+')" title="Delete"><i class="ti ti-trash"></i></button>':'';rows+=''+'<tr>'+'<td style="font-weight:600">'+s.name+'</td>'+'<td style="color:#888">'+s.empid+'</td>'+'<td>'+s.designation+'</td>'+'<td>'+s.department+'</td>'+'<td><span style="background:#f0f7ff;color:#000000;padding:2px 6px;border-radius:4px;font-size:11px;display:block;margin-bottom:2px">'+hrStr+'</span><span style="background:#f3e8ff;color:#6b21a8;padding:2px 6px;border-radius:4px;font-size:10px;display:block;text-align:center">'+cycleStr+'</span></td>'+'<td style="background:#f0f8ff;text-align:center">'+ls.annualAlloc+' Days</td>'+'<td style="background:#f0f8ff;text-align:center;color:#1565c0;font-weight:600">'+ls.annualTaken+' Days</td>'+'<td style="background:#f0f8ff;text-align:center;font-weight:700;'+aCol+'">'+ls.annualLeft+' Days</td>'+'<td style="background:#fff5f5;text-align:center">'+ls.sickAlloc+' Days</td>'+'<td style="background:#fff5f5;text-align:center;color:#c62828;font-weight:600">'+ls.sickTaken+' Days</td>'+'<td style="background:#fff5f5;text-align:center;font-weight:700;'+sCol+'">'+ls.sickLeft+' Days</td>'+'<td><span class="status-pill '+sc+'">'+s.status+'</span></td>'+'<td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="editStaff(STAFF_ID_MAP.stf'+idx+')" title="Edit"><i class="ti ti-edit"></i></button> '+delBtn+'</td>'+'</tr>'; setTimeout(translateUI, 10); });wrap.innerHTML='<div style="overflow:auto"><table><thead><tr><th><span data-i18n="tbl_name">Name</span></th><th><span data-i18n="tbl_id">ID</span></th><th><span data-i18n="tbl_designation">Designation</span></th><th><span data-i18n="tbl_dept">Dept</span></th><th><span data-i18n="tbl_pay_type">Pay Type</span></th><th style="background:#e8f4fd;color:#1565c0;text-align:center"><span data-i18n="tbl_annual_alloc">Annual<br>Allocated</span></th><th style="background:#e8f4fd;color:#1565c0;text-align:center"><span data-i18n="tbl_annual_taken">Annual<br>Taken</span></th><th style="background:#e8f4fd;color:#1565c0;text-align:center"><span data-i18n="tbl_annual_left">Annual<br>Left</span></th><th style="background:#fde8e8;color:#c62828;text-align:center"><span data-i18n="tbl_sick_alloc">Sick Leave<br>Allocated</span></th><th style="background:#fde8e8;color:#c62828;text-align:center"><span data-i18n="tbl_sick_taken">Sick Leave<br>Taken</span></th><th style="background:#fde8e8;color:#c62828;text-align:center"><span data-i18n="tbl_sick_left">Sick Leave<br>Left</span></th><th><span data-i18n="tbl_status">Status</span></th><th><span data-i18n="tbl_actions">Actions</span></th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function clearStaffForm(){document.getElementById('sf-name').value='';setNextEmpId();document.getElementById('sf-vnpf').value='';document.getElementById('sf-designation').value='';document.getElementById('sf-department').value='';document.getElementById('sf-email').value='';document.getElementById('sf-phone').value='';document.getElementById('sf-hourly').value='';document.getElementById('sf-bank').value='';document.getElementById('sf-account').value='';document.getElementById('sf-annual').value='21';document.getElementById('sf-sick').value='10';document.getElementById('sf-status').value='Active';document.getElementById('sf-paycycle').value='Monthly';document.getElementById('sf-create-user').checked=false;document.getElementById('sf-user-fields').style.display='none';document.getElementById('sf-username').value='';document.getElementById('sf-password').value='';APP.editingStaffIdx=-1;document.getElementById('staff-form-title').textContent='Add New Staff';}
function saveStaff(){var n=document.getElementById('sf-name').value.trim();var id=document.getElementById('sf-id').value.trim();var vnpfNum=document.getElementById('sf-vnpf').value.trim();var dsg=document.getElementById('sf-designation').value.trim();var dep=document.getElementById('sf-department').value;var email=document.getElementById('sf-email').value.trim();var phone=document.getElementById('sf-phone').value.trim();var hourlyRate=parseFloat(document.getElementById('sf-hourly').value)||0;var bank=document.getElementById('sf-bank').value.trim();var account=document.getElementById('sf-account').value.trim();var annual=parseInt(document.getElementById('sf-annual').value)||21;var sick=parseInt(document.getElementById('sf-sick').value)||10;var st=document.getElementById('sf-status').value;var pc=document.getElementById('sf-paycycle').value;if(!n){alert('Staff name is required.');return}if(!dep){alert('Please select a department.');return}var obj={name:n,empid:id,vnpfNumber:vnpfNum,designation:dsg,department:dep,email:email,phone:phone,hourlyRate:hourlyRate,bankName:bank,accountNumber:account,annualLeave:annual,sickLeave:sick,status:st,payCycle:pc};var savedId='';if(APP.editingStaffIdx!==-1){DB.update('staff',{_id:APP.editingStaffIdx},obj);savedId=APP.editingStaffIdx;APP.editingStaffIdx=-1;document.getElementById('staff-form-title').textContent='Add New Staff';}else{var newDoc=DB.insert('staff',obj);savedId=newDoc._id;}var createUser=document.getElementById('sf-create-user').checked;var uname=document.getElementById('sf-username').value.trim();var pass=document.getElementById('sf-password').value.trim();if(createUser&&uname){var existingUser=DB.findOne('users',{linkedStaffId:savedId});if(!existingUser){existingUser=DB.findOne('users',{username:uname});}if(existingUser){var userObj={name:n,username:uname,role:'staff',linkedStaffId:savedId};if(pass)userObj.password=pass;DB.update('users',{_id:existingUser._id},userObj);}else{if(!pass)pass='staff123';DB.insert('users',{name:n,username:uname,password:pass,role:'staff',linkedStaffId:savedId});}}clearStaffForm();renderStaffTable();if(typeof renderUsersTable==='function')renderUsersTable();setNextEmpId();var m=document.getElementById('sf-msg');m.textContent='Staff saved to database.';m.style.display='block';setTimeout(function(){m.style.display='none'},2500);}
function editStaff(dbId){var s=DB.findOne('staff',{_id:dbId});if(!s)return;APP.editingStaffIdx=dbId;document.getElementById('sf-name').value=s.name;document.getElementById('sf-id').value=s.empid;document.getElementById('sf-vnpf').value=s.vnpfNumber||'';document.getElementById('sf-designation').value=s.designation;document.getElementById('sf-department').value=s.department;document.getElementById('sf-email').value=s.email||'';document.getElementById('sf-phone').value=s.phone||'';document.getElementById('sf-hourly').value=s.hourlyRate||'';document.getElementById('sf-bank').value=s.bankName||'';document.getElementById('sf-account').value=s.accountNumber||'';document.getElementById('sf-annual').value=s.annualLeave||21;document.getElementById('sf-sick').value=s.sickLeave||10;document.getElementById('sf-status').value=s.status;document.getElementById('sf-paycycle').value=s.payCycle||'Monthly';var eu=DB.findOne('users',{linkedStaffId:dbId});if(eu){document.getElementById('sf-create-user').checked=true;document.getElementById('sf-user-fields').style.display='block';document.getElementById('sf-username').value=eu.username;document.getElementById('sf-password').value='';}else{document.getElementById('sf-create-user').checked=false;document.getElementById('sf-user-fields').style.display='none';document.getElementById('sf-username').value='';document.getElementById('sf-password').value='';}document.getElementById('staff-form-title').textContent='Edit Staff - '+s.name;}
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
function renderHRTable(){var filterS=document.getElementById('hr-filter-status')?document.getElementById('hr-filter-status').value:'';var filterT=document.getElementById('hr-filter-type')?document.getElementById('hr-filter-type').value:'';var role=APP.currentUser.role;var all=getUserHRRecords();if(filterS)all=all.filter(function(r){return r.status===filterS});if(filterT)all=all.filter(function(r){return r.type===filterT});var recent=all.slice().reverse().slice(0,5);var rWrap=document.getElementById('hr-recent-wrap');if(rWrap){if(!recent.length){rWrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem 0"><span data-i18n="msg_no_requests">No requests yet.</span></p>';}else{var rHtml='<table><thead><tr><th><span data-i18n="tbl_employee">Employee</span></th><th><span data-i18n="tbl_type">Type</span></th><th><span data-i18n="tbl_status">Status</span></th></tr></thead><tbody>';recent.forEach(function(r){rHtml+='<tr><td style="font-weight:600">'+r.staff+'</td><td>'+r.type+'</td><td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td></tr>'});rHtml+='</tbody></table>';rWrap.innerHTML=rHtml;}}var wrap=document.getElementById('hr-table-wrap');if(!wrap)return;if(!all.length){wrap.innerHTML='<p style="color:#888;font-size:13px;padding:1rem 0"><span data-i18n="msg_no_records">No records found.</span></p>';return}var rows='';all.slice().reverse().forEach(function(r,idx){var canApprove=role==='admin'||role==='it'||role==='manager';var eid='hr'+idx;HR_ID_MAP[eid]=r._id;var dateFmt=function(d){return d?fmtDate(d):'-'};var ls=getLeaveStats(r.staffId);var annualOutCell='<span style="color:#888;font-size:12px">--</span>';var sickOutCell='<span style="color:#888;font-size:12px">--</span>';if(r.type==='Annual Leave'){var aCol=ls.annualLeft<=0?'#dc2626':ls.annualLeft<=5?'#f59e0b':'#16a34a';annualOutCell='<span style="font-weight:700;color:'+aCol+'">'+ls.annualLeft+' / '+ls.annualAlloc+' d</span>'; setTimeout(translateUI, 10); }else if(r.type==='Sick Leave'){var sCol=ls.sickLeft<=0?'#dc2626':ls.sickLeft<=2?'#f59e0b':'#16a34a';sickOutCell='<span style="font-weight:700;color:'+sCol+'">'+ls.sickLeft+' / '+ls.sickAlloc+' d</span>';}var actionBtns='';if(canApprove&&r.status==='Pending'){actionBtns+='<button class="btn btn-success btn-sm" onclick="approveHR(HR_ID_MAP.'+eid+',\'Approved\')" title="Approve"><i class="fa-solid fa-check"></i></button> ';actionBtns+='<button class="btn btn-danger btn-sm" onclick="approveHR(HR_ID_MAP.'+eid+',\'Rejected\')" title="Reject"><i class="fa-solid fa-xmark"></i></button> ';}if(role==='admin'||role==='manager'){actionBtns+='<button class="btn btn-danger btn-sm" onclick="deleteHR(HR_ID_MAP.'+eid+')"><i class="ti ti-trash"></i></button>'}rows+=''+'<tr>'+'<td style="font-weight:600">'+r.staff+'</td>'+'<td style="color:#888">'+r.empid+'</td>'+'<td>'+r.type+'</td>'+'<td style="white-space:nowrap">'+dateFmt(r.startDate)+'</td>'+'<td style="white-space:nowrap">'+dateFmt(r.endDate)+'</td>'+'<td style="text-align:center">'+(r.type==='Payment Advance'?'--':r.days)+'</td>'+'<td style="text-align:center">'+annualOutCell+'</td>'+'<td style="text-align:center">'+sickOutCell+'</td>'+'<td>'+(r.amount?vuvFmt(r.amount):'--')+'</td>'+'<td><span class="status-pill '+pillClass(r.status)+'">'+r.status+'</span></td>'+'<td style="white-space:nowrap">'+actionBtns+'</td>'+'</tr>';});wrap.innerHTML='<div style="overflow:auto"><table><thead><tr><th><span data-i18n="tbl_employee">Employee</span></th><th><span data-i18n="tbl_id">ID</span></th><th><span data-i18n="tbl_type">Type</span></th><th><span data-i18n="tbl_start">Start</span></th><th><span data-i18n="tbl_end">End</span></th><th><span data-i18n="tbl_days">Days</span></th><th style="background:#e8f4fd;color:#1565c0;text-align:center"><span data-i18n="tbl_annual_out">Annual Outstanding</span></th><th style="background:#fde8e8;color:#c62828;text-align:center"><span data-i18n="tbl_sick_out">Sick Outstanding</span></th><th><span data-i18n="tbl_amount">Amount</span></th><th><span data-i18n="tbl_status">Status</span></th><th><span data-i18n="tbl_actions">Actions</span></th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
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
  var html='<table><thead><tr><th><span data-i18n="tbl_name">Name</span></th><th><span data-i18n="tbl_username">Username</span></th><th><span data-i18n="tbl_role">Role</span></th><th><span data-i18n="tbl_actions">Actions</span></th></tr></thead><tbody>';
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
function deleteUser(dbId){customConfirm('Delete this user?', function(){ DB.remove('users',{_id:dbId});renderUsersTable(); }); setTimeout(translateUI, 10); }
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
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">3.</span> Employee Payroll Details</div><div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th><span data-i18n="tbl_staff_name">Staff Name</span></th><th><span data-i18n="tbl_emp_id">Employee ID</span></th><th><span data-i18n="tbl_pay_date">Pay Date</span></th><th><span data-i18n="tbl_payroll_period">Payroll Period</span></th><th style="text-align:right"><span data-i18n="tbl_gross_pay">Gross Pay</span></th><th style="text-align:right"><span data-i18n="tbl_vnpf">VNPF</span></th><th style="text-align:right"><span data-i18n="tbl_loan_ded">Loan</span></th><th style="text-align:right"><span data-i18n="tbl_other_ded">Other Ded.</span></th><th style="text-align:right"><span data-i18n="tbl_net_pay">Net Pay</span></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'
    // ── SECTION 4: HR Leave & Advance Summary
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">4.</span> HR Leave &amp; Advance Summary</div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-bottom:1rem">'
        +'<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:4px">Annual Leave</p><p style="font-size:22px;font-weight:800;color:#1d4ed8">'+leaveTypes['Annual Leave']+'</p></div>'
        +'<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;margin-bottom:4px">Sick Leave</p><p style="font-size:22px;font-weight:800;color:#dc2626">'+leaveTypes['Sick Leave']+'</p></div>'
        +'<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:4px">Leave W/O Pay</p><p style="font-size:22px;font-weight:800;color:#d97706">'+leaveTypes['Leave Without Pay']+'</p></div>'
        +'<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:.75rem;text-align:center"><p style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px">Advances Approved</p><p style="font-size:16px;font-weight:800;color:#16a34a">'+vuvFmt(totalAdvApproved)+'</p></div>'
      +'</div>'
      +(hrData.length?'<div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th>Employee</th><th>ID</th><th><span data-i18n="tbl_type">Request Type</span></th><th><span data-i18n="tbl_start">Start Date</span></th><th><span data-i18n="tbl_end">End Date</span></th><th style="text-align:center"><span data-i18n="tbl_days">Days</span></th><th><span data-i18n="tbl_amount">Amount</span></th><th><span data-i18n="tbl_status">Status</span></th><th><span data-i18n="tbl_dept">Department</span></th></tr></thead><tbody>'+hrRows+'</tbody></table></div>':'<p style="font-size:13px;color:#888;text-align:center;padding:1rem"><span data-i18n="msg_no_hr_rpt">No HR leave or advance requests for this period.</span></p>')
    +'</div>'
    // ── SECTION 5: Staff Directory & Leave Balances
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">5.</span> Staff Directory &amp; Leave Balances</div>'
      +(staffData.length?'<div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th><span data-i18n="tbl_name">Name</span></th><th><span data-i18n="tbl_id">ID</span></th><th><span data-i18n="tbl_designation">Designation</span></th><th><span data-i18n="tbl_dept">Department</span></th><th style="text-align:center"><span data-i18n="tbl_annual_alloc">Annual Alloc.</span></th><th style="text-align:center"><span data-i18n="tbl_annual_left">Annual Left</span></th><th style="text-align:center"><span data-i18n="tbl_sick_alloc">Sick Alloc.</span></th><th style="text-align:center"><span data-i18n="tbl_sick_left">Sick Left</span></th><th><span data-i18n="tbl_status">Status</span></th></tr></thead><tbody>'+staffRows+'</tbody></table></div>':'<p style="font-size:13px;color:#888;text-align:center;padding:1rem"><span data-i18n="msg_no_staff_rpt">No staff records found.</span></p>')
    +'</div>'
    // ── SECTION 6: Compliance Observations
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">6.</span> Compliance Observations</div><div class="rpt-obs-block"><div class="rpt-obs-title">VNPF Compliance</div><div class="rpt-obs-text">'+narrative.vnpf_observation+'</div><div class="rpt-highlight-ok">&#10003; VNPF calculated at 6% &mdash; Total: '+vuvFmt(pr.tV)+'</div></div><div class="rpt-obs-block"><div class="rpt-obs-title">Deduction Review</div><div class="rpt-obs-text">'+narrative.deduction_observation+(pr.tO>0?'<ul>'+bigOthers.map(function(p){return'<li><strong>'+p.staff+'</strong>: '+vuvFmt(p.others)+(p.othersNote?' &mdash; '+p.othersNote:'')+' </li>'}).join('')+'</ul>':'')+'</div></div><div class="rpt-obs-block"><div class="rpt-obs-title">Payroll Accuracy</div><div class="rpt-obs-text">'+narrative.accuracy_observation+'</div></div></div>'
    // ── SECTION 7: Recommendations
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">7.</span> Recommendations</div><p style="font-size:13px;color:#555;margin-bottom:.75rem">Management is advised to:</p><ul class="rpt-rec-list">'+recs+'</ul></div>'
    // ── SECTION 8: Conclusion
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">8.</span> Conclusion</div><p style="font-size:13px;color:#444;line-height:1.8">'+narrative.conclusion+'</p></div>'
    // ── FOOTER
    +'<div class="rpt-section"><div class="rpt-section-title"><span class="rpt-section-num">4.</span> <span data-i18n="tbl_salary_banking">Salary Banking List</span></div><div style="overflow:auto"><table class="rpt-detail-table"><thead><tr><th><span data-i18n="tbl_name_col">Name</span></th><th><span data-i18n="tbl_bank_col">Bank</span></th><th><span data-i18n="tbl_account_col">Account</span></th><th style="text-align:right"><span data-i18n="tbl_amount_vt">Amount Vt</span></th><th><span data-i18n="tbl_account_desc">To account description</span></th><th><span data-i18n="tbl_transfer_priority">Transfer priority</span></th></tr></thead><tbody>'+bankRows+'</tbody></table></div></div>'
    +'<div class="rpt-footer">'
      +'<div><strong>Prepared By:</strong><br>Payroll &amp; Compliance Department<br>WokManeja</div>'
      +'<div style="text-align:center"><div style="font-size:9px;color:#bbb;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">System Developed by</div></div>'
      +'<div style="text-align:right;font-size:11px;color:#aaa">Generated: '+pr.today+'<br>WokManeja Payroll System &mdash; Confidential</div>'
    +'</div>'
  +'</div>';
}
function renderComplianceReport(data,narrative){document.getElementById('compliance-output').innerHTML=buildReportHTML(data,narrative,false); setTimeout(translateUI, 10); }
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

