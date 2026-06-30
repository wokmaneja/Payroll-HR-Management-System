// WokManeja Finance Module - Phase 1

async function renderFinanceDashboard() {
    var el = document.getElementById('section-finance-dashboard');
    el.innerHTML = '<div style="padding:20px;text-align:center">Loading Dashboard Data...</div>';
    
    // Fetch all necessary data
    var [jnlRes, billRes, invRes] = await Promise.all([
        fetch('/api/fin/journals', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }}),
        fetch('/api/finance_bills'),
        fetch('/api/finance_invoices')
    ]);
    
    var entries = await jnlRes.json();
    var bills = await billRes.json();
    var invoices = await invRes.json();
    
    var balances = {};
    entries.forEach(e => {
        if(!e.lines) return;
        e.lines.forEach(l => {
            if(!balances[l.account_code]) balances[l.account_code] = { name: l.account_name, type: l.account_type, val: 0 };
            balances[l.account_code].val += (parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0);
        });
    });

    var income = 0; var expenses = 0;
    var assets = 0; var liabilities = 0; var equity = 0;
    var cashBank = 0;

    Object.keys(balances).forEach(code => {
        var a = balances[code];
        if(a.type === 'Revenue') income -= a.val;
        if(a.type === 'Expense') expenses += a.val;
        if(a.type === 'Asset') assets += a.val;
        if(a.type === 'Liability') liabilities -= a.val;
        if(a.type === 'Equity') equity -= a.val;
        
        // Typical codes for cash/bank are 1000 or similar
        if (code === '1000' || a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank')) cashBank += a.val;
    });

    var netIncome = income - expenses;
    var unpaidBills = (bills && bills.filter) ? bills.filter(b => b.status === 'Pending').sort((a,b)=>new Date(a.due)-new Date(b.due)) : [];
    var unpaidInvoices = (invoices && invoices.filter) ? invoices.filter(i => i.status === 'Sent').sort((a,b)=>new Date(a.due)-new Date(b.due)) : [];
    
    // Aggregate Last 6 Months (Income vs Expense)
    var monthlyData = {};
    var today = new Date();
    for(var i=5; i>=0; i--) {
        var d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[label] = { income: 0, expense: 0, sortKey: d.getTime() };
    }
    
    // Expense Breakdown
    var expenseBreakdown = {};
    
    entries.forEach(e => {
        if(!e.lines || !e.date) return;
        var dateObj = new Date(e.date);
        var label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        e.lines.forEach(l => {
            var type = l.account_type;
            var amount = (parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0);
            
            if(monthlyData[label]) {
                if(type === 'Revenue') {
                    monthlyData[label].income += -amount; // Revenue is normally a credit (-)
                } else if(type === 'Expense') {
                    monthlyData[label].expense += amount; // Expense is normally a debit (+)
                }
            }
            
            if(type === 'Expense' && amount > 0) {
                if(!expenseBreakdown[l.account_name]) expenseBreakdown[l.account_name] = 0;
                expenseBreakdown[l.account_name] += amount;
            }
        });
    });
    
    var sortedMonths = Object.keys(monthlyData).sort((a,b) => monthlyData[a].sortKey - monthlyData[b].sortKey);
    var labels = []; var incomeArr = []; var expenseArr = [];
    sortedMonths.forEach(m => {
        labels.push(m);
        incomeArr.push(monthlyData[m].income);
        expenseArr.push(monthlyData[m].expense);
    });
    
    var expSorted = Object.keys(expenseBreakdown).sort((a,b) => expenseBreakdown[b] - expenseBreakdown[a]).slice(0,10);
    var expLabels = []; var expData = [];
    expSorted.forEach(k => { expLabels.push(k); expData.push(expenseBreakdown[k]); });

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-chart-bar" style="color:var(--gold)"></i> <span>Finance Dashboard</span></p>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;margin-bottom:1.5rem">
            <div class="card" style="border-top:3px solid var(--navy)">
                <p style="font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Net Income</p>
                <h2 style="color:${netIncome>=0?'#10b981':'#ef4444'};margin-top:10px">${vuvFmt(netIncome)}</h2>
            </div>
            <div class="card" style="border-top:3px solid var(--gold)">
                <p style="font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Cash & Bank</p>
                <h2 style="color:var(--navy);margin-top:10px">${vuvFmt(cashBank)}</h2>
            </div>
            <div class="card" style="border-top:3px solid #10b981">
                <p style="font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Total Income</p>
                <h2 style="color:#10b981;margin-top:10px">${vuvFmt(income)}</h2>
            </div>
            <div class="card" style="border-top:3px solid #ef4444">
                <p style="font-size:12px;color:#888;text-transform:uppercase;font-weight:600">Total Expenses</p>
                <h2 style="color:#ef4444;margin-top:10px">${vuvFmt(expenses)}</h2>
            </div>
        </div>
        
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Income vs Expense (6 Months)</p>
                <div style="position:relative;height:250px;width:100%"><canvas id="fin-bar-chart"></canvas></div>
            </div>
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Expense Breakdown (All Time)</p>
                <div style="position:relative;height:250px;width:100%"><canvas id="fin-pie-chart"></canvas></div>
            </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><i class="ti ti-receipt"></i> Recent Unpaid Bills</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <tr style="background:#f8f9fa;text-align:left"><th style="padding:8px">Vendor</th><th style="padding:8px">Due Date</th><th style="padding:8px;text-align:right">Amount</th></tr>
                    ${unpaidBills.length===0 ? '<tr><td colspan="3" style="padding:15px;text-align:center;color:#888">No pending bills</td></tr>' : 
                      unpaidBills.map(b => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${b.vendor}</td><td style="padding:8px">${fmtDate(b.due)}</td><td style="padding:8px;text-align:right;color:#ef4444">VUV ${b.amount.toLocaleString()}</td></tr>`).join('')}
                </table>
            </div>
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><i class="ti ti-file-invoice"></i> Recent Unpaid Invoices</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <tr style="background:#f8f9fa;text-align:left"><th style="padding:8px">Client</th><th style="padding:8px">Due Date</th><th style="padding:8px;text-align:right">Amount</th></tr>
                    ${unpaidInvoices.length===0 ? '<tr><td colspan="3" style="padding:15px;text-align:center;color:#888">No pending invoices</td></tr>' : 
                      unpaidInvoices.map(i => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${i.client}</td><td style="padding:8px">${fmtDate(i.due)}</td><td style="padding:8px;text-align:right;color:#10b981">VUV ${i.amount.toLocaleString()}</td></tr>`).join('')}
                </table>
            </div>
        </div>
    `;
    
    // Render Charts
    setTimeout(() => {
        if(window.finBarChart) window.finBarChart.destroy();
        var ctxBar = document.getElementById('fin-bar-chart').getContext('2d');
        window.finBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Income', data: incomeArr, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Expense', data: expenseArr, backgroundColor: '#ef4444', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        
        if(window.finPieChart) window.finPieChart.destroy();
        var ctxPie = document.getElementById('fin-pie-chart').getContext('2d');
        window.finPieChart = new Chart(ctxPie, {
            type: 'bar',
            data: {
                labels: expLabels.length > 0 ? expLabels : ['No Expenses'],
                datasets: [{
                    label: 'Expenses',
                    data: expData.length > 0 ? expData : [1],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b', '#eab308', '#d946ef', '#06b6d4'],
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }, 100);
}

// ----------------------------------------------------
// DAILY INCOME
// ----------------------------------------------------

function renderFinanceDailyIncome() {
    var el = document.getElementById('section-finance-daily-income');
    var today = new Date().toISOString().split('T')[0];

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-trending-up" style="color:var(--gold)"></i> <span>Daily Income</span></p>

        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem" id="di-summary-cards">
            <div class="card" style="border-top:3px solid #10b981;text-align:center">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Today</p>
                <p id="di-today-total" style="font-size:22px;font-weight:800;color:#10b981">VUV 0</p>
            </div>
            <div class="card" style="border-top:3px solid var(--navy);text-align:center">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">This Week</p>
                <p id="di-week-total" style="font-size:22px;font-weight:800;color:var(--navy)">VUV 0</p>
            </div>
            <div class="card" style="border-top:3px solid var(--gold);text-align:center">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">This Month</p>
                <p id="di-month-total" style="font-size:22px;font-weight:800;color:var(--gold)">VUV 0</p>
            </div>
            <div class="card" style="border-top:3px solid #6366f1;text-align:center">
                <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Total Records</p>
                <p id="di-count" style="font-size:22px;font-weight:800;color:#6366f1">0</p>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <!-- Entry Form -->
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1.2rem;color:var(--navy)"><i class="ti ti-plus" style="color:var(--gold)"></i> Record Daily Income</p>
                <div style="margin-bottom:.85rem">
                    <label>Date</label>
                    <input type="date" id="di-date" value="${today}">
                </div>
                <div style="margin-bottom:.85rem">
                    <label>Income Source</label>
                    <select id="di-source">
                        <option value="Bar Sales">Bar Sales</option>
                        <option value="Food Sales">Food Sales</option>
                        <option value="Events / Functions">Events / Functions</option>
                        <option value="Room Hire">Room Hire</option>
                        <option value="Cover Charge">Cover Charge</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div style="margin-bottom:.85rem">
                    <label>Description / Notes</label>
                    <input type="text" id="di-desc" placeholder="e.g. Saturday night sales">
                </div>
                <div style="margin-bottom:.85rem">
                    <label>Amount (VUV)</label>
                    <input type="number" id="di-amount" placeholder="0" min="0" style="font-size:16px;font-weight:700">
                </div>
                <div style="margin-bottom:1rem">
                    <label>Payment Method</label>
                    <select id="di-method">
                        <option value="Cash">Cash</option>
                        <option value="Card / EFTPOS">Card / EFTPOS</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Mixed">Mixed</option>
                    </select>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="submitDailyIncome()">
                    <i class="ti ti-device-floppy"></i> Save & Post to Ledger
                </button>
                <p id="di-save-msg" style="display:none;color:#27500a;background:#ddf0dd;padding:7px 12px;border-radius:6px;font-size:12px;text-align:center;margin-top:.75rem">
                    <i class="ti ti-check"></i> Saved & posted to General Ledger!
                </p>
            </div>

            <!-- Records List -->
            <div class="card">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
                    <p style="font-size:13px;font-weight:700;color:var(--navy);margin:0"><i class="ti ti-list" style="color:var(--gold)"></i> Income Records</p>
                    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                        <select id="di-filter-source" onchange="refreshDailyIncomeList()" style="font-size:12px;padding:5px 8px;width:auto">
                            <option value="">All Sources</option>
                            <option>Bar Sales</option>
                            <option>Food Sales</option>
                            <option>Events / Functions</option>
                            <option>Room Hire</option>
                            <option>Cover Charge</option>
                            <option>Other</option>
                        </select>
                        <select id="di-filter-month" onchange="refreshDailyIncomeList()" style="font-size:12px;padding:5px 8px;width:auto">
                            <option value="">All Months</option>
                            <option>January</option><option>February</option><option>March</option>
                            <option>April</option><option>May</option><option>June</option>
                            <option>July</option><option>August</option><option>September</option>
                            <option>October</option><option>November</option><option>December</option>
                        </select>
                    </div>
                </div>
                <div id="di-list"></div>
            </div>
        </div>
    `;
    refreshDailyIncomeList();
}

