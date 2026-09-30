import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-shell">
      {/* ============================================
          LEFT PANEL — Brand identity (desktop only)
          ============================================ */}
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand-inner">
          {/* Logo mark */}
          <div className="auth-brand-mark">
            <i className="bi bi-cup-hot"></i>
          </div>

          {/* Wordmark */}
          <h1 className="auth-brand-title">KALILUNI</h1>
          <p className="auth-brand-subtitle">FACTORY CO-OPERATIVE SOCIETY</p>

          {/* Value proposition */}
          <p className="auth-brand-tagline">
            Manage coffee deliveries, farmer payments, and cooperative
            operations — all in one place.
          </p>

          {/* Feature bullets */}
          <ul className="auth-brand-features">
            <li>
              <i className="bi bi-check2-circle"></i>
              <span>Real-time delivery recording</span>
            </li>
            <li>
              <i className="bi bi-check2-circle"></i>
              <span>Automated payment schedules</span>
            </li>
            <li>
              <i className="bi bi-check2-circle"></i>
              <span>Farmer self-service portal</span>
            </li>
            <li>
              <i className="bi bi-check2-circle"></i>
              <span>QR-verified delivery receipts</span>
            </li>
          </ul>

          {/* Footer */}
          <div className="auth-brand-footer">
            <i className="bi bi-shield-check me-1"></i>
            Secure • Trusted • Cooperative
          </div>
        </div>

        {/* Subtle background pattern */}
        <div className="auth-brand-pattern"></div>
      </aside>

      {/* ============================================
          RIGHT PANEL — Form area
          ============================================ */}
      <main id="main-content" tabIndex={-1} className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile brand header (shown only on small screens) */}
          <div className="auth-mobile-brand d-lg-none">
            <h2>KALILUNI FACTORY</h2>
            <p>CO-OPERATIVE SOCIETY</p>
          </div>

          {/* Form card — renders Login, Register, Forgot, Reset */}
          <div className="auth-card">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="auth-footer">
            <p className="mb-1">
              &copy; {new Date().getFullYear()} Kaliluni Farmers Co-operative Society
            </p>
            <p className="mb-0">
              Need help?{' '}
              <a href="mailto:support@kaliluni.co.ke">Contact the cooperative office</a>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;