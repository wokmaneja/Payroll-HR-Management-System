// WokManeja Unified Reports Module

// 1. HR Reports
async function renderReportHR() {
    var el = document.getElementById('section-report-hr');
    var staffRes = await fetch('/api/staff');
    var staff = await staffRes.json();
    var hrRes = await fetch('/api/hr_requests');
    var hrReqs = await hrRes.json();
    var kpiRes = await fetch('/api/kpi');
    var kpis = await kpiRes.json();

    var activeStaff = staff.filter(s => s.status !== 'Inactive').length;
    var totalStaff = staff.length;
    var avgKPI = kpis.length ? (kpis.reduce((acc, k) => acc + Number(k.score), 0) / kpis.length).toFixed(1) : 'N/A';
    var pendingReqs = hrReqs.filter(r => r.status === 'Pending').length;

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-users" style="color:var(--gold)"></i> <span>HR Reports</span></p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;margin-bottom:1rem">
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Active Staff</p>
                <h3 style="color:var(--navy);margin-top:.5rem">${activeStaff} / ${totalStaff}</h3>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Avg KPI Score</p>
                <h3 style="color:#10b981;margin-top:.5rem">${avgKPI}</h3>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Pending HR Requests</p>
                <h3 style="color:#f59e0b;margin-top:.5rem">${pendingReqs}</h3>
            </div>
        </div>
        <div class="card">
            <h4>Recent HR Activity</h4>
            <table class="table">
                <thead><tr><th>Date</th><th>Employee</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                    ${hrReqs.slice(-10).map(r => `<tr><td>${r.startDate}</td><td>${r.employeeName}</td><td>${r.type}</td><td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 2. Finance Reports
function renderReportFinance() {
    var el = document.getElementById('section-report-finance');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-receipt-2" style="color:var(--gold)"></i> <span>Finance Reports</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy);text-transform:uppercase">Profit & Loss Statement</p>
                <div id="f-rep-pl"></div>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy);text-transform:uppercase">Balance Sheet</p>
                <div id="f-rep-bs"></div>
            </div>
        </div>
    `;
    if(typeof refreshReports === 'function') refreshReports();
}

// 3. Payroll Reports
function renderReportPayroll() {
    var el = document.getElementById('section-report-payroll');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> <span>Payroll Reports</span></p>
        <div class="card" style="margin-bottom:1rem">
            <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
                <div style="flex:1;min-width:140px">
                    <label>Month</label>
                    <select id="rep-pay-month">
                        <option value="">All Months</option>
                        <option>January</option><option>February</option><option>March</option>
                        <option>April</option><option>May</option><option>June</option>
                        <option>July</option><option>August</option><option>September</option>
                        <option>October</option><option>November</option><option>December</option>
                    </select>
                </div>
                <div style="flex:1;min-width:100px">
                    <label>Year</label>
                    <input id="rep-pay-year" type="number" value="${new Date().getFullYear()}">
                </div>
                <button class="btn btn-primary" onclick="generateReportPayroll()"><i class="ti ti-search"></i> Generate</button>
            </div>
        </div>
        <div id="rep-pay-out"></div>
    `;
}

async function generateReportPayroll() {
    var m = document.getElementById('rep-pay-month').value;
    var y = document.getElementById('rep-pay-year').value;
    var res = await fetch('/api/payslips');
    var all = await res.json();
    var list = all.filter(p => (!m || p.month === m) && (!y || String(p.year) === y));
    var out = document.getElementById('rep-pay-out');

    if(!list.length) {
        out.innerHTML = '<div class="card" style="text-align:center;color:#888;padding:2rem">No payroll records found for this period.</div>';
        return;
    }

    var tE=list.reduce((s,p)=>s+(Number(p.totalEarn)||0),0);
    var tV=list.reduce((s,p)=>s+(Number(p.vnpf)||0),0);
    var tL=list.reduce((s,p)=>s+(Number(p.loan)||0),0);
    var tO=list.reduce((s,p)=>s+(Number(p.others)||0),0);
    var tN=list.reduce((s,p)=>s+(Number(p.net)||0),0);

    out.innerHTML = `
        <div class="card" style="margin-bottom:1rem;background:#0a0a0a;color:#fff">
            <div style="display:flex;justify-content:space-between">
                <div>
                    <h3 style="margin-top:0">Total Net Payroll</h3>
                    <h2 style="color:#10b981;margin:10px 0">VUV ${tN.toLocaleString()}</h2>
                </div>
                <div style="text-align:right">
                    <p style="margin:0;color:#aaa">Total Gross: VUV ${tE.toLocaleString()}</p>
                    <p style="margin:5px 0 0;color:#aaa">Total VNPF: VUV ${tV.toLocaleString()}</p>
                    <p style="margin:5px 0 0;color:#aaa">Total Deductions: VUV ${(tL+tO).toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div class="card">
            <h4>Processed Payslips</h4>
            <table class="table">
                <thead><tr><th>Staff</th><th>Role</th><th>Gross</th><th>VNPF</th><th>Net</th></tr></thead>
                <tbody>
                    ${list.map(p => `<tr><td>${p.name}</td><td>${p.role}</td><td>${(p.totalEarn||0).toLocaleString()}</td><td>${(p.vnpf||0).toLocaleString()}</td><td>${(p.net||0).toLocaleString()}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 4. Admin Reports
async function renderReportAdmin() {
    var el = document.getElementById('section-report-admin');
    var uRes = await fetch('/api/users');
    var users = await uRes.json();
    var rRes = await fetch('/api/roles');
    var roles = await rRes.json();
    var aRes = await fetch('/api/audit_logs');
    var logs = await aRes.json();

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-shield" style="color:var(--gold)"></i> <span>Admin Reports</span></p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div class="card">
                <h3>Users</h3>
                <h2 style="color:var(--navy);margin-top:10px">${users.length}</h2>
            </div>
            <div class="card">
                <h3>Defined Roles</h3>
                <h2 style="color:var(--navy);margin-top:10px">${roles.length}</h2>
            </div>
        </div>
        <div class="card">
            <h4>Recent Audit Logs</h4>
            <table class="table">
                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                    ${logs.slice(-10).map(l => `<tr><td>${new Date(l.time).toLocaleString()}</td><td>${l.user}</td><td>${l.action}</td><td>${l.details}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 5. VNPF & Bank Reports
function renderReportVNPF() {
    var el = document.getElementById('section-report-vnpf');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-building-bank" style="color:var(--gold)"></i> <span>VNPF & Bank Reports</span></p>
        <div class="card" style="margin-bottom:1rem">
            <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
                <div style="flex:1;min-width:140px">
                    <label>Month</label>
                    <select id="rep-vnpf-month">
                        <option value="">All Months</option>
                        <option>January</option><option>February</option><option>March</option>
                        <option>April</option><option>May</option><option>June</option>
                        <option>July</option><option>August</option><option>September</option>
                        <option>October</option><option>November</option><option>December</option>
                    </select>
                </div>
                <div style="flex:1;min-width:100px">
                    <label>Year</label>
                    <input id="rep-vnpf-year" type="number" value="${new Date().getFullYear()}">
                </div>
                <button class="btn btn-primary" onclick="generateReportVNPF()"><i class="ti ti-search"></i> Generate VNPF</button>
            </div>
        </div>
        <div id="rep-vnpf-out"></div>
    `;
}

async function generateReportVNPF() {
    var m = document.getElementById('rep-vnpf-month').value;
    var y = document.getElementById('rep-vnpf-year').value;
    var res = await fetch('/api/payslips');
    var all = await res.json();
    var list = all.filter(p => (!m || p.month === m) && (!y || String(p.year) === y));
    var out = document.getElementById('rep-vnpf-out');

    if(!list.length) {
        out.innerHTML = '<div class="card" style="text-align:center;color:#888;padding:2rem">No VNPF records for this period.</div>';
        return;
    }

    var html = '<div class="card"><h4>VNPF Contributions</h4><table class="table"><thead><tr><th>Employee</th><th>VNPF No.</th><th>Gross</th><th>Employee 4%</th><th>Employer 4%</th><th>Total 8%</th></tr></thead><tbody>';
    var totEmp=0, totEmpr=0;
    list.forEach(p => {
        var emp = (p.totalEarn||0) * 0.04;
        var empr = (p.totalEarn||0) * 0.04;
        totEmp += emp; totEmpr += empr;
        html += `<tr><td>${p.name}</td><td>${p.vnpfNo||'N/A'}</td><td>${(p.totalEarn||0).toLocaleString()}</td><td>${emp.toLocaleString()}</td><td>${empr.toLocaleString()}</td><td>${(emp+empr).toLocaleString()}</td></tr>`;
    });
    html += `<tr style="font-weight:bold;background:#f9f9f9"><td>TOTAL</td><td></td><td></td><td>${totEmp.toLocaleString()}</td><td>${totEmpr.toLocaleString()}</td><td>${(totEmp+totEmpr).toLocaleString()}</td></tr>`;
    html += '</tbody></table></div>';
    out.innerHTML = html;
}

// 6. Executive Summary
async function renderReportExecutive() {
    var el = document.getElementById('section-report-executive');
    el.innerHTML = '<div style="text-align:center;padding:2rem"><i class="ti ti-loader-2" style="animation:spin 1s linear infinite;font-size:2rem"></i><p>Aggregating Executive Summary...</p></div>';
    
    // Aggregate across modules
    var [staffRes, payslipsRes, entriesRes, hrRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/payslips'),
        fetch('/api/finance_journal_entries'),
        fetch('/api/hr_requests')
    ]);
    
    var staff = await staffRes.json();
    var payslips = await payslipsRes.json();
    var entries = await entriesRes.json();
    var hrReqs = await hrRes.json();

    var totalStaff = staff.length;
    var ytdPayroll = payslips.reduce((s,p)=>s+(Number(p.totalEarn)||0),0);
    
    var balances = {};
    entries.forEach(e => {
        if(e.lines) {
            e.lines.forEach(l => {
                if(!balances[l.accountName]) balances[l.accountName]=0;
                balances[l.accountName] += (l.debit||0)-(l.credit||0);
            });
        }
    });
    var cash = balances['Cash'] || 0;
    var rev = -(balances['Sales Revenue'] || 0);

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-chart-pie" style="color:var(--gold)"></i> <span>Executive Summary</span></p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;margin-bottom:1rem">
            <div class="card" style="background:#0a0a0a;color:#fff;text-align:center">
                <p style="font-size:12px;color:#aaa;text-transform:uppercase;font-weight:600">Company Revenue (YTD)</p>
                <h2 style="color:#10b981;margin-top:10px">VUV ${rev.toLocaleString()}</h2>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Cash on Hand</p>
                <h2 style="color:var(--navy);margin-top:10px">VUV ${cash.toLocaleString()}</h2>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Total Payroll (Gross YTD)</p>
                <h2 style="color:#ef4444;margin-top:10px">VUV ${ytdPayroll.toLocaleString()}</h2>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Total Employees</p>
                <h2 style="color:var(--navy);margin-top:10px">${totalStaff}</h2>
            </div>
        </div>
        <div class="card">
            <h4>Narrative Overview</h4>
            <p style="color:#444;line-height:1.5">This dashboard presents an aggregated view of WokManeja's data. Currently the company operates with ${totalStaff} staff members, having processed a total YTD gross payroll of VUV ${ytdPayroll.toLocaleString()}. Our total cash on hand is VUV ${cash.toLocaleString()} against recognized sales revenue of VUV ${rev.toLocaleString()}. We have ${hrReqs.filter(r=>r.status==='Pending').length} pending HR requests awaiting manager approval.</p>
        </div>
    `;
}
