# Kaliluni Coffee Farmers Delivery System — Frontend

React + Vite frontend for the Kaliluni Coffee Farmers Delivery System — a digital cooperative platform for coffee farmers, factory staff, cooperative administrators, and executive management.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Routing Overview](#routing-overview)
- [API Integration](#api-integration)
- [Authentication Flow](#authentication-flow)
- [Styling and Design System](#styling-and-design-system)
- [Responsive Design](#responsive-design)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

---

## Overview

This is the client-side application for the Kaliluni Coffee Farmers Delivery System. It provides role-specific dashboards and workflows for four user types:

- **Farmers** — view deliveries, transactions, announcements, and manage their profile
- **Staff** — record cherry deliveries, register farmers, process transactions, and generate reports
- **Administrators** — manage users, configure system settings, and review audit logs
- **CEO** — executive oversight, advance approvals, and analytics

---

## Key Features

- Role-based access control (RBAC) with protected routes
- JWT authentication with automatic token attachment to API requests
- Farmer self-registration with strong password enforcement
- Password strength meter with real-time validation
- Responsive, mobile-first design using Bootstrap 5
- Interactive charts using Chart.js
- PDF and Excel export functionality
- Downloadable cooperative forms
- Live notifications via React-Toastify
- Session persistence via localStorage
- Dynamic sidebar menu based on user role and current view
- View switching for staff/admin users who are also farmers

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 19 | Component-based UI library |
| Build Tool | Vite 8 | Fast dev server and bundler |
| Routing | React Router v7 | Client-side navigation with protected routes |
| UI Library | React-Bootstrap 5 | Responsive pre-built components |
| Icons | Bootstrap Icons | Vector icon set |
| HTTP Client | Axios | API requests with interceptors |
| Charts | Chart.js + react-chartjs-2 | Dashboard visualizations |
| PDF Export | jsPDF + jspdf-autotable | Client-side PDF generation |
| Excel Export | SheetJS (xlsx) | Client-side spreadsheet generation |
| Notifications | React-Toastify | Toast popups |
| Notifications | React Hook Form | Form state management (optional) |
| Linting | Oxlint | Fast JavaScript/TypeScript linter |

---

## Directory Structure
