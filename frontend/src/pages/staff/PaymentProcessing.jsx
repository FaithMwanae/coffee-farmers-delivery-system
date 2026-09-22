import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert, Row, Col, Button } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import { toast } from 'react-toastify';

const PaymentProcessing = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await staffApi.getPaymentSchedule();
        setPayments(data);
      } catch (err) {
        setError('Failed to load payment schedule');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRelease = (payment) => {
    toast.success(`Payment released for ${payment.farmerName}: ${formatCurrency(payment.net)}`);
  };

  const totals = payments.reduce(
    (acc, p) => {
      acc.gross += p.gross;
      acc.net += p.net;
      acc.advances += p.advances;
      acc.deductions += p.deductions;
      return acc;
    },
    { gross: 0, net: 0, advances: 0, deductions: 0 }
  );

  const columns = [
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'farmerName', label: 'Farmer' },
    { key: 'totalWeight', label: 'Weight', render: (v) => formatWeight(v) },
    { key: 'rate', label: 'Rate', render: (v) => `${formatCurrency(v)}/kg` },
    { key: 'gross', label: 'Gross', render: (v) => formatCurrency(v) },
    { key: 'advances', label: 'Advances', render: (v) => <span className="text-danger">- {formatCurrency(v)}</span> },
    { key: 'deductions', label: 'Deductions', render: (v) => <span className="text-danger">- {formatCurrency(v)}</span> },
    { key: 'net', label: 'Net Pay', render: (v) => <span className="fw-bold text-success">{formatCurrency(v)}</span> },
    {
      key: 'status',
      label: 'Action',
      render: (_, row) => (
        <Button size="sm" variant="success" onClick={() => handleRelease(row)}>
          Release
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <PageHeader
        title="Payment Processing"
        subtitle="Calculate and release farmer payments for the season"
        />

      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Gross Payout" value={formatCurrency(totals.gross)} color="primary" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Advances" value={formatCurrency(totals.advances)} color="warning" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Deductions" value={formatCurrency(totals.deductions)} color="danger" />
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <StatsCard title="Net Payable" value={formatCurrency(totals.net)} color="success" />
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <DataTable
            columns={columns}
            data={payments}
            searchPlaceholder="Search by farmer or member no..."
            searchKeys={['farmerName', 'memberNo']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentProcessing;