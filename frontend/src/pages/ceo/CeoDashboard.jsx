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

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Executive Dashboard`}
        subtitle={`Welcome, ${user?.name || 'CEO'} — overview of cooperative performance`}
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

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard title="Total Farmers" value={stats.totalFarmers} subtitle="Registered members" color="success" icon="bi-people" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Total Deliveries" value={formatWeight(stats.totalWeight)} subtitle={`${stats.totalDeliveries} deliveries`} color="primary" icon="bi-box-seam" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Transactions" value={stats.totalTransactions} subtitle="All time" color="info" icon="bi-arrow-left-right" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Pending Approvals" value={stats.pendingAdvances} subtitle="Advances to review" color="danger" icon="bi-hourglass-split" />
        </Col>
      </Row>

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
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Quick Actions</span>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/ceo/advances" variant="danger" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  Review Pending Advances
                  {stats.pendingAdvances > 0 && (
                    <Badge bg="light" text="dark" className="ms-2">{stats.pendingAdvances}</Badge>
                  )}
                </Button>
                <Button as={Link} to="/ceo/analytics" variant="success" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  View Analytics
                </Button>
                <Button as={Link} to="/staff/reports" variant="primary" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
                  Generate Reports
                </Button>
                <Button as={Link} to="/admin/audit-logs" variant="secondary" className="text-start py-2" style={{ fontSize: '0.85rem' }}>
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