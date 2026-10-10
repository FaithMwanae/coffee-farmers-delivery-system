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
  const [tab, setTab] = useState('pending'); // 'pending' | 'released' | 'bulk'
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

  // Bulk payment state
  const [groupBy, setGroupBy] = useState('bank'); // 'bank' | 'method'
  const [groups, setGroups] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(null);
  const [bulkMethod, setBulkMethod] = useState('M-Pesa');
  const [confirmBulkGroup, setConfirmBulkGroup] = useState(null);

  // ============================================
  // Loaders
  // ============================================
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

  const loadGroups = async (by = groupBy) => {
    try {
      setBulkLoading(true);
      const data = await staffApi.getPaymentsGrouped(by);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load grouped payments');
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    loadReleased();
  }, []);

  useEffect(() => {
    if (tab === 'bulk') {
      loadGroups(groupBy);
    }
  }, [tab, groupBy]);

  // ============================================
  // Single release
  // ============================================
  const openRelease = (payment) => {
    setSelected(payment);
    setMethod(payment.preferredPaymentMethod || 'M-Pesa');
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

      setVoucherPayment({
        id: Date.now(),
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

  // ============================================
  // Bulk release
  // ============================================
  const handleBulkRelease = async () => {
    if (!confirmBulkGroup) return;

    setBulkProcessing(confirmBulkGroup.groupName);

    try {
      const farmerIds = confirmBulkGroup.farmers.map((f) => f.id);
      const result = await staffApi.bulkReleasePayments(farmerIds, bulkMethod);

      const successCount = result.results?.success?.length || 0;
      const failCount = result.results?.failed?.length || 0;

      if (failCount > 0) {
        toast.warning(
          `Released ${successCount}. Skipped ${failCount}. Check console for details.`
        );
        console.log('Bulk release failures:', result.results.failed);
      } else {
        toast.success(`Released ${successCount} payment${successCount === 1 ? '' : 's'}`);
      }

      setConfirmBulkGroup(null);
      await Promise.all([loadPending(), loadReleased(), loadGroups(groupBy)]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Bulk release failed');
    } finally {
      setBulkProcessing(null);
    }
  };

  // ============================================
  // Totals
  // ============================================
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

  const bulkTotals = useMemo(
    () =>
      groups.reduce(
        (acc, g) => {
          acc.total += Number(g.totalAmount) || 0;
          acc.farmers += g.farmers?.length || 0;
          return acc;
        },
        { total: 0, farmers: 0 }
      ),
    [groups]
  );

  // ============================================
  // CSV export
  // ============================================
  const handleExportCSV = () => {
    const isPending = tab === 'pending';
    const isBulk = tab === 'bulk';

    if (isBulk) {
      const header = ['Group', 'Member No', 'Farmer', 'Phone', 'M-Pesa', 'Bank', 'Account No', 'Net Pay'];
      const rows = [];
      groups.forEach((g) => {
        (g.farmers || []).forEach((f) => {
          rows.push([
            g.groupName,
            f.memberNo,
            f.name,
            f.phone || '',
            f.mpesaNumber || '',
            f.bankName || '',
            f.bankAccountNo || '',
            f.net || 0,
          ]);
        });
      });

      const csv = [header, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bulk-payments-${groupBy}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
      return;
    }

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
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
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

  // ============================================
  // Pending columns
  // ============================================
  const pendingColumns = [
    { key: 'memberNo', label: 'Member No.', render: (v) => <code className="small">{v}</code> },
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
    { key: 'totalWeight', label: 'Weight', render: (v) => <span className="num">{formatWeight(v)}</span> },
    { key: 'gross', label: 'Gross', render: (v) => <span className="num">{formatCurrency(v)}</span> },
    { key: 'advances', label: 'Advances', render: (v) => <span className="num text-danger">− {formatCurrency(v)}</span> },
    { key: 'deductions', label: 'Deductions', render: (v) => <span className="num text-danger">− {formatCurrency(v)}</span> },
    { key: 'net', label: 'Net Pay', render: (v) => <span className="num fw-bold text-success">{formatCurrency(v)}</span> },
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

  // ============================================
  // Released columns
  // ============================================
  const releasedColumns = [
    { key: 'date', label: 'Date', render: (v) => <span className="small text-muted">{formatDate(v)}</span> },
    { key: 'memberNo', label: 'Member No.', render: (v) => <code className="small">{v}</code> },
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
    { key: 'amount', label: 'Amount', render: (v) => <span className="num fw-bold text-success">{formatCurrency(v)}</span> },
    {
      key: 'method',
      label: 'Method',
      render: (v) => (
        <Badge bg={METHOD_VARIANTS[v] || 'secondary'} className="fw-normal">{v || '—'}</Badge>
      ),
    },
    { key: 'reference', label: 'Reference', render: (v) => (v ? <code className="small">{v}</code> : <span className="text-muted">—</span>) },
    { key: 'releasedBy', label: 'Released By', render: (v) => <span className="small text-muted">{v || '—'}</span> },
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
  const isBulkTab = tab === 'bulk';
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
        .payment-tabs .nav-link:hover { color: var(--kl-primary); }
        .payment-tabs .nav-link.active {
          color: var(--kl-primary);
          background: transparent;
          border-bottom-color: var(--kl-primary);
        }
        .group-card .card-header { background: #fff; }
      `}</style>

      <PageHeader
        title="Payment Processing"
        subtitle={
          isBulkTab
            ? `${groups.length} group${groups.length === 1 ? '' : 's'} · ${bulkTotals.farmers} farmer${bulkTotals.farmers === 1 ? '' : 's'} ready`
            : `Season ${new Date().getFullYear()} — ${totals.pending} farmer${totals.pending === 1 ? '' : 's'} pending release`
        }
        action={
          <Button variant="outline-secondary" size="sm" onClick={handleExportCSV}>
            <i className="bi bi-download me-1"></i>
            Export {isBulkTab ? 'Bulk' : isPendingTab ? 'Pending' : 'Released'}
          </Button>
        }
      />

      {/* ============ KPI band ============ */}
      {!isBulkTab && (
        <Row className="g-3 mb-4">
          {isPendingTab ? (
            <>
              <Col xs={6} lg={3}>
                <StatsCard title="Gross Payout" value={formatCurrency(totals.gross)} subtitle={`${payments.length} farmer${payments.length === 1 ? '' : 's'}`} color="primary" icon="bi-cash-stack" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Advances" value={formatCurrency(totals.advances)} subtitle="Already issued" color="warning" icon="bi-arrow-down-circle" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Deductions" value={formatCurrency(totals.deductions)} subtitle="Loans, inputs, fees" color="danger" icon="bi-dash-circle" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Net Payable" value={formatCurrency(totals.net)} subtitle={`${totals.pending} pending`} color="success" icon="bi-wallet2" />
              </Col>
            </>
          ) : (
            <>
              <Col xs={6} lg={3}>
                <StatsCard title="Total Paid" value={formatCurrency(releasedTotals.total)} subtitle={`${released.length} payment${released.length === 1 ? '' : 's'}`} color="success" icon="bi-check-circle" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Via M-Pesa" value={formatCurrency(releasedTotals.byMethod['M-Pesa'] || 0)} subtitle="Mobile money" color="success" icon="bi-phone" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Via Bank" value={formatCurrency(releasedTotals.byMethod['Bank Transfer'] || 0)} subtitle="Bank transfers" color="primary" icon="bi-bank" />
              </Col>
              <Col xs={6} lg={3}>
                <StatsCard title="Via Cash" value={formatCurrency(releasedTotals.byMethod['Cash'] || 0)} subtitle="Cash payouts" color="warning" icon="bi-cash" />
              </Col>
            </>
          )}
        </Row>
      )}

      {isBulkTab && (
        <Row className="g-3 mb-4">
          <Col xs={6} lg={3}>
            <StatsCard title="Groups" value={groups.length} subtitle={groupBy === 'bank' ? 'By bank' : 'By method'} color="primary" icon="bi-diagram-3" />
          </Col>
          <Col xs={6} lg={3}>
            <StatsCard title="Farmers" value={bulkTotals.farmers} subtitle="To be paid" color="info" icon="bi-people" />
          </Col>
          <Col xs={6} lg={3}>
            <StatsCard title="Total Amount" value={formatCurrency(bulkTotals.total)} subtitle="Across all groups" color="success" icon="bi-cash-stack" />
          </Col>
          <Col xs={6} lg={3}>
            <StatsCard title="Method" value={bulkMethod} subtitle="Chosen for bulk" color="warning" icon="bi-send" />
          </Col>
        </Row>
      )}

      {/* ============ Card with tabs ============ */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom p-0">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <Nav variant="tabs" className="payment-tabs flex-grow-1">
              <Nav.Item>
                <Nav.Link active={tab === 'pending'} onClick={() => setTab('pending')}>
                  <i className="bi bi-hourglass-split me-2"></i>
                  Pending Release
                  {totals.pending > 0 && (
                    <Badge bg="warning" text="dark" className="ms-2 fw-normal">{totals.pending}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={tab === 'released'} onClick={() => setTab('released')}>
                  <i className="bi bi-check2-circle me-2"></i>
                  Released
                  {released.length > 0 && (
                    <Badge bg="success" className="ms-2 fw-normal">{released.length}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link active={tab === 'bulk'} onClick={() => setTab('bulk')}>
                  <i className="bi bi-people me-2"></i>
                  Bulk Payment
                  {groups.length > 0 && (
                    <Badge bg="primary" className="ms-2 fw-normal">{groups.length}</Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {isBulkTab && (
              <div className="d-flex gap-2 align-items-center px-3 py-2">
                <small className="text-muted">Group by:</small>
                <Form.Select
                  size="sm"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  style={{ width: '140px', minHeight: '34px' }}
                >
                  <option value="bank">Bank</option>
                  <option value="method">Payment Method</option>
                </Form.Select>
              </div>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {isBulkTab ? (
            bulkLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="text-muted mt-3 mb-0 small">Loading grouped payments...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem' }}></i>
                <p className="text-muted mt-3 mb-0 small">
                  No pending payments to bulk-process.
                </p>
                <p className="text-muted small">
                  Farmers without a {groupBy === 'bank' ? 'bank account' : 'preferred method'} will show under "No Bank Account" / "M-Pesa".
                </p>
              </div>
            ) : (
              <div className="p-3">
                {groups.map((group) => (
                  <Card key={group.groupName} className="mb-3 group-card">
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <i
                          className={`bi ${
                            group.groupName === 'No Bank Account'
                              ? 'bi-exclamation-triangle text-warning'
                              : groupBy === 'bank'
                              ? 'bi-bank text-primary'
                              : 'bi-phone text-success'
                          }`}
                          style={{ fontSize: '1.1rem' }}
                        ></i>
                        <div>
                          <div className="fw-semibold">{group.groupName}</div>
                          <small className="text-muted">
                            {group.farmers.length} farmer{group.farmers.length === 1 ? '' : 's'}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <div className="text-end">
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Total</div>
                          <div className="fw-bold num text-success">
                            {formatCurrency(group.totalAmount)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="success"
                          disabled={bulkProcessing === group.groupName}
                          onClick={() => {
                            setConfirmBulkGroup(group);
                            setBulkMethod(groupBy === 'method' ? group.groupName : 'M-Pesa');
                          }}
                        >
                          {bulkProcessing === group.groupName ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" className="me-1" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-send me-1"></i>
                              Pay All
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <table className="table table-sm mb-0" style={{ fontSize: '0.82rem' }}>
                          <thead>
                            <tr>
                              <th>Member No.</th>
                              <th>Farmer</th>
                              <th>Phone</th>
                              <th>M-Pesa</th>
                              <th>Bank Account</th>
                              <th className="text-end">Net Pay</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.farmers.map((f) => (
                              <tr key={f.id}>
                                <td><code className="small">{f.memberNo}</code></td>
                                <td className="fw-semibold">{f.name}</td>
                                <td className="text-muted small">{f.phone || '—'}</td>
                                <td className="text-muted small">{f.mpesaNumber || '—'}</td>
                                <td className="text-muted small">
                                  {f.bankAccountNo ? (
                                    <>
                                      {f.bankName}
                                      <br />
                                      <code style={{ fontSize: '0.75rem' }}>{f.bankAccountNo}</code>
                                    </>
                                  ) : '—'}
                                </td>
                                <td className="text-end num fw-bold text-success">
                                  {formatCurrency(f.net)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )
          ) : displayLoading ? (
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

      {/* ============ Release Modal (single) ============ */}
      <Modal show={showModal} onHide={closeModal} centered backdrop="static">
        <Modal.Header closeButton={!releasing}>
          <Modal.Title style={{ fontSize: '1rem' }}>Confirm Payment Release</Modal.Title>
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
                <Form.Label className="small fw-semibold text-secondary">Payment Method *</Form.Label>
                <Form.Select value={method} onChange={(e) => setMethod(e.target.value)} disabled={releasing}>
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
                    method === 'M-Pesa' ? 'e.g., QK12AB34CD'
                    : method === 'Bank Transfer' ? 'e.g., TRF-2026-04812'
                    : 'e.g., Cash voucher #'
                  }
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  disabled={releasing}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {method === 'Cash' ? 'Optional for cash payments' : 'Required for audit trail'}
                </Form.Text>
              </Form.Group>

              <Alert variant="light" className="small border mt-3 mb-0">
                <i className="bi bi-info-circle me-1"></i>
                This will record a <strong>Completed Payment</strong> and a printable voucher will be shown.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={closeModal} disabled={releasing}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleConfirmRelease} disabled={releasing}>
            {releasing ? (
              <><Spinner as="span" animation="border" size="sm" className="me-2" />Releasing...</>
            ) : (
              <><i className="bi bi-check2-circle me-1"></i>Confirm Release</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============ Bulk Confirm Modal ============ */}
      <Modal
        show={!!confirmBulkGroup}
        onHide={() => !bulkProcessing && setConfirmBulkGroup(null)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton={!bulkProcessing}>
          <Modal.Title style={{ fontSize: '1rem' }}>Confirm Bulk Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmBulkGroup && (
            <>
              <Alert variant="warning" className="small border">
                <i className="bi bi-exclamation-triangle me-1"></i>
                You are about to release payments to <strong>{confirmBulkGroup.farmers.length} farmers</strong> in one action.
              </Alert>

              <div className="border rounded p-3 mb-3" style={{ background: '#fafbfc' }}>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Group</span>
                  <strong className="small">{confirmBulkGroup.groupName}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Farmers</span>
                  <strong className="small">{confirmBulkGroup.farmers.length}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-top mt-2 pt-2">
                  <span className="text-muted small fw-semibold">Total Amount</span>
                  <strong className="text-success" style={{ fontSize: '1.15rem' }}>
                    {formatCurrency(confirmBulkGroup.totalAmount)}
                  </strong>
                </div>
              </div>

              <Form.Group>
                <Form.Label className="small fw-semibold text-secondary">
                  Payment Method *
                </Form.Label>
                <Form.Select
                  value={bulkMethod}
                  onChange={(e) => setBulkMethod(e.target.value)}
                  disabled={!!bulkProcessing}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Applied to every farmer in this group.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setConfirmBulkGroup(null)}
            disabled={!!bulkProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleBulkRelease}
            disabled={!!bulkProcessing}
          >
            {bulkProcessing ? (
              <><Spinner as="span" animation="border" size="sm" className="me-2" />Processing...</>
            ) : (
              <><i className="bi bi-check2-circle me-1"></i>Confirm Bulk Release</>
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