import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import StatsCard from '../../components/common/StatsCard';
import PageHeader from '../../components/common/PageHeader';
import ChartWrapper from '../../components/charts/ChartWrapper';
import FarmerDeliveryChart from '../../components/charts/FarmerDeliveryChart';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, deliveriesData, announcementsData] = await Promise.all([
          farmerApi.getDashboardStats(),
          farmerApi.getDeliveries(),
          farmerApi.getAnnouncements(),
        ]);
        setStats(statsData);
        setRecentDeliveries(deliveriesData.slice(0, 5));
        setAllDeliveries(deliveriesData);          // ← ADDED
        setAnnouncements(announcementsData.slice(0, 3));
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-2">Loading dashboard...</p>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <PageHeader
        title={`Welcome, ${user?.name || 'Farmer'}`}
        subtitle="Here's your coffee delivery summary for this season"
        action={<Badge bg="success" className="p-3">Season {stats?.season}</Badge>}
      />

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <StatsCard
            title="Total Deliveries"
            value={formatWeight(stats.totalDeliveries)}
            subtitle="This season"
            color="success"
          />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard
            title="Pending Payment"
            value={formatCurrency(stats.pendingPayment)}
            subtitle="Awaiting processing"
            color="info"
          />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard
            title="Advances Taken"
            value={formatCurrency(stats.advancesTaken)}
            subtitle="Total borrowed"
            color="warning"
          />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard
            title="Total Paid"
            value={formatCurrency(stats.totalPaid)}
            subtitle="Received to date"
            color="primary"
          />
        </Col>
      </Row>

      {/* Delivery Chart — NEW */}
      <Row className="mb-4">
        <Col lg={12}>
          <ChartWrapper title="My Delivery History" height={280}>
            <FarmerDeliveryChart deliveries={allDeliveries} />
          </ChartWrapper>
        </Col>
      </Row>

      <Row>
        {/* Recent Deliveries */}
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">📋 Recent Deliveries</h5>
                <Link to="/farmer/deliveries" className="text-success text-decoration-none small fw-bold">
                  View All →
                </Link>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Weight</th>
                      <th>Receipt</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">
                          No deliveries recorded yet
                        </td>
                      </tr>
                    ) : (
                      recentDeliveries.map((d) => (
                        <tr key={d.id}>
                          <td>{formatDate(d.date)}</td>
                          <td>{formatWeight(d.weight)}</td>
                          <td><code>{d.receipt}</code></td>
                          <td>
                            <Badge bg={d.status === 'Processed' ? 'success' : 'warning'}>
                              {d.status}
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

        {/* Announcements */}
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">📢 Announcements</h5>
                <Link to="/farmer/announcements" className="text-success text-decoration-none small fw-bold">
                  View All →
                </Link>
              </div>
              {announcements.length === 0 ? (
                <p className="text-muted small mb-0">No announcements yet</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="border-bottom pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="fw-bold mb-1">{a.title}</h6>
                      {a.priority === 'high' && <Badge bg="danger">New</Badge>}
                    </div>
                    <small className="text-muted d-block mb-1">{formatDate(a.date)}</small>
                    <p className="mb-0 small">{a.content}</p>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FarmerDashboard;