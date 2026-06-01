# WokManeja - Payroll & HR Management System

WokManeja is a lightweight, comprehensive Payroll and HR management application tailored specifically for businesses in Vanuatu. Designed to run as a secure local server, it provides a modern web interface without requiring complex cloud infrastructure or subscriptions.

An enterprise-grade Payroll and Human Resource management system powered by a local Node.js server and an embedded SQLite Database architecture.

## Features
- **Local SQLite Database Engine**: High-speed, robust local operation via an embedded database.
- **Network Accessibility**: The local server allows authorized devices on your network to connect securely.
- **Staff Directory & Regulatory Profiles**: Single source of truth for VNPF tracking and banking details.
- **Payroll Disbursements & Statutory Calculations**: Automated VNPF contributions, overtime calculation, severance package calculations, and custom deductions.
- **HR Leave Auditing**: Comprehensive state-machine management for Annual Leave, Sick Leave, and Payment Advances.
- **AI-Powered Executive Compliance**: Integrated with Anthropic Claude for deep analysis and recommendations on payroll trends.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the WokManeja server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to `http://localhost:5050` (or your machine's local IP address).

4. **Default Administrator Account:**
   - **Username:** `admin`
   - **Password:** `admin123`

Please refer to the updated [User Guide](WokManeja_User_Guide.md) for full operational instructions.
