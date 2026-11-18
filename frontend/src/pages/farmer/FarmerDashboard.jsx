import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Button, Table } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import FarmerDeliveryChart from '../../components/charts/FarmerDeliveryChart';
import RequestAdvanceModal from '../../components/farmer/RequestAdvanceModal';
import RequestInputModal from '../../components/farmer/RequestInputModal';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [inputs, setInputs] = useState([]); 
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, deliveriesData, announcementsData, eligibilityData, inputsData] = await Promise.all([
        farmerApi.getDashboardStats(),
        farmerApi.getDeliveries(),
        farmerApi.getAnnouncements(),
        farmerApi.getAdvanceEligibility().catch(() => null),
        farmerApi.getMyInputs().catch(() => []), 
      ]);
      setStats(statsData);
      setRecentDeliveries(deliveriesData.slice(0, 5));
      setAllDeliveries(deliveriesData);
      setAnnouncements(announcementsData.slice(0, 3));
      setEligibility(eligibilityData);
      setInputs(inputsData);
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

  // ⭐ Helper to check if an announcement is less than 3 days old
  const isNewAnnouncement = (dateStr) => {
    if (!dateStr) return false;
    const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

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
          <StatsCard title="Total Deliveries" value={formatWeight(stats.totalDeliveries)} subtitle="This season" color="success" icon="bi-box-seam" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Pending Payment" value={formatCurrency(stats.pendingPayment)} subtitle="Awaiting processing" color="info" icon="bi-cash-stack" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Advances Taken" value={formatCurrency(stats.advancesTaken)} subtitle="Total borrowed" color="warning" icon="bi-cash-coin" />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard title="Total Paid" value={formatCurrency(stats.totalPaid)} subtitle="Received to date" color="primary" icon="bi-check-circle" />
        </Col>
      </Row>

      {/* ============ Chart + Eligibility + Inputs ============ */}
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <ChartWrapper title="My Delivery History" height={280}>
            <FarmerDeliveryChart deliveries={allDeliveries} />
          </ChartWrapper>
        </Col>
        
        <Col lg={6}>
          <Row className="g-3 h-100">
            {/* Advance Eligibility Card */}
            <Col xs={12} md={6}>
              <Card className="h-100">
                <Card.Header><span>Advance Eligibility</span></Card.Header>
                <Card.Body className="d-flex flex-column p-3">
                  {!eligibility ? (
                    <div className="text-center text-muted py-3 small">Unavailable</div>
                  ) : (
                    <>
                      <div className="text-center mb-2">
                        <div className="text-muted small">Available</div>
                        <div className="fw-bold num text-success" style={{ fontSize: '1.4rem' }}>
                          {formatCurrency(eligibility.available)}
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button variant="outline-success" className="w-100" size="sm" disabled={!canRequest} onClick={() => setShowAdvanceModal(true)}>
                          Request Advance
                        </Button>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Farm Inputs Card */}
            <Col xs={12} md={6}>
              <Card className="h-100">
                <Card.Header><span>Farm Inputs</span></Card.Header>
                <Card.Body className="d-flex flex-column p-3">
                  <div className="text-center mb-2">
                    <div className="text-muted small">Need fertilizer?</div>
                    <div className="fw-semibold text-dark" style={{ fontSize: '1rem' }}>
                      Request Farm Inputs
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button variant="outline-success" className="w-100" size="sm" onClick={() => setShowInputModal(true)}>
                      Request Input
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* ============ Recent Input Requests Table ============ */}
      {inputs.length > 0 && (
        <Row className="g-3 mb-4">
          <Col lg={12}>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>My Input Requests</span>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Input</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputs.map((input) => (
                      <tr key={input.id}>
                        <td className="text-muted small">{formatDate(input.date)}</td>
                        <td className="fw-semibold">{input.input_type}</td>
                        <td>{input.quantity} {input.unit}</td>
                        <td>
                          <Badge bg={
                            input.status === 'Issued' ? 'success' : 
                            input.status === 'Approved' ? 'primary' : 
                            input.status === 'Rejected' ? 'danger' : 'warning'
                          } text={input.status === 'Requested' ? 'dark' : undefined}>
                            {input.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

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
                      <tr><td colSpan={4} className="text-center text-muted py-4 small">No deliveries recorded yet</td></tr>
                    ) : (
                      recentDeliveries.map((d) => (
                        <tr key={d.id}>
                          <td className="text-muted">{formatDate(d.date)}</td>
                          <td className="text-end num fw-semibold">{formatWeight(d.weight)}</td>
                          <td><code>{d.receipt || d.receipt_no}</code></td>
                          <td><Badge bg={d.status === 'Processed' ? 'success' : 'warning'}>{d.status || 'Processed'}</Badge></td>
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
                <div className="kl-empty py-3"><p className="small mb-0">No announcements yet</p></div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <h6 className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>{a.title}</h6>
                      {/* ⭐ Dynamic NEW badge based on date */}
                      {isNewAnnouncement(a.date) && (
                        <Badge bg="danger" className="fw-normal px-2 py-1" style={{ fontSize: '0.6rem' }}>
                          NEW
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted d-block mb-2">{formatDate(a.date)} · {a.author}</small>
                    <p className="mb-0" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>{a.content}</p>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <RequestAdvanceModal
        show={showAdvanceModal}
        onHide={() => setShowAdvanceModal(false)}
        onSuccess={loadData}
        initialEligibility={eligibility}
      />
      
      <RequestInputModal
        show={showInputModal}
        onHide={() => setShowInputModal(false)}
        onSuccess={loadData}
      />
    </Container>
  );
};

export default FarmerDashboard;