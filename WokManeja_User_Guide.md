<img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCAzMDAgODAiPjxyZWN0IHg9IjAiIHk9IjEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxNiIgZmlsbD0iIzBhMGEwYSIvPjxwYXRoIGQ9Ik0gMTUgNDUgTCAyNSAzMCBMIDM1IDQwIEwgNDggMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNIDM4IDI1IEwgNDggMjUgTCA0OCAzNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjx0ZXh0IHg9Ijc1IiB5PSI0NSIgZm9udC1mYW1pbHk9IlNlZ29lIFVJLCBUYWhvbWEsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzQiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMxYTFhMWEiPldvazx0c3BhbiBmaWxsPSIjMTBiOTgxIj5NYW5lamE8L3RzcGFuPjwvdGV4dD48dGV4dCB4PSI3NyIgeT0iNjUiIGZvbnQtZmFtaWx5PSJTZWdvZSBVSSwgVGFob21hLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjNjY2NjY2Ij5NZWtlbSB3b2sgYmxvbmcgeXUgaSBpc2k8L3RleHQ+PC9zdmc+" alt="WokManeja" style="height:80px; margin-bottom: 20px;" />

# WokManeja - Enterprise Payroll & HR System
Mekem wok blong yu i isi — Complete Reference Manual & Operations Handbook

**DOCUMENT REFERENCE:** WKM-MAN-2026-ENG  
**SYSTEM VERSION:** v1.0.0 (Production Packaged)  
**COMPLIANCE LAWS:** Vanuatu VNPF Statutory Act & Labor Law  
**PUBLISHED BY:** WokManeja System Services Group ©  

---

## 1. System Introduction & Technical Architecture
WokManeja is an enterprise-grade Payroll and Human Resource management system. It has been custom-designed to streamline the complex regulatory compliance tasks, leave auditing requirements, and payroll distributions faced by corporate administrations. By utilizing a local high-speed Node.js and SQLite backend, WokManeja guarantees fast interface response times, robust data integrity, and excellent data privacy.

### 1.1 Local Backend & SQLite Engine
WokManeja operates via a localized Node.js Express server backend with an embedded SQLite database engine (`database.sqlite`). The system compiles data structures into structured JSON collections ("staff", "payslips", "users", "hr_requests", "reminders") and writes them to the high-speed SQLite database instantly. This localized approach eliminates traditional remote server connection dropouts and ensures the business continues to operate even during internet disruptions.

### 1.2 Network Access & Authentication
WokManeja is configured to bind to the local network (`0.0.0.0`), allowing authorized devices within the same office or network to access the system securely. It features a built-in token-based authentication middleware. 
Upon initial deployment, a default system administrator account is generated (`Username: admin`, `Password: admin123`) which should be changed upon first login.

---

## 2. Staff Directory & Regulatory Profiles
The Staff Directory is the foundational module of the system, acting as the Single Source of Truth for all personnel information. Each profile tracks essential professional properties, structural banking values, and personal contact info. These fields are pulled dynamically across the system to populate VNPF reports, payslip records, and bank transfer ledgers.

### 2.1 Structural Fields and Employee Schema
- **Legal Full Name**: Used for VNPF statutory registration and formal banking distributions.
- **Unique Employee ID**: Auto-incremented format (e.g., WH001, WH002) to prevent identification collisions.
- **Designation / Title**: Designates official organizational title (e.g., Senior Accountant, Lead Bartender).
- **Department Unit**: Assigned business group: Executive, Finance, Operations, Administration, or Consultant.
- **Bank & Account digits**: Identifies bank (e.g., BSP) and account number for direct payroll deposits.
- **Leave Entitlements**: Statutory leave ceilings: defaults to 21 Annual Leave and 10 Sick Leave days per year.

### 2.2 Lifecycle Active/Inactive Statuses
To preserve history while maintaining clean operations, WokManeja utilizes active/inactive switches:
- **Active Status**: Includes the employee in new payroll runs and proration tables. Active staff appear in bulk processing lists.
- **Inactive Status**: Excludes the record from new payslip runs. The database retains their historical records (past payslips, VNPF contributions, leave logs) intact for compliance audits while cleaning active screens.

---

## 3. Payroll Disbursements & Statutory Calculations
WokManeja features a double-mode payroll processing engine. Administrators can compile individual payslips using a granular details card, or invoke the Bulk Staff Entry grid to process the entire company's payroll on a single page, complete with live proration calculations.

