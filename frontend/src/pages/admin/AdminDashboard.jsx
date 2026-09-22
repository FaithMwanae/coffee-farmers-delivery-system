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

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Welcome, ${user?.name || 'Admin'}`}
        subtitle="System overview and analytics"
        action={
          <Badge
            bg="dark"
            className="fw-normal"
            style={{ fontSize: '0.7rem', letterSpacing: '1px', padding: '8px 12px' }}
          >
            SEASON {stats?.season}
          </Badge>
        }
      />

      {/* Stats */}
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

      {/* Charts Row 1 */}
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

      {/* Charts Row 2 + Quick Actions */}
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
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Quick Actions</span>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to="/admin/users"
                  variant="success"
                  className="text-start py-2"
                  style={{ fontSize: '0.85rem' }}
                >
                  Manage Users
                </Button>
                <Button
                  as={Link}
                  to="/admin/settings"
                  variant="primary"
                  className="text-start py-2"
                  style={{ fontSize: '0.85rem' }}
                >
                  System Settings
                </Button>
                <Button
                  as={Link}
                  to="/admin/audit-logs"
                  variant="secondary"
                  className="text-start py-2"
                  style={{ fontSize: '0.85rem' }}
                >
                  View Audit Logs
                </Button>
              </div>

              {/* System Health Indicator */}
              <div
                className="mt-4 pt-3 border-top small text-muted"
                style={{ fontSize: '0.75rem' }}
              >
                <div className="d-flex justify-content-between mb-1">
                  <span>Active Users</span>
                  <strong className="text-dark">{stats.activeUsers}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Total Users</span>
                  <strong className="text-dark">{stats.totalUsers}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span>System Status</span>
                  <Badge bg="success" className="fw-normal" style={{ fontSize: '0.65rem' }}>
                    ONLINE
                  </Badge>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card className="border-0 shadow-sm">
        <Card.Header
          className="bg-white border-bottom d-flex justify-content-between align-items-center"
          style={{ padding: '14px 20px' }}
        >
          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Recent Activity</span>
          <Link
            to="/admin/audit-logs"
            className="text-success text-decoration-none small fw-semibold"
          >
            View All
          </Link>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="table-light">
                <tr>
                  {['Time', 'User', 'Action', 'Details'].map((label) => (
                    <th
                      key={label}
                      className="text-uppercase text-muted fw-semibold border-bottom"
                      style={{ fontSize: '0.68rem', letterSpacing: '0.5px', padding: '12px 16px' }}
                    >
                      {label}
                    </th>
                  ))}
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
                    <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td className="small text-muted" style={{ padding: '12px 16px' }}>
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{log.user_name || log.user}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          bg="light"
                          text="dark"
                          className="border fw-normal"
                          style={{ fontSize: '0.7rem', letterSpacing: '0.3px' }}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="small text-muted" style={{ padding: '12px 16px' }}>
                        {log.details}
                      </td>
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