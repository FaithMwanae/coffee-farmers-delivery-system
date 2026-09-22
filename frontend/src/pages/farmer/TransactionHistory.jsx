import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert, Row, Col, Button } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportToPDF, makeFileName } from '../../utils/exportUtils';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import { toast } from 'react-toastify';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await farmerApi.getTransactions();
        setTransactions(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Compute totals
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'Advance') acc.advances += Number(t.amount);
      if (t.type === 'Payment') acc.payments += Number(t.amount);
      if (t.type === 'Deduction') acc.deductions += Number(t.amount);
      return acc;
    },
    { advances: 0, payments: 0, deductions: 0 }
  );

  // ================================
  // Download PDF Statement
  // ================================
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
        <span className={row.type === 'Payment' ? 'text-success' : 'text-danger'}>
          {row.type === 'Payment' ? '+' : '-'} {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge bg="success">{v}</Badge>,
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
        title="Transaction History"
        subtitle="All your advances, deductions, and payments"
        action={
          <Button
            variant="success"
            onClick={handleDownloadStatement}
            disabled={transactions.length === 0}
          >
            📄 Download Statement
          </Button>
        }
      />

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4} sm={6} className="mb-3">
          <StatsCard
            title="Total Payments"
            value={formatCurrency(totals.payments)}
            color="success"
          />
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <StatsCard
            title="Total Advances"
            value={formatCurrency(totals.advances)}
            color="warning"
          />
        </Col>
        <Col md={4} sm={6} className="mb-3">
          <StatsCard
            title="Total Deductions"
            value={formatCurrency(totals.deductions)}
            color="danger"
          />
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
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