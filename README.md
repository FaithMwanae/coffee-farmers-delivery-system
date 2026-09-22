# ☕ Kaliluni Coffee Farmers Delivery System

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-green)
![Express](https://img.shields.io/badge/Express-5-lightgrey)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3)
![License](https://img.shields.io/badge/License-ISC-green)

> **Kaliluni Coffee Farmers Delivery System** is an end-to-end digital cooperative platform designed for coffee farmers cooperative societies. The system streamlines cherry delivery logging, financial accounting (harvest payouts, advances, input deductions), membership administration, official announcements, downloadable forms, and cooperative governance.

---

## 📌 Table of Contents

1. [System Overview](#-system-overview)
2. [Key Features by Role](#-key-features-by-role)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Workflow](#-architecture--workflow)
5. [Directory Structure](#-directory-structure)
6. [Database Schema & Models](#-database-schema--models)
7. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [1. Database Configuration](#1-database-configuration)
   - [2. Backend Setup](#2-backend-setup)
   - [3. Frontend Setup](#3-frontend-setup)
8. [Environment Variables](#-environment-variables)
9. [Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
10. [API Documentation](#-api-documentation)
11. [Development Scripts](#-development-scripts)
12. [Author & License](#-author--license)

---

## 📖 System Overview

The **Kaliluni Coffee Farmers Delivery System** replaces manual paperwork and ledger books in coffee cooperative societies with an automated, transparent, and role-based web platform.

- **For Farmers:** Real-time visibility into cherry deliveries, official weight receipts, advances, deductions, pending balances, and cooperative notices.
- **For Factory & Field Staff:** Rapid digital recording of incoming coffee cherry batches, automatic receipt generation (`KAL-YYYY-XXXX`), member registration, advance disbursement tracking, and net payout calculation.
- **For Cooperative Administrators:** Centralized control over member and staff user accounts, cooperative rates per kilogram, annual levies, loan interest rates, season calendars, system maintenance mode, and tamper-evident audit logs.

---

## 🌟 Key Features by Role

### 🌾 1. Farmer Portal
- **Farmer Dashboard:** Real-time overview of current season metrics (total kilograms delivered, gross earnings, advances taken, paid amounts, and net pending payment).
- **Delivery History:** Searchable record of cherry deliveries with date, gross weight, receipt numbers, and cherry quality grades (*Good, Excellent, Standard*).
- **Transaction History:** Breakdown of financial items (advances, deductions for farm inputs/fertilizers, and payout disbursements).
- **Announcements Feed:** Cooperative news updates, AGM notices, and input distribution alerts with priority badges.
- **Download Forms:** Access to official cooperative documents (Loan Application Forms, Membership Applications, Input Request Forms, Payment Query Forms).
- **Profile Management:** View and update registered phone number, location, and account details.

### 📋 2. Staff Portal
- **Staff Operations Dashboard:** Today's cherry intake summary, active delivering farmers count, and seasonal intake statistics.
- **Record Cherry Delivery:** Input delivery weight per member, choose quality grade, add batch remarks, and instantly issue unique receipt numbers.
- **Farmer Registry:** View complete member directory (`KFCS-XXXXX`), contact information, geographic location, and register new farmers.
- **Transaction Management:** Record loans/cash advances and deductions against upcoming harvests.
- **Payment Processing & Release:** Automated calculation of farmer earnings based on rate per kg minus advances and deductions, with one-click payment release.
- **Reports & Analytics:** Aggregated reports summarizing delivery volumes and seasonal performance.

### 🛡️ 3. Cooperative Administrator Portal
- **Admin Dashboard:** High-level cooperative KPIs (total farmers, active staff, total cherries delivered in kg, cumulative disbursements, active user status).
- **User Management:** Create, inspect, update, and activate/deactivate accounts across all three roles (`farmer`, `staff`, `admin`).
- **System Settings:** 
  - Cherry rate per kilogram (KES)
  - Annual cooperative society fee (KES)
  - Loan interest rate (%)
  - Harvest season dates (start date, end date, season tag)
  - Toggle SMS notifications & Email notifications
  - Toggle System Maintenance Mode
- **Security Audit Logs:** Comprehensive activity logging of critical events (`LOGIN`, `RECORD_DELIVERY`, `REGISTER_FARMER`, `RECORD_TRANSACTION`, `CREATE_USER`, `UPDATE_SETTINGS`) capturing user, role, IP address, and timestamp.

### 🔒 4. Authentication & Security
- **Farmer Self-Registration:** Allows new farmers to register with their name, email, phone, location, number of coffee trees, and password, generating a membership number (`KFCS-00XXX`).
- **JWT-Based Authentication:** Stateless session tokens attached via HTTP headers.
- **Role-Based Access Control (RBAC):** Strict route protection on both frontend (`ProtectedRoute`) and backend (`authenticate`, `allowRoles`).
- **Password Reset via Email Link:** Token-based password recovery via email (`/reset-password/:token`) using Nodemailer (auto-switches to Ethereal test mode with instant preview URL or Gmail SMTP).
- **In-Memory Store with Plain-Text Passwords:** Streamlined development & testing setup with `/backend/data/store.js`.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) | Component-based UI library |
| **Frontend Tooling** | [Vite 8](https://vitejs.dev/) | High-speed frontend build tool and dev server |
| **Routing** | [React Router v7](https://reactrouter.com/) | Client-side declarative routing and protected routes |
| **UI Components & Styling** | [React-Bootstrap](https://react-bootstrap.github.io/) / [Bootstrap 5](https://getbootstrap.com/) | Responsive layout, badges, modals, cards |
| **HTTP Client** | [Axios](https://axios-http.com/) | Promise-based HTTP client with auth interceptors |
| **Notifications** | [React-Toastify](https://fkhadra.github.io/react-toastify/) | Toast notifications for user actions |
| **Backend Runtime** | [Node.js](https://nodejs.org/) (ES Modules) | Server-side JavaScript runtime |
| **Backend Framework** | [Express 5](https://expressjs.com/) | RESTful API server framework |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (`pg` pool) | Relational database management system |
| **Password Security** | [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Password salting and hashing |
| **Auth Tokens** | [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) | JWT token creation and verification |
| **Email Service** | [Nodemailer](https://nodemailer.com/) | SMTP email dispatcher with development console fallback |
| **Logging & Utilities** | [Morgan](https://www.npmjs.com/package/morgan), [Dotenv](https://www.npmjs.com/package/dotenv), [CORS](https://www.npmjs.com/package/cors) | Request logger, env loader, and CORS middleware |

---

##  Architecture & Workflow

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + Vite)"]
        UI[User Interface / Bootstrap 5]
        AuthCtx[Auth Context & State]
        AxiosClient[Axios Client + JWT Interceptor]
        UI --> AuthCtx
        AuthCtx --> AxiosClient
    end

    subgraph API["Backend API (Express 5 Server)"]
        AuthRoute["/api/auth/*"]
        FarmerRoute["/api/farmer/*"]
        StaffRoute["/api/staff/*"]
        AdminRoute["/api/admin/*"]
        
        MW_Auth[Auth Middleware / JWT Verification]
        MW_Role[Role Checker Middleware]
        MW_Audit[Audit Logger Middleware]
    end

    subgraph Database["PostgreSQL Database"]
        DB_Users[(users)]
        DB_Farmers[(farmers)]
        DB_Deliveries[(deliveries)]
        DB_Transactions[(transactions)]
        DB_Announcements[(announcements)]
        DB_Forms[(forms)]
        DB_Settings[(settings)]
        DB_Logs[(audit_logs)]
        DB_Resets[(password_resets)]
    end

    AxiosClient -->|HTTP REST Requests| API
    API --> MW_Auth
    MW_Auth --> MW_Role
    MW_Role --> MW_Audit
    
    MW_Audit --> AuthRoute
    MW_Audit --> FarmerRoute
    MW_Audit --> StaffRoute
    MW_Audit --> AdminRoute

    AuthRoute --> DB_Users
    AuthRoute --> DB_Resets
    FarmerRoute --> DB_Deliveries
    FarmerRoute --> DB_Transactions
    FarmerRoute --> DB_Announcements
    FarmerRoute --> DB_Forms
    StaffRoute --> DB_Farmers
    StaffRoute --> DB_Deliveries
    StaffRoute --> DB_Transactions
    AdminRoute --> DB_Users
    AdminRoute --> DB_Settings
    AdminRoute --> DB_Logs
```

---

##  Directory Structure

```plaintext
coffee-farmers-delivery-system/
├── backend/
│   ├── config/
│   │   ├── initDb.js           # Database initialization and table seeding script
│   │   ├── pool.js             # PostgreSQL connection pool configuration
│   │   └── schema.sql          # PostgreSQL DDL tables, indexes, and initial data
│   ├── controllers/
│   │   ├── adminController.js  # User management, settings, audit logs logic
│   │   ├── authController.js   # Login, registration, password recovery logic
│   │   ├── farmerController.js # Deliveries, transactions, profile for farmers
│   │   └── staffController.js  # Delivery recording, farmer registry, payments
│   ├── data/
│   │   └── store.js            # Initial in-memory data store / mock structures
│   ├── middleware/
│   │   ├── auditLogger.js      # Audit log recording middleware
│   │   ├── auth.js             # Bearer JWT verification middleware
│   │   ├── errorHandler.js     # 404 handler and global error interceptor
│   │   └── roleCheck.js        # Role authorization middleware
│   ├── routes/
│   │   ├── adminRoutes.js      # /api/admin endpoints
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   ├── farmerRoutes.js     # /api/farmer endpoints
│   │   └── staffRoutes.js      # /api/staff endpoints
│   ├── utils/
│   │   ├── emailService.js     # Nodemailer SMTP and console email simulator
│   │   ├── passwordValidator.js# Strong password policy criteria checks
│   │   ├── paymentCalculator.js# Gross/Net payout calculation logic
│   │   └── tokenUtils.js       # JWT signing and verification helpers
│   ├── .env.example            # Sample backend environment configuration
│   ├── package.json            # Backend dependencies and scripts
│   └── server.js               # Express application entry point
│
├── frontend/
│   ├── public/                 # Static assets (favicons, SVG icons)
│   ├── src/
│   │   ├── api/                # API communication services (axios instances)
│   │   │   ├── adminApi.js
│   │   │   ├── authApi.js
│   │   │   ├── client.js       # Base Axios instance with token interceptors
│   │   │   ├── farmerApi.js
│   │   │   └── staffApi.js
│   │   ├── assets/             # Images and SVG icons
│   │   ├── components/
│   │   │   └── common/         # Reusable DataTable, PageHeader, StatsCard, etc.
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx # Global user authentication state provider
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx      # Wrapper for login, register, reset pages
│   │   │   └── DashboardLayout.jsx # Role-aware responsive sidebar & top navbar
│   │   ├── pages/
│   │   │   ├── admin/          # Admin dashboards, users, settings, audit logs
│   │   │   ├── auth/           # Login, Register, Forgot Password screens
│   │   │   ├── farmer/         # Farmer dashboard, deliveries, forms, profile
│   │   │   └── staff/          # Staff dashboard, intake, farmers, payments
│   │   ├── utils/              # Formatters for currency (KES), dates, weights
│   │   ├── App.jsx             # React application routes configuration
│   │   ├── index.css           # Global custom styling
│   │   └── main.jsx            # React root component bootstrap
│   ├── .env.example            # Sample frontend environment configuration
│   ├── index.html              # HTML entry page
│   ├── package.json            # Frontend dependencies and scripts
│   └── vite.config.js          # Vite configuration
│
└── README.md                   # System documentation
```

---

##  Database Schema & Models

The system runs on a relational PostgreSQL database structure:

1. **`users`**: User identities, role (`farmer`, `staff`, `admin`), email, hashed password, status (`Active`, `Inactive`).
2. **`farmers`**: Cooperative member registry linked to `users`, member numbers (`KFCS-XXXXX`), telephone, location, and cumulative weight.
3. **`deliveries`**: Coffee cherry deliveries with date, weight in kg, receipt number (`KAL-YYYY-XXXX`), quality grade, and status.
4. **`transactions`**: Advances, farm input deductions, and payment records associated with farmer accounts.
5. **`announcements`**: Society notices, AGM alerts, and bulletins with priority levels (`high`, `normal`).
6. **`forms`**: Downloadable PDF forms and cooperative documents.
7. **`settings`**: Dynamic operational parameters (cherry rate per kg, annual fee, loan interest rate, season period, notification toggles, maintenance mode).
8. **`audit_logs`**: Tamper-evident trail capturing timestamp, user name, role, action, and client IP address.
9. **`password_resets`**: 6-digit confirmation codes, secure tokens, expiration timestamps, and usage tracking.

---

##  Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x or later)
- **PostgreSQL** (v14+) running locally or accessible via a remote URI

---

### 1. Database Configuration

Start your PostgreSQL service and create a new database:

```sql
CREATE DATABASE kaliluni_coffee;
```

---

### 2. Backend Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with your PostgreSQL connection credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/kaliluni_coffee
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

5. Initialize the database schema and load seed data:
   ```bash
   npm run init-db
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### 3. Frontend Setup

1. Open a new terminal tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```

4. Verify the backend API URL inside `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to the displayed local URL (typically `http://localhost:5173`).

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | Optional | `5000` | Port for Express server |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` / `production`) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`) |
| `JWT_SECRET` | **Yes** | — | Secret key used for signing and verifying JWT tokens |
| `JWT_EXPIRES_IN` | Optional | `7d` | Lifetime of issued authentication tokens |
| `SMTP_HOST` | Optional | `smtp.gmail.com` | SMTP server host for real password reset emails |
| `SMTP_PORT` | Optional | `587` | SMTP server port |
| `SMTP_USER` | Optional | — | SMTP account username / email address |
| `SMTP_PASS` | Optional | — | SMTP account password / application-specific password |
| `SMTP_SERVICE` | Optional | `gmail` | Nodemailer service provider shortcut |
| `EMAIL_FROM` | Optional | `"Kaliluni Coffee Cooperative" <no-reply@kaliluni.com>` | Sender address for outgoing emails |

> [!NOTE]
> If SMTP credentials are left blank, password reset codes are printed to the backend terminal console via the built-in email simulator.

### Frontend (`frontend/.env`)

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `http://localhost:5000/api` | Base URL pointing to the Express backend API |

---

## 👥 Pre-Seeded Demo Accounts

The in-memory data store (`backend/data/store.js`) and database seed are pre-configured with **EXACTLY** these three accounts using plain-text passwords (`password`):

| Role | Name | Email | Password | Details |
|---|---|---|---|---|
| **Farmer** | John Mwangi | `farmer@kaliluni.com` | `password` | Member `KFCS-00123`, Kathiani |
| **Staff** | Jane Wanjiru | `staff@kaliluni.com` | `password` | Delivery intake & payment processing |
| **Admin** | Admin Kaliluni | `admin@kaliluni.com` | `password` | Full system access, audit logs, and settings |

> [!NOTE]
> Authentication in `backend/controllers/authController.js` performs direct plain-text matching (`password === user.password`) against `/backend/data/store.js` for development/demo ease prior to PostgreSQL migration. Both the token and user profile are returned upon successful login.

### 🧪 Verifying Login (PowerShell Test)

To test that all three roles return HTTP 200 with valid JWT tokens:

```powershell
$roles = @("farmer", "staff", "admin")
foreach ($r in $roles) {
  $body = @{ email = "$r@kaliluni.com"; password = "password" } | ConvertTo-Json
  try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
           -Method Post -Body $body -ContentType "application/json"
    Write-Host "OK $r -> role: $($res.user.role) name: $($res.user.name)"
  } catch {
    Write-Host "FAIL $r -> $($_.Exception.Message)"
  }
}
```

---

## 📡 API Documentation

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT token |
| `POST` | `/api/auth/register` | Public | Register new farmer account (includes `coffeeTrees`) |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user session profile |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset email link |
| `GET` | `/api/auth/verify-reset-token/:token` | Public | Verify reset token validity and fetch account email |
| `POST` | `/api/auth/reset-password/:token` | Public | Set new password using token |
| `POST` | `/api/auth/change-password` | Authenticated | Update password from within account |

### 2. Farmer Endpoints (`/api/farmer`)

*Requires `Bearer <token>` with `farmer` role.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/farmer/dashboard` | Dashboard metrics (deliveries, advances, pending payout) |
| `GET` | `/api/farmer/deliveries` | List of all deliveries made by the authenticated farmer |
| `GET` | `/api/farmer/transactions` | List of advances, deductions, and payments |
| `GET` | `/api/farmer/announcements` | Cooperative announcements bulletin |
| `GET` | `/api/farmer/forms` | Downloadable cooperative forms and documents |
| `GET` | `/api/farmer/profile` | Farmer member profile details |
| `PUT` | `/api/farmer/profile` | Update contact information (phone, location) |

### 3. Staff Endpoints (`/api/staff`)

*Requires `Bearer <token>` with `staff` or `admin` role.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/staff/dashboard` | Today's cherry intake summary and statistics |
| `GET` | `/api/staff/deliveries` | List of all recorded cherry deliveries |
| `POST` | `/api/staff/deliveries` | Record new cherry intake and issue receipt |
| `GET` | `/api/staff/farmers` | List all registered farmers in the cooperative |
| `POST` | `/api/staff/farmers` | Register a new farmer into the society registry |
| `GET` | `/api/staff/transactions` | Retrieve all society transactions |
| `POST` | `/api/staff/transactions` | Record advance or input deduction |
| `GET` | `/api/staff/payments` | Calculate payment schedule for all members |
| `GET` | `/api/staff/reports/summary` | Seasonal summary report of deliveries and payouts |

### 4. Admin Endpoints (`/api/admin`)

*Requires `Bearer <token>` with `admin` role.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Cooperative administrative metrics and KPIs |
| `GET` | `/api/admin/activity` | Recent audit events timeline |
| `GET` | `/api/admin/roles` | Distribution count of users by role |
| `GET` | `/api/admin/users` | List all system users |
| `POST` | `/api/admin/users` | Create a new user (farmer, staff, or admin) |
| `PUT` | `/api/admin/users/:id` | Update an existing user's information |
| `PATCH`| `/api/admin/users/:id/toggle-status` | Toggle user status between Active and Inactive |
| `GET` | `/api/admin/settings` | Retrieve cooperative pricing and rules |
| `PUT` | `/api/admin/settings` | Update pricing rates, fees, dates, and toggles |
| `GET` | `/api/admin/audit-logs` | Fetch system security audit trail |

---

## 📜 Development Scripts

### Backend (`/backend`)

- `npm run dev`: Starts the server with `nodemon` for auto-reloading during development.
- `npm start`: Starts the server with standard Node.js.
- `npm run init-db`: Runs `config/initDb.js` to create tables and seed default accounts.

### Frontend (`/frontend`)

- `npm run dev`: Starts Vite local development server with HMR.
- `npm run build`: Bundles production-ready assets into the `dist/` folder.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs Oxlint code diagnostics.

---

## 👩‍💻 Author & License

- **Developer:** Mwanae Faith Mumo
- **License:** [ISC](https://opensource.org/licenses/ISC)
- **Organization:** Kaliluni Farmers Co-operative Society Limited, Kathiani, Machakos
