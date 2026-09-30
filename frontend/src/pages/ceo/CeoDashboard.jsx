import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { ceoApi } from '../../api/ceoApi';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import MonthlyDeliveriesChart from '../../components/charts/MonthlyDeliveriesChart';
import PaymentTrendsChart from '../../components/charts/PaymentTrendsChart';
import RoleDistributionChart from '../../components/charts/RoleDistributionChart';

const CeoDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c] = await Promise.all([
          ceoApi.getDashboardStats(),
          ceoApi.getChartData(),
        ]);
        setStats(s);
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
          <p className="text-muted mt-3 small">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  const firstName = (user?.name || 'CEO').split(' ')[0];

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`Welcome back, ${firstName} — cooperative performance overview`}
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
            title="Total Deliveries"
            value={formatWeight(stats.totalWeight)}
            subtitle={`${stats.totalDeliveries} deliveries`}
            color="primary"
            icon="bi-box-seam"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Transactions"
            value={stats.totalTransactions}
            subtitle="All time"
            color="info"
            icon="bi-arrow-left-right"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingAdvances}
            subtitle="Advances to review"
            color="danger"
            icon="bi-hourglass-split"
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
          <ChartWrapper title="Users by Role" icon="bi-pie-chart" height={300}>
            <RoleDistributionChart data={charts.roleDistribution} />
          </ChartWrapper>
        </Col>
      </Row>

      {/* ============ Charts Row 2 + Quick Actions ============ */}
      <Row className="g-3">
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
                  to="/ceo/advances"
                  variant={stats.pendingAdvances > 0 ? 'danger' : 'outline-danger'}
                  className="text-start d-flex align-items-center justify-content-between"
                >
                  <span className="d-flex align-items-center gap-2">
                    <i className="bi bi-hourglass-split"></i>
                    Review Pending Advances
                  </span>
                  {stats.pendingAdvances > 0 && (
                    <Badge bg="light" text="dark">{stats.pendingAdvances}</Badge>
                  )}
                </Button>
                <Button
                  as={Link}
                  to="/ceo/analytics"
                  variant="success"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-bar-chart"></i>
                  View Analytics
                </Button>
                <Button
                  as={Link}
                  to="/staff/reports"
                  variant="outline-success"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-file-earmark-text"></i>
                  Generate Reports
                </Button>
                <Button
                  as={Link}
                  to="/admin/audit-logs"
                  variant="outline-secondary"
                  className="text-start d-flex align-items-center gap-2"
                >
                  <i className="bi bi-clipboard-data"></i>
                  Audit Trail
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CeoDashboard;