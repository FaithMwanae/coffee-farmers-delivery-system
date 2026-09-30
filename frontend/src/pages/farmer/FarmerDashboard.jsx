import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import FarmerDeliveryChart from '../../components/charts/FarmerDeliveryChart';
import RequestAdvanceModal from '../../components/farmer/RequestAdvanceModal';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, deliveriesData, announcementsData, eligibilityData] = await Promise.all([
        farmerApi.getDashboardStats(),
        farmerApi.getDeliveries(),
        farmerApi.getAnnouncements(),
        farmerApi.getAdvanceEligibility().catch(() => null),
      ]);
      setStats(statsData);
      setRecentDeliveries(deliveriesData.slice(0, 5));
      setAllDeliveries(deliveriesData);
      setAnnouncements(announcementsData.slice(0, 3));
      setEligibility(eligibilityData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const firstName = (user?.name || 'Farmer').split(' ')[0];
  const canRequest = eligibility && eligibility.available > 0;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Your coffee delivery summary for this season"
        action={
          <Badge bg="dark" className="fw-normal px-3 py-2" style={{ letterSpacing: '1px' }}>
            SEASON {stats?.season || '2026'}
          </Badge>
        }
      />

      {/* ============ Stats ============ */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Deliveries"
            value={formatWeight(stats.totalDeliveries)}
            subtitle="This season"
            color="success"
            icon="bi-box-seam"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Pending Payment"
            value={formatCurrency(stats.pendingPayment)}
            subtitle="Awaiting processing"
            color="info"
            icon="bi-cash-stack"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Advances Taken"
            value={formatCurrency(stats.advancesTaken)}
            subtitle="Total borrowed"
            color="warning"
            icon="bi-cash-coin"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            subtitle="Received to date"
            color="primary"
            icon="bi-check-circle"
          />
        </Col>
      </Row>

      {/* ============ Chart + Eligibility ============ */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <ChartWrapper title="My Delivery History" height={280}>
            <FarmerDeliveryChart deliveries={allDeliveries} />
          </ChartWrapper>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <span>Advance Eligibility</span>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              {!eligibility ? (
                <div className="text-center text-muted py-3 small">
                  Eligibility unavailable
                </div>
              ) : (
                <>
                  <div className="text-center mb-3">
                    <div className="text-muted small mb-1">Available to Request</div>
                    <div
                      className="fw-bold num"
                      style={{ fontSize: '1.9rem', color: 'var(--kl-primary)' }}
                    >
                      {formatCurrency(eligibility.available)}
                    </div>
                  </div>

                  <div className="border-top pt-3 mb-3 small">
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Total Eligible</span>
                      <strong className="num">{formatCurrency(eligibility.eligible)}</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted">Already Taken</span>
                      <strong className="num text-danger">
                        − {formatCurrency(eligibility.totalAdvanced)}
                      </strong>
                    </div>
                    {eligibility.pending > 0 && (
                      <div className="d-flex justify-content-between py-1">
                        <span className="text-muted">Pending Approval</span>
                        <strong className="num text-warning">
                          {formatCurrency(eligibility.pending)}
                        </strong>
                      </div>
                    )}
                    {eligibility.requested > 0 && (
                      <div className="d-flex justify-content-between py-1">
                        <span className="text-muted">Awaiting CEO</span>
                        <strong className="num text-info">
                          {formatCurrency(eligibility.requested)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <Button
                      variant="success"
                      className="w-100 d-flex align-items-center justify-content-center gap-2"
                      disabled={!canRequest}
                      onClick={() => setShowAdvanceModal(true)}
                    >
                      <i className="bi bi-cash-coin"></i>
                      {canRequest ? 'Request Advance' : 'No Balance Available'}
                    </Button>
                    <div className="text-center text-muted mt-2" style={{ fontSize: '0.72rem' }}>
                      Based on {formatWeight(eligibility.totalDelivered)} delivered
                      × {formatCurrency(eligibility.rate)}/kg
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        {/* ============ Recent Deliveries ============ */}
        <Col lg={7}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Recent Deliveries</span>
              <Link to="/farmer/deliveries" className="text-success text-decoration-none small fw-semibold">
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-end">Weight</th>
                      <th>Receipt</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4 small">
                          No deliveries recorded yet
                        </td>
                      </tr>
                    ) : (
                      recentDeliveries.map((d) => (
                        <tr key={d.id}>
                          <td className="text-muted">{formatDate(d.date)}</td>
                          <td className="text-end num fw-semibold">{formatWeight(d.weight)}</td>
                          <td>
                            <code>{d.receipt || d.receipt_no}</code>
                          </td>
                          <td>
                            <Badge bg={d.status === 'Processed' ? 'success' : 'warning'}>
                              {d.status || 'Processed'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ============ Announcements ============ */}
        <Col lg={5}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Announcements</span>
              <Link to="/farmer/announcements" className="text-success text-decoration-none small fw-semibold">
                View All <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </Card.Header>
            <Card.Body>
              {announcements.length === 0 ? (
                <div className="kl-empty py-3">
                  <p className="small mb-0">No announcements yet</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <h6 className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>
                        {a.title}
                      </h6>
                      {a.priority === 'high' && (
                        <Badge bg="danger" className="fw-normal px-2 py-1">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted d-block mb-2">
                      {formatDate(a.date)} · {a.author}
                    </small>
                    <p className="mb-0" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {a.content}
                    </p>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Request Advance Modal */}
      <RequestAdvanceModal
        show={showAdvanceModal}
        onHide={() => setShowAdvanceModal(false)}
        onSuccess={loadData}
        initialEligibility={eligibility}
      />
    </Container>
  );
};

export default FarmerDashboard;