async function submitDailyIncome() {
    var date   = document.getElementById('di-date').value;
    var source = document.getElementById('di-source').value;
    var desc   = document.getElementById('di-desc').value.trim();
    var amount = parseFloat(document.getElementById('di-amount').value) || 0;
    var method = document.getElementById('di-method').value;

    if (!date || !amount || amount <= 0) return alert('Please enter a valid date and amount.');

    var entry = {
        date,
        source,
        description: desc || source,
        amount,
        paymentMethod: method,
        recordedBy: APP.currentUser ? APP.currentUser.name : 'Staff'
    };

    DB.insert('finance_daily_income', entry);

    // Post to General Ledger: Debit Cash/Bank, Credit Sales Revenue
    var glLines = [
        { accountName: 'Cash / Bank', debit: amount, credit: 0 },
        { accountName: 'Sales Revenue', debit: 0, credit: amount }
    ];
    await postJournalEntry(
        'Daily Income: ' + source + (desc ? ' - ' + desc : ''),
        date,
        glLines
    );

    // Reset form
    document.getElementById('di-amount').value = '';
    document.getElementById('di-desc').value = '';

    // Show success
    var msg = document.getElementById('di-save-msg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);

    refreshDailyIncomeList();
}

function refreshDailyIncomeList() {
    var listEl = document.getElementById('di-list');
    if (!listEl) return;

    var records = DB.findAll('finance_daily_income') || [];
    var filterSource = (document.getElementById('di-filter-source') || {}).value || '';
    var filterMonth  = (document.getElementById('di-filter-month')  || {}).value || '';

    if (filterSource) records = records.filter(r => r.source === filterSource);
    if (filterMonth)  records = records.filter(r => {
        var d = new Date(r.date + 'T00:00:00');
        return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] === filterMonth;
    });

    records.sort((a,b) => new Date(b.date) - new Date(a.date));

    // Update summary cards
    var today  = new Date().toISOString().split('T')[0];
    var allRec = DB.findAll('finance_daily_income') || [];
    var now    = new Date();
    var weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6);

    var todayTotal = allRec.filter(r => r.date === today).reduce((s,r) => s + (parseFloat(r.amount)||0), 0);
    var weekTotal  = allRec.filter(r => new Date(r.date+'T00:00:00') >= weekAgo).reduce((s,r) => s + (parseFloat(r.amount)||0), 0);
    var monthTotal = allRec.filter(r => {
        var d = new Date(r.date+'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s,r) => s + (parseFloat(r.amount)||0), 0);

    var todayEl = document.getElementById('di-today-total');
    var weekEl  = document.getElementById('di-week-total');
    var monthEl = document.getElementById('di-month-total');
    var countEl = document.getElementById('di-count');
    if (todayEl) todayEl.textContent = 'VUV ' + Math.round(todayTotal).toLocaleString();
    if (weekEl)  weekEl.textContent  = 'VUV ' + Math.round(weekTotal).toLocaleString();
    if (monthEl) monthEl.textContent = 'VUV ' + Math.round(monthTotal).toLocaleString();
    if (countEl) countEl.textContent = allRec.length;

    if (records.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:2rem 0"><i class="ti ti-inbox" style="font-size:2rem;display:block;margin-bottom:.5rem"></i>No income records found.</p>';
        return;
    }

    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Payment</th><th>Amount</th><th>Recorded By</th><th>Action</th></tr></thead><tbody>';
    records.forEach(r => {
        var sourceColors = {
            'Bar Sales':'#10b981','Food Sales':'#f59e0b','Events / Functions':'#6366f1',
            'Room Hire':'#0ea5e9','Cover Charge':'#ec4899','Other':'#6b7280'
        };
        var col = sourceColors[r.source] || '#888';
        html += `<tr>
            <td style="white-space:nowrap">${fmtDate(r.date)}</td>
            <td><span style="background:${col}22;color:${col};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">${r.source}</span></td>
            <td>${r.description || '-'}</td>
            <td>${r.paymentMethod || '-'}</td>
            <td style="font-weight:800;color:#10b981">VUV ${parseFloat(r.amount||0).toLocaleString()}</td>
            <td style="color:#888;font-size:11px">${r.recordedBy || '-'}</td>
            <td><button onclick="deleteDailyIncome('${r._id}')" style="background:none;border:none;color:#e24b4a;cursor:pointer" title="Delete"><i class="ti ti-trash"></i></button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

function deleteDailyIncome(id) {
    if(!confirm('Delete this income record?')) return;
    DB.remove('finance_daily_income', {_id: id});
    refreshDailyIncomeList();
}

// ----------------------------------------------------
// BANKING
// ----------------------------------------------------

function renderFinanceBanking() {
    var el = document.getElementById('section-finance-banking');
    var today = new Date().toISOString().split('T')[0];

    // Seed a default bank account if none exist
    var accounts = DB.findAll('finance_bank_accounts') || [];
    if (accounts.length === 0) {
        DB.insert('finance_bank_accounts', { name: 'Main Operating Account', bank: 'ANZ Vanuatu', accountNo: '', balance: 0 });
        accounts = DB.findAll('finance_bank_accounts') || [];
    }

    var acctOptions = accounts.map(a => `<option value="${a._id}">${a.name} — ${a.bank}</option>`).join('');

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-building-bank" style="color:var(--gold)"></i> <span>Banking</span></p>

        <!-- Account Balance Cards -->
        <div id="bk-account-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-bottom:1.5rem"></div>

        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem;align-items:start">

            <!-- Left Panel: Record Transaction + Manage Accounts -->
            <div style="display:flex;flex-direction:column;gap:1rem">

                <!-- Record Transaction Form -->
                <div class="card">
                    <p style="font-size:13px;font-weight:700;margin-bottom:1.2rem;color:var(--navy)"><i class="ti ti-plus" style="color:var(--gold)"></i> Record Transaction</p>
                    <div style="margin-bottom:.85rem"><label>Date</label><input type="date" id="bk-date" value="${today}"></div>
                    <div style="margin-bottom:.85rem">
                        <label>Account</label>
                        <select id="bk-account">${acctOptions}</select>
                    </div>
                    <div style="margin-bottom:.85rem">
                        <label>Transaction Type</label>
                        <select id="bk-type" onchange="onBkTypeChange()">
                            <option value="Deposit">Deposit (Money In)</option>
                            <option value="Withdrawal">Withdrawal (Money Out)</option>
                            <option value="Transfer">Transfer to Another Account</option>
                            <option value="Bank Fee">Bank Fee / Charge</option>
                            <option value="Interest">Interest Earned</option>
                        </select>
                    </div>
                    <div id="bk-transfer-to-wrap" style="display:none;margin-bottom:.85rem">
                        <label>Transfer To Account</label>
                        <select id="bk-transfer-to">${acctOptions}</select>
                    </div>
                    <div style="margin-bottom:.85rem"><label>Description / Reference</label><input type="text" id="bk-desc" placeholder="e.g. Daily takings deposit"></div>
                    <div style="margin-bottom:1rem"><label>Amount (VUV)</label><input type="number" id="bk-amount" placeholder="0" min="0" style="font-size:16px;font-weight:700"></div>
                    <button class="btn btn-primary" style="width:100%" onclick="submitBankTransaction()">
                        <i class="ti ti-device-floppy"></i> Save & Post to Ledger
                    </button>
                    <p id="bk-save-msg" style="display:none;color:#27500a;background:#ddf0dd;padding:7px 12px;border-radius:6px;font-size:12px;text-align:center;margin-top:.75rem">
                        <i class="ti ti-check"></i> Saved & posted to General Ledger!
                    </p>
                </div>

                <!-- Manage Accounts -->
                <div class="card">
                    <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)"><i class="ti ti-adjustments-horizontal" style="color:var(--gold)"></i> Bank Accounts</p>
                    <div style="margin-bottom:.6rem"><input type="text" id="bk-new-name" placeholder="Account Name (e.g. Savings)"></div>
                    <div style="margin-bottom:.6rem"><input type="text" id="bk-new-bank" placeholder="Bank Name (e.g. BSP)"></div>
                    <div style="margin-bottom:.6rem"><input type="text" id="bk-new-acctno" placeholder="Account Number (optional)"></div>
                    <div style="margin-bottom:.85rem"><input type="number" id="bk-new-balance" placeholder="Opening Balance (VUV)" min="0"></div>
                    <button class="btn btn-outline" style="width:100%" onclick="addBankAccount()"><i class="ti ti-plus"></i> Add Account</button>
                    <div id="bk-accounts-list" style="margin-top:1rem"></div>
                </div>
            </div>

            <!-- Transactions List -->
            <div class="card">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
                    <p style="font-size:13px;font-weight:700;color:var(--navy);margin:0"><i class="ti ti-list" style="color:var(--gold)"></i> Transaction History</p>
                    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                        <select id="bk-filter-account" onchange="refreshBankTransactions()" style="font-size:12px;padding:5px 8px;width:auto">
                            <option value="">All Accounts</option>
                            ${accounts.map(a => `<option value="${a._id}">${a.name}</option>`).join('')}
                        </select>
                        <select id="bk-filter-type" onchange="refreshBankTransactions()" style="font-size:12px;padding:5px 8px;width:auto">
                            <option value="">All Types</option>
                            <option>Deposit</option>
                            <option>Withdrawal</option>
                            <option>Transfer</option>
                            <option>Bank Fee</option>
                            <option>Interest</option>
                        </select>
                    </div>
                </div>
                <div id="bk-tx-list"></div>
            </div>
        </div>
    `;

    refreshBankAccountCards();
    refreshBankAccountsList();
    refreshBankTransactions();
}

function onBkTypeChange() {
    var type = document.getElementById('bk-type').value;
    document.getElementById('bk-transfer-to-wrap').style.display = type === 'Transfer' ? 'block' : 'none';
}

function refreshBankAccountCards() {
    var el = document.getElementById('bk-account-cards');
    if (!el) return;
    var accounts = DB.findAll('finance_bank_accounts') || [];
    var txAll = DB.findAll('finance_bank_transactions') || [];

    var colors = ['#0ea5e9','#10b981','#6366f1','#f59e0b','#ec4899'];
    var html = '';
    accounts.forEach((a, i) => {
        var col = colors[i % colors.length];
        var txns = txAll.filter(t => t.accountId === a._id);
        var deposits    = txns.filter(t => t.type === 'Deposit' || t.type === 'Interest').reduce((s,t) => s+(parseFloat(t.amount)||0), 0);
        var withdrawals = txns.filter(t => t.type === 'Withdrawal' || t.type === 'Bank Fee').reduce((s,t) => s+(parseFloat(t.amount)||0), 0);
        var transfers_out = txAll.filter(t => t.type === 'Transfer' && t.accountId === a._id).reduce((s,t) => s+(parseFloat(t.amount)||0), 0);
        var transfers_in  = txAll.filter(t => t.type === 'Transfer' && t.transferToId === a._id).reduce((s,t) => s+(parseFloat(t.amount)||0), 0);
        var balance = (parseFloat(a.balance)||0) + deposits - withdrawals - transfers_out + transfers_in;

        html += `<div class="card" style="border-top:3px solid ${col}">
            <p style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">${a.bank}</p>
            <p style="font-size:14px;font-weight:700;color:#222;margin-bottom:6px">${a.name}</p>
            <p style="font-size:24px;font-weight:800;color:${col};margin-bottom:4px">VUV ${Math.round(balance).toLocaleString()}</p>
            <p style="font-size:10px;color:#aaa">${a.accountNo ? 'Acct: ' + a.accountNo : 'No account number'}</p>
            <button onclick="deleteBankAccount('${a._id}')" style="background:none;border:none;color:#e24b4a;cursor:pointer;font-size:11px;margin-top:6px"><i class="ti ti-trash"></i> Remove</button>
        </div>`;
    });
    el.innerHTML = html || '<p style="color:#888;font-size:12px">No bank accounts added yet.</p>';
}

function refreshBankAccountsList() {
    var el = document.getElementById('bk-accounts-list');
    if (!el) return;
    var accounts = DB.findAll('finance_bank_accounts') || [];
    if (accounts.length === 0) { el.innerHTML = ''; return; }
    var html = '<div style="border-top:1px solid #eee;padding-top:.75rem">';
    accounts.forEach(a => {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f5f5f5;font-size:12px">
            <span><b>${a.name}</b> <span style="color:#aaa">— ${a.bank}</span></span>
            <button onclick="deleteBankAccount('${a._id}')" style="background:none;border:none;color:#e24b4a;cursor:pointer"><i class="ti ti-trash"></i></button>
        </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
}

function addBankAccount() {
    var name    = (document.getElementById('bk-new-name').value || '').trim();
    var bank    = (document.getElementById('bk-new-bank').value || '').trim();
    var acctno  = (document.getElementById('bk-new-acctno').value || '').trim();
    var balance = parseFloat(document.getElementById('bk-new-balance').value) || 0;
    if (!name || !bank) return alert('Please enter an account name and bank name.');
    DB.insert('finance_bank_accounts', { name, bank, accountNo: acctno, balance });
    document.getElementById('bk-new-name').value = '';
    document.getElementById('bk-new-bank').value = '';
    document.getElementById('bk-new-acctno').value = '';
    document.getElementById('bk-new-balance').value = '';
    // Re-render to update dropdowns
    renderFinanceBanking();
}

function deleteBankAccount(id) {
    if (!confirm('Remove this bank account? Transactions will remain.')) return;
    DB.remove('finance_bank_accounts', {_id: id});
    renderFinanceBanking();
}

async function submitBankTransaction() {
    var date      = document.getElementById('bk-date').value;
    var accountId = document.getElementById('bk-account').value;
    var type      = document.getElementById('bk-type').value;
    var desc      = document.getElementById('bk-desc').value.trim();
    var amount    = parseFloat(document.getElementById('bk-amount').value) || 0;
    var transferToId = type === 'Transfer' ? (document.getElementById('bk-transfer-to').value || '') : '';

    if (!date || !accountId || !amount || amount <= 0) return alert('Please fill in the date, account, and a valid amount.');
    if (type === 'Transfer' && transferToId === accountId) return alert('Cannot transfer to the same account.');

    var accounts = DB.findAll('finance_bank_accounts') || [];
    var fromAcct = accounts.find(a => a._id === accountId);
    var toAcct   = transferToId ? accounts.find(a => a._id === transferToId) : null;

    var tx = { date, accountId, type, description: desc || type, amount, transferToId, recordedBy: APP.currentUser ? APP.currentUser.name : 'Staff' };
    DB.insert('finance_bank_transactions', tx);

    // GL Posting
    var glLines = [];
    var memo = (fromAcct ? fromAcct.name : 'Bank') + ': ' + type + (desc ? ' — ' + desc : '');

    if (type === 'Deposit') {
        // Debit Cash/Bank, Credit Sales Revenue (or could be a generic income)
        glLines = [
            { accountName: 'Cash / Bank', debit: amount, credit: 0 },
            { accountName: 'Sales Revenue', debit: 0, credit: amount }
        ];
    } else if (type === 'Withdrawal') {
        glLines = [
            { accountName: 'Miscellaneous Expense', debit: amount, credit: 0 },
            { accountName: 'Cash / Bank', debit: 0, credit: amount }
        ];
    } else if (type === 'Bank Fee') {
        glLines = [
            { accountName: 'Miscellaneous Expense', debit: amount, credit: 0 },
            { accountName: 'Cash / Bank', debit: 0, credit: amount }
        ];
    } else if (type === 'Interest') {
        glLines = [
            { accountName: 'Cash / Bank', debit: amount, credit: 0 },
            { accountName: 'Sales Revenue', debit: 0, credit: amount }
        ];
    } else if (type === 'Transfer') {
        // Internal transfer: Cash/Bank debit & credit (net zero, just records movement)
        glLines = [
            { accountName: 'Cash / Bank', debit: amount, credit: 0 },
            { accountName: 'Cash / Bank', debit: 0, credit: amount }
        ];
        memo = 'Bank Transfer: ' + (fromAcct ? fromAcct.name : 'Account') + ' → ' + (toAcct ? toAcct.name : 'Account') + (desc ? ' — ' + desc : '');
    }

    if (glLines.length > 0) {
        await postJournalEntry(memo, date, glLines);
    }

    // Reset amount & desc
    document.getElementById('bk-amount').value = '';
    document.getElementById('bk-desc').value = '';

    var msg = document.getElementById('bk-save-msg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);

    refreshBankAccountCards();
    refreshBankTransactions();
}

function refreshBankTransactions() {
    var el = document.getElementById('bk-tx-list');
    if (!el) return;

    var txns = DB.findAll('finance_bank_transactions') || [];
    var accounts = DB.findAll('finance_bank_accounts') || [];
    var acctMap = {};
    accounts.forEach(a => { acctMap[a._id] = a.name; });

    var filterAcct = (document.getElementById('bk-filter-account') || {}).value || '';
    var filterType = (document.getElementById('bk-filter-type') || {}).value || '';

    if (filterAcct) txns = txns.filter(t => t.accountId === filterAcct);
    if (filterType) txns = txns.filter(t => t.type === filterType);
    txns.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (txns.length === 0) {
        el.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:2rem 0"><i class="ti ti-inbox" style="font-size:2rem;display:block;margin-bottom:.5rem"></i>No transactions recorded.</p>';
        return;
    }

    var typeColors = {
        'Deposit':'#10b981','Withdrawal':'#e24b4a','Transfer':'#6366f1',
        'Bank Fee':'#f59e0b','Interest':'#0ea5e9'
    };
    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Description</th><th>Amount</th><th>Recorded By</th><th>Action</th></tr></thead><tbody>';
    txns.forEach(t => {
        var col = typeColors[t.type] || '#888';
        var isOut = t.type === 'Withdrawal' || t.type === 'Bank Fee';
        var amtColor = isOut ? '#e24b4a' : '#10b981';
        var amtPrefix = isOut ? '− ' : '+ ';
        var acctName = acctMap[t.accountId] || 'Unknown';
        if (t.type === 'Transfer' && t.transferToId) {
            acctName += ' → ' + (acctMap[t.transferToId] || '?');
        }
        html += `<tr>
            <td style="white-space:nowrap">${fmtDate(t.date)}</td>
            <td style="font-size:11px">${acctName}</td>
            <td><span style="background:${col}22;color:${col};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">${t.type}</span></td>
            <td>${t.description || '-'}</td>
            <td style="font-weight:800;color:${amtColor}">${amtPrefix}VUV ${parseFloat(t.amount||0).toLocaleString()}</td>
            <td style="color:#888;font-size:11px">${t.recordedBy || '-'}</td>
            <td><button onclick="deleteBankTx('${t._id}')" style="background:none;border:none;color:#e24b4a;cursor:pointer" title="Delete"><i class="ti ti-trash"></i></button></td>
        </tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;
}

function deleteBankTx(id) {
    if (!confirm('Delete this transaction?')) return;
    DB.remove('finance_bank_transactions', {_id: id});
    refreshBankAccountCards();
    refreshBankTransactions();
}

// ----------------------------------------------------
// EXPENSE MANAGEMENT
// ----------------------------------------------------

function renderFinanceExpenses() {
    var el = document.getElementById('section-finance-expenses');
    var depts = DB.findAll('departments') || [];
    var deptOptions = '<option value="">-- Select Department --</option>';
    depts.forEach(d => { deptOptions += '<option value="'+d.name+'">'+d.name+'</option>'; });
    
    var cats = DB.findAll('finance_expense_cats') || [];
    if(cats.length === 0) {
        ['Office Supplies', 'Travel', 'Fuel', 'Utilities', 'Repairs', 'Other'].forEach(c => DB.insert('finance_expense_cats', {name: c}));
        cats = DB.findAll('finance_expense_cats') || [];
    }
    var catOptions = '';
    cats.forEach(c => { catOptions += '<option value="'+c.name+'">'+c.name+'</option>'; });

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-receipt" style="color:var(--gold)"></i> <span>Expense Management</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Add New Expense</p>
                <div style="margin-bottom:.85rem">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                        <label style="margin:0">Category</label>
                        <a href="javascript:void(0)" onclick="openExpenseCatModal()" style="font-size:11px;color:var(--navy)">Manage</a>
                    </div>
                    <select id="f-exp-cat">${catOptions}</select>
                </div>
                <div style="margin-bottom:.85rem"><label>Description</label><input type="text" id="f-exp-desc" placeholder="Details..."></div>
                <div style="margin-bottom:.85rem"><label>Amount (VUV)</label><input type="number" id="f-exp-amount" placeholder="0"></div>
                <div style="margin-bottom:1rem"><label>Department</label><select id="f-exp-dept">${deptOptions}</select></div>
                <button class="btn btn-primary" onclick="submitExpense()">Submit Expense</button>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Recent Expenses</p>
                <div id="f-exp-list"></div>
            </div>
        </div>
        
        <!-- Category Management Modal -->
        <div id="modal-exp-cats" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;align-items:center;justify-content:center">
            <div style="background:#fff;padding:2rem;border-radius:8px;width:400px;max-width:90%">
                <h3 style="margin-top:0">Manage Expense Categories</h3>
                <div style="display:flex;gap:10px;margin-bottom:1rem">
                    <input type="text" id="new-exp-cat" placeholder="New Category Name" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px">
                    <button class="btn btn-primary" onclick="addExpenseCategory()">Add</button>
                </div>
                <div id="exp-cat-list" style="max-height:250px;overflow-y:auto;border:1px solid #eee;border-radius:4px"></div>
                <div style="display:flex;justify-content:flex-end;margin-top:1rem">
                    <button class="btn btn-outline" onclick="closeExpenseCatModal()">Done</button>
                </div>
            </div>
        </div>
    `;
    refreshExpenseList();
}

function openExpenseCatModal() {
    document.getElementById('modal-exp-cats').style.display = 'flex';
    refreshExpenseCatList();
}

function closeExpenseCatModal() {
    document.getElementById('modal-exp-cats').style.display = 'none';
    renderFinanceExpenses(); // re-render to update the dropdown
}

function refreshExpenseCatList() {
    var cats = DB.findAll('finance_expense_cats') || [];
    var html = '<table class="table" style="width:100%;font-size:12px;margin:0">';
    cats.forEach(c => {
        html += `<tr>
            <td style="padding:8px">${c.name}</td>
            <td style="text-align:right;padding:8px">
                <button onclick="deleteExpenseCategory('${c._id}')" style="background:none;border:none;color:#ef4444;cursor:pointer"><i class="ti ti-trash"></i></button>
            </td>
        </tr>`;
    });
    html += '</table>';
    document.getElementById('exp-cat-list').innerHTML = html;
}

function addExpenseCategory() {
    var name = document.getElementById('new-exp-cat').value.trim();
    if(!name) return;
    DB.insert('finance_expense_cats', {name});
    document.getElementById('new-exp-cat').value = '';
    refreshExpenseCatList();
}

function deleteExpenseCategory(id) {
    if(confirm('Delete this category?')) {
        DB.remove('finance_expense_cats', {_id: id});
        refreshExpenseCatList();
    }
}

function submitExpense() {
    var cat = document.getElementById('f-exp-cat').value;
    var desc = document.getElementById('f-exp-desc').value.trim();
    var amount = document.getElementById('f-exp-amount').value;
    var dept = document.getElementById('f-exp-dept').value;
    if (!desc || !amount || !dept) return alert('Please fill all fields.');

    var exp = {
        category: cat,
        description: desc,
        amount: parseFloat(amount),
        department: dept,
        status: 'Pending',
        submittedBy: APP.currentUser.name,
        date: new Date().toISOString()
    };
    
    DB.insert('finance_expenses', exp);
    document.getElementById('f-exp-desc').value = '';
    document.getElementById('f-exp-amount').value = '';
    refreshExpenseList();
}

function refreshExpenseList() {
    var listEl = document.getElementById('f-exp-list');
    var expenses = DB.findAll('finance_expenses') || [];
    if (expenses.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:1rem 0">No expenses recorded.</p>';
        return;
    }
    expenses.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Dept</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    expenses.forEach(e => {
        var statusColor = e.status==='Approved'?'#10b981':(e.status==='Rejected'?'#e24b4a':'#f59e0b');
        var btn = '';
        if (e.status === 'Pending' && (APP.currentUser.role === 'admin' || APP.currentUser.role === 'manager')) {
            btn = `<button onclick="updateExpenseStatus('${e._id}', 'Approved')" style="background:transparent;border:none;color:#10b981;cursor:pointer;margin-right:5px" title="Approve"><i class="ti ti-check"></i></button>` +
                  `<button onclick="updateExpenseStatus('${e._id}', 'Rejected')" style="background:transparent;border:none;color:#e24b4a;cursor:pointer" title="Reject"><i class="ti ti-x"></i></button>`;
        } else if (e.status === 'Approved' && (APP.currentUser.role === 'admin' || APP.currentUser.role === 'manager')) {
            btn = '<span style="font-size:10px;color:#aaa">By ' + (e.approvedBy || 'Admin') + '</span>';
        }
        html += `<tr>
            <td>${fmtDate(e.date)}</td>
            <td>${e.category}</td>
            <td>${e.description}</td>
            <td>${e.department}</td>
            <td style="font-weight:700">VUV ${parseFloat(e.amount).toLocaleString()}</td>
            <td style="color:${statusColor};font-weight:600">${e.status}</td>
            <td>${btn}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

async function updateExpenseStatus(id, status) {
    if(!(await uiConfirm('Mark expense as ' + status + '?'))) return;
    DB.update('finance_expenses', {_id: id}, {status: status, approvedBy: APP.currentUser.name});
    
    if(status === 'Approved') {
        var e = (DB.findAll('finance_expenses') || []).find(x => x._id === id);
        if(e) {
            try {
                var res = await fetch('/api/fin/journals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
                    body: JSON.stringify({
                        reference: 'EXP-' + e._id.substring(0,6).toUpperCase(),
                        description: 'Expense Approved: ' + e.category + ' (' + e.description + ')',
                        date: e.date,
                        lines: [
                            { account_name: e.category, debit: e.amount, credit: 0 },
                            { account_name: 'Accounts Payable', debit: 0, credit: e.amount }
                        ]
                    })
                });
                if (!res.ok) {
                    var errData = await res.json();
                    uiAlert('Failed to update GL: ' + (errData.error || 'Unknown error'));
                    return; // Stop and don't refresh if it failed
                }
            } catch (err) {
                uiAlert('Fetch error: ' + err.message);
                return;
            }
        }
    }
    
    refreshExpenseList();
}


// ----------------------------------------------------
// PETTY CASH
// ----------------------------------------------------

function renderFinancePettyCash() {
    var el = document.getElementById('section-finance-petty-cash');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-wallet" style="color:var(--gold)"></i> <span>Petty Cash Management</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div style="display:flex;flex-direction:column;gap:1rem">
                <div class="card" style="height:fit-content">
                    <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Create Fund</p>
                    <div style="margin-bottom:.85rem"><label>Fund Name</label><input type="text" id="f-pc-name" placeholder="e.g. Office Front Desk"></div>
                    <div style="margin-bottom:.85rem"><label>Initial Balance (VUV)</label><input type="number" id="f-pc-bal" placeholder="0"></div>
                    <button class="btn btn-primary" onclick="createPettyCashFund()">Create Fund</button>
                </div>
                <div class="card" style="height:fit-content">
                    <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Record Transaction</p>
                    <div style="margin-bottom:.85rem"><label>Select Fund</label><select id="f-pc-fund"></select></div>
                    <div style="margin-bottom:.85rem"><label>Type</label><select id="f-pc-type">
                        <option value="Expense">Expense (Deduct)</option>
                        <option value="Replenish">Replenish (Add)</option>
                    </select></div>
                    <div style="margin-bottom:.85rem"><label>Amount (VUV)</label><input type="number" id="f-pc-amount" placeholder="0"></div>
                    <div style="margin-bottom:.85rem"><label>Description</label><input type="text" id="f-pc-desc" placeholder="Details..."></div><div style="margin-bottom:.85rem"><label>Receipt</label><input type="file" id="f-pc-receipt" accept="image/*,.pdf" style="width:100%;font-size:12px;padding:4px"></div>
                    <button class="btn btn-primary" onclick="recordPettyCashTx()">Record Transaction</button>
                </div>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Active Funds & History</p>
                <div id="f-pc-funds-list" style="margin-bottom:1rem;display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:.5rem"></div>
                <div id="f-pc-tx-list"></div>
            </div>
        </div>
    `;
    refreshPettyCashUI();
}

function createPettyCashFund() {
    var name = document.getElementById('f-pc-name').value.trim();
    var bal = document.getElementById('f-pc-bal').value;
    if(!name || !bal) return alert('Please fill all fields');
    DB.insert('finance_petty_cash_funds', {
        name: name,
        balance: parseFloat(bal),
        createdAt: new Date().toISOString()
    });
    document.getElementById('f-pc-name').value = '';
    document.getElementById('f-pc-bal').value = '';
    refreshPettyCashUI();
}

function recordPettyCashTx() {
    var fundId = document.getElementById('f-pc-fund').value;
    var type = document.getElementById('f-pc-type').value;
    var amount = parseFloat(document.getElementById('f-pc-amount').value);
    var desc = document.getElementById('f-pc-desc').value.trim();
    if(!fundId || !amount || !desc) return alert('Please fill all fields');
    var fund = DB.findOne('finance_petty_cash_funds', {_id: fundId});
    if(!fund) return alert('Fund not found');
    if(type === 'Expense' && fund.balance < amount) return alert('Insufficient balance in this fund!');

    var fileInput = document.getElementById('f-pc-receipt');
    if(fileInput && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { doTxInsert(e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        doTxInsert(null);
    }

    function doTxInsert(b64) {
        var newBal = type === 'Expense' ? fund.balance - amount : fund.balance + amount;
        DB.update('finance_petty_cash_funds', {_id: fundId}, {balance: newBal});
        DB.insert('finance_petty_cash_transactions', {
            fundId: fundId, fundName: fund.name, type: type, amount: amount, description: desc, 
            user: APP.currentUser.name, date: new Date().toISOString(), receipt: b64
        });
        document.getElementById('f-pc-amount').value = '';
        document.getElementById('f-pc-desc').value = '';
        if(document.getElementById('f-pc-receipt')) document.getElementById('f-pc-receipt').value='';
        refreshPettyCashUI();
    }
}

function refreshPettyCashUI() {
    var funds = DB.findAll('finance_petty_cash_funds') || [];
    var fundSel = document.getElementById('f-pc-fund');
    var fundsList = document.getElementById('f-pc-funds-list');
    
    if(fundSel) {
        fundSel.innerHTML = '<option value="">-- Select Fund --</option>';
        funds.forEach(f => {
            fundSel.innerHTML += '<option value="'+f._id+'">'+f.name+' (VUV '+f.balance.toLocaleString()+')</option>';
        });
    }

    if(fundsList) {
        fundsList.innerHTML = '';
        funds.forEach(f => {
            fundsList.innerHTML += `
                <div style="background:#f8f9fb;border:1px solid #e2e8f0;border-radius:6px;padding:10px;text-align:center">
                    <p style="font-size:12px;color:var(--navy);font-weight:700">${f.name}</p>
                    <p style="font-size:16px;color:#10b981;font-weight:800;margin-top:5px">VUV ${parseFloat(f.balance).toLocaleString()}</p>
                </div>
            `;
        });
    }

    var txList = document.getElementById('f-pc-tx-list');
    var txs = DB.findAll('finance_petty_cash_transactions') || [];
    txs.sort((a,b) => new Date(b.date) - new Date(a.date));

    if(txList) {
        if(txs.length === 0) {
            txList.innerHTML = '<p style="color:#888;font-size:12px;text-align:center">No transactions yet.</p>';
        } else {
            var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Fund</th><th>Type</th><th>Description</th><th>Amount</th><th>User</th></tr></thead><tbody>';
            txs.forEach(t => {
                var color = t.type === 'Expense' ? '#e24b4a' : '#10b981';
                var sign = t.type === 'Expense' ? '-' : '+';
                html += `<tr>
                    <td>${fmtDate(t.date)}</td>
                    <td>${t.fundName}</td>
                    <td style="color:${color};font-weight:600">${t.type}</td>
                    <td>${t.description}</td>
                    <td style="font-weight:700">${sign} VUV ${parseFloat(t.amount).toLocaleString()}</td>
                    <td>${t.user}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            txList.innerHTML = html;
        }
    }
}


// ----------------------------------------------------
// REIMBURSEMENTS
// ----------------------------------------------------

function renderFinanceReimbursements() {
    var el = document.getElementById('section-finance-reimbursements');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-cash" style="color:var(--gold)"></i> <span>Reimbursements & Claims</span></p>
        <div class="card">
            <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Pending Reimbursements</p>
            <div id="f-reimb-list"></div>
        </div>
    `;
    refreshReimbursements();
}

async function refreshReimbursements() {
    var listEl = document.getElementById('f-reimb-list');
    if (!listEl) return;
    listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:1rem 0">Loading...</p>';

    var claims = DB.findAll('finance_reimbursements') || [];

    // Fetch live HR requests from server to get accurate financePaid state
    try {
        var hrRes = await fetch('/api/hr_requests', {
            headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }
        });
        var hrReqs = hrRes.ok ? await hrRes.json() : (DB.findAll('hr_requests') || []);
        hrReqs.forEach(req => {
            if(req.type === 'Medical Claim' && req.status === 'Approved' && !req.financePaid) {
                claims.push({
                    _id: 'HR_' + req._id,
                    hrRef: req._id,
                    date: (req._created ? req._created.split('T')[0] : req.startDate),
                    staffName: req.staff || req.staffName || 'Unknown',
                    type: 'Medical Claim',
                    description: req.notes || 'Medical Claim Reimbursement',
                    amount: req.amount || req.medicalAmount || 0,
                    status: 'Pending Payout'
                });
            }
        });
    } catch(e) {
        // fallback to MEMORY_DB
        var hrReqsFallback = DB.findAll('hr_requests') || [];
        hrReqsFallback.forEach(req => {
            if(req.type === 'Medical Claim' && req.status === 'Approved' && !req.financePaid) {
                claims.push({
                    _id: 'HR_' + req._id,
                    hrRef: req._id,
                    date: (req._created ? req._created.split('T')[0] : req.startDate),
                    staffName: req.staff || req.staffName || 'Unknown',
                    type: 'Medical Claim',
                    description: req.notes || 'Medical Claim Reimbursement',
                    amount: req.amount || req.medicalAmount || 0,
                    status: 'Pending Payout'
                });
            }
        });
    }

    if (claims.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center;padding:1rem 0">No pending reimbursements.</p>';
        return;
    }

    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Staff</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    claims.forEach(c => {
        var btn = `<button onclick="markReimbursed('${c._id}')" class="btn btn-sm btn-primary">Mark Paid</button>`;
        html += `<tr>
            <td>${fmtDate(c.date)}</td>
            <td>${c.staffName}</td>
            <td>${c.type}</td>
            <td>${c.description}</td>
            <td style="font-weight:700">VUV ${parseFloat(c.amount || 0).toLocaleString()}</td>
            <td style="color:#f59e0b;font-weight:600">${c.status}</td>
            <td>${btn}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
}


async function markReimbursed(id) {
    if(!confirm('Mark this claim as paid/reimbursed?')) return;
    
    if(id.startsWith('HR_')) {
        var hrId = id.substring(3);
        try {
            var res = await fetch('/api/fin/mark-paid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
                body: JSON.stringify({ hrId: hrId })
            });
            var data = await res.json();
            if (!res.ok) {
                alert('Failed to mark as paid: ' + (data.error || res.statusText));
                return;
            }
            // Also update local MEMORY_DB so UI refreshes correctly
            DB.update('hr_requests', {_id: hrId}, {financePaid: true, financePaidDate: new Date().toISOString()});
        } catch(e) {
            alert('Error: ' + e.message);
            return;
        }
    } else {
        var claim = DB.findOne('finance_reimbursements', {_id: id});
        var amount = claim ? (parseFloat(claim.amount) || 0) : 0;
        var memo = 'General Reimbursement - ' + (claim ? (claim.staffName || 'Staff') : 'Staff');
        DB.update('finance_reimbursements', {_id: id}, {status: 'Paid', paidDate: new Date().toISOString()});
        
        if (amount > 0) {
            var lines = [
                { accountName: 'Miscellaneous Expense', debit: amount },
                { accountName: 'Cash / Bank', credit: amount }
            ];
            await postJournalEntry(memo, new Date().toISOString(), lines);
        }
    }
    
    refreshReimbursements();
    // Refresh GL view if open
    var glEl = document.getElementById('f-gl-list');
    if (glEl) refreshGL();
}


// ----------------------------------------------------
// CHART OF ACCOUNTS
// ----------------------------------------------------
var DEFAULT_COA = [
    { code: '1000', name: 'Cash', type: 'Asset' },
    { code: '1100', name: 'Bank Account', type: 'Asset' },
    { code: '1200', name: 'Accounts Receivable', type: 'Asset' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability' },
    { code: '2100', name: 'PAYE Payable', type: 'Liability' },
    { code: '2101', name: 'VNPF Payable', type: 'Liability' },
    { code: '2102', name: 'Salary Payable', type: 'Liability' },
    { code: '3000', name: 'Retained Earnings', type: 'Equity' },
    { code: '4000', name: 'Sales Revenue', type: 'Income' },
    { code: '4100', name: 'Services Revenue', type: 'Income' },
    { code: '5000', name: 'Salary Expense', type: 'Expense' },
    { code: '5100', name: 'Office Supplies', type: 'Expense' },
    { code: '5200', name: 'Travel Expense', type: 'Expense' },
    { code: '5300', name: 'Utilities', type: 'Expense' }
];

function initCOA() {
    var accounts = DB.findAll('finance_accounts') || [];
    if (accounts.length === 0) {
        DEFAULT_COA.forEach(acc => {
            DB.insert('finance_accounts', acc);
        });
    }
}

async function renderFinanceCOA() {
    var el = document.getElementById('section-finance-coa');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-list-tree" style="color:var(--gold)"></i> <span>Chart of Accounts</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Add Account</p>
                <div style="margin-bottom:.85rem"><label>Account Code</label><input type="text" id="f-coa-code" placeholder="e.g. 1010"></div>
                <div style="margin-bottom:.85rem"><label>Account Name</label><input type="text" id="f-coa-name" placeholder="e.g. Petty Cash"></div>
                <div style="margin-bottom:1rem"><label>Type</label><select id="f-coa-type">
                    <option>Asset</option><option>Liability</option><option>Equity</option><option>Revenue</option><option>Expense</option>
                </select></div>
                <button class="btn btn-primary" onclick="addAccount()">Add Account</button>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Chart of Accounts</p>
                <div id="f-coa-list"><p>Loading...</p></div>
            </div>
        </div>
    `;
    await refreshCOA();
}

async function addAccount() {
    var code = document.getElementById('f-coa-code').value.trim();
    var name = document.getElementById('f-coa-name').value.trim();
    var type = document.getElementById('f-coa-type').value;
    if(!code || !name) return alert('Fill all fields');
    
    const res = await fetch('/api/fin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
        body: JSON.stringify({ code, name, type })
    });
    if(res.ok) {
        document.getElementById('f-coa-code').value = '';
        document.getElementById('f-coa-name').value = '';
        await refreshCOA();
    } else {
        alert("Error adding account");
    }
}

async function refreshCOA() {
    var listEl = document.getElementById('f-coa-list');
    const res = await fetch('/api/fin/accounts', {
        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }
    });
    if(!res.ok) return;
    const accounts = await res.json();
    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Code</th><th>Name</th><th>Type</th></tr></thead><tbody>';
    accounts.forEach(a => {
        html += `<tr><td>${a.code}</td><td style="font-weight:600">${a.name}</td><td>${a.type}</td></tr>`;
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

// ----------------------------------------------------
// GENERAL LEDGER
// ----------------------------------------------------

async function postJournalEntry(memo, date, lines) {
    initCOA();
    var totalDebit = 0;
    var totalCredit = 0;
    var apiLines = [];
    lines.forEach(l => {
        var d = parseFloat(l.debit || 0);
        var c = parseFloat(l.credit || 0);
        totalDebit += d;
        totalCredit += c;
        apiLines.push({
            account_name: l.accountName || l.account_name,
            debit: d,
            credit: c
        });
    });
    // Ensure balance (allowing small rounding diffs)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.error('Journal entry out of balance!', lines);
        return false;
    }
    
    try {
        var res = await fetch('/api/fin/journals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') },
            body: JSON.stringify({
                reference: 'JE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                description: memo,
                date: date || new Date().toISOString(),
                lines: apiLines
            })
        });
        if (!res.ok) {
            console.error('Failed to post to GL', await res.text());
            return false;
        }
    } catch(e) {
        console.error(e);
        return false;
    }
    return true;
}

async function renderFinanceGL() {
    var el = document.getElementById('section-finance-gl');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-book-2" style="color:var(--gold)"></i> <span>General Ledger</span></p>
        <div class="card">
            <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Journal Entries (Automated)</p>
            <div id="f-gl-list"></div>
        </div>
    `;
    await refreshGL();
}

function showManualJEDialog() {
    document.getElementById('je-memo').value = '';
    document.getElementById('je-date').value = new Date().toISOString().substring(0,10);
    document.getElementById('je-lines-container').innerHTML = '';
    addJELine();
    addJELine();
    document.getElementById('modal-je').style.display = 'flex';
}

function addJELine() {
    var accounts = DB.findAll('finance_accounts') || [];
    var accOpts = '<option value="">-- Select Account --</option>';
    accounts.forEach(a => { accOpts += `<option value="${a.name}">${a.code} - ${a.name}</option>`; });
    
    var div = document.createElement('div');
    div.className = 'je-line';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <select class="je-acc" style="flex:2;padding:6px">${accOpts}</select>
        <input type="number" class="je-dr" placeholder="Debit" style="flex:1;padding:6px">
        <input type="number" class="je-cr" placeholder="Credit" style="flex:1;padding:6px">
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:red;cursor:pointer"><i class="ti ti-trash"></i></button>
    `;
    document.getElementById('je-lines-container').appendChild(div);
}

async function saveManualJE() {
    var memo = document.getElementById('je-memo').value.trim();
    var date = document.getElementById('je-date').value;
    if(!memo || !date) return alert('Enter Memo and Date');
    
    var lines = [];
    var lineNodes = document.querySelectorAll('.je-line');
    var hasError = false;
    
    lineNodes.forEach(node => {
        var acc = node.querySelector('.je-acc').value;
        var dr = parseFloat(node.querySelector('.je-dr').value) || 0;
        var cr = parseFloat(node.querySelector('.je-cr').value) || 0;
        if(acc && (dr > 0 || cr > 0)) {
            lines.push({ accountName: acc, debit: dr, credit: cr });
        }
    });
    
    if(lines.length < 2) return alert('At least two lines required.');
    
    var success = await postJournalEntry(memo, date, lines);
    if(success) {
        document.getElementById('modal-je').style.display = 'none';
        refreshGL();
        refreshReports();
        refreshBudget();
    } else {
        alert('Entry is out of balance. Check Debits and Credits.');
    }
}

async function refreshGL() {
    var listEl = document.getElementById('f-gl-list');
    listEl.innerHTML = '<p>Loading...</p>';
    
    const res = await fetch('/api/fin/journals', {
        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }
    });
    if(!res.ok) return;
    const entries = await res.json();
    
    if(entries.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center">No journal entries found.</p>';
        return;
    }
    
    var isAdmin = (APP && APP.currentUser && APP.currentUser.role === 'admin');
    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Ref</th><th>Memo</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>';
    
    entries.forEach(e => {
        var first = true;
        e.lines.forEach((l) => {
            html += `<tr style="${first?'border-top:2px solid #e2e8f0':''}">
                <td style="color:#666">${first ? fmtDate(e.date) : ''}</td>
                <td style="color:#666;font-size:10px">${first ? e.reference : ''}</td>
                <td style="color:#666">${first ? e.description : ''}</td>
                <td style="font-weight:600">${l.account_code} - ${l.account_name}</td>
                <td style="color:#10b981">${l.debit ? l.debit.toLocaleString() : ''}</td>
                <td style="color:#e24b4a">${l.credit ? l.credit.toLocaleString() : ''}</td>
            </tr>`;
            first = false;
        });
    });
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

// ----------------------------------------------------
// BUDGETING
// ----------------------------------------------------

function renderFinanceBudget() {
    var el = document.getElementById('section-finance-budget');
    var depts = DB.findAll('departments') || [];
    var deptOptions = '<option value="">-- Select Department --</option>';
    depts.forEach(d => { deptOptions += '<option value="'+d.name+'">'+d.name+'</option>'; });

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-target" style="color:var(--gold)"></i> <span>Budgeting Dashboard</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Set Monthly Budget</p>
                <div style="margin-bottom:.85rem"><label>Department</label><select id="f-bud-dept">${deptOptions}</select></div>
                <div style="margin-bottom:.85rem"><label>Monthly Limit (VUV)</label><input type="number" id="f-bud-amount" placeholder="0"></div>
                <button class="btn btn-primary" onclick="setBudget()">Set Budget</button>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Department Budgets vs Actuals</p>
                <div id="f-bud-list"></div>
            </div>
        </div>
    `;
    refreshBudget();
}

function setBudget() {
    var dept = document.getElementById('f-bud-dept').value;
    var amount = parseFloat(document.getElementById('f-bud-amount').value);
    if(!dept || !amount) return alert('Fill all fields');
    
    var existing = DB.findOne('finance_budgets', {department: dept});
    if (existing) {
        DB.update('finance_budgets', {_id: existing._id}, {amount: amount});
    } else {
        DB.insert('finance_budgets', {department: dept, amount: amount});
    }
    refreshBudget();
}

function refreshBudget() {
    var listEl = document.getElementById('f-bud-list');
    var budgets = DB.findAll('finance_budgets') || [];
    var lines = DB.findAll('finance_journal_lines') || [];
    
    // Calculate actual expenses per department
    var actuals = {};
    lines.forEach(l => {
        if(l.department && l.debit > 0) {
            actuals[l.department] = (actuals[l.department] || 0) + l.debit;
        }
    });

    if(budgets.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center">No budgets set.</p>';
        return;
    }

    var html = '';
    budgets.forEach(b => {
        var spent = actuals[b.department] || 0;
        var pct = (spent / b.amount) * 100;
        var color = pct > 90 ? '#e24b4a' : (pct > 75 ? '#f59e0b' : '#10b981');
        
        html += `<div style="margin-bottom:1rem;background:#f8f9fb;padding:10px;border-radius:6px;border:1px solid #e2e8f0">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
                <strong style="color:var(--navy)">${b.department}</strong>
                <span style="font-size:11px;color:#666">Spent: <b>VUV ${spent.toLocaleString()}</b> / VUV ${b.amount.toLocaleString()}</span>
            </div>
            <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden">
                <div style="width:${Math.min(pct, 100)}%;height:100%;background:${color};border-radius:4px"></div>
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
}

// ----------------------------------------------------
// FINANCIAL REPORTS
// ----------------------------------------------------

function renderFinanceReports() {
    var el = document.getElementById('section-finance-reports');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-report-money" style="color:var(--gold)"></i> <span>Financial Reports</span></p>
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
    refreshReports();
}

async function refreshReports() {
    var plEl = document.getElementById('f-rep-pl');
    var bsEl = document.getElementById('f-rep-bs');
    if(!plEl || !bsEl) return;
    
    plEl.innerHTML = '<p>Loading...</p>';
    bsEl.innerHTML = '<p>Loading...</p>';
    
    const [accRes, jnlRes] = await Promise.all([
        fetch('/api/fin/accounts', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }}),
        fetch('/api/fin/journals', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }})
    ]);
    if(!accRes.ok || !jnlRes.ok) return;
    
    const accounts = await accRes.json();
    const entries = await jnlRes.json();
    
    // Calculate balance per account
    var balances = {};
    entries.forEach(e => {
        e.lines.forEach(l => {
            if(!balances[l.account_code]) balances[l.account_code] = 0;
            balances[l.account_code] += parseFloat(l.debit || 0);
            balances[l.account_code] -= parseFloat(l.credit || 0);
        });
    });

    var income = 0; var expenses = 0;
    var assets = 0; var liabilities = 0; var equity = 0;
    
    var plHtml = '<table class="table" style="width:100%;font-size:12px;border-collapse:collapse">';
    var bsHtml = '<table class="table" style="width:100%;font-size:12px;border-collapse:collapse">';

    // helper
    var addRow = (name, amount, isTotal) => `<tr><td style="padding:6px;${isTotal?'font-weight:700;border-top:2px solid #ccc':''}"><div style="${isTotal?'':'padding-left:10px'}">${name}</div></td><td style="text-align:right;padding:6px;${isTotal?'font-weight:700;border-top:2px solid #ccc':''}">${vuvFmt(amount)}</td></tr>`;

    accounts.forEach(a => {
        var bal = balances[a.code] || 0;
        if(bal === 0) return;
        
        // Revenue is normally Credit, Expenses are Debit
        if(a.type === 'Revenue') { var v = -bal; income += v; plHtml += addRow(a.code + ' - ' + a.name, v); }
        if(a.type === 'Expense') { var v = bal; expenses += v; plHtml += addRow(a.code + ' - ' + a.name, v); }
        
        // Assets Debit, Liab/Equity Credit
        if(a.type === 'Asset') { var v = bal; assets += v; bsHtml += addRow(a.code + ' - ' + a.name, v); }
        if(a.type === 'Liability') { var v = -bal; liabilities += v; bsHtml += addRow(a.code + ' - ' + a.name, v); }
        if(a.type === 'Equity') { var v = -bal; equity += v; bsHtml += addRow(a.code + ' - ' + a.name, v); }
    });
    
    var netIncome = income - expenses;
    plHtml += addRow('Total Revenue', income, true);
    plHtml += addRow('Total Expenses', expenses, true);
    plHtml += addRow('Net Income (Profit)', netIncome, true);
    plHtml += '</table>';
    
    bsHtml += addRow('Total Assets', assets, true);
    bsHtml += addRow('Total Liabilities', liabilities, true);
    // Add net income to equity for balance sheet purposes
    bsHtml += addRow('Current Year Earnings', netIncome, false);
    bsHtml += addRow('Total Equity', equity + netIncome, true);
    
    bsHtml += '</table>';
    
    plEl.innerHTML = '<div style="position:relative;margin-bottom:1.5rem;height:250px;width:100%"><canvas id="finReportChart"></canvas></div>' + plHtml;
    bsEl.innerHTML = bsHtml;
    
    setTimeout(() => {
        if(typeof createChart !== 'function') return;
        var expData = [];
        var expLabels = [];
        accounts.forEach(a => {
            if(a.type === 'Expense' && balances[a.code]) {
                expLabels.push(a.name);
                expData.push(balances[a.code]);
            }
        });
        createChart('finReportChart', 'doughnut', {
            labels: expLabels,
            datasets: [{
                data: expData,
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280', '#0ea5e9', '#ec4899']
            }]
        });
    }, 100);
}

// ----------------------------------------------------
// INTEGRATION HOOKS
// ----------------------------------------------------
async function postPayrollGL(p) {
    // p is the payslip document inserted into 'payslips'
    // Total Cost to Company = Gross Earnings + Employer VNPF (usually same as employee VNPF)
    // Debit: Salary Expense
    // Credit: PAYE Payable (not implemented here, but we can assume 'others' goes there or to a generic Liability)
    // Credit: VNPF Payable (Employee 6% + Employer 6% = 12%)
    // Credit: Salary Payable (Net Pay)
    
    var employerVNPF = p.vnpf || 0; 
    var employeeVNPF = p.vnpf || 0;
    var totalVNPF = employerVNPF + employeeVNPF;
    var gross = p.totalEarn || 0;
    var totalCost = gross + employerVNPF;
    var net = p.net || 0;
    var loanDeduction = p.loan || 0;
    var otherDeduction = p.others || 0;

    var lines = [
        { accountName: 'Salary Expense', debit: totalCost, department: p.department }
    ];

    if(totalVNPF > 0) lines.push({ accountName: 'VNPF Employer Expense', debit: employerVNPF });
    if(totalVNPF > 0) lines.push({ accountName: 'VNPF Payable', credit: totalVNPF });
    if(net > 0) lines.push({ accountName: 'Cash / Bank', credit: net }); // Simplified to credit Bank directly instead of Salary Payable
    if(loanDeduction > 0) lines.push({ accountName: 'Employee Advances', credit: loanDeduction }); // Repayment of staff loan
    if(otherDeduction > 0) lines.push({ accountName: 'Accounts Payable', credit: otherDeduction }); // Generic liability for other deducts

    await postJournalEntry('Payroll: ' + p.staff + ' (' + p.periodStart + ' - ' + p.periodEnd + ')', p.paydate, lines);
}

// ==========================================
// PHASE 3: AR & AP (Invoices and Bills)
// ==========================================

async function renderFinanceContacts() {
    var c = document.getElementById('section-finance-contacts');
    c.innerHTML = '<div style="padding:20px"><p class="section-title"><i class="ti ti-address-book" style="color:var(--gold)"></i> <span>Contacts (Clients & Vendors)</span></p><div style="background:#fff;padding:20px;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,0.08);margin-bottom:20px"><h3 style="margin:0 0 1rem 0;font-size:15px">Add / Edit Contact</h3><div style="display:flex;gap:10px;flex-wrap:wrap"><input type="text" id="contact-name" placeholder="Company / Individual Name" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><select id="contact-type" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px"><option value="Client">Client</option><option value="Vendor">Vendor</option><option value="Both">Both</option></select><input type="email" id="contact-email" placeholder="Email (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><input type="text" id="contact-phone" placeholder="Phone (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;width:140px"><input type="text" id="contact-address" placeholder="Address (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><button id="btn-save-contact" onclick="saveContact()" style="padding:8px 18px;background:#0a0a0a;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:600;font-size:13px">+ Save Contact</button><button id="btn-cancel-edit-contact" onclick="cancelEditContact()" style="display:none;padding:8px 18px;background:#f0f0f0;color:#333;border:none;border-radius:7px;cursor:pointer;font-weight:600;font-size:13px">Cancel</button></div></div><div id="contacts-list"></div></div>';
    await refreshContactsList();
}

async function saveContact() {
    var name = document.getElementById('contact-name').value.trim();
    var type = document.getElementById('contact-type').value;
    var email = document.getElementById('contact-email').value.trim();
    var phone = document.getElementById('contact-phone').value.trim();
    var address = document.getElementById('contact-address').value.trim();
    if(!name) return alert('Name is required');
    
    var btn = document.getElementById('btn-save-contact');
    var editId = btn.dataset.editId;
    
    if (editId) {
        await fetch('/api/finance_contacts', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query: {_id: editId}, update: {name, type, email, phone, address}}) });
        cancelEditContact();
    } else {
        await fetch('/api/finance_contacts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, type, email, phone, address, created_at: new Date().toISOString()}) });
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-phone').value = '';
        document.getElementById('contact-address').value = '';
    }
    renderFinanceContacts();
}

function editContact(id) {
    if (!window.ALL_CONTACTS) return;
    var c = window.ALL_CONTACTS.find(x => x._id === id);
    if (!c) return;
    document.getElementById('contact-name').value = c.name || '';
    document.getElementById('contact-type').value = c.type || 'Client';
    document.getElementById('contact-email').value = c.email || '';
    document.getElementById('contact-phone').value = c.phone || '';
    document.getElementById('contact-address').value = c.address || '';
    
    var btn = document.getElementById('btn-save-contact');
    btn.dataset.editId = id;
    btn.innerHTML = 'Update Contact';
    document.getElementById('btn-cancel-edit-contact').style.display = 'inline-block';
}

function cancelEditContact() {
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-type').value = 'Client';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-address').value = '';
    
    var btn = document.getElementById('btn-save-contact');
    delete btn.dataset.editId;
    btn.innerHTML = '+ Save Contact';
    document.getElementById('btn-cancel-edit-contact').style.display = 'none';
}

async function refreshContactsList() {
    var res = await fetch('/api/finance_contacts');
    var contacts = await res.json();
    window.ALL_CONTACTS = contacts;
    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,0.08);border-radius:10px;overflow:hidden"><thead><tr style="background:#f8f8f8"><th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Name</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Type</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Email</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Phone</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Address</th><th style="padding:11px 14px"></th></tr></thead><tbody>';
    contacts.forEach(c => {
        html += `<tr style="border-top:1px solid #f0f0f0"><td style="padding:11px 14px;font-weight:600">${c.name}</td><td style="padding:11px 14px"><span style="background:#eef;color:#338;padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700">${c.type}</span></td><td style="padding:11px 14px;font-size:13px">${c.email||'-'}</td><td style="padding:11px 14px;font-size:13px">${c.phone||'-'}</td><td style="padding:11px 14px;font-size:13px">${c.address||'-'}</td><td style="padding:11px 14px;text-align:right"><button onclick="editContact('${c._id}')" style="background:transparent;border:none;color:#888;cursor:pointer;margin-right:8px" title="Edit Contact"><i class="ti ti-pencil"></i></button><button onclick="deleteContact('${c._id}')" style="background:transparent;border:none;color:#ef4444;cursor:pointer" title="Delete Contact"><i class="ti ti-trash"></i></button></td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('contacts-list').innerHTML = html;
}

// ==========================================
// INVOICES (Accounts Receivable)
// ==========================================

async function renderFinanceInvoices() {
    var c = document.getElementById('section-finance-invoices');
    var [cRes, accRes] = await Promise.all([fetch('/api/finance_contacts'), fetch('/api/fin/accounts', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }})]);
    var contacts = await cRes.json();
    var accounts = await accRes.json();
    var clientOptions = contacts.filter(x => x.type === 'Client' || x.type === 'Both').map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    var revenueOptions = accounts.filter(x => x.type === 'Revenue' || x.type === 'Income').map(x => `<option value="${x.code} - ${x.name}">${x.code} - ${x.name}</option>`).join('');

    c.innerHTML = `
    <div style="padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <div>
                <p class="section-title"><i class="ti ti-file-invoice" style="color:var(--gold)"></i> <span>Invoices (Accounts Receivable)</span></p>
                <p style="font-size:13px;color:var(--text2);margin:0">Create, manage and print professional invoices</p>
            </div>
            <button onclick="openInvoiceModal()" style="display:flex;align-items:center;gap:7px;padding:10px 18px;background:#0a0a0a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">
                <i class="ti ti-plus"></i> New Invoice
            </button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:1rem;align-items:center;flex-wrap:wrap">
            <input type="text" id="inv-search" placeholder="Search invoices..." oninput="filterInvoices()" style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px;width:220px">
            <select id="inv-filter-status" onchange="filterInvoices()" style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px">
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
            </select>
            <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap" id="inv-summary-pills"></div>
        </div>
        <div id="invoices-list"></div>
    </div>
    <div id="modal-invoice" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:flex-start;justify-content:center;overflow-y:auto;padding:30px 15px">
        <div style="background:#fff;border-radius:14px;width:100%;max-width:800px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.25);margin:auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
                <h2 style="margin:0;font-size:20px;font-weight:800">Create Invoice</h2>
                <button onclick="document.getElementById('modal-invoice').style.display='none'" style="background:none;border:none;font-size:24px;cursor:pointer;color:#888">&times;</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:1.2rem">
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Client *</label>
                    <select id="inv-client" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px"><option value="">-- Select Client --</option>${clientOptions}</select>
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Revenue Account</label>
                    <select id="inv-revenue-acct" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px"><option value="Sales Revenue">Sales Revenue</option>${revenueOptions}</select>
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Invoice Date *</label>
                    <input type="date" id="inv-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Due Date *</label>
                    <input type="date" id="inv-due" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div style="grid-column:1/-1">
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Notes / Payment Terms</label>
                    <textarea id="inv-notes" placeholder="e.g. Payment due within 30 days. Bank: BSP Account 1234567..." rows="2" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px;resize:vertical"></textarea>
                </div>
            </div>
            <div style="margin-bottom:1.2rem">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                    <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#888">Line Items *</label>
                    <button onclick="addInvoiceLineItem()" style="font-size:12px;padding:5px 12px;background:#f0f0f0;border:none;border-radius:6px;cursor:pointer;font-weight:600"><i class="ti ti-plus"></i> Add Row</button>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:13px">
                    <thead><tr style="background:#f8f8f8">
                        <th style="padding:9px 10px;text-align:left;font-weight:700;font-size:11px;color:#888;text-transform:uppercase">Description</th>
                        <th style="padding:9px 10px;text-align:right;width:70px;font-weight:700;font-size:11px;color:#888;text-transform:uppercase">Qty</th>
                        <th style="padding:9px 10px;text-align:right;width:130px;font-weight:700;font-size:11px;color:#888;text-transform:uppercase">Unit Price</th>
                        <th style="padding:9px 10px;text-align:right;width:130px;font-weight:700;font-size:11px;color:#888;text-transform:uppercase">Total</th>
                        <th style="width:36px"></th>
                    </tr></thead>
                    <tbody id="inv-line-items"></tbody>
                    <tfoot><tr style="border-top:2px solid #eee">
                        <td colspan="3" style="padding:10px;text-align:right;font-weight:700;font-size:13px">TOTAL (VUV)</td>
                        <td style="padding:10px;text-align:right;font-weight:900;font-size:18px;color:#0a0a0a" id="inv-total-display">0.00</td>
                        <td></td>
                    </tr></tfoot>
                </table>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
                <button onclick="document.getElementById('modal-invoice').style.display='none'" style="padding:10px 20px;background:#f0f0f0;border:none;border-radius:7px;cursor:pointer;font-weight:600">Cancel</button>
                <button onclick="saveInvoice('Draft')" style="padding:10px 20px;background:#f59e0b;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:600">Save as Draft</button>
                <button onclick="saveInvoice('Sent')" style="padding:10px 20px;background:#0a0a0a;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:600">Generate Invoice</button>
            </div>
        </div>
    </div>`;

    addInvoiceLineItem();
    await refreshInvoicesList();
}

function openInvoiceModal() {
    document.getElementById('modal-invoice').style.display = 'flex';
    document.getElementById('inv-line-items').innerHTML = '';
    document.getElementById('inv-notes').value = '';
    document.getElementById('inv-total-display').textContent = '0.00';
    addInvoiceLineItem();
}

function addInvoiceLineItem(data) {
    var tbody = document.getElementById('inv-line-items');
    var row = document.createElement('tr');
    row.innerHTML = `<td style="padding:5px"><input type="text" placeholder="Description of service or item" value="${data ? data.desc : ''}" class="inv-li-desc" oninput="recalcInvoiceTotal()" style="width:100%;padding:7px 9px;border:1px solid #eee;border-radius:5px;font-size:13px"></td>
        <td style="padding:5px"><input type="number" value="${data ? data.qty : 1}" min="0" class="inv-li-qty" oninput="recalcInvoiceTotal()" style="width:65px;padding:7px;border:1px solid #eee;border-radius:5px;font-size:13px;text-align:right"></td>
        <td style="padding:5px"><input type="number" value="${data ? data.price : ''}" min="0" placeholder="0.00" class="inv-li-price" oninput="recalcInvoiceTotal()" style="width:120px;padding:7px;border:1px solid #eee;border-radius:5px;font-size:13px;text-align:right"></td>
        <td style="padding:5px;text-align:right;font-weight:600;color:#0a0a0a" class="inv-li-total">0.00</td>
        <td style="padding:5px;text-align:center"><button onclick="this.closest('tr').remove();recalcInvoiceTotal()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:18px;line-height:1">&times;</button></td>`;
    tbody.appendChild(row);
    recalcInvoiceTotal();
}

function recalcInvoiceTotal() {
    var rows = document.querySelectorAll('#inv-line-items tr');
    var total = 0;
    rows.forEach(r => {
        var qty = parseFloat(r.querySelector('.inv-li-qty').value) || 0;
        var price = parseFloat(r.querySelector('.inv-li-price').value) || 0;
        var lineTotal = qty * price;
        r.querySelector('.inv-li-total').textContent = lineTotal.toLocaleString(undefined, {minimumFractionDigits:2});
        total += lineTotal;
    });
    var el = document.getElementById('inv-total-display');
    if(el) el.textContent = total.toLocaleString(undefined, {minimumFractionDigits:2});
}

async function saveInvoice(status) {
    var client = document.getElementById('inv-client').value;
    var date = document.getElementById('inv-date').value;
    var due = document.getElementById('inv-due').value;
    var notes = document.getElementById('inv-notes').value.trim();
    var revenueAcct = document.getElementById('inv-revenue-acct').value || 'Sales Revenue';
    if(!client) return alert('Please select a client');
    if(!date || !due) return alert('Please fill in invoice and due dates');
    var lineItems = [];
    document.querySelectorAll('#inv-line-items tr').forEach(r => {
        var desc = r.querySelector('.inv-li-desc').value.trim();
        var qty = parseFloat(r.querySelector('.inv-li-qty').value) || 0;
        var price = parseFloat(r.querySelector('.inv-li-price').value) || 0;
        if(desc && qty > 0 && price > 0) lineItems.push({ desc, qty, price, total: qty * price });
    });
    if(lineItems.length === 0) return alert('Please add at least one line item');
    var amount = lineItems.reduce((s, l) => s + l.total, 0);
    var yr = new Date().getFullYear();
    var invNum = 'INV-' + yr + '-' + String(Date.now()).slice(-5);
    var doc = { num: invNum, client, date, due, notes, lineItems, amount, revenueAcct, status };
    await fetch('/api/finance_invoices', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
    if(status === 'Sent') {
        await postJournalEntry('Invoice ' + invNum + ' to ' + client, date, [
            { accountName: 'Accounts Receivable', debit: amount },
            { accountName: revenueAcct, credit: amount }
        ]);
    }
    document.getElementById('modal-invoice').style.display = 'none';
    await refreshInvoicesList();
}

async function refreshInvoicesList() {
    var res = await fetch('/api/finance_invoices');
    var invoices = await res.json();
    var today = new Date(); today.setHours(0,0,0,0);
    invoices.forEach(inv => {
        if(inv.status !== 'Paid' && inv.due) {
            var d = new Date(inv.due); d.setHours(0,0,0,0);
            inv._computed = d < today ? 'Overdue' : inv.status;
        } else { inv._computed = inv.status; }
    });
    var paid = invoices.filter(i => i._computed === 'Paid').length;
    var overdue = invoices.filter(i => i._computed === 'Overdue').length;
    var pending = invoices.filter(i => i._computed !== 'Paid' && i._computed !== 'Overdue').length;
    var totalOut = invoices.filter(i => i._computed !== 'Paid').reduce((s, i) => s + (i.amount||0), 0);
    var pillsHtml = `<span style="background:#dcfce7;color:#166534;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">${paid} Paid</span><span style="background:#fef9c3;color:#92400e;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">${pending} Pending</span><span style="background:#fee2e2;color:#991b1b;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">${overdue} Overdue</span><span style="background:#f0f0f0;color:#444;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">Outstanding: VUV ${totalOut.toLocaleString()}</span>`;
    var pillEl = document.getElementById('inv-summary-pills');
    if(pillEl) pillEl.innerHTML = pillsHtml;
    window._allInvoices = invoices;
    renderInvoiceTable(invoices);
}

function filterInvoices() {
    var q = (document.getElementById('inv-search').value || '').toLowerCase();
    var st = (document.getElementById('inv-filter-status').value || '').toLowerCase();
    var list = (window._allInvoices || []).filter(i => {
        var matchQ = !q || (i.num||'').toLowerCase().includes(q) || (i.client||'').toLowerCase().includes(q);
        var matchS = !st || (i._computed||'').toLowerCase() === st;
        return matchQ && matchS;
    });
    renderInvoiceTable(list);
}

function renderInvoiceTable(invoices) {
    var statusColors = { Paid:'background:#dcfce7;color:#166534', Sent:'background:#e0f2fe;color:#0369a1', Draft:'background:#f3f4f6;color:#6b7280', Overdue:'background:#fee2e2;color:#991b1b' };
    var html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08)">
        <thead><tr style="background:#f8f8f8">
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Invoice #</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Client</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Date</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Due</th>
            <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Amount (VUV)</th>
            <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Status</th>
            <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Actions</th>
        </tr></thead><tbody>`;
    if(invoices.length === 0) html += '<tr><td colspan="7" style="padding:35px;text-align:center;color:#aaa;font-size:14px">No invoices found. Click <strong>New Invoice</strong> to create one.</td></tr>';
    invoices.forEach(inv => {
        var s = inv._computed || inv.status;
        var style = statusColors[s] || statusColors['Sent'];
        var badge = `<span style="${style};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${s}</span>`;
        var actions = `<button onclick="printInvoice('${inv._id}')" title="View Invoice" style="padding:5px 9px;background:#f0f0f0;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px"><i class="ti ti-eye"></i> View</button>`;
        if(s !== 'Paid') {
            actions += `<button onclick="markInvoicePaid('${inv._id}', '${inv.num}', '${inv.client}', ${inv.amount})" title="Mark Paid" style="padding:5px 9px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-check"></i> Mark Paid</button>`;
        } else {
            actions += `<button onclick="printReceipt('${inv._id}')" title="View Receipt" style="padding:5px 9px;background:#0a0a0a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-eye"></i> Receipt</button>`;
        }
        html += `<tr style="border-top:1px solid #f0f0f0">
            <td style="padding:11px 14px;font-weight:700;font-family:monospace;font-size:12px">${inv.num}</td>
            <td style="padding:11px 14px">${inv.client}</td>
            <td style="padding:11px 14px;font-size:12px;color:#666">${inv.date||''}</td>
            <td style="padding:11px 14px;font-size:12px;color:${s==='Overdue'?'#ef4444':'#666'};font-weight:${s==='Overdue'?'700':'400'}">${inv.due||''}</td>
            <td style="padding:11px 14px;text-align:right;font-weight:700">${(inv.amount||0).toLocaleString()}</td>
            <td style="padding:11px 14px;text-align:center">${badge}</td>
            <td style="padding:11px 14px;text-align:right;white-space:nowrap">${actions}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    var listEl = document.getElementById('invoices-list');
    if(listEl) listEl.innerHTML = html;
}

async function markInvoicePaid(id, num, client, amount) {
    if(!confirm('Mark Invoice ' + num + ' as PAID? This will post a GL entry and allow receipt printing.')) return;
    var paidDate = new Date().toISOString().split('T')[0];
    await fetch('/api/finance_invoices/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'Paid', paidDate }) });
    await postJournalEntry('Payment Received - Invoice ' + num + ' (' + client + ')', paidDate, [
        { accountName: 'Cash', debit: amount },
        { accountName: 'Accounts Receivable', credit: amount }
    ]);
    await refreshInvoicesList();
}

async function printInvoice(id) {
    var res = await fetch('/api/finance_invoices/' + id);
    var inv = await res.json();
    var companyRes = await fetch('/api/company_settings');
    var companyArr = await companyRes.json();
    var company = Array.isArray(companyArr) ? (companyArr[0]||{}) : (companyArr||{});
    var cName = company.name || 'WokManeja';
    var cAddress = company.address || 'Vanuatu';
    var cPhone = company.phone || '';
    var cEmail = company.email || '';

    // Populate overlay fields
    document.getElementById('inv-print-company').textContent = cName;
    document.getElementById('inv-print-address').textContent = cAddress;
    document.getElementById('inv-print-phone').textContent = cPhone;
    document.getElementById('inv-print-email').textContent = cEmail;
    document.getElementById('inv-print-num').textContent = inv.num || '';
    document.getElementById('inv-print-client').textContent = inv.client || '';
    document.getElementById('inv-print-footer').textContent = 'Generated by WokManeja · ' + new Date().toLocaleDateString();

    // Status badge
    var s = inv.status;
    document.getElementById('inv-print-status').innerHTML = s === 'Paid'
        ? '<span style="background:#dcfce7;color:#166534;padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700">✓ PAID</span>'
        : '<span style="background:#fef3c7;color:#92400e;padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700">UNPAID</span>';

    // Dates
    var datesHtml = 'Invoice Date: <strong>' + (inv.date||'') + '</strong><br>Due Date: <strong>' + (inv.due||'') + '</strong>';
    if(inv.paidDate) datesHtml += '<br>Paid On: <strong>' + inv.paidDate + '</strong>';
    document.getElementById('inv-print-dates').innerHTML = datesHtml;

    // Line items
    var lineHtml = '';
    if(inv.lineItems && inv.lineItems.length > 0) {
        inv.lineItems.forEach(function(l) {
            lineHtml += '<tr><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0">' + l.desc + '</td>' +
                '<td style="padding:9px 12px;text-align:center;border-bottom:1px solid #f0f0f0">' + l.qty + '</td>' +
                '<td style="padding:9px 12px;text-align:right;border-bottom:1px solid #f0f0f0">' + (l.price||0).toLocaleString(undefined,{minimumFractionDigits:2}) + '</td>' +
                '<td style="padding:9px 12px;text-align:right;border-bottom:1px solid #f0f0f0;font-weight:700">' + (l.total||0).toLocaleString(undefined,{minimumFractionDigits:2}) + '</td></tr>';
        });
    } else {
        lineHtml = '<tr><td colspan="4" style="padding:9px 12px;color:#666">Services rendered</td></tr>';
    }
    document.getElementById('inv-print-lines').innerHTML = lineHtml;
    document.getElementById('inv-print-total').textContent = (inv.amount||0).toLocaleString(undefined,{minimumFractionDigits:2});

    // Notes
    if(inv.notes) {
        document.getElementById('inv-print-notes').textContent = inv.notes;
        document.getElementById('inv-print-notes-wrap').style.display = 'block';
    } else {
        document.getElementById('inv-print-notes-wrap').style.display = 'none';
    }

    document.getElementById('invoice-print-overlay').style.display = 'flex';
}

async function printReceipt(id) {
    var res = await fetch('/api/finance_invoices/' + id);
    var inv = await res.json();
    var companyRes = await fetch('/api/company_settings');
    var companyArr = await companyRes.json();
    var company = Array.isArray(companyArr) ? (companyArr[0]||{}) : (companyArr||{});
    var cName = company.name || 'WokManeja';
    var cAddress = company.address || 'Vanuatu';
    var rcptNum = 'RCPT-' + (inv.num||'').replace('INV-', '');
    var lineDesc = (inv.lineItems && inv.lineItems.length > 0) ? inv.lineItems.map(function(l){return l.desc;}).join(', ') : 'Services rendered';

    document.getElementById('rcpt-print-company').textContent = cName;
    document.getElementById('rcpt-print-address').textContent = cAddress;
    document.getElementById('rcpt-print-amount').textContent = (inv.amount||0).toLocaleString(undefined,{minimumFractionDigits:2});

    var rowData = [
        ['Receipt No.', rcptNum],
        ['Invoice Ref.', inv.num||''],
        ['Received From', inv.client||''],
        ['Invoice Date', inv.date||''],
        ['Payment Date', inv.paidDate || new Date().toLocaleDateString()],
        ['Description', lineDesc]
    ];
    var rowsHtml = rowData.map(function(r) {
        return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f5f5f5;font-size:13px">' +
            '<span style="color:#888;font-weight:600">' + r[0] + '</span>' +
            '<span style="font-weight:700;text-align:right;max-width:260px;word-break:break-word">' + r[1] + '</span></div>';
    }).join('');
    document.getElementById('rcpt-print-rows').innerHTML = rowsHtml;
    document.getElementById('rcpt-print-footer').innerHTML = 'This is your official receipt. Thank you for your payment.<br>Generated by WokManeja · ' + new Date().toLocaleString();

    document.getElementById('receipt-print-overlay').style.display = 'flex';
}


// ==========================================
// VENDOR BILLS (Accounts Payable)
// ==========================================

async function renderFinanceBills() {
    var c = document.getElementById('section-finance-bills');
    var [cRes, accRes] = await Promise.all([fetch('/api/finance_contacts'), fetch('/api/fin/accounts', { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }})]);
    var contacts = await cRes.json();
    var accounts = await accRes.json();
    var vendorOptions = contacts.filter(x => x.type && (x.type.toLowerCase() === 'vendor' || x.type.toLowerCase() === 'both')).map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    var expOptions = accounts.filter(x => x.type === 'Expense').map(x => `<option value="${x.code} - ${x.name}">${x.code} - ${x.name}</option>`).join('');

    c.innerHTML = `
    <div style="padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">
            <div>
                <p class="section-title"><i class="ti ti-receipt-2" style="color:var(--gold)"></i> <span>Vendor Bills (Accounts Payable)</span></p>
                <p style="font-size:13px;color:var(--text2);margin:0">Log and track bills from vendors and suppliers</p>
            </div>
            <button onclick="openBillModal()" style="display:flex;align-items:center;gap:7px;padding:10px 18px;background:#0a0a0a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">
                <i class="ti ti-plus"></i> New Bill
            </button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:1rem;align-items:center;flex-wrap:wrap">
            <input type="text" id="bill-search" placeholder="Search bills..." oninput="filterBills()" style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px;width:220px">
            <select id="bill-filter-status" onchange="filterBills()" style="padding:8px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px">
                <option value="">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
            </select>
            <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap" id="bill-summary-pills"></div>
        </div>
        <div id="bills-list"></div>
    </div>
    <div id="modal-bill" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;align-items:flex-start;justify-content:center;overflow-y:auto;padding:30px 15px">
        <div style="background:#fff;border-radius:14px;width:100%;max-width:680px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.25);margin:auto">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
                <h2 style="margin:0;font-size:20px;font-weight:800">Log Vendor Bill</h2>
                <button onclick="document.getElementById('modal-bill').style.display='none'" style="background:none;border:none;font-size:24px;cursor:pointer;color:#888">&times;</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:1.2rem">
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Vendor *</label>
                    <select id="bill-vendor" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px"><option value="">-- Select Vendor --</option>${vendorOptions}</select>
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Expense Account *</label>
                    <select id="bill-expense" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px"><option value="">-- Select Account --</option>${expOptions}</select>
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Bill Date *</label>
                    <input type="date" id="bill-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Due Date *</label>
                    <input type="date" id="bill-due" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div style="grid-column:1/-1">
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Description *</label>
                    <input type="text" id="bill-desc" placeholder="What is this bill for?" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Amount (VUV) *</label>
                    <input type="number" id="bill-amount" placeholder="0.00" min="0" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px">
                </div>
                <div>
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Attachment (Optional)</label>
                    <input type="file" id="bill-file" accept="image/*,.pdf" style="width:100%;padding:7px;border:1px solid #e0e0e0;border-radius:7px;font-size:12px">
                </div>
                <div style="grid-column:1/-1">
                    <label style="font-size:11px;font-weight:700;display:block;margin-bottom:5px;text-transform:uppercase;color:#888">Notes</label>
                    <textarea id="bill-notes" placeholder="Additional notes or reference numbers..." rows="2" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:7px;font-size:13px;resize:vertical"></textarea>
                </div>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
                <button onclick="document.getElementById('modal-bill').style.display='none'" style="padding:10px 20px;background:#f0f0f0;border:none;border-radius:7px;cursor:pointer;font-weight:600">Cancel</button>
                <button onclick="saveBill()" style="padding:10px 20px;background:#0a0a0a;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:600">Log Bill</button>
            </div>
        </div>
    </div>`;
    await refreshBillsList();
}

function openBillModal() {
    document.getElementById('modal-bill').style.display = 'flex';
    ['bill-desc','bill-amount','bill-notes'].forEach(id => { var el = document.getElementById(id); if(el) el.value = ''; });
}

async function saveBill() {
    var vendor = document.getElementById('bill-vendor').value;
    var desc = document.getElementById('bill-desc').value.trim();
    var expenseAcct = document.getElementById('bill-expense').value;
    var amount = parseFloat(document.getElementById('bill-amount').value);
    var due = document.getElementById('bill-due').value;
    var date = document.getElementById('bill-date').value;
    var notes = document.getElementById('bill-notes').value.trim();
    if(!vendor || !desc || !expenseAcct || isNaN(amount) || !due) return alert('Please fill all required fields');
    var yr = new Date().getFullYear();
    var billNum = 'BILL-' + yr + '-' + String(Date.now()).slice(-5);
    var doc = { num: billNum, vendor, desc, expenseAcct, amount, due, date, notes, status: 'Unpaid' };
    await fetch('/api/finance_bills', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
    await postJournalEntry('Bill ' + billNum + ' from ' + vendor, date, [
        { accountName: expenseAcct, debit: amount },
        { accountName: 'Accounts Payable', credit: amount }
    ]);
    document.getElementById('modal-bill').style.display = 'none';
    await refreshBillsList();
}

async function refreshBillsList() {
    var res = await fetch('/api/finance_bills');
    var bills = await res.json();
    var today = new Date(); today.setHours(0,0,0,0);
    bills.forEach(b => {
        if(b.status !== 'Paid' && b.due) { var d = new Date(b.due); d.setHours(0,0,0,0); b._computed = d < today ? 'Overdue' : 'Unpaid'; }
        else b._computed = b.status;
    });
    var paid = bills.filter(b => b._computed === 'Paid').length;
    var overdue = bills.filter(b => b._computed === 'Overdue').length;
    var totalUnpaid = bills.filter(b => b._computed !== 'Paid').reduce((s,b) => s+(b.amount||0), 0);
    var pillsHtml = `<span style="background:#dcfce7;color:#166534;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">${paid} Paid</span><span style="background:#fee2e2;color:#991b1b;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">${overdue} Overdue</span><span style="background:#f0f0f0;color:#444;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700">Outstanding: VUV ${totalUnpaid.toLocaleString()}</span>`;
    var pillEl = document.getElementById('bill-summary-pills');
    if(pillEl) pillEl.innerHTML = pillsHtml;
    window._allBills = bills;
    renderBillTable(bills);
}

function filterBills() {
    var q = (document.getElementById('bill-search').value || '').toLowerCase();
    var st = (document.getElementById('bill-filter-status').value || '').toLowerCase();
    var list = (window._allBills || []).filter(b => {
        var matchQ = !q || (b.num||'').toLowerCase().includes(q) || (b.vendor||'').toLowerCase().includes(q) || (b.desc||'').toLowerCase().includes(q);
        var matchS = !st || (b._computed||'').toLowerCase() === st;
        return matchQ && matchS;
    });
    renderBillTable(list);
}

function renderBillTable(bills) {
    var statusColors = { Paid:'background:#dcfce7;color:#166534', Unpaid:'background:#fef3c7;color:#92400e', Overdue:'background:#fee2e2;color:#991b1b' };
    var html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08)">
        <thead><tr style="background:#f8f8f8">
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Bill #</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Vendor</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Description</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Expense Acct</th>
            <th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Due</th>
            <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Amount (VUV)</th>
            <th style="padding:11px 14px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Status</th>
            <th style="padding:11px 14px;text-align:right;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Action</th>
        </tr></thead><tbody>`;
    if(bills.length === 0) html += '<tr><td colspan="8" style="padding:35px;text-align:center;color:#aaa;font-size:14px">No bills found. Click <strong>New Bill</strong> to log one.</td></tr>';
    bills.forEach(b => {
        var s = b._computed || b.status;
        var st = statusColors[s] || statusColors['Unpaid'];
        var badge = `<span style="${st};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${s}</span>`;
        var action = s !== 'Paid' ? `<button onclick="markBillPaid('${b._id}', '${b.num}', '${b.vendor}', ${b.amount})" style="padding:5px 9px;background:#0a0a0a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-check"></i> Pay Bill</button>` : `<span style="font-size:12px;color:#888">Paid ${b.paidDate||''}</span>`;
        html += `<tr style="border-top:1px solid #f0f0f0">
            <td style="padding:11px 14px;font-weight:700;font-family:monospace;font-size:12px">${b.num}</td>
            <td style="padding:11px 14px">${b.vendor}</td>
            <td style="padding:11px 14px;color:#555">${b.desc}</td>
            <td style="padding:11px 14px;font-size:12px;color:#666">${b.expenseAcct}</td>
            <td style="padding:11px 14px;font-size:12px;color:${s==='Overdue'?'#ef4444':'#666'};font-weight:${s==='Overdue'?'700':'400'}">${b.due||''}</td>
            <td style="padding:11px 14px;text-align:right;font-weight:700">${(b.amount||0).toLocaleString()}</td>
            <td style="padding:11px 14px;text-align:center">${badge}</td>
            <td style="padding:11px 14px;text-align:right">${action}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';
    var listEl = document.getElementById('bills-list');
    if(listEl) listEl.innerHTML = html;
}

async function markBillPaid(id, num, vendor, amount) {
    if(!confirm('Record payment for Bill ' + num + '? This will post a GL entry.')) return;
    var paidDate = new Date().toISOString().split('T')[0];
    await fetch('/api/finance_bills/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'Paid', paidDate }) });
    await postJournalEntry('Payment made for Bill ' + num + ' (' + vendor + ')', paidDate, [
        { accountName: 'Accounts Payable', debit: amount },
        { accountName: 'Cash', credit: amount }
    ]);
    await refreshBillsList();
}

// ==========================================
// PHASE 4: Bank Reconciliation
// ==========================================

async function renderFinanceReconciliation() {
    var c = document.getElementById('section-finance-reconciliation');
    c.innerHTML = `
        <div style="padding:20px">
            <h2 style="margin:0 0 15px 0">Bank Reconciliation</h2>
            <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:20px;display:flex;gap:20px;align-items:flex-end">
                <div>
                    <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px">Statement Date</label>
                    <input type="date" id="recon-date" style="padding:8px;width:150px">
                </div>
                <div>
                    <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px">Statement Balance (VUV)</label>
                    <input type="number" id="recon-balance" placeholder="0.00" style="padding:8px;width:200px" oninput="calculateReconDiff()">
                </div>
                <div>
                    <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px">System Cash Balance</label>
                    <div id="recon-sys-balance" style="font-size:16px;font-weight:bold;padding:8px 0">Loading...</div>
                </div>
                <div>
                    <label style="display:block;font-size:12px;font-weight:600;margin-bottom:5px">Difference</label>
                    <div id="recon-diff" style="font-size:16px;font-weight:bold;padding:8px 0;color:#ef4444">Loading...</div>
                </div>
            </div>
            <div id="recon-list"></div>
        </div>
    `;
    await refreshReconList();
}

async function refreshReconList() {
    var res = await fetch('/api/fin/journals', {
        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('api_token') }
    });
    var entries = await res.json();
    
    var sysBalance = 0;
    var unclearedHtml = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden"><thead><tr style="background:#f4f4f4;text-align:left"><th style="padding:10px;width:40px">Clear</th><th style="padding:10px">Date</th><th style="padding:10px">Description</th><th style="padding:10px;text-align:right">Amount (VUV)</th></tr></thead><tbody>';
    
    entries.forEach(e => {
        if(!e.lines) return;
        var cashLine = e.lines.find(l => l.account_name === 'Cash / Bank');
        if(cashLine) {
            var amount = (cashLine.debit || 0) - (cashLine.credit || 0);
            sysBalance += amount;
            
            if(!e.cleared) {
                var amtStr = amount > 0 ? '+ ' + amount.toLocaleString() : '- ' + Math.abs(amount).toLocaleString();
                var color = amount > 0 ? '#10b981' : '#ef4444';
                unclearedHtml += `<tr style="border-top:1px solid #eee"><td style="padding:10px;text-align:center"><input type="checkbox" onchange="toggleClear('${e.id}', this.checked)" style="transform:scale(1.2);cursor:pointer"></td><td style="padding:10px">${e.date}</td><td style="padding:10px">${e.description}</td><td style="padding:10px;text-align:right;color:${color}">${amtStr}</td></tr>`;
            }
        }
    });
    unclearedHtml += '</tbody></table>';
    
    document.getElementById('recon-sys-balance').innerText = sysBalance.toLocaleString();
    document.getElementById('recon-sys-balance').dataset.val = sysBalance;
    document.getElementById('recon-list').innerHTML = unclearedHtml;
    calculateReconDiff();
}

async function toggleClear(id, isCleared) {
    await fetch('/api/fin/journals/' + id + '/clear', { 
        method: 'PUT', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + sessionStorage.getItem('api_token')
        }, 
        body: JSON.stringify({ cleared: isCleared }) 
    });
    // We don't refresh the whole list immediately so the user doesn't lose context while checking boxes.
    // The visual row will stay, but the math changes.
}

function calculateReconDiff() {
    var stmt = parseFloat(document.getElementById('recon-balance').value) || 0;
    var sys = parseFloat(document.getElementById('recon-sys-balance').dataset.val) || 0;
    var diff = stmt - sys;
    var el = document.getElementById('recon-diff');
    el.innerText = diff.toLocaleString();
    el.style.color = diff === 0 ? '#10b981' : '#ef4444';
}

async function deleteContact(id) {
    if(confirm('Are you sure you want to delete this contact?')) {
        await fetch('/api/finance_contacts', {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({_id: id})
        });
        await renderFinanceContacts();
    }
}

var autoReconMatches = [];
function handleBankCSV(e) {
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
        var text = evt.target.result;
        var lines = text.split('\n').map(x => x.trim()).filter(x => x.length > 0);
        if(lines.length < 2) return alert('CSV is too short.');
        
        var headers = lines[0].split(',').map(x => x.replace(/["']/g, '').trim());
        var sample = lines[1].split(',').map(x => x.replace(/["']/g, '').trim());
        
        var modalHtml = `<div id="csv-map-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999">
            <div style="background:#fff;padding:20px;border-radius:8px;width:400px;max-width:90%">
                <h3 style="margin-top:0">Map CSV Columns</h3>
                <p style="font-size:13px;color:#666">Please tell us which column contains which data.</p>
                <div style="margin-bottom:10px">
                    <label style="font-size:12px;font-weight:bold">Date Column</label>
                    <select id="csv-map-date" style="width:100%;padding:6px">${headers.map((h,i) => `<option value="${i}">${h} (e.g. ${sample[i]})</option>`).join('')}</select>
                </div>
                <div style="margin-bottom:10px">
                    <label style="font-size:12px;font-weight:bold">Description Column</label>
                    <select id="csv-map-desc" style="width:100%;padding:6px">${headers.map((h,i) => `<option value="${i}">${h} (e.g. ${sample[i]})</option>`).join('')}</select>
                </div>
                <div style="margin-bottom:15px">
                    <label style="font-size:12px;font-weight:bold">Amount Column</label>
                    <select id="csv-map-amt" style="width:100%;padding:6px">${headers.map((h,i) => `<option value="${i}">${h} (e.g. ${sample[i]})</option>`).join('')}</select>
                </div>
                <div style="display:flex;gap:10px">
                    <button class="btn-primary" id="btn-run-recon" style="flex:1">Run Auto-Match</button>
                    <button class="btn-outline" onclick="document.getElementById('csv-map-modal').remove()" style="flex:1">Cancel</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('btn-run-recon').onclick = async function() {
            var idxDate = parseInt(document.getElementById('csv-map-date').value);
            var idxDesc = parseInt(document.getElementById('csv-map-desc').value);
            var idxAmt = parseInt(document.getElementById('csv-map-amt').value);
            document.getElementById('csv-map-modal').remove();
            
            var bankRecords = [];
            for(var i=1; i<lines.length; i++) {
                var cols = lines[i].split(',').map(x => x.replace(/["']/g, '').trim());
                if(cols.length > Math.max(idxDate, idxDesc, idxAmt)) {
                    bankRecords.push({
                        date: cols[idxDate],
                        desc: cols[idxDesc],
                        amount: parseFloat(cols[idxAmt].replace(/[^0-9.-]/g, ''))
                    });
                }
            }
            
            // Get Uncleared system records
            var res = await fetch('/api/finance_journal_entries');
            var entries = await res.json();
            var uncleared = [];
            entries.forEach(e => {
                if(e.cleared || !e.lines) return;
                var cashLine = e.lines.find(l => l.accountName === 'Cash');
                if(cashLine) {
                    uncleared.push({
                        id: e._id,
                        date: e.date,
                        desc: e.desc,
                        amount: (cashLine.debit || 0) - (cashLine.credit || 0)
                    });
                }
            });
            
            // Auto match
            autoReconMatches = [];
            uncleared.forEach(sys => {
                // Find a matching bank record (exact amount, skip date matching for now since bank dates vary wildly)
                var matchIdx = bankRecords.findIndex(b => Math.abs(b.amount - sys.amount) < 0.01 && !b.matched);
                if(matchIdx !== -1) {
                    bankRecords[matchIdx].matched = true;
                    autoReconMatches.push(sys.id);
                }
            });
            
            if(autoReconMatches.length > 0) {
                if(confirm('Found ' + autoReconMatches.length + ' matches! Do you want to automatically clear them?')) {
                    for(var mId of autoReconMatches) {
                        var cbox = document.querySelector('input[type="checkbox"][onchange*="\''+mId+'\'"]');
                        if(cbox) {
                            cbox.checked = true;
                            await toggleClear(mId, true);
                        }
                    }
                    alert('Successfully cleared ' + autoReconMatches.length + ' transactions!');
                    await refreshReconList();
                }
            } else {
                alert('No matches found.');
            }
            document.getElementById('recon-upload').value = '';
        };
    };
    reader.readAsText(file);
}


window.currentEditJEId = null;

function editJournalEntry(id) {
    alert("Manual editing of posted Journal Entries has been disabled for compliance with strict accounting practices. If an entry is incorrect, please post a manual reversing entry instead.");
    return;
    window.currentEditJEId = id;
    var entry = DB.findOne('finance_journal_entries', {_id: id});
    if(!entry) return;
    
    document.getElementById('eje-memo').value = entry.memo || '';
    document.getElementById('eje-date').value = entry.date.split('T')[0];
    document.getElementById('eje-lines-container').innerHTML = '';
    
    var lines = DB.findAll('finance_journal_lines', {entryId: id});
    lines.forEach(l => {
        addEditJELine(l);
    });
    
    document.getElementById('modal-edit-je').style.display = 'flex';
}

function addEditJELine(lineData) {
    var accounts = DB.findAll('finance_accounts') || [];
    var accOpts = '<option value="">-- Select Account --</option>';
    accounts.forEach(a => { 
        var sel = (lineData && lineData.accountName === a.name) ? 'selected' : '';
        accOpts += `<option value="${a.name}" ${sel}>${a.code} - ${a.name}</option>`; 
    });
    
    var d = lineData ? (lineData.debit || '') : '';
    var c = lineData ? (lineData.credit || '') : '';
    
    var div = document.createElement('div');
    div.className = 'eje-line-row';
    div.style.display = 'flex';
    div.style.gap = '5px';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <select class="eje-acc" style="flex:1;padding:5px">${accOpts}</select>
        <input type="number" class="eje-deb" placeholder="Debit" style="width:80px;padding:5px" value="${d}">
        <input type="number" class="eje-cre" placeholder="Credit" style="width:80px;padding:5px" value="${c}">
        <button onclick="this.parentNode.remove()" style="padding:5px;background:#fff;border:1px solid #ccc;cursor:pointer;color:#ef4444">&times;</button>
    `;
    document.getElementById('eje-lines-container').appendChild(div);
}

async function saveEditedJE() {
    var memo = document.getElementById('eje-memo').value.trim();
    var date = document.getElementById('eje-date').value;
    
    var rows = document.querySelectorAll('.eje-line-row');
    var lines = [];
    var totalDebit = 0;
    var totalCredit = 0;
    
    rows.forEach(r => {
        var a = r.querySelector('.eje-acc').value;
        var d = parseFloat(r.querySelector('.eje-deb').value) || 0;
        var c = parseFloat(r.querySelector('.eje-cre').value) || 0;
        if(a && (d > 0 || c > 0)) {
            lines.push({ accountName: a, debit: d, credit: c });
            totalDebit += d;
            totalCredit += c;
        }
    });
    
    if(lines.length < 2) return alert('Need at least two lines.');
    if(Math.abs(totalDebit - totalCredit) > 0.01) return alert('Entry is out of balance. Check Debits and Credits.');
    
    // 1. Update Entry
    DB.update('finance_journal_entries', {_id: window.currentEditJEId}, {
        memo: memo,
        date: date,
        totalAmount: totalDebit
    });
    
    // 2. Remove old lines and add new lines
    // We fetch DELETE the backend, and manually remove from MEMORY_DB
    await fetch('/api/finance_journal_lines', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({entryId: window.currentEditJEId}) });
    MEMORY_DB['finance_journal_lines'] = MEMORY_DB['finance_journal_lines'].filter(x => x.entryId !== window.currentEditJEId);
    
    lines.forEach(l => {
        DB.insert('finance_journal_lines', {
            entryId: window.currentEditJEId,
            date: date,
            accountName: l.accountName,
            debit: l.debit,
            credit: l.credit,
            department: ''
        });
    });
    
    document.getElementById('modal-edit-je').style.display = 'none';
    refreshGL();
    if(typeof renderFinanceDashboard === 'function') renderFinanceDashboard(); // update charts if needed but GL tab is active
}
