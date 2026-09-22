import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { staffApi } from '../../api/staffApi';
import { formatWeight, formatDate } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import MonthlyDeliveriesChart from '../../components/charts/MonthlyDeliveriesChart';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, c] = await Promise.all([
          staffApi.getDashboardStats(),
          staffApi.getRecentDeliveries(),
          staffApi.getChartData(),
        ]);
        setStats(s);
        setRecent(r);
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
          <p className="text-muted mt-3 small">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const intakeChartData = (charts?.weeklyIntake || []).map((w) => ({
    month: w.week,
    weight: w.weight,
  }));

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Welcome, ${user?.name || 'Staff'}`}
        subtitle="Today's operational summary"
        action={
          <Button as={Link} to="/staff/record-delivery" variant="success" size="sm">
            Record Delivery
          </Button>
        }
      />

      {/* Stats */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Today's Intake"
            value={formatWeight(stats.todayIntake)}
            subtitle="Cherries received"
            color="primary"
            icon="bi-box-seam"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Farmers Today"
            value={stats.todayFarmers}
            subtitle="Delivered today"
            color="success"
            icon="bi-people"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Pending Payments"
            value={stats.pendingPayments}
            subtitle="Farmers to pay"
            color="warning"
            icon="bi-cash-stack"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Farmers"
            value={stats.totalFarmers}
            subtitle="Registered"
            color="info"
            icon="bi-person-badge"
          />
        </Col>
      </Row>

      {/* Weekly Intake Chart — full width, no icon */}
      <Row className="g-3 mb-4">
        <Col lg={12}>
          <ChartWrapper title="Weekly Intake" height={280}>
            {intakeChartData.length > 0 ? (
              <MonthlyDeliveriesChart data={intakeChartData} />
            ) : (
              <div className="text-center text-muted py-5 small">No intake data yet</div>
            )}
          </ChartWrapper>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Recent Deliveries */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Recent Deliveries</span>
              <Link to="/staff/deliveries" className="text-success text-decoration-none small fw-semibold">
                View All
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      {['Receipt', 'Farmer', 'Weight', 'Date'].map((label) => (
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
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4 small">
                          No recent deliveries
                        </td>
                      </tr>
                    ) : (
                      recent.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <code
                              style={{
                                color: '#1a4d2e',
                                background: '#f0f4f1',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '0.82rem',
                              }}
                            >
                              {d.receipt_no || d.receipt}
                            </code>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{d.farmer_name || d.farmerName}</td>
                          <td style={{ padding: '12px 16px' }}>{formatWeight(d.weight)}</td>
                          <td style={{ padding: '12px 16px' }}>{formatDate(d.date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Quick Actions</span>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/staff/record-delivery" variant="success" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  Record New Delivery
                </Button>
                <Button as={Link} to="/staff/farmers" variant="primary" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  Register New Farmer
                </Button>
                <Button as={Link} to="/staff/transactions" variant="warning" className="text-start py-2" style={{ fontSize: '0.85rem', color: '#fff' }}>
                  Record Transaction
                </Button>
                <Button as={Link} to="/staff/payments" variant="info" className="text-start py-2" style={{ fontSize: '0.85rem', color: '#fff' }}>
                  Payment Schedule
                </Button>
                <Button as={Link} to="/staff/reports" variant="secondary" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  Generate Reports
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StaffDashboard;