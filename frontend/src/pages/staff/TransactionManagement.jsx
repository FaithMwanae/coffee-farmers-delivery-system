import { useEffect, useState } from 'react';
import {
  Container, Card, Form, Button, Badge, Spinner, Alert, Row, Col, Modal,
} from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatDate, formatWeight } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import FarmerSearchSelect from '../../components/forms/FarmerSearchSelect';
import { toast } from 'react-toastify';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [advanceInfo, setAdvanceInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [form, setForm] = useState({
    farmerId: '',
    type: 'Advance',
    amount: '',
    description: '',
  });

  const loadAll = async () => {
    try {
      const [tx, fm] = await Promise.all([
        staffApi.getAllTransactions(),
        staffApi.getAllFarmers(),
      ]);
      setTransactions(tx);
      setFarmers(fm);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Fetch advance eligibility when farmer or type changes
  useEffect(() => {
    const loadInfo = async () => {
      if (form.type === 'Advance' && form.farmerId) {
        setLoadingInfo(true);
        try {
          const info = await staffApi.getFarmerAdvanceInfo(form.farmerId);
          setAdvanceInfo(info);
        } catch (err) {
          console.error(err);
          setAdvanceInfo(null);
        } finally {
          setLoadingInfo(false);
        }
      } else {
        setAdvanceInfo(null);
      }
    };
    loadInfo();
  }, [form.farmerId, form.type]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFarmerChange = (farmerId) => {
    setForm({ ...form, farmerId, amount: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.farmerId || !form.amount || !form.description) {
      toast.error('Please fill all fields');
      return;
    }

    if (form.type === 'Advance' && advanceInfo) {
      if (Number(form.amount) > advanceInfo.available) {
        toast.error(
          `Amount exceeds available. Maximum: ${formatCurrency(advanceInfo.available)}`
        );
        return;
      }
    }

    setSaving(true);
    try {
      await staffApi.recordTransaction(form);
      toast.success(
        form.type === 'Advance'
          ? 'Advance recorded — pending CEO approval.'
          : 'Transaction recorded.'
      );
      setShowModal(false);
      setForm({ farmerId: '', type: 'Advance', amount: '', description: '' });
      setAdvanceInfo(null);
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.status && t.status !== 'Completed') return acc;
      if (t.type === 'Advance') acc.advances += Number(t.amount || 0);
      if (t.type === 'Deduction') acc.deductions += Number(t.amount || 0);
      return acc;
    },
    { advances: 0, deductions: 0 }
  );

  const pendingCount = transactions.filter((t) => t.status === 'Pending').length;

  const columns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'farmerName', label: 'Farmer' },
    {
      key: 'type',
      label: 'Type',
      render: (v) => (
        <Badge bg={v === 'Advance' ? 'warning' : v === 'Deduction' ? 'danger' : 'success'}>
          {v}
        </Badge>
      ),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => <span className="fw-bold">{formatCurrency(v)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const colors = { Pending: 'warning', Completed: 'success', Rejected: 'danger' };
        return (
          <Badge bg={colors[v] || 'secondary'} style={{ fontSize: '0.7rem' }}>
            {v || 'Completed'}
          </Badge>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Transaction Management"
        subtitle="Record advances, deductions, and input allocations"
        action={
          <Button variant="success" size="sm" onClick={() => setShowModal(true)}>
            Record Transaction
          </Button>
        }
      />

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <StatsCard title="Total Advances" value={formatCurrency(totals.advances)} subtitle="Completed only" color="warning" icon="bi-cash-coin" />
        </Col>
        <Col md={3} sm={6}>
          <StatsCard title="Total Deductions" value={formatCurrency(totals.deductions)} subtitle="Completed only" color="danger" icon="bi-dash-circle" />
        </Col>
        <Col md={3} sm={6}>
          <StatsCard title="Pending Approval" value={pendingCount} subtitle="Awaiting CEO" color="info" icon="bi-hourglass-split" />
        </Col>
        <Col md={3} sm={6}>
          <StatsCard title="Total Transactions" value={transactions.length} subtitle="All time" color="primary" icon="bi-list-check" />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <DataTable
            columns={columns}
            data={transactions}
            searchPlaceholder="Search by farmer, member no, type, or status..."
            searchKeys={['farmerName', 'memberNo', 'type', 'description', 'status']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>

      {/* Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Record New Transaction
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="mb-3">
              <FarmerSearchSelect
                farmers={farmers}
                value={form.farmerId}
                onChange={handleFarmerChange}
                required
              />
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Transaction Type *
              </Form.Label>
              <Form.Select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={{ fontSize: '0.9rem' }}
              >
                <option>Advance</option>
                <option>Deduction</option>
                <option>Payment</option>
              </Form.Select>
            </Form.Group>

            {/* ⭐ Advance eligibility card */}
            {form.type === 'Advance' && form.farmerId && (
              <>
                {loadingInfo ? (
                  <Alert variant="light" className="border small text-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading eligibility...
                  </Alert>
                ) : advanceInfo ? (
                  <Card className="border-0 mb-3" style={{ background: '#f0f4f1' }}>
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Total Delivered</span>
                        <strong>{formatWeight(advanceInfo.totalDelivered)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Advance Rate</span>
                        <strong>{formatCurrency(advanceInfo.rate)}/kg</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Eligible (kg × rate)</span>
                        <strong>{formatCurrency(advanceInfo.eligible)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="text-muted">Already Advanced</span>
                        <strong className="text-danger">
                          − {formatCurrency(advanceInfo.totalAdvanced)}
                        </strong>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between">
                        <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                          Available to Advance
                        </span>
                        <strong style={{ color: '#1a4d2e', fontSize: '1.05rem' }}>
                          {formatCurrency(advanceInfo.available)}
                        </strong>
                      </div>
                    </Card.Body>
                  </Card>
                ) : null}
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Amount (KES) *
              </Form.Label>
              <Form.Control
                type="number"
                name="amount"
                min="1"
                max={form.type === 'Advance' && advanceInfo ? advanceInfo.available : undefined}
                value={form.amount}
                onChange={handleChange}
                placeholder={
                  form.type === 'Advance' && advanceInfo
                    ? `Max: ${advanceInfo.available.toLocaleString()}`
                    : 'e.g., 5000'
                }
                required
                style={{ fontSize: '0.9rem' }}
              />
              {form.type === 'Advance' && advanceInfo && Number(form.amount) > advanceInfo.available && (
                <Form.Text className="text-danger" style={{ fontSize: '0.72rem' }}>
                  Exceeds available amount
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Description *
              </Form.Label>
              <Form.Control
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g., School fees advance"
                required
                style={{ fontSize: '0.9rem' }}
              />
            </Form.Group>

            {form.type === 'Advance' && (
              <Alert variant="light" className="mb-0 small border">
                <i className="bi bi-info-circle me-1"></i>
                <strong>Advances require CEO approval</strong> before they count toward
                the farmer's balance.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowModal(false)}
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={saving}
              size="sm"
              style={{ fontSize: '0.85rem' }}
            >
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default TransactionManagement;