import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // ⭐ We ONLY call the report endpoints here.
        const [summaryData, chartsData, txData] = await Promise.all([
          staffApi.getReportSummary(),
          staffApi.getChartData(),
          staffApi.getAllTransactions().catch(() => []), // Safe fallback
        ]);
        
        setSummary(summaryData);
        setCharts(chartsData);
        setRecentTx(Array.isArray(txData) ? txData.slice(0, 5) : []);
      } catch (err) {
        console.error("Report Load Error:", err);
        setError('Failed to load report data. Please check backend logs.');
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
          <p className="text-muted mt-3 small">Generating reports...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  // Chart Configuration
  const barData = {
    labels: charts?.weeklyIntake?.map((d) => d.week) || [],
    datasets: [
      {
        label: 'Weight Delivered (kg)',
        data: charts?.weeklyIntake?.map((d) => d.weight) || [],
        backgroundColor: 'rgba(25, 135, 84, 0.8)',
        hoverBackgroundColor: 'rgba(25, 135, 84, 1)',
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 14, weight: 'bold' },
        callbacks: {
          label: (context) => ` ${context.parsed.y.toLocaleString()} kg`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6', drawBorder: false },
        ticks: { color: '#6b7280', callback: (value) => `${value} kg` },
      },
    },
  };

  const doughnutData = {
    labels: charts?.topFarmers?.map((f) => f.name) || [],
    datasets: [
      {
        data: charts?.topFarmers?.map((f) => f.weight) || [],
        backgroundColor: ['#198754', '#0dcaf0', '#ffc107', '#0d6efd', '#dc3545'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, padding: 20, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        callbacks: {
          label: (context) => ` ${context.parsed.toLocaleString()} kg`,
        },
      },
    },
  };

  return (
    <Container fluid className="px-0">
      <PageHeader title="Reports & Analytics" subtitle="Overview of cooperative performance and top contributors" />

      {/* 1. KPI Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-primary h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3 text-primary">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Farmers</div>
                <h3 className="mb-0 fw-bold">{summary?.totalFarmers?.toLocaleString() || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-success h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3 text-success">
                <i className="bi bi-box-seam fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Delivered</div>
                <h3 className="mb-0 fw-bold">{formatWeight(summary?.totalWeight || 0)}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-warning h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
                <i className="bi bi-receipt fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Transactions</div>
                <h3 className="mb-0 fw-bold">{summary?.totalTransactions?.toLocaleString() || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 2. Charts */}
      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom pt-3 pb-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold"><i className="bi bi-bar-chart-fill me-2 text-success"></i>Weekly Delivery Intake</h6>
              <Badge bg="light" text="dark" className="fw-normal">Last 8 Weeks</Badge>
            </Card.Header>
            <Card.Body>
              {charts?.weeklyIntake?.length > 0 ? (
                <div style={{ height: '320px' }}>
                  <Bar data={barData} options={barOptions} />
                </div>
              ) : (
                <div className="text-center py-5"><p className="text-muted mb-0">No delivery data for the last 8 weeks.</p></div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom pt-3 pb-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold"><i className="bi bi-pie-chart-fill me-2 text-info"></i>Top 5 Farmers</h6>
              <Badge bg="light" text="dark" className="fw-normal">By Volume</Badge>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center">
              {charts?.topFarmers?.length > 0 ? (
                <div style={{ height: '320px', width: '100%' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              ) : (
                <div className="text-center py-5"><p className="text-muted mb-0">No farmer data available.</p></div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* 3. Recent Activity Table */}
      {recentTx.length > 0 && (
        <Row className="g-3">
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom pt-3 pb-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2 text-secondary"></i>Recent Transactions</h6>
                <Badge bg="light" text="dark" className="fw-normal">Last 5 records</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="align-middle mb-0 text-nowrap">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Farmer</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map((tx) => (
                      <tr key={tx.id}>
                        <td className="text-muted small">{formatDate(tx.date)}</td>
                        <td>
                          <div className="fw-semibold">{tx.farmerName}</div>
                          <small className="text-muted">{tx.memberNo}</small>
                        </td>
                        <td>
                          <Badge bg={tx.type === 'Payment' ? 'success' : tx.type === 'Advance' ? 'warning' : 'danger'} text={tx.type === 'Advance' ? 'dark' : undefined}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                          {tx.description}
                        </td>
                        <td className="text-end fw-bold num">{formatCurrency(tx.amount)}</td>
                        <td>
                          <Badge bg={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'secondary'} text={tx.status === 'Pending' ? 'dark' : undefined}>
                            {tx.status}
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
    </Container>
  );
};

export default Reports;