import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert, Row, Col, Button } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportToPDF, makeFileName } from '../../utils/exportUtils';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import { toast } from 'react-toastify';

const STATUS_VARIANTS = {
  Requested: 'info',
  Pending: 'warning',
  Completed: 'success',
  Rejected: 'danger',
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [txData, advanceData] = await Promise.all([
          farmerApi.getTransactions(),
          farmerApi.getMyAdvances().catch(() => []),
        ]);
        setTransactions(txData);
        setAdvances(advanceData);
      } catch (err) {
        console.error(err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'Advance' && t.status === 'Completed') acc.advances += Number(t.amount);
      if (t.type === 'Payment') acc.payments += Number(t.amount);
      if (t.type === 'Deduction') acc.deductions += Number(t.amount);
      return acc;
    },
    { advances: 0, payments: 0, deductions: 0 }
  );

  const handleDownloadStatement = () => {
    try {
      const pdfColumns = [
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount (KES)' },
        { key: 'status', label: 'Status' },
      ];

      const pdfRows = transactions.map((t) => ({
        date: formatDate(t.date),
        type: t.type,
        description: t.description,
        amount: Number(t.amount).toLocaleString(),
        status: t.status,
      }));

      exportToPDF({
        title: 'My Transaction Statement',
        subtitle: 'Advances, deductions, and payments',
        columns: pdfColumns,
        rows: pdfRows,
        fileName: `${makeFileName('my_statement')}.pdf`,
      });

      toast.success('Statement downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate statement');
    }
  };

  // ============ General transactions table columns ============
  const columns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'type',
      label: 'Type',
      render: (v) => {
        const colors = { Advance: 'warning', Payment: 'success', Deduction: 'danger' };
        return <Badge bg={colors[v] || 'secondary'}>{v}</Badge>;
      },
    },
    { key: 'description', label: 'Description' },
    {
      key: 'amount',
      label: 'Amount',
      render: (v, row) => (
        <span className={`num ${row.type === 'Payment' ? 'text-success' : 'text-danger'}`}>
          {row.type === 'Payment' ? '+' : '−'} {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge bg={STATUS_VARIANTS[v] || 'success'}>{v}</Badge>
      ),
    },
  ];

  // ============ Advance requests table columns ============
  const advanceColumns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => <span className="num fw-semibold">{formatCurrency(v)}</span>,
    },
    { key: 'description', label: 'Purpose' },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (v) => (
        <Badge bg={v === 'farmer' ? 'primary' : 'secondary'} className="fw-normal">
          {v === 'farmer' ? 'You' : 'Staff'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <Badge bg={STATUS_VARIANTS[v] || 'secondary'}>{v}</Badge>
      ),
    },
    {
      key: 'rejectionReason',
      label: 'Reason',
      render: (v) => (v ? <span className="text-muted small">{v}</span> : <span className="text-muted">—</span>),
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
    <Container fluid className="px-0">
      <PageHeader
        title="Transaction History"
        subtitle="All your advances, deductions, and payments"
        action={
          <Button
            variant="success"
            onClick={handleDownloadStatement}
            disabled={transactions.length === 0}
          >
            <i className="bi bi-download me-1"></i>
            Download Statement
          </Button>
        }
      />

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col xs={6} lg={4}>
          <StatsCard
            title="Total Payments"
            value={formatCurrency(totals.payments)}
            subtitle="Received to date"
            color="success"
            icon="bi-cash-stack"
          />
        </Col>
        <Col xs={6} lg={4}>
          <StatsCard
            title="Total Advances"
            value={formatCurrency(totals.advances)}
            subtitle="Completed advances"
            color="warning"
            icon="bi-cash-coin"
          />
        </Col>
        <Col xs={6} lg={4}>
          <StatsCard
            title="Total Deductions"
            value={formatCurrency(totals.deductions)}
            subtitle="Loan, fees, inputs"
            color="danger"
            icon="bi-dash-circle"
          />
        </Col>
      </Row>

      {/* Advance Requests */}
      {advances.length > 0 && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>My Advance Requests</span>
            <small className="text-muted">
              {advances.length} request{advances.length === 1 ? '' : 's'}
            </small>
          </Card.Header>
          <Card.Body className="p-0">
            <DataTable
              columns={advanceColumns}
              data={advances}
              searchPlaceholder="Search requests..."
              searchKeys={['description', 'status']}
              itemsPerPage={5}
            />
          </Card.Body>
        </Card>
      )}

      {/* All Transactions */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>All Transactions</span>
          <small className="text-muted">
            {transactions.length} record{transactions.length === 1 ? '' : 's'}
          </small>
        </Card.Header>
        <Card.Body className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            searchPlaceholder="Search transactions..."
            searchKeys={['type', 'description', 'status']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TransactionHistory;