### 3.1 Pay Cycles
WokManeja supports granular pay cycle configuration to meet various corporate payroll rhythms. Supported pay cycles include:
- **Weekly**: Payments are calculated and distributed every 7 days.
- **Fortnightly**: Payments are calculated and distributed every 14 days (Every 2 Weeks).
- **Monthly**: Payments are calculated and distributed once per calendar month.

### 3.2 Earnings Configurations
WokManeja supports several configurable earnings additions:
- **Basic Pay**: Core structured salary or hourly accumulation.
- **Overtime**: See below for calculation breakdown.
- **Severance Package**: Includes a built-in severance calculator that strictly calculates 1 month's remuneration for each year of service.
- **Allowances & Bonus**: Custom line items for standard allowances and one-off bonuses.

### 3.3 Granular Overtime Rates & Calculations
Overtime is automatically calculated from the basic monthly salary. An employee's standard hourly rate is derived by dividing their monthly basic pay by 220 standard working hours (equivalent to 22 working days of 10 hours each). Based on this hourly value, three statutory overtime multipliers are applied:
- **Standard Weekday**: 1.5x Hourly Rate
- **Standard Weekend**: 2.0x Hourly Rate
- **Public Holiday**: 2.5x Hourly Rate

### 3.4 Statutory VNPF & Custom Deductions
- **Statutory VNPF**: Auto-calculated at exactly 6% of the employee's Basic Pay, guaranteeing statutory compliance for Vanuatu National Provident Fund filing. The employer match is handled under the reports.
- **Custom Deductions & Loans**: Allows structuring payments to offset outstanding staff loans or corporate advance balances. The custom field features a descriptive memo for Union Fees, equipment cost recoveries, or tax levies.

---

## 4. HR Leave Auditing & Monetary Advances
To replace separate tracking spreadsheets and paper applications, WokManeja bundles a centralized HR transactions ledger. This ledger manages the complete workflow of employee absences and company-issued financial loans, feeding records directly into the database.

### 4.1 Categories of HR Requests
- **Annual Leave**: Tracks standard vacations. Approving this request automatically deducts the specified number of days from the employee's annual balance.
- **Sick Leave**: Logs paid sick leave, tracking it against their statutory annual sick leave entitlement.
- **Leave Without Pay (LWOP)**: Records standard unpaid absences. This provides audit trails for monthly salary proration during payslip generations.
- **Payment Advance**: Tracks structural corporate loans. Submitting a Payment Advance registers an outstanding balance under the employee profile, which can then be offset inside the Deduction module of their next payslip.

### 4.2 Workflow Approval State Machine
All HR submissions progress through a strict, auditable workflow state machine:
1. **Pending (Amber)**: Stored in the database and flagged on the supervisor dashboard, indicating review is required.
2. **Approved (Green)**: Finalizes the record. The system deducts leave days from their balance or registers the cash loan, logging a permanent notification.
3. **Rejected (Red)**: Rejects the request. No balances are affected, but the historical trail is kept for payroll auditing.

---

## 5. Compliance Reporting & Data Security

### 5.1 VNPF Remittance Reports
To simplify monthly compliance filings, the VNPF Remittance Report compiles a complete statutory ledger for any selected month. The report pulls all historical payslips, extracts standard Basic Salary values, auto-calculates the 6% Employer share and the 6% Employee share, and aggregates the total 12% joint VUV remittance due. It outputs a print-formatted, government-compliant ledger ready for upload or PDF printing.

### 5.2 Data Security & SQLite Safety
Because WokManeja operates inside a secure local backend, a few critical precautions must be followed:
- **Backup Ledger**: Proactively export database files using the "Database Manager" tab on the sidebar. Save this backup file in a secure external drive.
- **Inactivity Shield**: If the system is left unattended for 15 minutes, the system triggers an automatic logoff to protect employee pay data.

> [!IMPORTANT] 
> **SECURITY REMINDER: LICENSING AUDITS**
> The active corporate license key is bound to your physical machine. You can verify your license details at any time by navigating to "Company Settings" in the sidebar navigation. The system dynamically reads the local activation flag file and displays your license key and activation date in the secure read-only display box.

---

## 6. Dashboard & Real-Time Notifications

### 6.1 Operational Dashboard
The Dashboard provides a real-time operational overview. It actively monitors core metrics including total active staff, pending HR leave requests, and pending corporate payment advances. Any company reminder marked as "Pin to Dashboard" will prominently display here to ensure all administrators are aware of urgent tasks.

### 6.2 Notification Bell System
Integrated into the top navigation bar, the Notification Bell tracks the lifecycle of HR requests and system events. When an employee submits a new leave request or cash advance, the system generates a new alert. Administrators can review the alert and, upon taking action (Approve/Reject), the notification updates dynamically to maintain a clean communication log.

