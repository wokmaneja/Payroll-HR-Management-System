// WokManeja Finance Module - Phase 1

async function renderFinanceDashboard() {
    var el = document.getElementById('section-finance-dashboard');
    el.innerHTML = '<div style="padding:20px;text-align:center">Loading Dashboard Data...</div>';
    
    // Fetch all necessary data
    var [glRes, lineRes, accRes, billRes, invRes] = await Promise.all([
        fetch('/api/finance_journal_entries'),
        fetch('/api/finance_journal_lines'),
        fetch('/api/finance_accounts'),
        fetch('/api/finance_bills'),
        fetch('/api/finance_invoices')
    ]);
    
    var entries = await glRes.json();
    var allLines = await lineRes.json();
    var accounts = await accRes.json();
    var bills = await billRes.json();
    var invoices = await invRes.json();
    
    // Map lines to entries
    entries.forEach(e => {
        e.lines = allLines.filter(l => l.entryId === e._id);
    });
    
    // High-Level Balances
    var balances = {};
    entries.forEach(e => {
        if(!e.lines) return;
        e.lines.forEach(l => {
            if(!balances[l.accountName]) balances[l.accountName] = 0;
            balances[l.accountName] += (l.debit || 0) - (l.credit || 0);
        });
    });

    var cash = balances['Cash'] || 0;
    var ar = balances['Accounts Receivable'] || 0;
    var ap = -(balances['Accounts Payable'] || 0);
    var netPos = cash + ar - ap;

    // Aggregate Last 6 Months (Income vs Expense)
    var monthlyData = {};
    var today = new Date();
    for(var i=5; i>=0; i--) {
        var d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        var label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[label] = { income: 0, expense: 0, sortKey: d.getTime() };
    }
    
    // Account Type Mapping
    var accTypeMap = {};
    accounts.forEach(a => accTypeMap[a.name] = a.type);
    
    // Expense Breakdown
    var expenseBreakdown = {};
    
    entries.forEach(e => {
        if(!e.lines || !e.date) return;
        var dateObj = new Date(e.date);
        var label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        e.lines.forEach(l => {
            var type = accTypeMap[l.accountName];
            var amount = (l.debit || 0) - (l.credit || 0);
            
            if(monthlyData[label]) {
                if(type === 'Revenue') {
                    monthlyData[label].income += -amount; // Revenue is normally a credit (-)
                } else if(type === 'Expense') {
                    monthlyData[label].expense += amount; // Expense is normally a debit (+)
                }
            }
            
            if(type === 'Expense' && amount > 0) {
                if(!expenseBreakdown[l.accountName]) expenseBreakdown[l.accountName] = 0;
                expenseBreakdown[l.accountName] += amount;
            }
        });
    });

    var labels = Object.keys(monthlyData).sort((a,b) => monthlyData[a].sortKey - monthlyData[b].sortKey);
    var incomeArr = labels.map(l => monthlyData[l].income);
    var expenseArr = labels.map(l => monthlyData[l].expense);
    
    var expLabels = Object.keys(expenseBreakdown).sort((a,b) => expenseBreakdown[b] - expenseBreakdown[a]);
    var expData = expLabels.map(l => expenseBreakdown[l]);
    
    // Mini Reports
    var unpaidBills = bills.filter(b => b.status === 'Unpaid').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5);
    var unpaidInvoices = invoices.filter(i => i.status !== 'Paid').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,5);
    
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-chart-bar" style="color:var(--gold)"></i> <span>Finance Executive Dashboard</span></p>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;margin-bottom:1.5rem">
            <div class="card" style="text-align:center;background:#0a0a0a;color:#fff">
                <p style="font-size:12px;color:#aaa;text-transform:uppercase;font-weight:600">Total Cash on Hand</p>
                <h3 style="color:#10b981;margin-top:.5rem">VUV ${cash.toLocaleString()}</h3>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Accounts Receivable</p>
                <h3 style="color:#3b82f6;margin-top:.5rem">VUV ${ar.toLocaleString()}</h3>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Accounts Payable</p>
                <h3 style="color:#ef4444;margin-top:.5rem">VUV ${ap.toLocaleString()}</h3>
            </div>
            <div class="card" style="text-align:center">
                <p style="font-size:12px;color:var(--text2);text-transform:uppercase;font-weight:600">Net Position</p>
                <h3 style="color:var(--navy);margin-top:.5rem">VUV ${netPos.toLocaleString()}</h3>
            </div>
        </div>
        
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem">
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Income vs Expense (6 Months)</p>
                <div style="position:relative;height:300px;width:100%"><canvas id="fin-bar-chart"></canvas></div>
            </div>
            <div class="card">
                <p style="font-size:14px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Expense Breakdown</p>
                <div style="position:relative;height:300px;width:100%"><canvas id="fin-pie-chart"></canvas></div>
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
            type: 'doughnut',
            data: {
                labels: expLabels.length > 0 ? expLabels : ['No Expenses'],
                datasets: [{
                    data: expData.length > 0 ? expData : [1],
                    backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b', '#eab308', '#d946ef', '#06b6d4'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%' }
        });
    }, 100);
}

