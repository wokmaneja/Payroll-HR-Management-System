// dashboards.js — WokManeja Module Dashboards (Chart.js)
// Improved: chart destroy/redraw, real data, richer UI, better colours

// ─── Chart.js instance registry (prevents duplicate canvas errors) ────────────
var CHART_REGISTRY = {};

function createChart(canvasId, type, data, options) {
    // Destroy old chart on same canvas if it exists
    if (CHART_REGISTRY[canvasId]) {
        CHART_REGISTRY[canvasId].destroy();
        delete CHART_REGISTRY[canvasId];
    }
    var ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    var chart = new Chart(ctx, {
        type: type,
        data: data,
        options: Object.assign({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { family: 'Montserrat', size: 11 }, padding: 16 }
                }
            }
        }, options || {})
    });
    CHART_REGISTRY[canvasId] = chart;
    return chart;
}

// ─── Colour palettes ─────────────────────────────────────────────────────────
var PALETTE = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];

function kpiCard(icon, label, value, color, sub) {
    return '<div class="card" style="border-top:3px solid '+color+';text-align:center;padding:1.2rem">' +
        '<i class="ti '+icon+'" style="font-size:26px;color:'+color+';margin-bottom:8px;display:block"></i>' +
        '<p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;font-weight:700">'+label+'</p>' +
        '<h2 style="font-size:26px;font-weight:800;color:'+color+';margin:6px 0 2px">'+value+'</h2>' +
        (sub ? '<p style="font-size:11px;color:#aaa">'+sub+'</p>' : '') +
        '</div>';
}

// ─── HR Dashboard ─────────────────────────────────────────────────────────────
function renderHRDashboard() {
    var allHR  = DB.findAll('hr_requests') || [];
    var staff  = DB.findAll('staff') || [];
    var active = staff.filter(s => s.status !== 'Inactive').length;
    var pending   = allHR.filter(r => r.status === 'Pending').length;
    var approved  = allHR.filter(r => r.status === 'Approved').length;
    var rejected  = allHR.filter(r => r.status === 'Rejected').length;

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">';
    html += kpiCard('ti-users',      'Active Staff',     active,   '#3b82f6');
    html += kpiCard('ti-calendar-event', 'Total Requests', allHR.length, '#10b981');
    html += kpiCard('ti-clock',      'Pending',          pending,  '#f59e0b');
    html += kpiCard('ti-check',      'Approved',         approved, '#10b981');
    html += kpiCard('ti-x',          'Rejected',         rejected, '#ef4444');
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Leave Requests by Type</p><div style="position:relative;height:250px;width:100%"><canvas id="hrChart1"></canvas></div></div>';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Request Status Breakdown</p><div style="position:relative;height:250px;width:100%"><canvas id="hrChart2"></canvas></div></div>';
    html += '</div>';

    // Recent activity table
    html += '<div class="card"><p style="font-weight:700;color:#0a0a0a;margin-bottom:1rem">Recent HR Activity (Last 10)</p>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Type</th><th>Start</th><th>Status</th></tr></thead><tbody>';
    var recent = [...allHR].reverse().slice(0, 10);
    if (!recent.length) {
        html += '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:2rem">No HR records yet.</td></tr>';
    } else {
        recent.forEach(r => {
            var pill = r.status==='Approved' ? 'pill-approved' : r.status==='Pending' ? 'pill-pending' : 'pill-rejected';
            html += '<tr><td style="font-weight:600">'+(r.staff||r.employeeName||'—')+'</td><td>'+r.type+'</td><td>'+(r.startDate||r.start||'—')+'</td><td><span class="status-pill '+pill+'">'+r.status+'</span></td></tr>';
        });
    }
    html += '</tbody></table></div></div>';

    document.getElementById('hr-dashboard-content').innerHTML = html;

    setTimeout(() => {
        // Chart 1: Leave types doughnut
        var typeCounts = {};
        allHR.forEach(r => { typeCounts[r.type] = (typeCounts[r.type]||0) + 1; });
        if (Object.keys(typeCounts).length) {
            createChart('hrChart1', 'bar', {
                labels: Object.keys(typeCounts),
                datasets: [{ label: 'Requests', data: Object.values(typeCounts), backgroundColor: PALETTE, borderWidth: 2 }]
            }, { indexAxis: 'y' });
        }
        // Chart 2: Status bar
        createChart('hrChart2', 'bar', {
            labels: ['Approved', 'Pending', 'Rejected'],
            datasets: [{ label: 'Requests', data: [approved, pending, rejected], backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderRadius: 6 }]
        }, { plugins: { legend: { display: false } } });
    }, 120);
}

