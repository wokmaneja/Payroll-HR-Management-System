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
    c.innerHTML = '<div style="padding:20px"><h2 style="margin:0 0 15px 0">Contacts (Clients & Vendors)</h2><div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:20px"><h3 style="margin-top:0">Add New Contact</h3><input type="text" id="contact-name" placeholder="Company/Individual Name" style="padding:8px;width:200px;margin-right:10px"><select id="contact-type" style="padding:8px;margin-right:10px"><option value="Client">Client</option><option value="Vendor">Vendor</option><option value="Both">Both</option></select><input type="email" id="contact-email" placeholder="Email (Optional)" style="padding:8px;width:200px;margin-right:10px"><button onclick="saveContact()" class="btn-primary" style="padding:8px 15px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer">Save Contact</button></div><div id="contacts-list"></div></div>';
    await refreshContactsList();
}

async function saveContact() {
    var name = document.getElementById('contact-name').value.trim();
    var type = document.getElementById('contact-type').value;
    var email = document.getElementById('contact-email').value.trim();
    if(!name) return alert('Name is required');
    await fetch('/api/finance_contacts', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name, type, email, created_at: new Date().toISOString()}) });
    renderFinanceContacts();
}

async function refreshContactsList() {
    var res = await fetch('/api/finance_contacts');
    var contacts = await res.json();
    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden"><thead><tr style="background:#f4f4f4;text-align:left"><th style="padding:10px">Name</th><th style="padding:10px">Type</th><th style="padding:10px">Email</th></tr></thead><tbody>';
    contacts.forEach(c => {
        html += `<tr style="border-top:1px solid #eee"><td style="padding:10px">${c.name}</td><td style="padding:10px"><span style="background:#eef;color:#338;padding:2px 8px;border-radius:10px;font-size:12px">${c.type}</span></td><td style="padding:10px">${c.email||'-'}</td><td style="padding:10px;text-align:right"><button onclick="deleteContact('${c._id}')" style="background:transparent;border:none;color:#ef4444;cursor:pointer"><i class="ti ti-trash"></i></button></td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('contacts-list').innerHTML = html;
}

async function renderFinanceInvoices() {
    var c = document.getElementById('section-finance-invoices');
    var res = await fetch('/api/finance_contacts');
    var contacts = await res.json();
    var clientOptions = contacts.filter(x => x.type === 'Client' || x.type === 'Both').map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    
    c.innerHTML = `<div style="padding:20px"><h2 style="margin:0 0 15px 0">Invoices (Accounts Receivable)</h2><div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:20px"><h3 style="margin-top:0">Create New Invoice</h3><div style="display:flex;gap:10px;margin-bottom:10px"><select id="inv-client" style="padding:8px;width:200px"><option value="">-- Select Client --</option>${clientOptions}</select><input type="text" id="inv-desc" placeholder="Description/Services" style="padding:8px;flex:1"><input type="number" id="inv-amount" placeholder="Amount" style="padding:8px;width:120px"><input type="date" id="inv-due" style="padding:8px;width:150px"></div><button onclick="saveInvoice()" class="btn-primary" style="padding:8px 15px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer">Generate Invoice</button></div><div id="invoices-list"></div></div>`;
    await refreshInvoicesList();
}

async function saveInvoice() {
    var client = document.getElementById('inv-client').value;
    var desc = document.getElementById('inv-desc').value.trim();
    var amount = parseFloat(document.getElementById('inv-amount').value);
    var due = document.getElementById('inv-due').value;
    if(!client || !desc || isNaN(amount) || !due) return alert('Fill all fields');
    
    var invNum = 'INV-' + Date.now().toString().slice(-6);
    var doc = { num: invNum, client, desc, amount, due, status: 'Sent', date: new Date().toISOString().split('T')[0] };
    await fetch('/api/finance_invoices', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
    
    // Auto-post to GL (AR increases, Revenue increases)
    await postJournalEntry('Invoice ' + invNum + ' to ' + client, doc.date, [
        { accountName: 'Accounts Receivable', debit: amount },
        { accountName: 'Sales Revenue', credit: amount }
    ]);
    renderFinanceInvoices();
}

async function refreshInvoicesList() {
    var res = await fetch('/api/finance_invoices');
    var invoices = await res.json();
    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden"><thead><tr style="background:#f4f4f4;text-align:left"><th style="padding:10px">Invoice #</th><th style="padding:10px">Client</th><th style="padding:10px">Description</th><th style="padding:10px">Amount</th><th style="padding:10px">Due Date</th><th style="padding:10px">Status</th><th style="padding:10px">Action</th></tr></thead><tbody>';
    invoices.forEach(i => {
        var s = i.status;
        var badge = s === 'Paid' ? '<span style="color:#2a2;background:#eef6ee;padding:2px 6px;border-radius:4px;font-size:12px">Paid</span>' : '<span style="color:#d90;background:#fef5e6;padding:2px 6px;border-radius:4px;font-size:12px">Sent</span>';
        var action = s === 'Sent' ? `<button onclick="markInvoicePaid('${i.id}', '${i.num}', '${i.client}', ${i.amount})" style="padding:4px 8px;background:#2a2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Mark Paid</button>` : '';
        html += `<tr style="border-top:1px solid #eee"><td style="padding:10px">${i.num}</td><td style="padding:10px">${i.client}</td><td style="padding:10px">${i.desc}</td><td style="padding:10px">${i.amount.toLocaleString()}</td><td style="padding:10px">${i.due}</td><td style="padding:10px">${badge}</td><td style="padding:10px">${action}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('invoices-list').innerHTML = html;
}

async function markInvoicePaid(id, num, client, amount) {
    if(!confirm('Mark Invoice ' + num + ' as paid?')) return;
    await fetch('/api/finance_invoices/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'Paid', paidDate: new Date().toISOString().split('T')[0] }) });
    
    // Auto-post to GL (Cash increases, AR decreases)
    await postJournalEntry('Payment Received for Invoice ' + num + ' (' + client + ')', new Date().toISOString().split('T')[0], [
        { accountName: 'Cash', debit: amount },
        { accountName: 'Accounts Receivable', credit: amount }
    ]);
    renderFinanceInvoices();
}

async function renderFinanceBills() {
    var c = document.getElementById('section-finance-bills');
    var res = await fetch('/api/finance_contacts');
    var contacts = await res.json();
    var vendorOptions = contacts.filter(x => x.type && (x.type.toLowerCase() === 'vendor' || x.type.toLowerCase() === 'both')).map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    
    var coaRes = await fetch('/api/finance_accounts');
    var accounts = await coaRes.json();
    var expOptions = accounts.filter(x => x.type === 'Expense').map(x => `<option value="${x.name}">${x.name}</option>`).join('');
    
    c.innerHTML = `<div style="padding:20px"><h2 style="margin:0 0 15px 0">Vendor Bills (Accounts Payable)</h2><div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:20px"><h3 style="margin-top:0">Log New Vendor Bill</h3><div style="display:flex;gap:10px;margin-bottom:10px"><select id="bill-vendor" style="padding:8px;width:200px"><option value="">-- Select Vendor --</option>${vendorOptions}</select><input type="text" id="bill-desc" placeholder="Description" style="padding:8px;flex:1"><select id="bill-expense" style="padding:8px;width:180px"><option value="">-- Expense Account --</option>${expOptions}</select><input type="number" id="bill-amount" placeholder="Amount" style="padding:8px;width:120px"><input type="date" id="bill-due" style="padding:8px;width:150px"><input type="file" id="bill-file" accept="image/*,.pdf" style="padding:8px;width:150px"></div><button onclick="saveBill()" class="btn-primary" style="padding:8px 15px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer">Log Bill</button></div><div id="bills-list"></div></div>`;
    await refreshBillsList();
}

async function saveBill() {
    var vendor = document.getElementById('bill-vendor').value;
    var desc = document.getElementById('bill-desc').value.trim();
    var expenseAcct = document.getElementById('bill-expense').value;
    var amount = parseFloat(document.getElementById('bill-amount').value);
    var due = document.getElementById('bill-due').value;
    if(!vendor || !desc || !expenseAcct || isNaN(amount) || !due) return alert('Fill all fields');
    
    var billNum = 'BILL-' + Date.now().toString().slice(-6);
    var doc = { num: billNum, vendor, desc, expenseAcct, amount, due, status: 'Unpaid', date: new Date().toISOString().split('T')[0] };
    await fetch('/api/finance_bills', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(doc) });
    
    // Auto-post to GL (Expense increases, AP increases)
    await postJournalEntry('Bill ' + billNum + ' from ' + vendor, doc.date, [
        { accountName: expenseAcct, debit: amount },
        { accountName: 'Accounts Payable', credit: amount }
    ]);
    renderFinanceBills();
}

async function refreshBillsList() {
    var res = await fetch('/api/finance_bills');
    var bills = await res.json();
    var html = '<table style="width:100%;border-collapse:collapse;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden"><thead><tr style="background:#f4f4f4;text-align:left"><th style="padding:10px">Bill #</th><th style="padding:10px">Vendor</th><th style="padding:10px">Description</th><th style="padding:10px">Expense Acct</th><th style="padding:10px">Amount</th><th style="padding:10px">Due Date</th><th style="padding:10px">Status</th><th style="padding:10px">Action</th></tr></thead><tbody>';
    bills.forEach(b => {
        var s = b.status;
        var badge = s === 'Paid' ? '<span style="color:#2a2;background:#eef6ee;padding:2px 6px;border-radius:4px;font-size:12px">Paid</span>' : '<span style="color:#e24b4a;background:#fdecec;padding:2px 6px;border-radius:4px;font-size:12px">Unpaid</span>';
        var action = s === 'Unpaid' ? `<button onclick="markBillPaid('${b.id}', '${b.num}', '${b.vendor}', ${b.amount})" style="padding:4px 8px;background:#2a2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px">Pay Bill</button>` : '';
        var viewBtn = b.receipt ? `<a href="${b.receipt}" target="_blank" class="btn-outline" style="padding:3px 6px;margin-right:5px;font-size:12px;border:1px solid #ccc;border-radius:4px;color:#333;text-decoration:none"><i class="ti ti-paperclip"></i></a>` : '';
        html += `<tr style="border-top:1px solid #eee"><td style="padding:10px">${b.num}</td><td style="padding:10px">${b.vendor}</td><td style="padding:10px">${b.desc}</td><td style="padding:10px">${b.expenseAcct}</td><td style="padding:10px">${b.amount.toLocaleString()}</td><td style="padding:10px">${b.due}</td><td style="padding:10px">${badge}</td><td style="padding:10px">${viewBtn}${action}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('bills-list').innerHTML = html;
}

async function markBillPaid(id, num, vendor, amount) {
    if(!confirm('Record payment for Bill ' + num + '?')) return;
    await fetch('/api/finance_bills/' + id, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'Paid', paidDate: new Date().toISOString().split('T')[0] }) });
    
    // Auto-post to GL (AP decreases, Cash decreases)
    await postJournalEntry('Payment made for Bill ' + num + ' (' + vendor + ')', new Date().toISOString().split('T')[0], [
        { accountName: 'Accounts Payable', debit: amount },
        { accountName: 'Cash', credit: amount }
    ]);
    renderFinanceBills();
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