// ----------------------------------------------------
// EXPENSE MANAGEMENT
// ----------------------------------------------------

function renderFinanceExpenses() {
    var el = document.getElementById('section-finance-expenses');
    var depts = DB.findAll('departments') || [];
    var deptOptions = '<option value="">-- Select Department --</option>';
    depts.forEach(d => { deptOptions += '<option value="'+d.name+'">'+d.name+'</option>'; });

    el.innerHTML = `
        <p class="section-title"><i class="ti ti-receipt" style="color:var(--gold)"></i> <span>Expense Management</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Add New Expense</p>
                <div style="margin-bottom:.85rem"><label>Category</label><select id="f-exp-cat">
                    <option>Office Supplies</option>
                    <option>Travel</option>
                    <option>Fuel</option>
                    <option>Utilities</option>
                    <option>Repairs</option>
                    <option>Other</option>
                </select></div>
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
    `;
    refreshExpenseList();
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

function updateExpenseStatus(id, status) {
    if(!confirm('Mark expense as ' + status + '?')) return;
    DB.update('finance_expenses', {_id: id}, {status: status, approvedBy: APP.currentUser.name});
    
    if(status === 'Approved') {
        var e = (DB.findAll('finance_expenses') || []).find(x => x._id === id);
        if(e) {
            postJournalEntry('Expense Approved: ' + e.category + ' (' + e.description + ')', e.date, [
                { accountName: e.category, debit: e.amount, department: e.department },
                { accountName: 'Accounts Payable', credit: e.amount }
            ]);
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

function refreshReimbursements() {
    var listEl = document.getElementById('f-reimb-list');
    var claims = DB.findAll('finance_reimbursements') || [];
    
    // Also pull in Medical Claims from HR that are approved but unpaid
    var hrReqs = DB.findAll('hr_requests') || [];
    hrReqs.forEach(req => {
        if(req.type === 'Medical Claim' && req.status === 'Approved' && !req.financePaid) {
            claims.push({
                _id: 'HR_' + req._id, // virtual ID
                hrRef: req._id,
                date: req._created,
                staffName: req.staffName,
                type: 'Medical Claim',
                description: req.notes || 'Medical Claim',
                amount: req.amount || req.medicalAmount,
                status: 'Pending Payout'
            });
        }
    });

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

function markReimbursed(id) {
    if(!confirm('Mark this claim as paid/reimbursed?')) return;
    
    if(id.startsWith('HR_')) {
        var hrId = id.substring(3);
        DB.update('hr_requests', {_id: hrId}, {financePaid: true, financePaidDate: new Date().toISOString()});
    } else {
        DB.update('finance_reimbursements', {_id: id}, {status: 'Paid', paidDate: new Date().toISOString()});
    }
    refreshReimbursements();
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

function renderFinanceCOA() {
    initCOA();
    var el = document.getElementById('section-finance-coa');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-list-tree" style="color:var(--gold)"></i> <span>Chart of Accounts</span></p>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:1rem">
            <div class="card" style="height:fit-content">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Add Account</p>
                <div style="margin-bottom:.85rem"><label>Account Code</label><input type="text" id="f-coa-code" placeholder="e.g. 1010"></div>
                <div style="margin-bottom:.85rem"><label>Account Name</label><input type="text" id="f-coa-name" placeholder="e.g. Petty Cash"></div>
                <div style="margin-bottom:1rem"><label>Type</label><select id="f-coa-type">
                    <option>Asset</option><option>Liability</option><option>Equity</option><option>Income</option><option>Expense</option>
                </select></div>
                <button class="btn btn-primary" onclick="addAccount()">Add Account</button>
            </div>
            <div class="card">
                <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Chart of Accounts</p>
                <div id="f-coa-list"></div>
            </div>
        </div>
    `;
    refreshCOA();
}

function addAccount() {
    var code = document.getElementById('f-coa-code').value.trim();
    var name = document.getElementById('f-coa-name').value.trim();
    var type = document.getElementById('f-coa-type').value;
    if(!code || !name) return alert('Fill all fields');
    DB.insert('finance_accounts', {code, name, type});
    refreshCOA();
}

function refreshCOA() {
    var listEl = document.getElementById('f-coa-list');
    var accounts = DB.findAll('finance_accounts') || [];
    accounts.sort((a,b) => parseInt(a.code||0) - parseInt(b.code||0));
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

function postJournalEntry(memo, date, lines) {
    initCOA();
    var totalDebit = 0;
    var totalCredit = 0;
    lines.forEach(l => {
        totalDebit += parseFloat(l.debit || 0);
        totalCredit += parseFloat(l.credit || 0);
    });
    // Ensure balance (allowing small rounding diffs)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        console.error('Journal entry out of balance!', lines);
        return false;
    }
    
    var entry = DB.insert('finance_journal_entries', {
        memo: memo,
        date: date || new Date().toISOString(),
        totalAmount: totalDebit,
        user: (APP.currentUser?APP.currentUser.name:'System')
    });
    
    lines.forEach(l => {
        DB.insert('finance_journal_lines', {
            entryId: entry._id,
            date: entry.date,
            accountName: l.accountName,
            debit: parseFloat(l.debit || 0),
            credit: parseFloat(l.credit || 0),
            department: l.department || ''
        });
    });
    return true;
}

function renderFinanceGL() {
    var el = document.getElementById('section-finance-gl');
    el.innerHTML = `
        <p class="section-title"><i class="ti ti-book-2" style="color:var(--gold)"></i> <span>General Ledger</span></p>
        <div style="margin-bottom:1rem">
            <button class="btn btn-primary" onclick="showManualJEDialog()"><i class="ti ti-plus"></i> New Journal Entry</button>
        </div>
        <div class="card">
            <p style="font-size:13px;font-weight:700;margin-bottom:1rem;color:var(--navy)">Journal Entries</p>
            <div id="f-gl-list"></div>
        </div>
        
        
        <!-- Edit JE Modal -->
        <div id="modal-edit-je" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;align-items:center;justify-content:center">
            <div style="background:#fff;padding:2rem;border-radius:8px;width:500px;max-width:90%">
                <h3 style="margin-top:0">Edit Journal Entry</h3>
                <div style="margin-bottom:1rem"><label>Memo / Description</label><input type="text" id="eje-memo" style="width:100%;padding:8px"></div>
                <div style="margin-bottom:1rem"><label>Date</label><input type="date" id="eje-date" style="width:100%;padding:8px"></div>
                
                <p style="font-weight:bold;margin-bottom:0.5rem;font-size:13px">Lines (Debits & Credits)</p>
                <div id="eje-lines-container" style="background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:1rem"></div>
                <button class="btn btn-outline btn-sm" onclick="addEditJELine()" style="margin-bottom:1rem">+ Add Line</button>
                
                <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #eee">
                    <button class="btn btn-outline" onclick="document.getElementById('modal-edit-je').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="saveEditedJE()">Save Changes</button>
                </div>
            </div>
        </div>
        
        <!-- Manual JE Modal -->
        <div id="modal-je" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999;align-items:center;justify-content:center">
            <div style="background:#fff;padding:2rem;border-radius:8px;width:500px;max-width:90%">
                <h3 style="margin-top:0">New Journal Entry</h3>
                <div style="margin-bottom:1rem"><label>Memo / Description</label><input type="text" id="je-memo" style="width:100%;padding:8px" placeholder="e.g. Sales Income for March"></div>
                <div style="margin-bottom:1rem"><label>Date</label><input type="date" id="je-date" style="width:100%;padding:8px"></div>
                
                <p style="font-weight:bold;margin-bottom:0.5rem;font-size:13px">Lines (Debits & Credits)</p>
                <div id="je-lines-container" style="background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:1rem"></div>
                <button class="btn btn-outline btn-sm" onclick="addJELine()" style="margin-bottom:1rem">+ Add Line</button>
                
                <div style="display:flex;justify-content:flex-end;gap:1rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #eee">
                    <button class="btn btn-outline" onclick="document.getElementById('modal-je').style.display='none'">Cancel</button>
                    <button class="btn btn-primary" onclick="saveManualJE()">Save Entry</button>
                </div>
            </div>
        </div>
    `;
    refreshGL();
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

function saveManualJE() {
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
    
    if(postJournalEntry(memo, date, lines)) {
        document.getElementById('modal-je').style.display = 'none';
        refreshGL();
        refreshReports();
        refreshBudget();
    } else {
        alert('Entry is out of balance. Check Debits and Credits.');
    }
}

function refreshGL() {
    var listEl = document.getElementById('f-gl-list');
    var entries = DB.findAll('finance_journal_entries') || [];
    var lines = DB.findAll('finance_journal_lines') || [];
    entries.sort((a,b) => new Date(b.date) - new Date(a.date));

    if(entries.length === 0) {
        listEl.innerHTML = '<p style="color:#888;font-size:12px;text-align:center">No journal entries found.</p>';
        return;
    }
    
    
    var isAdmin = (APP && APP.currentUser && APP.currentUser.role === 'Administrator');
    var html = '<table class="table" style="width:100%;font-size:12px"><thead><tr><th>Date</th><th>Memo</th><th>Account</th><th>Debit</th><th>Credit</th>' + (isAdmin ? '<th>Action</th>' : '') + '</tr></thead><tbody>';
    entries.forEach(e => {
        var eLines = lines.filter(l => l.entryId === e._id);
        var first = true;
        eLines.forEach((l, i) => {
            html += `<tr style="${first?'border-top:2px solid #e2e8f0':''}">
                <td style="color:#666">${first ? fmtDate(e.date) : ''}</td>
                <td style="color:#666">${first ? e.memo : ''}</td>
                <td style="font-weight:600">${l.accountName} ${l.department?'('+l.department+')':''}</td>
                <td style="color:#10b981">${l.debit ? l.debit.toLocaleString() : ''}</td>
                <td style="color:#e24b4a">${l.credit ? l.credit.toLocaleString() : ''}</td>
                ${isAdmin && first ? `<td rowspan="${eLines.length}"><button onclick="editJournalEntry('${e._id}')" class="btn btn-sm btn-outline" style="font-size:11px;padding:3px 8px">Edit</button></td>` : (isAdmin && !first ? '' : '')}
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

function refreshReports() {
    initCOA();
    var lines = DB.findAll('finance_journal_lines') || [];
    var accounts = DB.findAll('finance_accounts') || [];
    
    // Calculate balance per account
    var balances = {};
    lines.forEach(l => {
        if(!balances[l.accountName]) balances[l.accountName] = 0;
        balances[l.accountName] += l.debit;
        balances[l.accountName] -= l.credit;
    });

    var income = 0; var expenses = 0;
    var assets = 0; var liabilities = 0; var equity = 0;
    
    var plHtml = '<table style="width:100%;font-size:12px;border-collapse:collapse">';
    var bsHtml = '<table style="width:100%;font-size:12px;border-collapse:collapse">';

    // helper
    var addRow = (name, amount, isTotal) => `<tr><td style="padding:4px 0;${isTotal?'font-weight:700;border-top:1px solid #ccc;padding-top:8px':''}"><div style="${isTotal?'':'padding-left:10px'}">${name}</div></td><td style="text-align:right;padding:4px 0;${isTotal?'font-weight:700;border-top:1px solid #ccc;padding-top:8px':''}">${amount.toLocaleString()}</td></tr>`;

    accounts.forEach(a => {
        var bal = balances[a.name] || 0;
        if(bal === 0) return;
        
        // Income is normally Credit, Expenses are Debit
        if(a.type === 'Income') { var v = -bal; income += v; plHtml += addRow(a.name, v); }
        if(a.type === 'Expense') { var v = bal; expenses += v; plHtml += addRow(a.name, v); }
        
        // Assets Debit, Liab/Equity Credit
        if(a.type === 'Asset') { var v = bal; assets += v; bsHtml += addRow(a.name, v); }
        if(a.type === 'Liability') { var v = -bal; liabilities += v; bsHtml += addRow(a.name, v); }
        if(a.type === 'Equity') { var v = -bal; equity += v; bsHtml += addRow(a.name, v); }
    });
    
    var netIncome = income - expenses;
    plHtml += addRow('Total Income', income, true);
    plHtml += addRow('Total Expenses', expenses, true);
    plHtml += addRow('Net Income (Profit)', netIncome, true);
    plHtml += '</table>';

    // Add Net Income to Equity for balance sheet
    equity += netIncome;
    bsHtml += addRow('Total Assets', assets, true);
    bsHtml += '<tr><td colspan="2" style="height:15px"></td></tr>';
    bsHtml += addRow('Total Liabilities', liabilities, true);
    bsHtml += addRow('Total Equity (incl. Profit)', equity, true);
    bsHtml += addRow('Total Liab & Equity', liabilities + equity, true);
    bsHtml += '</table>';

    document.getElementById('f-rep-pl').innerHTML = plHtml;
    document.getElementById('f-rep-bs').innerHTML = bsHtml;
}

// ----------------------------------------------------
// INTEGRATION HOOKS
// ----------------------------------------------------
function postPayrollGL(p) {
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

    if(totalVNPF > 0) lines.push({ accountName: 'VNPF Payable', credit: totalVNPF });
    if(net > 0) lines.push({ accountName: 'Salary Payable', credit: net });
    if(loanDeduction > 0) lines.push({ accountName: 'Accounts Receivable', credit: loanDeduction }); // Repayment of staff loan
    if(otherDeduction > 0) lines.push({ accountName: 'Accounts Payable', credit: otherDeduction }); // Generic liability for other deducts

    postJournalEntry('Payroll: ' + p.staff + ' (' + p.periodStart + ' - ' + p.periodEnd + ')', p.paydate, lines);
}

// ==========================================
// PHASE 3: AR & AP (Invoices and Bills)
// ==========================================

async function renderFinanceContacts() {
    var c = document.getElementById('section-finance-contacts');
    c.innerHTML = '<div style="padding:20px"><p class="section-title"><i class="ti ti-address-book" style="color:var(--gold)"></i> <span>Contacts (Clients & Vendors)</span></p><div style="background:#fff;padding:20px;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,0.08);margin-bottom:20px"><h3 style="margin:0 0 1rem 0;font-size:15px">Add New Contact</h3><div style="display:flex;gap:10px;flex-wrap:wrap"><input type="text" id="contact-name" placeholder="Company / Individual Name" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><select id="contact-type" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px"><option value="Client">Client</option><option value="Vendor">Vendor</option><option value="Both">Both</option></select><input type="email" id="contact-email" placeholder="Email (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><input type="text" id="contact-phone" placeholder="Phone (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;width:140px"><input type="text" id="contact-address" placeholder="Address (Optional)" style="padding:8px 12px;border:1px solid #ddd;border-radius:7px;font-size:13px;flex:2;min-width:160px"><button onclick="saveContact()" style="padding:8px 18px;background:#0a0a0a;color:#fff;border:none;border-radius:7px;cursor:pointer;font-weight:600;font-size:13px">+ Save Contact</button></div></div><div id="contacts-list"></div></div>';
    await refreshContactsList();
}

async function saveContact() {
    var name = document.getElementById('contact-name').value.trim();
    var type = document.getElementById('contact-type').value;
    var email = document.getElementById('contact-email').value.trim();
    var phone = document.getElementById('contact-phone').value.trim();
    var address = document.getElementById('contact-address').value.trim();
    if(!name) return alert('Name is required');
    await fetch('/api/finance_contacts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, type, email, phone, address, created_at: new Date().toISOString()}) });
    renderFinanceContacts();
}

async function refreshContactsList() {
    var res = await fetch('/api/finance_contacts');
    var contacts = await res.json();
    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,0.08);border-radius:10px;overflow:hidden"><thead><tr style="background:#f8f8f8"><th style="padding:11px 14px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Name</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Type</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Email</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Phone</th><th style="padding:11px 14px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Address</th><th style="padding:11px 14px"></th></tr></thead><tbody>';
    contacts.forEach(c => {
        html += `<tr style="border-top:1px solid #f0f0f0"><td style="padding:11px 14px;font-weight:600">${c.name}</td><td style="padding:11px 14px"><span style="background:#eef;color:#338;padding:2px 9px;border-radius:10px;font-size:11px;font-weight:700">${c.type}</span></td><td style="padding:11px 14px;font-size:13px">${c.email||'-'}</td><td style="padding:11px 14px;font-size:13px">${c.phone||'-'}</td><td style="padding:11px 14px;font-size:13px">${c.address||'-'}</td><td style="padding:11px 14px;text-align:right"><button onclick="deleteContact('${c._id}')" style="background:transparent;border:none;color:#ef4444;cursor:pointer"><i class="ti ti-trash"></i></button></td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('contacts-list').innerHTML = html;
}

// ==========================================
// INVOICES (Accounts Receivable)
// ==========================================

async function renderFinanceInvoices() {
    var c = document.getElementById('section-finance-invoices');
    var [cRes, accRes] = await Promise.all([fetch('/api/finance_contacts'), fetch('/api/finance_accounts')]);
    var contacts = await cRes.json();
    var accounts = await accRes.json();
    var clientOptions = contacts.filter(x => x.type === 'Client' || x.type === 'Both').map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    var revenueOptions = accounts.filter(x => x.type === 'Revenue' || x.type === 'Income').map(x => `<option value="${x.name}">${x.name}</option>`).join('');

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
        var actions = `<button onclick="printInvoice('${inv._id}')" title="Print/PDF Invoice" style="padding:5px 9px;background:#f0f0f0;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px"><i class="ti ti-printer"></i> Print</button>`;
        if(s !== 'Paid') {
            actions += `<button onclick="markInvoicePaid('${inv._id}', '${inv.num}', '${inv.client}', ${inv.amount})" title="Mark Paid" style="padding:5px 9px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-check"></i> Mark Paid</button>`;
        } else {
            actions += `<button onclick="printReceipt('${inv._id}')" title="Print Receipt" style="padding:5px 9px;background:#0a0a0a;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px"><i class="ti ti-receipt"></i> Receipt</button>`;
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
    var lineItemsHtml = '';
    if(inv.lineItems && inv.lineItems.length > 0) {
        inv.lineItems.forEach(l => {
            lineItemsHtml += `<tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${l.desc}</td><td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f0f0f0">${l.qty}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f0f0f0">${(l.price||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #f0f0f0;font-weight:700">${(l.total||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>`;
        });
    } else {
        lineItemsHtml = `<tr><td colspan="4" style="padding:10px 12px">Services rendered</td></tr>`;
    }
    var statusBadge = inv.status === 'Paid' ? '<span style="background:#dcfce7;color:#166534;padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700">✓ PAID</span>' : '<span style="background:#fef3c7;color:#92400e;padding:5px 15px;border-radius:20px;font-size:12px;font-weight:700">UNPAID</span>';
    var win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${inv.num}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif}body{background:#eee;padding:30px}
    .page{background:#fff;max-width:820px;margin:0 auto;padding:50px;box-shadow:0 4px 20px rgba(0,0,0,.12);border-radius:10px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0a0a0a;padding-bottom:28px;margin-bottom:35px}
    .logo{height:55px;margin-bottom:8px}
    .co h1{font-size:22px;font-weight:800;color:#0a0a0a}.co p{font-size:12px;color:#666;margin-top:2px}
    .inv-id h2{font-size:34px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#0a0a0a;text-align:right}
    .inv-id .num{font-size:13px;font-family:monospace;color:#555;text-align:right;margin-top:6px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:25px;margin-bottom:32px}
    .meta-block h4{font-size:10px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:1px;margin-bottom:8px}
    .meta-block p{font-size:14px;line-height:1.7;color:#222}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#0a0a0a}
    thead th{padding:12px 14px;color:#fff;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .total-row td{background:#0a0a0a;color:#fff;font-weight:800;font-size:18px}
    .notes{background:#f8f9fb;border-left:4px solid #10b981;border-radius:0 8px 8px 0;padding:14px;font-size:12px;color:#444;margin-top:28px;line-height:1.7}
    .footer{margin-top:32px;border-top:1px solid #eee;padding-top:18px;display:flex;justify-content:space-between;font-size:11px;color:#999}
    @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;padding:30px}.no-print{display:none}@page{margin:1cm}}
    </style></head><body>
    <div class="page">
        <div class="hdr">
            <div class="co">
                <img src="logo.png" class="logo" alt="${cName}" onerror="this.style.display='none'">
                <h1>${cName}</h1>
                <p>${cAddress}</p>
                ${cPhone?'<p>'+cPhone+'</p>':''}
                ${cEmail?'<p>'+cEmail+'</p>':''}
            </div>
            <div class="inv-id">
                <h2>Invoice</h2>
                <div class="num">${inv.num}</div>
                <div style="margin-top:12px">${statusBadge}</div>
            </div>
        </div>
        <div class="meta">
            <div class="meta-block">
                <h4>Bill To</h4>
                <p><strong>${inv.client}</strong></p>
            </div>
            <div class="meta-block" style="text-align:right">
                <h4>Details</h4>
                <p>Invoice Date: <strong>${inv.date||''}</strong><br>Due Date: <strong>${inv.due||''}</strong>${inv.paidDate?'<br>Paid On: <strong>'+inv.paidDate+'</strong>':''}</p>
            </div>
        </div>
        <table style="margin-bottom:0">
            <thead><tr><th>Description</th><th style="width:60px;text-align:center">Qty</th><th style="width:140px;text-align:right">Unit Price</th><th style="width:140px;text-align:right">Amount (VUV)</th></tr></thead>
            <tbody>${lineItemsHtml}</tbody>
            <tfoot><tr class="total-row"><td colspan="3" style="padding:14px 14px;text-align:right">TOTAL DUE (VUV)</td><td style="padding:14px 14px;text-align:right">${(inv.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr></tfoot>
        </table>
        ${inv.notes?'<div class="notes"><strong>Notes / Payment Terms:</strong><br>'+inv.notes+'</div>':''}
        <div class="footer">
            <span>Thank you for your business!</span>
            <span>Generated by WokManeja &bull; ${new Date().toLocaleDateString()}</span>
        </div>
    </div>
    <div class="no-print" style="text-align:center;margin-top:20px">
        <button onclick="window.print()" style="padding:11px 28px;background:#0a0a0a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">🖨️ Print / Save as PDF</button>
    </div></body></html>`);
    win.document.close();
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
    var lineDesc = (inv.lineItems && inv.lineItems.length > 0) ? inv.lineItems.map(l => l.desc).join(', ') : 'Services rendered';
    var win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${rcptNum} - Receipt</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif}body{background:#eee;padding:40px}
    .page{background:#fff;max-width:520px;margin:0 auto;padding:45px;box-shadow:0 4px 20px rgba(0,0,0,.12);border-radius:10px}
    .hdr{text-align:center;border-bottom:2px solid #0a0a0a;margin-bottom:28px;padding-bottom:22px}
    .hdr img{height:52px;margin-bottom:10px}
    .hdr h1{font-size:20px;font-weight:800}.hdr p{font-size:12px;color:#888;margin-top:3px}
    .badge{font-size:24px;font-weight:900;text-align:center;text-transform:uppercase;letter-spacing:2px;background:#f8f8f8;padding:12px;border-radius:8px;margin:18px 0}
    .row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f5f5f5;font-size:13px}
    .row:last-child{border-bottom:none}
    .row span:first-child{color:#888;font-weight:600}
    .row span:last-child{font-weight:700}
    .amount-box{background:#0a0a0a;color:#fff;border-radius:10px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;margin:22px 0}
    .amount-box .lbl{font-size:12px;font-weight:700;opacity:.8}
    .amount-box .amt{font-size:24px;font-weight:900}
    .stamp{text-align:center;margin:20px 0}
    .stamp span{display:inline-block;background:#dcfce7;color:#166534;padding:9px 32px;border-radius:30px;font-size:22px;font-weight:900;letter-spacing:2px;border:3px solid #16a34a}
    .foot{text-align:center;margin-top:28px;font-size:11px;color:#bbb;line-height:1.8}
    @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;padding:25px}.no-print{display:none}@page{margin:0.5cm}}
    </style></head><body>
    <div class="page">
        <div class="hdr">
            <img src="logo.png" alt="${cName}" onerror="this.style.display='none'">
            <h1>${cName}</h1>
            <p>${cAddress}</p>
        </div>
        <div class="badge">Payment Receipt</div>
        <div style="margin:20px 0">
            <div class="row"><span>Receipt No.</span><span>${rcptNum}</span></div>
            <div class="row"><span>Invoice Ref.</span><span>${inv.num}</span></div>
            <div class="row"><span>Received From</span><span>${inv.client}</span></div>
            <div class="row"><span>Invoice Date</span><span>${inv.date||''}</span></div>
            <div class="row"><span>Payment Date</span><span>${inv.paidDate||new Date().toLocaleDateString()}</span></div>
            <div class="row"><span>Description</span><span style="max-width:240px;text-align:right;word-break:break-word">${lineDesc}</span></div>
        </div>
        <div class="amount-box">
            <div class="lbl">AMOUNT RECEIVED (VUV)</div>
            <div class="amt">${(inv.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
        </div>
        <div class="stamp"><span>✓ PAID IN FULL</span></div>
        <div class="foot">
            <p>This is your official receipt. Thank you for your payment.</p>
            <p>Generated by WokManeja &bull; ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <div class="no-print" style="text-align:center;margin-top:20px">
        <button onclick="window.print()" style="padding:11px 28px;background:#0a0a0a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">🖨️ Print Receipt</button>
    </div></body></html>`);
    win.document.close();
}

// ==========================================
// VENDOR BILLS (Accounts Payable)
// ==========================================

async function renderFinanceBills() {
    var c = document.getElementById('section-finance-bills');
    var [cRes, accRes] = await Promise.all([fetch('/api/finance_contacts'), fetch('/api/finance_accounts')]);
    var contacts = await cRes.json();
    var accounts = await accRes.json();
    var vendorOptions = contacts.filter(x => x.type && (x.type.toLowerCase() === 'vendor' || x.type.toLowerCase() === 'both')).map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    var expOptions = accounts.filter(x => x.type === 'Expense').map(x => `<option value="${x.name}">${x.name}</option>`).join('');

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
    var res = await fetch('/api/finance_journal_entries');
    var entries = await res.json();
    
    var sysBalance = 0;
    var unclearedHtml = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden"><thead><tr style="background:#f4f4f4;text-align:left"><th style="padding:10px;width:40px">Clear</th><th style="padding:10px">Date</th><th style="padding:10px">Description</th><th style="padding:10px;text-align:right">Amount (VUV)</th></tr></thead><tbody>';
    
    entries.forEach(e => {
        if(!e.lines) return;
        var cashLine = e.lines.find(l => l.accountName === 'Cash');
        if(cashLine) {
            var amount = (cashLine.debit || 0) - (cashLine.credit || 0);
            sysBalance += amount;
            
            if(!e.cleared) {
                var amtStr = amount > 0 ? '+ ' + amount.toLocaleString() : '- ' + Math.abs(amount).toLocaleString();
                var color = amount > 0 ? '#10b981' : '#ef4444';
                unclearedHtml += `<tr style="border-top:1px solid #eee"><td style="padding:10px;text-align:center"><input type="checkbox" onchange="toggleClear('${e.id}', this.checked)" style="transform:scale(1.2);cursor:pointer"></td><td style="padding:10px">${e.date}</td><td style="padding:10px">${e.desc}</td><td style="padding:10px;text-align:right;color:${color}">${amtStr}</td></tr>`;
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
    var res = await fetch('/api/finance_journal_entries/' + id);
    var doc = await res.json();
    doc.cleared = isCleared;
    await fetch('/api/finance_journal_entries/' + id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
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
