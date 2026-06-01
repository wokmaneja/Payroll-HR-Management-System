<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="height:80px; margin-bottom: 20px;" />

# WokManeja - How-To Use Guide
Step-by-step instructions for completing everyday operational tasks in the WokManeja system.

---

## 1. Getting Started & Login

### How to Access the System
1. Open your web browser (Chrome, Edge, or Firefox).
2. Navigate to your local server address (e.g., `http://localhost:5050` or the specific IP address provided by your IT department).
3. The WokManeja login screen will appear.

### How to Log In
1. Enter your assigned **Username** and **Password**.
   - *Note: If this is a fresh installation, the default administrator credentials are `admin` / `admin123`.*
2. Click **Sign In**.
3. You will be directed to the operational Dashboard.

---

## 2. Managing Staff Profiles

### How to Add a New Employee
1. Navigate to the **Staff Management** tab using the left sidebar.
2. Under the **Add New Staff** card on the left:
   - Enter the **Full Name**.
   - The **Employee ID** will auto-generate to prevent collisions (e.g., WH001).
   - Enter the **Designation / Job Title**.
   - Select their **Department** from the dropdown. (Click *Manage* to add a new department if needed).
   - Enter their **Bank Name** and **Account Number**.
3. Set the employee's **Pay Cycle** (Weekly, Fortnightly, or Monthly).
4. (Optional) Check the **Enable Staff Portal Access** box to create a linked user account for the employee, allowing them to log in and view their HR records.
5. Click **Save Staff**.

### How to Inactivate an Employee (Offboarding)
If an employee leaves the company, you should not delete their profile (to maintain historical audit trails).
1. Go to **Staff Management**.
2. Find the employee in the Staff Directory table on the right.
3. Click the **Edit** button next to their name.
4. Change their **Status** dropdown from *Active* to *Inactive*.
5. Click **Save Staff**. They will no longer appear in future payroll runs.

---

## 3. Processing Payroll

### How to Create an Individual Payslip
1. Navigate to the **Create Payslip** tab.
2. Select the employee from the **Employee Name** dropdown. The system will auto-fill their ID, department, and Pay Cycle.
3. Select the **Period Start** and **Period End** dates.
4. Enter the **Basic Pay** in the Earnings section.
5. (Optional) Click **Show Overtime Calculator** to help compute complex statutory overtime multipliers. Enter the final value in the Overtime field.
6. (Optional) If offboarding an employee, use the **Calculate Severance** button (1 month remuneration per year of service).
7. The **VNPF Deduction** will auto-calculate at 6% based on the Basic Pay.
8. Enter any Custom Deductions (e.g., Staff Loans) if applicable.
9. Verify the **Net Payable Amount** at the top.
10. Click **Save to Database**.
11. Click **Download / Print** to generate a PDF copy for the employee.

### How to Process Bulk Payroll
1. Navigate to the **Bulk Payslip Processing** tab.
2. Select the global **Pay Cycle** (e.g., Monthly).
3. Set the global **Pay Date**, **Month**, and **Year**.
4. The active staff grid will populate. You can type directly into the *Basic*, *OT*, *Bonus*, and *Deductions* columns for each employee.
5. The system will auto-calculate VNPF and Net Payable for each row dynamically.
6. Click **Save All to Database** to process the entire company payroll in one click.

### How to Reprint a Historical Payslip
1. Navigate to **Payslip Records**.
2. Find the payslip you need (you can filter by month or search by name).
3. Click the **Print** button next to the record to generate an exact PDF replica.

---

## 4. HR Leave & Advances

### How to Submit a Leave Request
1. Navigate to the **HR Leave & Advance** tab.
2. Under the Submit Request form:
   - Select the **Employee**.
   - Select the **Request Type** (Annual Leave, Sick Leave, Leave Without Pay, or Payment Advance).
   - Choose the **Start Date** and **End Date**.
   - Add a brief reason in the **Notes** box.
3. Click **Submit Request**.

### How to Approve or Reject a Request
1. As an Administrator or Manager, navigate to the **Dashboard** or **HR Leave & Advance** tab.
2. Locate the **Pending** request in the Recent Requests table.
3. Click **Approve** (Green checkmark) or **Reject** (Red cross).
4. Approving Annual/Sick leave will automatically deduct the taken days from the employee's entitlement balance. Approving a Payment Advance registers an outstanding loan balance for the employee.

---

## 5. Compliance & Reporting

### How to Generate the AI Executive Report
1. Navigate to **AI Compliance Report** (if authorized).
2. Select the desired Month and Year.
3. Click **Generate Report**.
4. The system will bundle the database metrics securely and generate a plain-English executive summary highlighting any unusual trends, VNPF discrepancies, or sick leave spikes.

### How to Export VNPF Remittance
1. Navigate to **VNPF Remittance**.
2. Select the target Month and Year.
3. The system will aggregate the 6% Employer and 6% Employee contributions.
4. Click **Download PDF** to export the ledger for government upload.

---

## 6. System Maintenance

### How to Export a Database Backup
1. Navigate to **Database Manager** (requires Admin or IT role).
2. Click **Export Database**.
3. A JSON backup file containing all system data will be downloaded to your machine. 
4. Store this file securely on an external drive. *(It is recommended to do this on the last day of every month).*

### How to Restore a Database Backup
1. Navigate to **Database Manager**.
2. Click **Import Backup**.
3. Select the previously downloaded JSON backup file.
4. **Warning:** This will overwrite all current system data with the backup state. Use only in emergencies or when migrating hardware.
