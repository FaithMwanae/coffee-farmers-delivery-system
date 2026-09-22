import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Container, Offcanvas, Dropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, logout, hasFarmerProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  // ============================================
  // Determine the CURRENT VIEW from the URL
  // ============================================
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.startsWith('/farmer')) return 'farmer';
    if (path.startsWith('/staff')) return 'staff';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/ceo')) return 'ceo';
    return user?.role || 'farmer';
  };

  const currentView = getCurrentView();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const menuConfig = {
    farmer: {
      sections: [
        {
          title: 'Main',
          items: [
            { label: 'Dashboard', route: '/farmer/dashboard', icon: 'bi-speedometer2' },
            { label: 'Delivery History', route: '/farmer/deliveries', icon: 'bi-box-seam' },
            { label: 'Transactions', route: '/farmer/transactions', icon: 'bi-arrow-left-right' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'Announcements', route: '/farmer/announcements', icon: 'bi-megaphone' },
            { label: 'Forms', route: '/farmer/forms', icon: 'bi-file-earmark-text' },
            { label: 'My Profile', route: '/farmer/profile', icon: 'bi-person' },
          ],
        },
      ],
    },
    staff: {
      sections: [
        {
          title: 'Operations',
          items: [
            { label: 'Dashboard', route: '/staff/dashboard', icon: 'bi-speedometer2' },
            { label: 'Record Delivery', route: '/staff/record-delivery', icon: 'bi-box-seam' },
            { label: 'Farmer Management', route: '/staff/farmers', icon: 'bi-people' },
          ],
        },
        {
          title: 'Finance',
          items: [
            { label: 'Transactions', route: '/staff/transactions', icon: 'bi-arrow-left-right' },
            { label: 'Payment Processing', route: '/staff/payments', icon: 'bi-cash-stack' },
          ],
        },
        {
          title: 'Communication & Reports',
          items: [
            { label: 'Announcements', route: '/staff/announcements', icon: 'bi-megaphone' },
            { label: 'Reports', route: '/staff/reports', icon: 'bi-graph-up' },
          ],
        },
      ],
    },
    admin: {
      sections: [
        {
          title: 'System',
          items: [
            { label: 'Dashboard', route: '/admin/dashboard', icon: 'bi-speedometer2' },
            { label: 'User Management', route: '/admin/users', icon: 'bi-people' },
            { label: 'System Settings', route: '/admin/settings', icon: 'bi-gear' },
            { label: 'Audit Logs', route: '/admin/audit-logs', icon: 'bi-clipboard-data' },
          ],
        },
      ],
    },
    ceo: {
      sections: [
        {
          title: 'Executive',
          items: [
            { label: 'Dashboard', route: '/ceo/dashboard', icon: 'bi-speedometer2' },
            { label: 'Advance Approvals', route: '/ceo/advances', icon: 'bi-check2-square' },
          ],
        },
        {
          title: 'Analytics',
          items: [
            { label: 'Reports & Analytics', route: '/ceo/analytics', icon: 'bi-graph-up' },
            { label: 'Audit Logs', route: '/ceo/audit-logs', icon: 'bi-clipboard-data' },
          ],
        },
      ],
    },
  };

  const sections = (menuConfig[currentView] || menuConfig.farmer).sections;

  const handleNav = (route) => {
    navigate(route);
    setShowSidebar(false);
  };

  const handleLogout = () => {
    setShowSidebar(false);
    logout();
  };

  // ============================================
  // SIDEBAR FOOTER — Switch view logic
  // ============================================
  const renderSidebarFooter = () => {
    const accountRole = user?.role;
    const isInFarmerView = currentView === 'farmer';
    const canSwitchToFarmer = accountRole === 'staff' || accountRole === 'admin' || accountRole === 'ceo';

    // Case 1: Staff/Admin/CEO currently in Farmer view → "Back to [role] View"
    if (canSwitchToFarmer && isInFarmerView) {
      return (
        <a
          href={`/${accountRole}/dashboard`}
          className="kl-nav-item"
          onClick={(e) => {
            e.preventDefault();
            handleNav(`/${accountRole}/dashboard`);
          }}
        >
          <i className="bi bi-arrow-left-right"></i>
          <span>Back to {accountRole.charAt(0).toUpperCase() + accountRole.slice(1)} View</span>
        </a>
      );
    }

    // Case 2: Staff/Admin/CEO NOT in farmer view → show Switch / Register
    if (canSwitchToFarmer && !isInFarmerView) {
      if (hasFarmerProfile) {
        return (
          <a
            href="/farmer/dashboard"
            className="kl-nav-item"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/farmer/dashboard');
            }}
          >
            <i className="bi bi-arrow-left-right"></i>
            <span>Switch to Farmer View</span>
          </a>
        );
      }
      return (
        <a
          href="/become-farmer"
          className="kl-nav-item"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/become-farmer');
          }}
        >
          <i className="bi bi-plus-circle"></i>
          <span>Register as Farmer</span>
        </a>
      );
    }

    // Case 3: Farmer account → nothing extra
    return null;
  };

  // ============================================
  // SIDEBAR CONTENT
  // ============================================
  const SidebarContent = () => (
    <div className="kl-sidebar" style={{ height: '100%', minHeight: '100%' }}>
      <div className="kl-sidebar-brand">
        <h5 style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>
          KALILUNI FACTORY
        </h5>
        <small style={{ fontSize: '0.6rem', letterSpacing: '1.5px' }}>
          CO-OPERATIVE SOCIETY
        </small>
      </div>

      <div className="kl-sidebar-nav py-2">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="kl-sidebar-section">{section.title}</div>
            {section.items.map((item) => {
              const isActive = location.pathname === item.route;
              return (
                <a
                  key={item.route}
                  href={item.route}
                  className={`kl-nav-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.route);
                  }}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </div>

      <div className="kl-sidebar-footer">
        {renderSidebarFooter()}

        <a
          href="#logout"
          className="kl-nav-item"
          style={{ color: '#ff8a80' }}
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Sign Out</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: 'var(--kl-bg)' }}>
      {/* Desktop Sidebar */}
      <div className="d-none d-lg-block" style={{ flexShrink: 0 }}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        style={{ width: '280px', padding: 0 }}
      >
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Top Bar */}
        <div className="kl-topbar">
          <button
            className="btn btn-sm d-lg-none"
            style={{
              background: 'var(--kl-primary)',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
            }}
            onClick={() => setShowSidebar(true)}
            aria-label="Open menu"
          >
            <i className="bi bi-list" style={{ fontSize: '1.2rem' }}></i>
          </button>

          <div className="flex-grow-1"></div>

          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              className="kl-user-chip"
              id="user-menu"
            >
              <div className="kl-user-avatar">{getInitials(user?.name)}</div>
              <div className="d-none d-sm-block text-start">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--kl-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentView}
                </div>
              </div>
              <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.7rem', color: 'var(--kl-muted)' }}></i>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* Page Content */}
        <Container
          fluid
          className="p-3 p-md-4"
          style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}
        >
          <Outlet />
        </Container>
      </div>
    </div>
  );
};

export default DashboardLayout;