---

## 7. Reminders & Database Management

### 7.1 Company Reminders Module
The Reminders module replaces traditional sticky notes by offering a structured task manager. Users can create categorized reminders (General, Payroll, Compliance, Meeting), assign due dates, and apply priority levels (Low, Medium, High). Critical reminders can be pinned directly to the Dashboard. Once a task is completed, it can be marked as resolved to clear it from the active queue.

### 7.2 Database Manager & Data Integrity
WokManeja utilizes a local SQLite architecture. To prevent catastrophic data loss during hardware failures, the Database Manager tool is provided to facilitate secure backups.
- **Export Database**: Compiles all employee profiles, payslips, leaves, and configurations into a backup file which should be stored securely on a USB drive or external server.
- **Import Backup**: Restores the system state using a previously exported file. Importing a backup overwrites the current session, ensuring seamless recovery during PC migrations.

> [!TIP]
> **BACKUP BEST PRACTICES**
> It is heavily recommended that the Payroll Administrator performs a full Database Export on the last working day of every month, immediately following the final payslip and VNPF batch generations.

---

## 8. Users, Settings & Licensing

### 8.1 Role-Based Access Control (RBAC)
To maintain operational security, WokManeja enforces access boundaries via user accounts:
- **Administrator**: Full access across the entire system, including deleting historical payroll logs and overriding approvals.
- **Manager**: Can view HR reports and authorize leave requests, but cannot modify core payroll configurations or delete historical ledgers.
- **IT / Support**: Can execute Database exports/imports and system resets but cannot view decrypted financial payslips.
- **Standard User**: Read-only access restricted strictly to viewing the staff directory and public memos.

### 8.2 Company Profile Configuration
The Company Settings panel enables modification of global variables such as the Registered Company Name, Employer VNPF Number, and Corporate Logo. These settings automatically cascade down, updating the headers of all generated Payslips and VNPF Remittance PDFs instantly.

---

## 9. Payslip Records & Archiving
WokManeja features a dedicated Payslip Records ledger which acts as the digital archive for every salary disbursement processed through the system. Rather than storing fragile paper copies, the SQLite engine permanently indexes all gross, net, and deduction calculations for rapid retrieval.

### 9.1 Audit and Reprinting
From the Payslip Records interface, administrators can instantly review historical distributions. If an employee requests a copy of a previous payslip for banking or loan purposes, the system allows the administrator to generate an exact PDF replica of the original payslip without altering current payroll data.

---

## 10. AI-Powered Executive Compliance

### 10.1 Claude AI Narrative Generation
Unlike standard accounting software that only exports tabular data, WokManeja includes an advanced Executive Compliance Report powered by Anthropic's Claude AI. When a monthly report is requested, the system compiles the total Gross Payroll, VNPF deductions, HR leave logs, and Cash Advances, and securely processes them to generate a human-readable executive narrative.

### 10.2 Automated Observations & Recommendations
The AI Engine automatically flags compliance risks. It generates targeted observations regarding VNPF matching accuracy, abnormal deduction patterns, and unusual spikes in sick leave. Furthermore, it constructs actionable recommendations for the executive team, ensuring the company remains strictly compliant with Vanuatu Labor Laws.

---

## 11. Advanced Database Management

### 11.1 Live Database Viewer
For IT and technical administrators, the Database Management module includes a Live DB Viewer. This interface allows direct read-only inspection of the raw JSON collections (users, staff, payslips, hr_requests) stored within the SQLite engine. This transparency is vital for auditing system integrity without needing external database tools.

### 11.2 Automated Monthly Backups
To safeguard against data loss, WokManeja features an Auto-Backup mechanism. When enabled in the Company Settings, the background engine detects the final operational day of the month and automatically prompts a secure JSON backup download to the administrator's machine. This guarantees an off-site ledger is preserved at the close of every payroll cycle.

---

## 12. Roles & Detailed Permissions
In addition to the general RBAC definitions, system interactions are strictly sandboxed:
- **HR Approvals**: While standard users can submit leave applications on behalf of staff, only Managers and Administrators possess the cryptographic clearance to Approve or Reject them.
- **Record Deletion**: The IT role is granted privileges to purge the database or import backups to resolve corruption. However, to prevent internal fraud, IT users are strictly prohibited from viewing decrypted financial payslips—a capability reserved solely for Executive Managers and Administrators.
- **Self-Service Leaves**: If a user account is linked to a staff profile in the User Management console, that individual can monitor their own personal annual and sick leave balances securely.
