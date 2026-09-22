import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-3 px-2">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <div className="text-center mb-4">
              <h1
                className="fw-bold text-dark mb-1"
                style={{
                  fontSize: 'clamp(1.2rem, 4.5vw, 1.7rem)',
                  letterSpacing: '2px',
                }}
              >
                KALILUNI FACTORY
              </h1>
              <p
                className="text-muted small mb-0"
                style={{
                  letterSpacing: '2px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                CO-OPERATIVE SOCIETY
              </p>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-body p-3 p-sm-4 p-md-5">
                <Outlet />
              </div>
            </div>

            <div className="text-center mt-3 text-muted" style={{ fontSize: '0.75rem' }}>
              &copy; 2026 Kaliluni Farmers Co-operative Society
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;