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
        setAllDeliveries(deliveriesData);
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title={`Welcome, ${user?.name || 'Farmer'}`}
        subtitle="Here's your coffee delivery summary for this season"
        action={
          <Badge
            bg="dark"
            className="fw-normal"
            style={{ fontSize: '0.7rem', letterSpacing: '1px', padding: '8px 12px' }}
          >
            SEASON {stats?.season || '2026'}
          </Badge>
        }
      />

      {/* Stats Cards */}
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

      {/* Delivery Chart */}
      <Row className="g-3 mb-4">
        <Col lg={12}>
          <ChartWrapper title="My Delivery History" height={280}>
            <FarmerDeliveryChart deliveries={allDeliveries} />
          </ChartWrapper>
        </Col>
      </Row>

      <Row className="g-3">
        {/* Recent Deliveries */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header
              className="bg-white border-bottom d-flex justify-content-between align-items-center"
              style={{ padding: '14px 20px' }}
            >
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Recent Deliveries
              </span>
              <Link
                to="/farmer/deliveries"
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
                      {['Date', 'Weight', 'Receipt', 'Status'].map((label) => (
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
                    {recentDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4 small">
                          No deliveries recorded yet
                        </td>
                      </tr>
                    ) : (
                      recentDeliveries.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px 16px' }}>{formatDate(d.date)}</td>
                          <td style={{ padding: '12px 16px' }}>{formatWeight(d.weight)}</td>
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
                              {d.receipt || d.receipt_no}
                            </code>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
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

        {/* Announcements */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header
              className="bg-white border-bottom d-flex justify-content-between align-items-center"
              style={{ padding: '14px 20px' }}
            >
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Announcements
              </span>
              <Link
                to="/farmer/announcements"
                className="text-success text-decoration-none small fw-semibold"
              >
                View All
              </Link>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              {announcements.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-megaphone text-muted" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-3 mb-0 small">No announcements yet</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="border-bottom pb-3 mb-3"
                    style={{ borderColor: '#f0f0f0 !important' }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <h6 className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>
                        {a.title}
                      </h6>
                      {a.priority === 'high' && (
                        <Badge
                          bg="danger"
                          className="fw-normal"
                          style={{ fontSize: '0.6rem', letterSpacing: '0.5px', padding: '3px 6px' }}
                        >
                          NEW
                        </Badge>
                      )}
                    </div>
                    <small className="text-muted d-block mb-2" style={{ fontSize: '0.72rem' }}>
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
    </Container>
  );
};

export default FarmerDashboard;