# WokManeja — Payroll & HR Management System

> **v2.0** — Full-Suite HRMS: Payroll · Leave · Recruitment · Document Center · Staff Discipline · KPI Tracking

WokManeja is a lightweight, comprehensive **Payroll and Human Resources Management System (HRMS)** tailored specifically for businesses in Vanuatu and the Pacific. Designed to run as a secure local server, it provides a modern web interface without requiring complex cloud infrastructure or subscriptions.

An enterprise-grade system powered by a local **Node.js** server and an embedded **SQLite** database architecture.

---

## 🌐 Live Demo

**[▶ Try the Live Demo](https://wokmaneja.github.io/Payroll-HR-Management-System/)** — Hosted on GitHub Pages.

> Demo Credentials: `admin` / `admin123`

---

## ✨ What's New in v2.0

| Module | Description |
|---|---|
| 📁 **Document Center** | HR can request & manage staff documents (IDs, Contracts, Licences). Staff upload via self-service portal. |
| 💼 **Recruitment Management** | Post internal vacancies, track candidates, manage pipeline (New → Interviewing → Hired). |
| ⚖️ **Staff Discipline** | Log incidents, request staff explanations, track status through to finalized corrective action. |
| 🎯 **Performance KPI Tracking** | Assign KPI targets per staff, track scores and attach supporting documents. |
| 🔔 **Staff Self-Service Portal** | Staff can view payslips, submit leave, upload documents, browse vacancies & view KPIs. |
| 🛡️ **Control Center Licensing** | Manage secure deployments and validate offline software license keys. |
| 🖥️ **Windows Service Installer** | Complete `.exe` setup that uses NSSM to run WokManeja silently in the background 24/7. |
| 📧 **SMTP Notifications** | Real-time email dispatch pipeline for critical HR alerts and management requests. |

---

## 🚀 Core Features

- **Local SQLite Database Engine** — High-speed, robust local operation via an embedded database. Zero configuration required.
- **Network Accessibility** — The local server allows authorized devices on your network to connect securely.
- **Automated Windows Installer** — Installs seamlessly and registers as a background Windows Service (NSSM) for absolute uptime.
- **Staff Directory & Profiles** — Single source of truth for VNPF tracking, banking details, and employment records.
- **Payroll Disbursements & Statutory Calculations** — Automated VNPF contributions, overtime, severance packages, and custom deductions.
- **Bulk Payroll Processing** — Generate payslips for all active staff in one click (weekly, fortnightly, monthly).
- **HR Leave & Advance Auditing** — Comprehensive state-machine management for Annual Leave, Sick Leave, Medical Claims, and Payment Advances.
- **Document Center** — Request, upload, and securely manage staff documents.
- **Work Recruitment Management** — Full candidate pipeline with internal vacancy postings.
- **Staff Discipline HRMS** — Policy enforcement with digital workflows and audit trails.
- **Performance KPI Tracking** — Staff appraisals and key performance monitoring.
- **Control Center Licensing** — Independent dashboard for generating and managing secure license keys.
- **Role-Based Access Control (RBAC)** — Admin, Manager, IT, and Staff roles with granular permissions.
- **Real-Time Notification System** — In-app alerts and full SMTP email integration for HR requests, vacancies, and disciplinary actions.
- **Compliance Reporting** — Payroll & VNPF compliance reports with PDF export.
- **Full Audit Logs** — Complete system activity trail for accountability.
- **Auto Backup** — Configurable scheduled backups of the SQLite database.
- **Multi-Language Support** — Internationalization-ready UI.

---

## 🖥️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+

### Installation

#### Automated Deployment (Recommended)
You can download, extract, and install the WokManeja Windows Service in a single step by opening a **Windows PowerShell** terminal as Administrator and running:

```powershell
$url = "https://github.com/wokmaneja/Payroll-HR-Management-System/releases/download/v1.2.0/WokManeja-Release-1.0.0.zip"; $dest = "C:\WokManeja"; Invoke-WebRequest -Uri $url -OutFile "WM.zip"; Expand-Archive -Path "WM.zip" -DestinationPath $dest -Force; Start-Process -FilePath "$dest\install-service.bat" -Verb RunAs; Remove-Item "WM.zip"
```

#### Manual Developer Setup (Source Code)
1. **Clone the repository:**
   ```bash
   git clone https://github.com/wokmaneja/Payroll-HR-Management-System.git
   cd Payroll-HR-Management-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:5050`

### Default Accounts

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Administrator |
| `manager` | `mgr123` | Manager |
| `it_user` | `it123` | IT Officer |
| `jdoe` | `user123` | Staff |

---

## 🏗️ Architecture

```
WokManeja/
├── server.js          # Node.js/Express backend
├── public/
│   ├── index.html     # Main single-page application
│   └── features.js    # HRMS module render functions (Docs, Recruitment, KPI, Discipline)
├── database.sqlite    # Embedded SQLite database
└── uploads/           # Secure file storage for staff documents
```

**Tech Stack:** Node.js · Express · SQLite (`better-sqlite3`) · Vanilla JS · HTML/CSS

---

## 📋 User Roles

| Role | Access |
|---|---|
| **Admin** | Full system access — all modules, user management, delete records |
| **Manager** | All payroll & HR features, approve/reject requests, delete records |
| **IT** | All payroll & HR features, approve/reject requests (cannot delete) |
| **Staff** | Self-service portal — own payslips, leave requests, documents, KPIs |

---

## 📦 Release History

| Version | Highlights |
|---|---|
| **v2.0** | Document Center, Recruitment, Staff Discipline, KPI Tracking, Staff Portal |
| **v1.0.3** | Medical Insurance Claims, Bulk Payslip, VNPF Bank Report |
| **v1.0.2** | Notification system, Leave summaries, UI overhaul |
| **v1.0.1** | Payslip Records, Audit Logs, Auto Backup |
| **v1.0.0** | Initial Release — Payroll, Leave & Advance, Staff Directory |

---

## 📄 Documentation

- [User Guide](WokManeja_User_Guide.md)
- [How-To Guide](WokManeja_How_To_Use.md)
- [Business Proposal](business_proposal.html)

---

## 📬 Contact & Licensing

Need a license key or custom deployment?  
📧 **wokmaneja@gmail.com**

WokManeja © 2026. Empowering your workforce with secure, modern, and scalable HR management.
