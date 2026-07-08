// petty_cash.js

async function renderPCDashboard() {
    document.getElementById('section-pc-dashboard').innerHTML = '<p>Loading...</p>';
    const res = await fetch('/api/pc/balance', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const bal = await res.json();
    
    // Also fetch summary for the chart
    const sRes = await fetch('/api/pc/summary', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const sum = await sRes.json();
    
    let html = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <p class="section-title"><i class="ti ti-wallet" style="color:var(--gold)"></i> Petty Cash Dashboard</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
            <div class="card" style="border-top:3px solid var(--navy)">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Opening Float</p>
                <p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--navy)">${vuvFmt(bal.openingBalance)}</p>
            </div>
            <div class="card" style="border-top:3px solid var(--gold)">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Current Balance</p>
                <p style="font-size:30px;font-weight:800;margin-top:6px;color:var(--gold)">${vuvFmt(bal.currentBalance)}</p>
            </div>
            <div class="card" style="border-top:3px solid #e24b4a">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Float Used</p>
                <p style="font-size:30px;font-weight:800;margin-top:6px;color:#e24b4a">${bal.floatUsedPct.toFixed(1)}%</p>
            </div>
            <div class="card" style="border-top:3px solid #10b981">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px">Amount to Replenish</p>
                <p style="font-size:30px;font-weight:800;margin-top:6px;color:#10b981">${vuvFmt(bal.replenishAmount)}</p>
            </div>
        </div>
    `;
    
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem">`;
    html += `<div class="card"><p style="font-weight:700;margin-bottom:1rem">Monthly Spend by Category</p><table><thead><tr><th style="text-align:left">Category</th><th style="text-align:right">Total</th></tr></thead><tbody>`;
    let labels = [];
    let data = [];
    sum.forEach(row => {
        html += `<tr><td>${row.name}</td><td style="text-align:right;font-weight:700">${vuvFmt(row.total)}</td></tr>`;
        labels.push(row.name);
        data.push(row.total);
    });
    if(sum.length === 0) html += `<tr><td colspan="2" style="text-align:center;color:#888">No expenses yet.</td></tr>`;
    html += `</tbody></table></div>`;
    
    html += `<div class="card"><p style="font-weight:700;margin-bottom:1rem">Category Breakdown</p><div style="position:relative;height:250px;width:100%"><canvas id="pcChart1"></canvas></div></div>`;
    html += `</div>`;
    
    document.getElementById('section-pc-dashboard').innerHTML = html;
    
    if(sum.length > 0) {
        setTimeout(() => {
            createChart('pcChart1', 'doughnut', {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']
                }]
            });
        }, 100);
    }
}

