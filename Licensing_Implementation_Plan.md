# WokManeja Module & Staff-Cap Licensing — Implementation Plan

## 1. Goal

Extend the existing hardware-locked `WM-...` license key system so a single key can also encode:

- which app modules a client is licensed for (some clients get everything, some get only a subset)
- a maximum staff headcount, enforced as a hard block on the server

Backward compatibility is required: any license key already activated before this feature existed (no module/staff segments) must keep working as **full access, unlimited staff**.

## 2. Key Format

```
WM-{PLAN}-{DURATION}-{MODULES}-{STAFFCAP}-{RANDOM}
```

| Segment | Values | Notes |
|---|---|---|
| PLAN | `STD`, `PRO`, `ENT` | defaults to `enterprise` if absent |
| DURATION | `1M`, `3M`, `6M`, `1Y`, `2Y`, `5Y`, `LIFETIME` | defaults to 12 months |
| MODULES | `ALL`, or any combination of `HR`, `PC`, `FIN`, `PAY`, `RPT`, `ADM` | absent/unrecognized = full access (backward compatible) |
| STAFFCAP | `S{n}` (e.g. `S50`) or `SUNL` | absent = unlimited |
| RANDOM | any hex string | uniqueness only, not parsed |

Example: `WM-PRO-1Y-HR-FIN-S50-7F3A2C` = Pro plan, 1 year, HR + Finance only, capped at 50 staff.

Module code → app section mapping:

- `HR` → Leave & Advance, Document Center, Performance KPI, Staff Discipline
- `PC` → Petty Cash (Register, Vouchers, Monthly Summary, Settings)
- `FIN` → Finance (Invoices, Bills, Daily Income, Banking, Reconciliation, GL, Budgeting)
- `PAY` → Payroll (Create/Bulk Payslip, Payslip Records)
- `RPT` → Reports Center
- `ADM` → Company Settings, App Updates, Database Manager, Audit Logs, Trash Bin

Always available regardless of license: Dashboard, Staff Directory, Add/Edit Staff, User Management, Roles & Permissions, Help.

## 3. Server changes (`server.js`)

- `POST /api/license/activate` — parses `modules` and `maxStaff` from the key using the same substring-matching style already used for plan/duration, stores both in the encrypted license payload (`null` = unrestricted).
- `GET /api/license/status` — returns `modules`, `maxStaff`, and current `staffCount` alongside the existing fields, defaulting to unrestricted for any license that predates this feature.
- Generic `POST /api/:collection` handler — when `collection === 'staff'`, decrypts the license, and if `maxStaff` is set and the current staff count is at/over the cap, rejects with `403` before the insert. Fails open (allows the request) if the license check itself errors, so a bug never locks out legitimate staff creation.

## 4. Main app changes (`public/index.html`)

- `MODULE_ITEM_MAP` — maps each nav item id to its module code.
- `isModuleLicensed()` / `filterMenuByLicense()` — filter `MENUS[role]` before rendering the sidebar, hiding whole module groups the license doesn't cover, while keeping core items visible.
- `refreshLicenseEntitlements()` — fetches `/api/license/status` right after login and caches `licensedModules` / `maxStaff` / `staffCount` on `APP`, before `buildNav()` runs.
- `saveStaff()` — client-side pre-check against `APP.maxStaff` with a friendly alert, backed by the server-side hard block.
- Company Settings → Software License card now shows licensed modules and staff usage (e.g. "12 / 50").

## 5. Control Center changes (`control-center/src/App.jsx`, `index.html`, `public/`)

- License Key Generator gets a module checklist (with an "All Modules" shortcut) and a staff-cap control (Unlimited or a number), and `handleGenerateKey()` embeds both into the generated key.
- Rebrand: default Vite favicon/title replaced with the real WokManeja logo (`favicon.png`, `logo.png`) and title "WokManeja Control Center"; header and login-screen icons now use the actual logo image.

## 6. Status

| Item | Status |
|---|---|
| Server-side parsing + enforcement | Done, verified in code |
| Main app nav filtering + staff cap UI | Done, verified in code |
| Control Center generator UI + rebrand | Done, verified in code |
| Deployed to live Control Center (GitHub Pages) | **Pending** — see Section 7 |
| Deployed to live business app (server.js/index.html) | **Pending** — separate from Pages; requires your normal app-update/release process |

## 7. Deployment (Control Center only)

The sandbox environment used for this session cannot push to GitHub directly (no reachable network path to `api.github.com`, and its local git index proved unreliable). Do this manually, once, from your own machine:

1. On GitHub, open `control-center/src/App.jsx` in the `wokmaneja/Payroll-HR-Management-System` repo, edit, and paste in the contents of your local `control-center\src\App.jsx`. Commit to `main`.
2. Same for `control-center/index.html` using your local copy.
3. In `control-center/public/`, upload `favicon.png` and `logo.png` from your local `control-center\public\` folder.
4. The "Deploy Control Center to GitHub Pages" Action runs automatically on push to `main` and redeploys within a couple of minutes.

Once done, `https://wokmaneja.github.io/Payroll-HR-Management-System/` will show the updated generator and branding.

## 8. Housekeeping flagged during this work

- The GitHub PAT you pasted into chat to test API deployment should be rotated/revoked, since it was never actually usable from the sandbox (network was blocked) and is now visible in the conversation log.
- Your local repo has 4 old, un-popped `git stash` entries and several stray one-off script files (`patch-index-*.js`, `check_license.js`, etc.) at the repo root — worth a cleanup pass when convenient, unrelated to this feature.
