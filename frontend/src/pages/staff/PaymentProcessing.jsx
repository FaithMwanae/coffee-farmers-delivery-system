import { useEffect, useState, useMemo } from 'react';
import {
  Container, Card, Badge, Spinner, Alert, Row, Col, Button,
  Modal, Form,
} from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = ['M-Pesa', 'Bank Transfer', 'Cash'];

const PaymentProcessing = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);

  // Release modal state
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState('M-Pesa');
  const [reference, setReference] = useState('');

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getPaymentSchedule();
      setPayments(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Failed to load payment schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const openRelease = (payment) => {
    setSelected(payment);
    setMethod('M-Pesa');
    setReference('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (releasing) return;
    setShowModal(false);
    setSelected(null);
  };

  const handleConfirmRelease = async () => {
    if (!selected) return;
    if (method !== 'Cash' && !reference.trim()) {
      toast.error('Please enter a reference number');
      return;
    }

    setReleasing(true);
    try {
      const farmerId = selected.farmerId ?? selected.farmer_id ?? selected.id;
      if (!farmerId) {
        toast.error('Farmer ID is missing — cannot release payment');
        setReleasing(false);
        return;
      }

      await staffApi.releasePayment(farmerId, {
        amount: Number(selected.net) || 0,
        method,
        reference: reference.trim(),
        season: selected.season || new Date().getFullYear(),
      });

      toast.success(
        `Payment released for ${selected.farmerName}: ${formatCurrency(selected.net)}`
      );
      setShowModal(false);
      setSelected(null);
      await loadSchedule();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setReleasing(false);
    }
  };

  const totals = useMemo(
    () =>
      payments.reduce(
        (acc, p) => {
          acc.gross += Number(p.gross) || 0;
          acc.net += Number(p.net) || 0;
          acc.advances += Number(p.advances) || 0;
          acc.deductions += Number(p.deductions) || 0;
          if (!p.status || p.status === 'Pending') acc.pending += 1;
          return acc;
        },
        { gross: 0, net: 0, advances: 0, deductions: 0, pending: 0 }
      ),
    [payments]
  );

  const handleExportCSV = () => {
    const header = [
      'Member No', 'Farmer', 'Phone',
      'Weight (kg)', 'Rate (KES/kg)',
      'Gross (KES)', 'Advances (KES)', 'Deductions (KES)',
      'Net (KES)', 'Status',
    ];
    const rows = payments.map((p) => [
      p.memberNo || '',
      p.farmerName || '',
      p.phone || '',
      p.totalWeight || 0,
      p.rate || 0,
      p.gross || 0,
      p.advances || 0,
      p.deductions || 0,
      p.net || 0,
      p.status || 'Pending',
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const columns = [
    {
      key: 'memberNo',
      label: 'Member No.',
      render: (v) => <code className="small">{v}</code>,
    },
    {
      key: 'farmerName',
      label: 'Farmer',
      render: (v, row) => (
        <div>
          <div className="fw-semibold">{v}</div>
          {row.phone && (
            <small className="text-muted">{row.phone}</small>
          )}
        </div>
      ),
    },
    {
      key: 'totalWeight',
      label: 'Weight',
      render: (v) => <span className="num">{formatWeight(v)}</span>,
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (v) => <span className="num">{formatCurrency(v)}/kg</span>,
    },
    {
      key: 'gross',
      label: 'Gross',
      render: (v) => <span className="num">{formatCurrency(v)}</span>,
    },
    {
      key: 'advances',
      label: 'Advances',
      render: (v) => <span className="num text-danger">− {formatCurrency(v)}</span>,
    },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (v) => <span className="num text-danger">− {formatCurrency(v)}</span>,
    },
    {
      key: 'net',
      label: 'Net Pay',
      render: (v) => (
        <span className="num fw-bold text-success">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => {
        const s = v || 'Pending';
        const variant =
          s === 'Released' || s === 'Completed'
            ? 'success'
            : s === 'Pending'
            ? 'warning'
            : 'secondary';
        return (
          <Badge bg={variant} className="fw-normal" text={variant === 'warning' ? 'dark' : undefined}>
            {s}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => {
        const isReleased = row.status === 'Released' || row.status === 'Completed';
        return isReleased ? (
          <Button size="sm" variant="outline-secondary" disabled>
            <i className="bi bi-check2 me-1"></i>Released
          </Button>
        ) : (
          <Button size="sm" variant="success" onClick={() => openRelease(row)}>
            <i className="bi bi-send me-1"></i>Release
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '60vh' }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading payment schedule...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <style>{`
        .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
      `}</style>

      <PageHeader
        title="Payment Processing"
        subtitle={`Season ${new Date().getFullYear()} · ${totals.pending} farmer${
          totals.pending === 1 ? '' : 's'
        } pending release`}
        action={
          <Button variant="outline-secondary" size="sm" onClick={handleExportCSV}>
            <i className="bi bi-download me-1"></i>Export CSV
          </Button>
        }
      />

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatsCard
            title="Gross Payout"
            value={formatCurrency(totals.gross)}
            subtitle={`${payments.length} farmer${payments.length === 1 ? '' : 's'}`}
            color="primary"
            icon="bi-cash-stack"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Advances"
            value={formatCurrency(totals.advances)}
            subtitle="Already issued"
            color="warning"
            icon="bi-arrow-down-circle"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Deductions"
            value={formatCurrency(totals.deductions)}
            subtitle="Loans, inputs, fees"
            color="danger"
            icon="bi-dash-circle"
          />
        </Col>
        <Col xs={6} lg={3}>
          <StatsCard
            title="Net Payable"
            value={formatCurrency(totals.net)}
            subtitle={`${totals.pending} pending`}
            color="success"
            icon="bi-wallet2"
          />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header
          className="bg-white border-bottom d-flex justify-content-between align-items-center"
          style={{ padding: '14px 20px' }}
        >
          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
            Farmer Payment Schedule
          </span>
          <small className="text-muted">
            {payments.length} record{payments.length === 1 ? '' : 's'}
          </small>
        </Card.Header>
        <Card.Body className="p-0">
          {payments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem' }}></i>
              <p className="text-muted mt-3 mb-0 small">
                No farmers pending payment for this season.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={payments}
              searchPlaceholder="Search by farmer, member no, or phone..."
              searchKeys={['farmerName', 'memberNo', 'phone']}
              itemsPerPage={10}
            />
          )}
        </Card.Body>
      </Card>

      {/* ⭐ Release Confirmation Modal */}
      <Modal show={showModal} onHide={closeModal} centered backdrop="static">
        <Modal.Header closeButton={!releasing}>
          <Modal.Title style={{ fontSize: '1rem' }}>
            Confirm Payment Release
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selected && (
            <>
              <div className="border rounded p-3 mb-3" style={{ background: '#fafbfc' }}>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Farmer</span>
                  <strong className="small">{selected.farmerName}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Member No.</span>
                  <code>{selected.memberNo}</code>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Net Amount</span>
                  <strong className="text-success" style={{ fontSize: '1.05rem' }}>
                    {formatCurrency(selected.net)}
                  </strong>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Payment Method *
                </Form.Label>
                <Form.Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  disabled={releasing}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">
                  Reference Number {method !== 'Cash' && '*'}
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={
                    method === 'M-Pesa'
                      ? 'e.g., QK12AB34CD'
                      : method === 'Bank Transfer'
                      ? 'e.g., TRF-2026-04812'
                      : 'e.g., Cash voucher #'
                  }
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={releasing}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {method === 'Cash'
                    ? 'Optional for cash payments'
                    : 'Required for audit trail'}
                </Form.Text>
              </Form.Group>

              <Alert variant="light" className="small border mt-3 mb-0">
                <i className="bi bi-info-circle me-1"></i>
                This will record a <strong>Completed Payment</strong> transaction for{' '}
                {selected.farmerName}.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={closeModal}
            disabled={releasing}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleConfirmRelease}
            disabled={releasing}
          >
            {releasing ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Releasing...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-1"></i>Confirm Release
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PaymentProcessing;