async function renderPCRegister() {
    document.getElementById('section-pc-register').innerHTML = '<p>Loading...</p>';
    const res = await fetch('/api/pc/register', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const rows = await res.json();
    
    const balRes = await fetch('/api/pc/balance', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const bal = await balRes.json();
    
    let html = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <p class="section-title"><i class="ti ti-book" style="color:var(--gold)"></i> Petty Cash Register</p>
            ${hasCapability('approvePettyCash') ? `<button class="btn btn-navy" onclick="replenishFloatPrompt(${bal.replenishAmount})"><i class="ti ti-cash"></i> Replenish Float</button>` : ''}
        </div>
        <div class="card" style="padding:0;overflow-x:auto">
            <table style="width:100%" class="rpt-detail-table">
                <thead>
                    <tr>
                        <th style="padding-left:14px;text-align:left">Date</th>
                        <th style="text-align:left">Voucher #</th>
                        <th style="text-align:left">Description</th>
                        <th style="text-align:left">Category</th>
                        <th style="text-align:right;color:#ff8a8a">Cash Out</th>
                        <th style="text-align:right;color:#a5d6a7">Cash In</th>
                        <th style="text-align:right;color:#82b1ff;padding-right:14px">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background:#f8f9fb"><td colspan="6" style="font-weight:700;padding-left:14px">Opening Balance (Float)</td><td style="text-align:right;font-weight:800;padding-right:14px">${vuvFmt(bal.openingBalance)}</td></tr>
    `;
    
    rows.forEach(r => {
        html += `<tr>
            <td style="padding-left:14px">${fmtDate(r.entry_date)}</td>
            <td>${r.voucher_no || '-'}</td>
            <td>${r.description || r.entry_type}</td>
            <td>${r.category_name || '-'}</td>
            <td style="text-align:right">${r.cash_out ? vuvFmt(r.cash_out) : '-'}</td>
            <td style="text-align:right">${r.cash_in ? vuvFmt(r.cash_in) : '-'}</td>
            <td style="text-align:right;font-weight:700;padding-right:14px">${vuvFmt(r.balance)}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    document.getElementById('section-pc-register').innerHTML = html;
}

async function replenishFloatPrompt(suggestedAmt = '') {
    const amt = await uiPrompt("Enter amount to replenish:", suggestedAmt);
    if(!amt || isNaN(amt)) return;
    try {
        const res = await fetch('/api/pc/register/replenish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
            body: JSON.stringify({ amount: parseFloat(amt), date: new Date().toISOString().split('T')[0] })
        });
        if(res.ok) renderPCRegister();
        else alert('Failed to replenish float.');
    } catch(e) {
        alert(e.message);
    }
}

async function renderPCVouchers() {
    document.getElementById('section-pc-vouchers').innerHTML = '<p>Loading...</p>';
    const res = await fetch('/api/pc/vouchers', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const rows = await res.json();
    
    let html = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <p class="section-title"><i class="ti ti-receipt" style="color:var(--gold)"></i> Vouchers</p>
            ${(APP.currentUser.role !== 'viewer') ? `<button class="btn btn-navy" onclick="showCreateVoucherModal()"><i class="ti ti-plus"></i> New Voucher</button>` : ''}
        </div>
        <div class="card" style="padding:0;overflow-x:auto">
            <table style="width:100%" class="rpt-detail-table">
                <thead>
                    <tr>
                        <th style="padding-left:14px;text-align:left">Voucher #</th>
                        <th style="text-align:left">Date</th>
                        <th style="text-align:left">Payee</th>
                        <th style="text-align:left">Staff Name</th>
                        <th style="text-align:left">Category</th>
                        <th style="text-align:left">Department</th>
                        <th style="text-align:right">Amount</th>
                        <th style="padding-right:14px;text-align:left">Status</th>
                    </tr>
                </thead>
                <tbody>
    `;
    rows.forEach(r => {
        html += `<tr>
            <td style="font-weight:600;padding-left:14px">${r.voucher_no}</td>
            <td>${fmtDate(r.date)}</td>
            <td>${r.payee}</td>
            <td>${r.staff_name || '-'}</td>
            <td>${r.category_name}</td>
            <td>${r.department || '-'}</td>
            <td style="text-align:right;font-weight:700">${vuvFmt(r.amount)}</td>
            <td style="padding-right:14px"><span class="status-pill status-approved" style="background:#e8f5e9;color:#1b5e20;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600">${r.status}</span></td>
        </tr>`;
    });
    if(rows.length === 0) html += `<tr><td colspan="8" style="text-align:center;color:#888;padding:2rem">No vouchers found.</td></tr>`;
    html += `</tbody></table></div>`;
    document.getElementById('section-pc-vouchers').innerHTML = html;
}

function showCreateVoucherModal() {
    const m = document.createElement('div');
    m.id = 'pc-modal';
    m.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    
    const token = sessionStorage.getItem('api_token');
    fetch('/api/pc/categories', { headers: { 'Authorization': 'Bearer ' + token }})
    .then(r => r.json())
    .then(cats => {
        let catOpts = cats.map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('');
        const staffList = DB.findAll('staff') || [];
        const activeStaff = staffList.filter(s => s.status === 'Active' || !s.status);
        let staffOpts = '<option value="">-- Select Staff (optional) --</option>' +
            activeStaff.map(s => `<option value="${s.name}">${s.name}${s.designation ? ' - ' + s.designation : ''}</option>`).join('');
        m.innerHTML = `
        <div class="card" style="width:420px;max-width:90%">
            <h3 style="margin-bottom:1rem;color:var(--navy)"><i class="ti ti-receipt"></i> Create Voucher</h3>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Date</label>
                <input type="date" id="pc-v-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Payee</label>
                <input type="text" id="pc-v-payee" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Staff Name</label>
                <select id="pc-v-staff" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">${staffOpts}</select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Category</label>
                <select id="pc-v-cat" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">${catOpts}</select>
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Description</label>
                <input type="text" id="pc-v-desc" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Amount</label>
                <input type="number" id="pc-v-amt" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem">
                <button class="btn btn-default" onclick="document.getElementById('pc-modal').remove()">Cancel</button>
                <button class="btn btn-gold" onclick="submitPCVoucher()">Save Voucher</button>
            </div>
        </div>`;
        document.body.appendChild(m);
    });
}

async function submitPCVoucher() {
    const data = {
        date: document.getElementById('pc-v-date').value,
        payee: document.getElementById('pc-v-payee').value,
        staff_name: document.getElementById('pc-v-staff').value || null,
        category_id: document.getElementById('pc-v-cat').value,
        description: document.getElementById('pc-v-desc').value,
        amount: document.getElementById('pc-v-amt').value,
        department: 'Finance' // Default department, can be updated later
    };
    if(!data.amount || !data.payee) { alert('Please fill required fields.'); return; }
    
    try {
        const res = await fetch('/api/pc/vouchers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
            body: JSON.stringify(data)
        });
        const out = await res.json();
        if(!res.ok) {
            alert('Error: ' + (out.error || 'Failed to create voucher'));
            return;
        }
        document.getElementById('pc-modal').remove();
        renderPCVouchers();
    } catch(e) {
        alert(e.message);
    }
}

function renderPCSummary() {
    document.getElementById('section-pc-summary').innerHTML = '<div class="card"><p>Monthly Summary features are displayed on the Dashboard.</p></div>';
}

async function renderPCSettings() {
    if(!hasCapability('approvePettyCash')) {
        document.getElementById('section-pc-settings').innerHTML = '<div class="card"><p style="color:#e24b4a">Unauthorized.</p></div>';
        return;
    }
    
    document.getElementById('section-pc-settings').innerHTML = '<p>Loading...</p>';
    const res = await fetch('/api/pc/settings', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }});
    const s = await res.json();
    
    let html = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <p class="section-title"><i class="ti ti-settings" style="color:var(--gold)"></i> Petty Cash Settings</p>
            <button class="btn btn-navy" onclick="savePCSettings()"><i class="ti ti-device-floppy"></i> Save Config</button>
        </div>
        <div class="card" style="max-width:500px">
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Opening Float Balance</label>
                <input type="number" id="pc-s-float" value="${s.float || ''}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Supervisor Approval Limit</label>
                <input type="number" id="pc-s-super" value="${s.limit_super || ''}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
            <div style="margin-bottom:1rem">
                <label style="font-size:12px;font-weight:600;color:#555">Manager Approval Limit</label>
                <input type="number" id="pc-s-mgr" value="${s.limit_mgr || ''}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-top:4px">
            </div>
        </div>
    `;
    document.getElementById('section-pc-settings').innerHTML = html;
}

async function savePCSettings() {
    const data = {
        float: document.getElementById('pc-s-float').value,
        limit_super: document.getElementById('pc-s-super').value,
        limit_mgr: document.getElementById('pc-s-mgr').value
    };
    const res = await fetch('/api/pc/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
        body: JSON.stringify(data)
    });
    if(res.ok) {
        alert('Settings saved!');
        renderPCSettings();
    } else alert('Failed to save.');
}
