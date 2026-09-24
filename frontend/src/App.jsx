import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Maintenance page
import Maintenance from './pages/maintenance/Maintenance';

// Account pages
import BecomeFarmer from './pages/account/BecomeFarmer';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import DeliveryHistory from './pages/farmer/DeliveryHistory';
import TransactionHistory from './pages/farmer/TransactionHistory';
import Announcements from './pages/farmer/Announcements';
import DownloadForms from './pages/farmer/DownloadForms';
import FarmerProfile from './pages/farmer/FarmerProfile';

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import RecordDelivery from './pages/staff/RecordDelivery';
import FarmerManagement from './pages/staff/FarmerManagement';
import TransactionManagement from './pages/staff/TransactionManagement';
import PaymentProcessing from './pages/staff/PaymentProcessing';
import StaffReports from './pages/staff/Reports';
import StaffAnnouncements from './pages/staff/Announcements';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';

// CEO pages
import CeoDashboard from './pages/ceo/CeoDashboard';
import AdvanceApprovals from './pages/ceo/AdvanceApprovals';

import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* ============ PUBLIC ROUTES ============ */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* MAINTENANCE — standalone, no layout */}
        <Route path="/maintenance" element={<Maintenance />} />

        {/* ============ PROTECTED ROUTES ============ */}
        <Route element={<DashboardLayout />}>
          {/* ----- FARMER ----- */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/deliveries"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <DeliveryHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/transactions"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <TransactionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/announcements"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/forms"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <DownloadForms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/profile"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'staff', 'admin', 'ceo']}>
                <FarmerProfile />
              </ProtectedRoute>
            }
          />

          {/* ----- STAFF ----- */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/record-delivery"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <RecordDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/deliveries"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <RecordDelivery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/farmers"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <FarmerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/transactions"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <TransactionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/payments"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <PaymentProcessing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reports"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <StaffReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/announcements"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin', 'ceo']}>
                <StaffAnnouncements />
              </ProtectedRoute>
            }
          />

          {/* ----- ADMIN ----- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'ceo']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin', 'ceo']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* ----- CEO ----- */}
          <Route
            path="/ceo/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                <CeoDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo/advances"
            element={
              <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                <AdvanceApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo/analytics"
            element={
              <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                <StaffReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ceo/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ceo', 'admin']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* ----- SHARED (any logged-in user) ----- */}
          <Route
            path="/become-farmer"
            element={
              <ProtectedRoute>
                <BecomeFarmer />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ============ DEFAULT ============ */}
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}

export default App;