import { useEffect, useState, useMemo } from 'react';
import {
  Container, Card, Badge, Spinner, Alert, Row, Col, Button,
  Modal, Form, Nav,
} from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import PaymentVoucherModal from '../../components/staff/PaymentVoucherModal';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = ['M-Pesa', 'Bank Transfer', 'Cash'];

const METHOD_VARIANTS = {
  'M-Pesa': 'success',
  'Bank Transfer': 'primary',
  Cash: 'warning',
};

const PaymentProcessing = () => {
  const [tab, setTab] = useState('pending'); // 'pending' | 'released'
  const [payments, setPayments] = useState([]);
  const [released, setReleased] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasedLoading, setReleasedLoading] = useState(false);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);

  // Release modal
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [method, setMethod] = useState('M-Pesa');
  const [reference, setReference] = useState('');

  // Voucher modal
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherPayment, setVoucherPayment] = useState(null);

  const loadPending = async () => {
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

  const loadReleased = async () => {
    try {
      setReleasedLoading(true);
      const data = await staffApi.getReleasedPayments();
      setReleased(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setReleasedLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    loadReleased();
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
        toast.error('Farmer ID is missing — cannot release');
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

      // Show voucher immediately after release
      setVoucherPayment({
        id: Date.now(), // temp id, real id isn't returned — see note below
        farmerId,
        farmerName: selected.farmerName,
        memberNo: selected.memberNo,
        phone: selected.phone,
        amount: Number(selected.net) || 0,
        method,
        reference: reference.trim(),
        date: new Date().toISOString(),
        releasedBy: 'You',
      });
      setShowVoucher(true);

      setShowModal(false);
      setSelected(null);

      await Promise.all([loadPending(), loadReleased()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release payment');
    } finally {
      setReleasing(false);
    }
  };

  // ============ Totals for pending tab ============
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

  // ============ Totals for released tab ============
  const releasedTotals = useMemo(
    () =>
      released.reduce(
        (acc, p) => {
          acc.total += Number(p.amount) || 0;
          acc.byMethod[p.method] = (acc.byMethod[p.method] || 0) + Number(p.amount);
          return acc;
        },
        { total: 0, byMethod: {} }
      ),
    [released]
  );

  const handleExportCSV = () => {
    const isPending = tab === 'pending';
    const rows = isPending ? payments : released;

    const header = isPending
      ? ['Member No', 'Farmer', 'Phone', 'Weight', 'Rate', 'Gross', 'Advances', 'Deductions', 'Net', 'Status']
      : ['Member No', 'Farmer', 'Phone', 'Amount', 'Method', 'Reference', 'Date', 'Released By'];

    const data = rows.map((p) => {
      if (isPending) {
        return [
          p.memberNo || '', p.farmerName || '', p.phone || '',
          p.totalWeight || 0, p.rate || 0, p.gross || 0,
          p.advances || 0, p.deductions || 0, p.net || 0, p.status || 'Pending',
        ];
      }
      return [
        p.memberNo || '', p.farmerName || '', p.phone || '',
        p.amount || 0, p.method || '', p.reference || '',
        p.date ? formatDate(p.date) : '', p.releasedBy || '',
      ];
    });

    const csv = [header, ...data]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${isPending ? 'pending' : 'released'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // ============ Pending table columns ============
  const pendingColumns = [
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
          {row.phone && <small className="text-muted">{row.phone}</small>}
        </div>
      ),
    },
    {
      key: 'totalWeight',
      label: 'Weight',
      render: (v) => <span className="num">{formatWeight(v)}</span>,
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
        const variant = s === 'Released' ? 'success' : 'warning';
        return <Badge bg={variant} text={variant === 'warning' ? 'dark' : undefined}>{s}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => {
        const isReleased = row.status === 'Released';
        return isReleased ? (
          <Button size="sm" variant="outline-secondary" disabled>
            <i className="bi bi-check2 me-1"></i>Paid
          </Button>
        ) : (
          <Button size="sm" variant="success" onClick={() => openRelease(row)}>
            <i className="bi bi-send me-1"></i>Release
          </Button>
        );
      },
    },
  ];

  // ============ Released table columns ============
  const releasedColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (v) => <span className="small text-muted">{formatDate(v)}</span>,
    },
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
          {row.phone && <small className="text-muted">{row.phone}</small>}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (v) => (
        <span className="num fw-bold text-success">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      render: (v) => (
        <Badge bg={METHOD_VARIANTS[v] || 'secondary'} className="fw-normal">
          {v || '—'}
        </Badge>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (v) => (v ? <code className="small">{v}</code> : <span className="text-muted">—</span>),
    },
    {
      key: 'releasedBy',
      label: 'Released By',
      render: (v) => <span className="small text-muted">{v || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            setVoucherPayment(row);
            setShowVoucher(true);
          }}
        >
          <i className="bi bi-receipt me-1"></i>Voucher
        </Button>
      ),
    },
  ];

  const isPendingTab = tab === 'pending';
  const displayLoading = isPendingTab ? loading : releasedLoading;
  const rowsForTable = isPendingTab ? payments : released;
  const columns = isPendingTab ? pendingColumns : releasedColumns;

  return (
    <Container fluid className="px-0">
      <style>{`
        .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .payment-tabs .nav-link {
          color: var(--kl-muted);
          font-weight: 500;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 10px 16px;
          border-radius: 0;
        }
        .payment-tabs .nav-link:hover {
          color: var(--kl-primary);
        }
        .payment-tabs .nav-link.active {
          color: var(--kl-primary);
          background: transparent;
          border-bottom-color: var(--kl-primary);
        }
      `}</style>

      <PageHeader
        title="Payment Processing"
        subtitle={`Season ${new Date().getFullYear()} — ${totals.pending} farmer${totals.pending === 1 ? '' : 's'} pending release`}
        action={
          <Button variant="outline-secondary" size="sm" onClick={handleExportCSV}>
            <i className="bi bi-download me-1"></i>
            Export {isPendingTab ? 'Pending' : 'Released'}
          </Button>
        }
      />

      {/* ============ KPI band — different per tab ============ */}
      <Row className="g-3 mb-4">
        {isPendingTab ? (
          <>
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
          </>
        ) : (
          <>
            <Col xs={6} lg={3}>
              <StatsCard
                title="Total Paid"
                value={formatCurrency(releasedTotals.total)}
                subtitle={`${released.length} payment${released.length === 1 ? '' : 's'}`}
                color="success"
                icon="bi-check-circle"
              />
            </Col>
            <Col xs={6} lg={3}>
              <StatsCard
                title="Via M-Pesa"
                value={formatCurrency(releasedTotals.byMethod['M-Pesa'] || 0)}
                subtitle="Mobile money"
                color="success"
                icon="bi-phone"
              />
            </Col>
            <Col xs={6} lg={3}>
              <StatsCard
                title="Via Bank"
                value={formatCurrency(releasedTotals.byMethod['Bank Transfer'] || 0)}
                subtitle="Bank transfers"
                color="primary"
                icon="bi-bank"
              />
            </Col>
            <Col xs={6} lg={3}>
              <StatsCard
                title="Via Cash"
                value={formatCurrency(releasedTotals.byMethod['Cash'] || 0)}
                subtitle="Cash payouts"
                color="warning"
                icon="bi-cash"
              />
            </Col>
          </>
        )}
      </Row>

      {/* ============ Card with tabs ============ */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom p-0">
          <Nav variant="tabs" className="payment-tabs">
            <Nav.Item>
              <Nav.Link
                active={tab === 'pending'}
                onClick={() => setTab('pending')}
              >
                <i className="bi bi-hourglass-split me-2"></i>
                Pending Release
                {totals.pending > 0 && (
                  <Badge bg="warning" text="dark" className="ms-2 fw-normal">
                    {totals.pending}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={tab === 'released'}
                onClick={() => setTab('released')}
              >
                <i className="bi bi-check2-circle me-2"></i>
                Released
                {released.length > 0 && (
                  <Badge bg="success" className="ms-2 fw-normal">
                    {released.length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        <Card.Body className="p-0">
          {displayLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="text-muted mt-3 mb-0 small">
                Loading {isPendingTab ? 'pending payments' : 'payment history'}...
              </p>
            </div>
          ) : error && isPendingTab ? (
            <Alert variant="danger" className="m-3">{error}</Alert>
          ) : rowsForTable.length === 0 ? (
            <div className="text-center py-5">
              <i
                className={`bi ${isPendingTab ? 'bi-inbox' : 'bi-receipt'} text-muted`}
                style={{ fontSize: '2.5rem' }}
              ></i>
              <p className="text-muted mt-3 mb-0 small">
                {isPendingTab
                  ? 'No farmers pending payment for this season.'
                  : 'No payments released yet this season.'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={rowsForTable}
              searchPlaceholder={
                isPendingTab
                  ? 'Search by farmer, member no, or phone...'
                  : 'Search by farmer, member no, method, or reference...'
              }
              searchKeys={
                isPendingTab
                  ? ['farmerName', 'memberNo', 'phone']
                  : ['farmerName', 'memberNo', 'phone', 'method', 'reference']
              }
              itemsPerPage={10}
            />
          )}
        </Card.Body>
      </Card>

      {/* ============ Release Modal ============ */}
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
                {selected.phone && (
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted small">Phone</span>
                    <span className="small">{selected.phone}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-1 border-top mt-2 pt-2">
                  <span className="text-muted small fw-semibold">Net Amount</span>
                  <strong className="text-success" style={{ fontSize: '1.15rem' }}>
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
                This will record a <strong>Completed Payment</strong> and a
                printable voucher will be shown.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={closeModal} disabled={releasing}>
            Cancel
          </Button>
          <Button variant="success" size="sm" onClick={handleConfirmRelease} disabled={releasing}>
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

      {/* ============ Voucher Modal ============ */}
      <PaymentVoucherModal
        show={showVoucher}
        onHide={() => setShowVoucher(false)}
        payment={voucherPayment}
      />
    </Container>
  );
};

export default PaymentProcessing;