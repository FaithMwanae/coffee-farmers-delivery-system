import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/adminApi';
import { formatCurrency, formatWeight, formatDateTime } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import MonthlyDeliveriesChart from '../../components/charts/MonthlyDeliveriesChart';
import PaymentTrendsChart from '../../components/charts/PaymentTrendsChart';
import RoleDistributionChart from '../../components/charts/RoleDistributionChart';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, c] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getRecentActivity(),
          adminApi.getChartData(),
        ]);
        setStats(s);
        setActivity(a);
        setCharts(c);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const firstName = (user?.name || 'Admin').split(' ')[0];

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="System overview and analytics"
        action={
          <Badge bg="dark" className="fw-normal px-3 py-2" style={{ letterSpacing: '1px' }}>
            SEASON {stats?.season}
          </Badge>
        }
      />

      {/* ============ Stats ============ */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Farmers"
            value={stats.totalFarmers}
            subtitle="Registered members"
            color="success"
            icon="bi-people"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Staff"
            value={stats.totalStaff}
            subtitle="Active staff accounts"
            color="primary"
            icon="bi-person-badge"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Deliveries"
            value={formatWeight(stats.totalDeliveries)}
            subtitle="All-time weight"
            color="info"
            icon="bi-box-seam"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Payments"
            value={formatCurrency(stats.totalPayments)}
            subtitle="Paid to farmers"
            color="warning"
            icon="bi-cash-stack"
          />
        </Col>
      </Row>

      {/* ============ Charts Row 1 ============ */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <ChartWrapper title="Monthly Deliveries" icon="bi-graph-up" height={300}>
            {charts.monthlyDeliveries.length > 0 ? (
              <MonthlyDeliveriesChart data={charts.monthlyDeliveries} />
            ) : (
              <div className="text-center text-muted py-5 small">No delivery data yet</div>
            )}
          </ChartWrapper>
        </Col>
        <Col lg={4}>
          <ChartWrapper title="Role Distribution" icon="bi-pie-chart" height={300}>
            <RoleDistributionChart data={charts.roleDistribution} />
          </ChartWrapper>
        </Col>
      </Row>

      {/* ============ Charts Row 2 + Quick Actions ============ */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <ChartWrapper title="Payment Trends" icon="bi-cash-stack" height={300}>
            {charts.monthlyPayments.length > 0 ? (
              <PaymentTrendsChart data={charts.monthlyPayments} />
            ) : (
              <div className="text-center text-muted py-5 small">No payment data yet</div>
            )}
          </ChartWrapper>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <span>Quick Actions</span>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to="/admin/users"
                  variant="success"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-people"></i>
                  Manage Users
                </Button>
                <Button
                  as={Link}
                  to="/admin/settings"
                  variant="outline-success"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-gear"></i>
                  System Settings
                </Button>
                <Button
                  as={Link}
                  to="/admin/audit-logs"
                  variant="outline-secondary"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-clipboard-data"></i>
                  View Audit Logs
                </Button>
              </div>

              {/* System Health Indicator */}
              <div className="mt-4 pt-3 border-top small">
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Active Users</span>
                  <strong className="text-dark num">{stats.activeUsers}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2 text-muted">
                  <span>Total Users</span>
                  <strong className="text-dark num">{stats.totalUsers}</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center text-muted">
                  <span>System Status</span>
                  <Badge bg="success" className="fw-normal">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                    ONLINE
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ============ Recent Activity ============ */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Recent Activity</span>
          <Link to="/admin/audit-logs" className="text-success text-decoration-none small fw-semibold">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4 small">
                      No recent activity
                    </td>
                  </tr>
                ) : (
                  activity.slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td className="text-muted small">{formatDateTime(log.timestamp)}</td>
                      <td className="fw-semibold">{log.user_name || log.user}</td>
                      <td>
                        <Badge bg="light" text="dark" className="border fw-normal">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="text-muted small">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;