// ─── Payroll Dashboard ───────────────────────────────────────────────────────
function renderPayrollDashboard() {
    var slips = DB.findAll('payslips') || [];
    var totalNet  = slips.reduce((s,p) => s + (p.net||0), 0);
    var totalVNPF = slips.reduce((s,p) => s + (p.vnpf||0), 0);
    var totalGross= slips.reduce((s,p) => s + (p.totalEarn||0), 0);
    var staff     = DB.findAll('staff') || [];

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem">';
    html += kpiCard('ti-file-invoice','Total Payslips',  slips.length,            '#3b82f6');
    html += kpiCard('ti-users',       'Staff on Payroll',staff.filter(s=>s.status!=='Inactive').length, '#10b981');
    html += kpiCard('ti-cash',        'Total Gross',     'VUV '+Math.round(totalGross).toLocaleString(), '#f59e0b');
    html += kpiCard('ti-trending-up', 'Total Net Pay',   'VUV '+Math.round(totalNet).toLocaleString(),   '#10b981');
    html += kpiCard('ti-building-bank','Total VNPF',     'VUV '+Math.round(totalVNPF).toLocaleString(),  '#8b5cf6');
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem">';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Net Payroll by Period</p><div style="position:relative;height:250px;width:100%"><canvas id="payChart1"></canvas></div></div>';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Payroll Breakdown</p><div style="position:relative;height:250px;width:100%"><canvas id="payChart2"></canvas></div></div>';
    html += '</div>';

    // Top earners table
    html += '<div class="card"><p style="font-weight:700;color:#0a0a0a;margin-bottom:1rem">Latest Payslips</p>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>Staff</th><th>Period</th><th>Gross</th><th>VNPF</th><th style="text-align:right">Net Pay</th></tr></thead><tbody>';
    var recent = [...slips].reverse().slice(0, 10);
    if (!recent.length) {
        html += '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:2rem">No payslips yet.</td></tr>';
    } else {
        recent.forEach(p => {
            html += '<tr><td style="font-weight:600">'+p.staff+'</td><td style="font-size:12px">'+p.month+' '+p.year+'</td><td>'+Math.round(p.totalEarn||0).toLocaleString()+'</td><td>'+Math.round(p.vnpf||0).toLocaleString()+'</td><td style="text-align:right;font-weight:700;color:#10b981">VUV '+Math.round(p.net||0).toLocaleString()+'</td></tr>';
        });
    }
    html += '</tbody></table></div></div>';

    document.getElementById('payroll-dashboard-content').innerHTML = html;

    setTimeout(() => {
        // Chart 1: Trend line by period
        var monthly = {};
        slips.forEach(s => {
            var k = (s.month||'?') + ' ' + (s.year||'');
            if (!monthly[k]) monthly[k] = 0;
            monthly[k] += s.net || 0;
        });
        var labels = Object.keys(monthly);
        var vals   = Object.values(monthly);
        createChart('payChart1', 'line', {
            labels: labels,
            datasets: [{
                label: 'Net Pay (VUV)',
                data: vals,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 5
            }]
        });
        // Chart 2: Gross vs Net vs VNPF horizontal bar
        createChart('payChart2', 'bar', {
            labels: ['Net Pay', 'VNPF', 'Other Deductions'],
            datasets: [{
                label: 'Amount',
                data: [totalNet, totalVNPF, Math.max(0, totalGross - totalNet - totalVNPF)],
                backgroundColor: ['#10b981','#f59e0b','#ef4444'],
                borderWidth: 2
            }]
        }, { indexAxis: 'y' });
    }, 120);
}

// ─── Reports Dashboard ───────────────────────────────────────────────────────
function renderReportsDashboard() {
    var slips  = DB.findAll('payslips') || [];
    var hrReqs = DB.findAll('hr_requests') || [];
    var staff  = DB.findAll('staff') || [];

    var cards = [
        { icon:'ti-chart-pie',    label:'HR Reports',      count:hrReqs.length,  sub:'HR requests logged',   color:'#3b82f6',  id:'report-hr' },
        { icon:'ti-report-money', label:'Payroll Reports', count:slips.length,   sub:'payslips in database', color:'#10b981',  id:'report-payroll' },
        { icon:'ti-receipt-2',    label:'Finance Reports', count:0,              sub:'P&L and balance sheet', color:'#f59e0b',  id:'report-finance' },
        { icon:'ti-file-certificate',label:'VNPF Reports', count:slips.length,   sub:'slips eligible',       color:'#8b5cf6',  id:'report-vnpf' },
        { icon:'ti-chart-line',   label:'Executive',       count:staff.length,   sub:'staff across all depts',color:'#ef4444', id:'report-executive' },
        { icon:'ti-shield-lock',  label:'Admin Reports',   count: (DB.findAll('users')||[]).length, sub:'system users', color:'#0ea5e9', id:'report-admin' }
    ];

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-bottom:1.5rem">';
    cards.forEach(c => {
        html += '<div class="card" style="border-top:3px solid '+c.color+';cursor:pointer;transition:box-shadow .2s" onclick="showSection(\''+c.id+'\');renderReport_'+c.id.replace('-','')+'_safe()" onmouseover="this.style.boxShadow=\'0 4px 20px rgba(0,0,0,.12)\'" onmouseout="this.style.boxShadow=\'\'">'+
            '<i class="ti '+c.icon+'" style="font-size:32px;color:'+c.color+';margin-bottom:10px;display:block"></i>'+
            '<h3 style="font-weight:700;margin-bottom:4px;color:#0a0a0a">'+c.label+'</h3>'+
            '<p style="font-size:22px;font-weight:800;color:'+c.color+';margin:4px 0">'+c.count+'</p>'+
            '<p style="font-size:12px;color:#888">'+c.sub+'</p>'+
            '</div>';
    });
    html += '</div>';
    html += '<p style="text-align:center;color:#aaa;font-size:13px;margin-top:1rem"><i class="ti ti-click" style="margin-right:4px"></i>Click any report card above to open that report, or use the sidebar menu.</p>';

    document.getElementById('reports-dashboard-content').innerHTML = html;
}

