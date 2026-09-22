# Kaliluni Coffee Farmers Delivery System

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-green)
![Express](https://img.shields.io/badge/Express-5-lightgrey)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3)
![License](https://img.shields.io/badge/License-ISC-green)

Kaliluni Coffee Farmers Delivery System is an end-to-end digital cooperative platform designed for coffee farmers cooperative societies. The system streamlines cherry delivery logging, financial accounting (harvest payouts, advances, input deductions), membership administration, official announcements, downloadable forms, and cooperative governance.

---

## Table of Contents

- [System Overview](#system-overview)
- [Key Features by Role](#key-features-by-role)
- [Technology Stack](#technology-stack)
- [Architecture and Workflow](#architecture-and-workflow)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pre-Seeded Demo Accounts](#pre-seeded-demo-accounts)
- [API Documentation](#api-documentation)
- [Development Scripts](#development-scripts)
- [Author and License](#author-and-license)

---

## System Overview

The Kaliluni Coffee Farmers Delivery System replaces manual paperwork and ledger books in coffee cooperative societies with an automated, transparent, and role-based web platform.

- **Farmers:** Real-time visibility into cherry deliveries, official weight receipts, advances, deductions, pending balances, and cooperative notices.
- **Factory and Field Staff:** Rapid digital recording of incoming coffee cherry batches, automatic receipt generation (KAL-YYYY-XXXX), member registration, advance disbursement tracking, and net payout calculation.
- **Cooperative Administrators:** Centralized control over member and staff user accounts, cooperative rates per kilogram, annual levies, loan interest rates, season calendars, system maintenance mode, and tamper-evident audit logs.
- **Chief Executive Officer (CEO):** Executive oversight of cooperative performance, high-level analytics, and approval/rejection of farmer advance requests.

---

## Key Features by Role

### 1. Farmer Portal

- **Farmer Dashboard:** Real-time overview of current season metrics (total kilograms delivered, gross earnings, advances taken, paid amounts, and net pending payment).
- **Delivery History:** Searchable record of cherry deliveries with date, gross weight, receipt numbers, and cherry quality grades.
- **Transaction History:** Breakdown of financial items (advances, deductions for farm inputs, and payout disbursements).
- **Announcements Feed:** Cooperative news updates, AGM notices, and input distribution alerts with priority badges.
- **Download Forms:** Access to official cooperative documents (Loan Application, Membership Application, Input Request, Payment Query).
- **Profile Management:** View and update registered phone number, location, and account details.

### 2. Staff Portal

- **Staff Operations Dashboard:** Today's cherry intake summary, active delivering farmers count, and seasonal intake statistics.
- **Record Cherry Delivery:** Input delivery weight per member, choose quality grade, add batch remarks, and instantly issue unique receipt numbers.
- **Farmer Registry:** View complete member directory (KFCS-XXXXX), contact information, geographic location, and register new farmers.
- **Transaction Management:** Record loans/cash advances and deductions against upcoming harvests.
- **Payment Processing and Release:** Automated calculation of farmer earnings based on rate per kg minus advances and deductions.
- **Reports and Analytics:** Aggregated reports summarizing delivery volumes and seasonal performance.

### 3. Cooperative Administrator Portal

- **Admin Dashboard:** High-level cooperative KPIs (total farmers, active staff, total cherries delivered in kg, cumulative disbursements, active user status).
- **User Management:** Create, inspect, update, and activate/deactivate accounts across all roles (farmer, staff, admin, CEO).
- **System Settings:**
  - Cherry rate per kilogram (KES)
  - Advance rate per kilogram (KES)
  - Annual cooperative society fee (KES)
  - Loan interest rate (%)
  - Harvest season dates (start date, end date, season tag)
  - SMS and Email notification toggles
  - System Maintenance Mode toggle
- **Security Audit Logs:** Comprehensive activity logging of critical events (LOGIN, RECORD_DELIVERY, REGISTER_FARMER, RECORD_TRANSACTION, CREATE_USER, UPDATE_SETTINGS, APPROVE_ADVANCE) capturing user, role, IP address, and timestamp.

### 4. CEO Portal

- **Executive Dashboard:** Charts for monthly deliveries, payment trends, role distribution, and top-performing farmers.
- **Advance Approvals:** Review, approve, or reject farmer advance requests with a full audit trail.
- **Reports and Analytics:** Access to aggregated operational reports.
- **Audit Trail:** Full visibility into system activity.

### 5. Authentication and Security

- **Farmer Self-Registration:** New farmers register with name, email, phone, location, number of coffee trees, and password. A membership number (KFCS-00XXX) is generated automatically.
- **JWT-Based Authentication:** Stateless session tokens attached via HTTP headers.
- **Role-Based Access Control (RBAC):** Route protection on both frontend (`ProtectedRoute`) and backend (`authenticate`, `allowRoles`).
- **Password Reset via 6-Digit Code:** Secure password recovery via email with a time-limited 6-digit verification code. Uses Nodemailer with automatic Ethereal test mode or Gmail SMTP.
- **Strong Password Policy:** Enforced on registration and password changes (minimum 8 characters, uppercase, lowercase, number, and special character).
- **Bcrypt Password Hashing:** All new passwords are hashed with bcryptjs.

---

## Technology Stack

| Layer | Technology | Description |
|-------|-----------|-------------|
| Frontend Framework | React 19 | Component-based UI library |
| Frontend Tooling | Vite 8 | High-speed frontend build tool and dev server |
| Routing | React Router v7 | Client-side declarative routing and protected routes |
| UI Components and Styling | React-Bootstrap / Bootstrap 5 | Responsive layout, badges, modals, cards |
| HTTP Client | Axios | Promise-based HTTP client with auth interceptors |
| Notifications | React-Toastify | Toast notifications for user actions |
| Charts | Chart.js / react-chartjs-2 | Interactive data visualizations |
| PDF Export | jsPDF / jspdf-autotable | Client-side PDF report generation |
| Excel Export | SheetJS (xlsx) | Client-side Excel report generation |
| Backend Runtime | Node.js (ES Modules) | Server-side JavaScript runtime |
| Backend Framework | Express 5 | RESTful API server framework |
| Database | PostgreSQL (pg pool) | Relational database management system |
| Password Security | bcryptjs | Password salting and hashing |
| Auth Tokens | jsonwebtoken | JWT token creation and verification |
| File Uploads | multer | Multipart form-data handling for form uploads |
| Email Service | Nodemailer | SMTP email dispatcher with development console fallback |
| Logging and Utilities | Morgan, Dotenv, CORS | Request logger, env loader, and CORS middleware |

---

## Architecture and Workflow
