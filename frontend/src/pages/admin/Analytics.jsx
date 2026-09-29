import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import ChartWrapper from '../../components/charts/ChartWrapper';
import MonthlyDeliveriesChart from '../../components/charts/MonthlyDeliveriesChart';
import TopFarmersChart from '../../components/charts/TopFarmersChart';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await adminApi.getAnalytics();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load analytics');
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
          <p className="text-muted mt-3 small">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return null;

  const seasonStart = data.season?.start ? new Date(data.season.start) : null;
  const seasonEnd = data.season?.end ? new Date(data.season.end) : null;
  const now = new Date();
  let progress = 0;
  let daysLeft = 0;

  if (seasonStart && seasonEnd && seasonEnd > seasonStart) {
    const total = seasonEnd - seasonStart;
    const elapsed = now - seasonStart;
    progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    daysLeft = Math.max(0, Math.ceil((seasonEnd - now) / (1000 * 60 * 60 * 24)));
  }

  const netToFarmers =
    Number(data.financial.payments || 0) -
    Number(data.financial.advances || 0) -
    Number(data.financial.deductions || 0);

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Advanced Analytics"
        subtitle={`Deep insights into cooperative performance — Season ${data.season?.current || '—'}`}
        action={
          <Badge bg="dark" className="fw-normal" style={{ fontSize: '0.7rem', letterSpacing: '1px', padding: '8px 12px' }}>
            {daysLeft} DAYS LEFT
          </Badge>
        }
      />

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Avg Weight / Farmer"
            value={formatWeight(Math.round(data.averages.avgWeight))}
            subtitle="This season"
            color="primary"
            icon="bi-graph-up"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Top Farmer"
            value={formatWeight(Math.round(data.averages.maxWeight))}
            subtitle="Highest delivery"
            color="success"
            icon="bi-trophy"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Payments"
            value={formatCurrency(data.financial.payments)}
            subtitle="Paid to farmers"
            color="info"
            icon="bi-cash-stack"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Total Advances"
            value={formatCurrency(data.financial.advances)}
            subtitle="Borrowed"
            color="warning"
            icon="bi-cash-coin"
          />
        </Col>
      </Row>

      {seasonStart && seasonEnd && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  Season Progress
                </div>
                <h6 className="fw-semibold mb-0">
                  {data.season.current} — {daysLeft} days remaining
                </h6>
              </div>
              <div className="text-end">
                <div className="fw-bold text-success" style={{ fontSize: '1.4rem' }}>
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
            <ProgressBar now={progress} variant="success" style={{ height: '10px', borderRadius: '6px' }} />
            <div className="d-flex justify-content-between small text-muted mt-2" style={{ fontSize: '0.72rem' }}>
              <span>Start: {seasonStart.toLocaleDateString('en-GB')}</span>
              <span>End: {seasonEnd.toLocaleDateString('en-GB')}</span>
            </div>
          </Card.Body>
        </Card>
      )}

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <ChartWrapper title="Delivery Trends (12 months)" icon="bi-graph-up" height={300}>
            {data.monthlyDeliveries.length > 0 ? (
              <MonthlyDeliveriesChart
                data={data.monthlyDeliveries.map((m) => ({ month: m.month, weight: m.weight }))}
              />
            ) : (
              <div className="text-center text-muted py-5 small">No delivery data yet</div>
            )}
          </ChartWrapper>
        </Col>
        <Col lg={4}>
          <ChartWrapper title="Top 5 Farmers" icon="bi-trophy" height={300}>
            {data.topFarmers.length > 0 ? (
              <TopFarmersChart data={data.topFarmers} />
            ) : (
              <div className="text-center text-muted py-5 small">No farmers yet</div>
            )}
          </ChartWrapper>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Financial Breakdown</span>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Payments</span>
                <strong className="text-success">{formatCurrency(data.financial.payments)}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Advances</span>
                <strong className="text-warning">{formatCurrency(data.financial.advances)}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Deductions</span>
                <strong className="text-danger">{formatCurrency(data.financial.deductions)}</strong>
              </div>
              <div className="d-flex justify-content-between py-3">
                <strong>Net to Farmers</strong>
                <strong className="text-dark" style={{ fontSize: '1.1rem' }}>
                  {formatCurrency(netToFarmers)}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Quality Distribution</span>
            </Card.Header>
            <Card.Body className="p-4">
              {data.qualityDistribution.length === 0 ? (
                <p className="text-muted small mb-0">No delivery data yet</p>
              ) : (
                data.qualityDistribution.map((q, idx) => {
                  const total = data.qualityDistribution.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((q.count / total) * 100) : 0;
                  const colors = { Excellent: 'success', Good: 'primary', Fair: 'warning', Poor: 'danger' };
                  return (
                    <div key={idx} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="small fw-semibold">{q.quality}</span>
                        <span className="small text-muted">{q.count} deliveries ({pct}%)</span>
                      </div>
                      <ProgressBar now={pct} variant={colors[q.quality] || 'secondary'} style={{ height: '8px' }} />
                    </div>
                  );
                })
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Analytics;