// Safe shim – prevents JS errors when clicking report cards from the Reports Dashboard
function renderReport_reporthr_safe()        { if(typeof renderReportHR==='function') renderReportHR(); }
function renderReport_reportfinance_safe()   { if(typeof renderReportFinance==='function') renderReportFinance(); }
function renderReport_reportpayroll_safe()   { if(typeof renderReportPayroll==='function') renderReportPayroll(); }
function renderReport_reportvnpf_safe()      { if(typeof renderReportVNPF==='function') renderReportVNPF(); }
function renderReport_reportexecutive_safe() { if(typeof renderReportExecutive==='function') renderReportExecutive(); }
function renderReport_reportadmin_safe()     { if(typeof renderReportAdmin==='function') renderReportAdmin(); }

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
function renderAdminDashboard() {
    var users      = DB.findAll('users') || [];
    var staff      = DB.findAll('staff') || [];
    var logs       = DB.findAll('audit_logs') || [];
    var activeStaff= staff.filter(s => s.status !== 'Inactive').length;

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem">';
    html += kpiCard('ti-user-shield', 'Total Users',    users.length,       '#3b82f6');
    html += kpiCard('ti-users',       'Total Staff',    staff.length,       '#10b981', activeStaff+' active');
    html += kpiCard('ti-history',     'Audit Entries',  logs.length,        '#f59e0b');
    html += kpiCard('ti-shield-check','Roles',          [...new Set(users.map(u=>u.role))].length, '#8b5cf6');
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Users by Role</p><div style="position:relative;height:250px;width:100%"><canvas id="adminChart1"></canvas></div></div>';
    html += '<div class="card"><p style="font-weight:700;margin-bottom:1rem;color:#0a0a0a">Staff by Department</p><div style="position:relative;height:250px;width:100%"><canvas id="adminChart2"></canvas></div></div>';
    html += '</div>';

    // Recent audit table
    html += '<div class="card"><p style="font-weight:700;color:#0a0a0a;margin-bottom:1rem">Recent Audit Log Entries</p>';
    html += '<div style="overflow-x:auto"><table><thead><tr><th>User</th><th>Action</th><th>Time</th></tr></thead><tbody>';
    var recentLogs = [...logs].reverse().slice(0, 10);
    if (!recentLogs.length) {
        html += '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:2rem">No audit entries yet.</td></tr>';
    } else {
        recentLogs.forEach(l => {
            html += '<tr><td style="font-weight:600">'+(l.user||l.by||'system')+'</td><td>'+(l.action||l.event||'—')+'</td><td style="font-size:11px;color:#888">'+(l.time||l.createdAt||'—')+'</td></tr>';
        });
    }
    html += '</tbody></table></div></div>';

    document.getElementById('admin-dashboard-content').innerHTML = html;

    setTimeout(() => {
        // Chart 1: Users by role
        var roles = {};
        users.forEach(u => { roles[u.role] = (roles[u.role]||0) + 1; });
        if (Object.keys(roles).length) {
            createChart('adminChart1', 'bar', {
                labels: Object.keys(roles),
                datasets: [{ label: 'Users', data: Object.values(roles), backgroundColor: PALETTE, borderWidth: 2 }]
            }, { indexAxis: 'y' });
        }
        // Chart 2: Staff by department (real data)
        var depts = {};
        staff.forEach(s => { var d = s.department||'Unknown'; depts[d] = (depts[d]||0) + 1; });
        if (Object.keys(depts).length) {
            createChart('adminChart2', 'bar', {
                labels: Object.keys(depts),
                datasets: [{ label: 'Staff Count', data: Object.values(depts), backgroundColor: PALETTE, borderRadius: 6 }]
            }, { plugins: { legend: { display: false } } });
        }
    }, 120);
}
