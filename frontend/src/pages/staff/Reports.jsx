import { useEffect, useState, useMemo } from 'react';
import {
  Container, Card, Button, Spinner, Alert, Row, Col, Form, Badge,
  ButtonGroup,
} from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { exportToPDF, exportToExcel, makeFileName } from '../../utils/exportUtils';
import PageHeader from '../../components/common/PageHeader';
import FarmerSearchSelect from '../../components/forms/FarmerSearchSelect';
import { toast } from 'react-toastify';

// ============================================
// CONSTANTS
// ============================================
const PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const DATE_REPORTS = ['deliveries', 'transactions', 'farmerStatement'];
const CUMULATIVE_REPORTS = ['payments', 'farmers'];

// ============================================
// HELPERS
// ============================================
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayStr = () => toLocalDateString(new Date());

const filterByPeriod = (items, period, customStart, customEnd) => {
  if (period === 'all') return items;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = null, to = null;

  switch (period) {
    case 'today':
      from = today;
      to = new Date(today); to.setHours(23, 59, 59, 999);
      break;
    case 'week':
      from = new Date(today); from.setDate(today.getDate() - today.getDay());
      to = new Date(today); to.setHours(23, 59, 59, 999);
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(today); to.setHours(23, 59, 59, 999);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(today); to.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (!customStart && !customEnd) return items;
      if (customStart) { from = new Date(customStart); from.setHours(0, 0, 0, 0); }
      if (customEnd) { to = new Date(customEnd); to.setHours(23, 59, 59, 999); }
      if (customStart && !customEnd) { to = new Date(customStart); to.setHours(23, 59, 59, 999); }
      break;
    default: return items;
  }

  return items.filter((item) => {
    const itemDate = new Date(item.date);
    if (isNaN(itemDate)) return false;
    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;
    return true;
  });
};

const getPeriodLabel = (value, customStart, customEnd) => {
  if (value === 'custom') {
    if (customStart && customEnd) {
      if (customStart === customEnd) return `on ${formatDate(customStart)}`;
      return `${formatDate(customStart)} — ${formatDate(customEnd)}`;
    }
    if (customStart) return `on ${formatDate(customStart)}`;
    return 'Custom Range';
  }
  return PERIODS.find((p) => p.value === value)?.label || 'All Time';
};

// ============================================
// MAIN COMPONENT
// ============================================
const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('deliveries');
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd] = useState(todayStr());
  const [exporting, setExporting] = useState(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');

  const [deliveries, setDeliveries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [f, d, t, p] = await Promise.all([
          staffApi.getAllFarmers(),
          staffApi.getAllDeliveries(),
          staffApi.getAllTransactions(),
          staffApi.getPaymentSchedule(),
        ]);
        setFarmers(f);
        setDeliveries(d);
        setTransactions(t);
        setPayments(p);
      } catch (err) {
        console.error(err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const supportsDate = DATE_REPORTS.includes(reportType);
  const isCumulative = CUMULATIVE_REPORTS.includes(reportType);
  const isFarmerStatement = reportType === 'farmerStatement';

  // ------- Filter by period -------
  const periodFilteredDeliveries = useMemo(
    () => (supportsDate ? filterByPeriod(deliveries, period, customStart, customEnd) : deliveries),
    [deliveries, period, customStart, customEnd, supportsDate]
  );

  const periodFilteredTransactions = useMemo(
    () => (supportsDate ? filterByPeriod(transactions, period, customStart, customEnd) : transactions),
    [transactions, period, customStart, customEnd, supportsDate]
  );

  // ------- Selected farmer -------
  const selectedFarmer = useMemo(
    () => farmers.find((f) => String(f.id) === String(selectedFarmerId)) || null,
    [farmers, selectedFarmerId]
  );

  // ------- Farmer-specific data (for statement) -------
  const farmerDeliveries = useMemo(() => {
    if (!selectedFarmer) return [];
    const memberNo = selectedFarmer.memberNo || selectedFarmer.member_no;
    return periodFilteredDeliveries.filter(
      (d) => (d.memberNo || d.member_no) === memberNo
    );
  }, [periodFilteredDeliveries, selectedFarmer]);

  const farmerTransactions = useMemo(() => {
    if (!selectedFarmer) return [];
    const memberNo = selectedFarmer.memberNo || selectedFarmer.member_no;
    return periodFilteredTransactions.filter(
      (t) => (t.memberNo || t.member_no) === memberNo
    );
  }, [periodFilteredTransactions, selectedFarmer]);

  // ------- Farmer statement summary -------
  const farmerSummary = useMemo(() => {
    if (!selectedFarmer) return null;

    const totalWeight = farmerDeliveries.reduce((s, d) => s + Number(d.weight || 0), 0);
    const advances = farmerTransactions
      .filter((t) => t.type === 'Advance')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const deductions = farmerTransactions
      .filter((t) => t.type === 'Deduction')
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const payments = farmerTransactions
      .filter((t) => t.type === 'Payment')
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const rate = 80;
    const gross = totalWeight * rate;
    const netPayable = gross - advances - deductions - payments;

    return {
      totalWeight,
      advances,
      deductions,
      payments,
      rate,
      gross,
      netPayable,
    };
  }, [selectedFarmer, farmerDeliveries, farmerTransactions]);

  // ------- Combined ledger for the statement -------
  const farmerLedger = useMemo(() => {
    if (!selectedFarmer) return [];

    const deliveryRows = farmerDeliveries.map((d) => ({
      date: d.date,
      category: 'Delivery',
      details: `Receipt ${d.receipt || d.receipt_no}`,
      weight: Number(d.weight),
      amount: null,
    }));

    const txRows = farmerTransactions.map((t) => ({
      date: t.date,
      category: t.type,
      details: t.description,
      weight: null,
      amount: Number(t.amount),
    }));

    return [...deliveryRows, ...txRows].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [selectedFarmer, farmerDeliveries, farmerTransactions]);

  // ------- Global summary -------
  const summary = useMemo(
    () => ({
      totalFarmers: farmers.length,
      totalWeight: periodFilteredDeliveries.reduce((s, x) => s + Number(x.weight || 0), 0),
      totalTransactions: periodFilteredTransactions.length,
      pendingPayments: payments.length,
    }),
    [farmers, periodFilteredDeliveries, periodFilteredTransactions, payments]
  );

  // ============================================
  // REPORT CONFIG
  // ============================================
  const reportConfig = useMemo(() => {
    const periodLabel = getPeriodLabel(period, customStart, customEnd);

    return {
      deliveries: {
        title: 'Coffee Deliveries Report',
        subtitle: supportsDate ? `Period: ${periodLabel}` : 'All cherry deliveries recorded',
        columns: [
          { key: 'receipt', label: 'Receipt No' },
          { key: 'farmerName', label: 'Farmer' },
          { key: 'memberNo', label: 'Member No' },
          { key: 'date', label: 'Date', format: (v) => formatDate(v) },
          { key: 'weight', label: 'Weight (kg)' },
          { key: 'quality', label: 'Quality' },
          { key: 'status', label: 'Status' },
        ],
        data: periodFilteredDeliveries.map((d) => ({
          receipt: d.receipt || d.receipt_no,
          farmerName: d.farmerName || d.farmer_name,
          memberNo: d.memberNo || d.member_no,
          date: d.date,
          weight: Number(d.weight),
          quality: d.quality || '—',
          status: d.status || 'Processed',
        })),
      },
      transactions: {
        title: 'Transactions Report',
        subtitle: supportsDate ? `Period: ${periodLabel}` : 'All advances, deductions, and payments',
        columns: [
          { key: 'date', label: 'Date', format: (v) => formatDate(v) },
          { key: 'farmerName', label: 'Farmer' },
          { key: 'memberNo', label: 'Member No' },
          { key: 'type', label: 'Type' },
          { key: 'description', label: 'Description' },
          { key: 'amount', label: 'Amount (KES)' },
          { key: 'status', label: 'Status' },
        ],
        data: periodFilteredTransactions.map((t) => ({
          date: t.date,
          farmerName: t.farmerName || t.farmer_name,
          memberNo: t.memberNo || t.member_no,
          type: t.type,
          description: t.description,
          amount: Number(t.amount),
          status: t.status || 'Completed',
        })),
      },
      payments: {
        title: 'Payment Schedule',
        subtitle: 'Season 2026 — cumulative payment breakdown',
        columns: [
          { key: 'memberNo', label: 'Member No' },
          { key: 'farmerName', label: 'Farmer' },
          { key: 'totalWeight', label: 'Weight (kg)' },
          { key: 'rate', label: 'Rate (KES/kg)' },
          { key: 'gross', label: 'Gross (KES)' },
          { key: 'advances', label: 'Advances (KES)' },
          { key: 'deductions', label: 'Deductions (KES)' },
          { key: 'net', label: 'Net Pay (KES)' },
        ],
        data: payments.map((p) => ({
          memberNo: p.memberNo,
          farmerName: p.farmerName,
          totalWeight: p.totalWeight,
          rate: p.rate,
          gross: p.gross,
          advances: p.advances,
          deductions: p.deductions,
          net: p.net,
        })),
      },
      farmers: {
        title: 'Farmer Register',
        subtitle: 'All registered farmers (cumulative)',
        columns: [
          { key: 'memberNo', label: 'Member No' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'location', label: 'Location' },
          { key: 'coffeeTrees', label: 'Coffee Trees' },
          { key: 'totalDelivered', label: 'Total Delivered (kg)' },
          { key: 'joinDate', label: 'Join Date', format: (v) => formatDate(v) },
          { key: 'status', label: 'Status' },
        ],
        data: farmers.map((f) => ({
          memberNo: f.memberNo || f.member_no,
          name: f.name,
          phone: f.phone || '—',
          location: f.location || '—',
          coffeeTrees: f.coffeeTrees || f.coffee_trees || 0,
          totalDelivered: Number(f.totalDelivered || f.total_delivered || 0),
          joinDate: f.joinDate || f.join_date,
          status: f.status,
        })),
      },
      farmerStatement: {
        title: selectedFarmer
          ? `Farmer Statement — ${selectedFarmer.name}`
          : 'Individual Farmer Statement',
        subtitle: selectedFarmer
          ? `${selectedFarmer.memberNo || selectedFarmer.member_no} · ${selectedFarmer.location || ''} · Period: ${periodLabel}`
          : 'Select a farmer to generate',
        columns: [
          { key: 'date', label: 'Date', format: (v) => formatDate(v) },
          { key: 'category', label: 'Category' },
          { key: 'details', label: 'Details' },
          { key: 'weight', label: 'Weight (kg)', format: (v) => (v ? v : '—') },
          { key: 'amount', label: 'Amount (KES)', format: (v) => (v ? v.toLocaleString() : '—') },
        ],
        data: farmerLedger,
      },
    };
  }, [periodFilteredDeliveries, periodFilteredTransactions, payments, farmers, farmerLedger, period, customStart, customEnd, supportsDate, selectedFarmer]);

  const config = reportConfig[reportType];
  const periodLabel = getPeriodLabel(period, customStart, customEnd);

  // ============================================
  // Export handlers
  // ============================================
  const fileNameSuffix = () => {
    if (isFarmerStatement && selectedFarmer) {
      const no = selectedFarmer.memberNo || selectedFarmer.member_no;
      return `_${no}`;
    }
    if (period === 'custom' && customStart) {
      if (customStart === customEnd || !customEnd) return `_${customStart}`;
      return `_${customStart}_to_${customEnd}`;
    }
    if (period === 'all') return '_all-time';
    return `_${period}`;
  };

  const canExport = config.data.length > 0 && (!isFarmerStatement || selectedFarmer);

  const handleExportPDF = () => {
    setExporting('pdf');
    try {
      exportToPDF({
        title: config.title,
        subtitle: config.subtitle,
        columns: config.columns,
        rows: config.data,
        fileName: `${makeFileName(reportType + fileNameSuffix())}.pdf`,
        orientation: 'landscape',
      });
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    try {
      exportToExcel({
        sheetName: reportType === 'farmerStatement' ? 'Statement' : reportType.charAt(0).toUpperCase() + reportType.slice(1),
        title: config.title,
        columns: config.columns,
        rows: config.data,
        fileName: `${makeFileName(reportType + fileNameSuffix())}.xlsx`,
      });
      toast.success('Excel downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel');
    } finally {
      setExporting(null);
    }
  };

  // ============================================
  // Render
  // ============================================
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate, preview, and export operational reports"
      />

      {/* KPI STRIP */}
      {!isFarmerStatement && (
        <Row className="g-3 mb-4">
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Registered Farmers
                  </span>
                  <i className="bi bi-people text-primary" style={{ fontSize: '1.1rem' }}></i>
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                  {summary.totalFarmers}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Weight Delivered
                  </span>
                  <i className="bi bi-box-seam text-success" style={{ fontSize: '1.1rem' }}></i>
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                  {formatWeight(summary.totalWeight)}
                </div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{periodLabel}</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Transactions
                  </span>
                  <i className="bi bi-arrow-left-right text-warning" style={{ fontSize: '1.1rem' }}></i>
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                  {summary.totalTransactions}
                </div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{periodLabel}</small>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} lg={3}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Payment Records
                  </span>
                  <i className="bi bi-cash-stack text-info" style={{ fontSize: '1.1rem' }}></i>
                </div>
                <div className="fw-bold text-dark" style={{ fontSize: '1.6rem', lineHeight: 1 }}>
                  {summary.pendingPayments}
                </div>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Cumulative</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* REPORT BUILDER */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
          <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Configure Report</span>
        </Card.Header>
        <Card.Body style={{ padding: '20px' }}>
          <Row className="g-3 align-items-end">
            {/* Report Type */}
            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  Report Type
                </Form.Label>
                <Form.Select
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    if (e.target.value !== 'farmerStatement') setSelectedFarmerId('');
                  }}
                  style={{ fontSize: '0.9rem' }}
                >
                  <option value="deliveries">Coffee Deliveries</option>
                  <option value="transactions">Transactions</option>
                  <option value="payments">Payment Schedule</option>
                  <option value="farmers">Farmer Register</option>
                  <option value="farmerStatement">Individual Farmer Statement</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Farmer selector (only for statement) */}
            {isFarmerStatement && (
              <Col md={6} lg={4}>
                <FarmerSearchSelect
                  farmers={farmers}
                  value={selectedFarmerId}
                  onChange={setSelectedFarmerId}
                  required
                />
              </Col>
            )}

            {/* Period */}
            {!isFarmerStatement && (
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label className="small text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Period {isCumulative && <span className="text-muted fst-italic text-lowercase">(n/a)</span>}
                  </Form.Label>
                  <Form.Select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={isCumulative}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Period for statement */}
            {isFarmerStatement && (
              <Col md={6} lg={3}>
                <Form.Group>
                  <Form.Label className="small text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Period
                  </Form.Label>
                  <Form.Select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            {/* Custom Range */}
            {period === 'custom' && !isCumulative && (
              <>
                <Col md={6} lg={2}>
                  <Form.Group>
                    <Form.Label className="small text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      From
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} lg={2}>
                  <Form.Group>
                    <Form.Label className="small text-muted text-uppercase fw-semibold mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                      To
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </Form.Group>
                </Col>
              </>
            )}

            {/* Export */}
            <Col lg={period === 'custom' ? 3 : (isFarmerStatement ? 2 : 3)} className="d-flex align-items-end">
              <ButtonGroup className="w-100">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={exporting !== null || !canExport}
                  style={{ fontSize: '0.82rem', padding: '8px' }}
                >
                  {exporting === 'pdf' ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    'PDF'
                  )}
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={exporting !== null || !canExport}
                  style={{ fontSize: '0.82rem', padding: '8px' }}
                >
                  {exporting === 'excel' ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    'Excel'
                  )}
                </Button>
              </ButtonGroup>
            </Col>
          </Row>

          {period === 'custom' && !isCumulative && (
            <div className="mt-3 small text-muted">
              Set both dates to the same day for a single-day report.
            </div>
          )}

          {isCumulative && (
            <Alert variant="light" className="mt-3 mb-0 small border">
              <strong>{config.title}</strong> shows cumulative season totals regardless of period.
            </Alert>
          )}

          {isFarmerStatement && !selectedFarmer && (
            <Alert variant="warning" className="mt-3 mb-0 small">
              Select a farmer above to generate their statement.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* FARMER INFO CARD */}
      {isFarmerStatement && selectedFarmer && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between flex-wrap gap-3 align-items-start mb-4">
              <div>
                <h5 className="mb-1 fw-semibold">{selectedFarmer.name}</h5>
                <div className="text-muted small">
                  <span className="badge bg-dark me-2" style={{ fontFamily: 'Courier New, monospace', letterSpacing: '1px' }}>
                    {selectedFarmer.memberNo || selectedFarmer.member_no}
                  </span>
                  {selectedFarmer.location} · {selectedFarmer.phone}
                </div>
              </div>
              <Badge bg="success" style={{ fontSize: '0.7rem', letterSpacing: '1px', padding: '6px 10px' }}>
                {selectedFarmer.status || 'ACTIVE'}
              </Badge>
            </div>

            <Row className="g-2">
              <Col md={3} xs={6}>
                <div className="border rounded p-3 bg-light">
                  <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                    Weight Delivered
                  </div>
                  <div className="fw-bold" style={{ fontSize: '1.2rem' }}>{formatWeight(farmerSummary.totalWeight)}</div>
                </div>
              </Col>
              <Col md={3} xs={6}>
                <div className="border rounded p-3 bg-light">
                  <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                    Advances
                  </div>
                  <div className="fw-bold text-danger" style={{ fontSize: '1.2rem' }}>{formatCurrency(farmerSummary.advances)}</div>
                </div>
              </Col>
              <Col md={3} xs={6}>
                <div className="border rounded p-3 bg-light">
                  <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                    Deductions
                  </div>
                  <div className="fw-bold text-danger" style={{ fontSize: '1.2rem' }}>{formatCurrency(farmerSummary.deductions)}</div>
                </div>
              </Col>
              <Col md={3} xs={6}>
                <div className="border rounded p-3" style={{ background: '#e6f4ea' }}>
                  <div className="text-uppercase text-muted fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                    Net Payable
                  </div>
                  <div className="fw-bold text-success" style={{ fontSize: '1.2rem' }}>{formatCurrency(farmerSummary.netPayable)}</div>
                </div>
              </Col>
            </Row>

            <div className="small text-muted mt-3">
              Calculation: <strong>{farmerSummary.totalWeight} kg</strong> × <strong>{formatCurrency(farmerSummary.rate)}/kg</strong> = <strong>{formatCurrency(farmerSummary.gross)}</strong> — Advances — Deductions — Payments
            </div>
          </Card.Body>
        </Card>
      )}

      {/* PREVIEW TABLE */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ padding: '14px 20px' }}>
          <div className="d-flex align-items-center">
            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Preview</span>
            <span className="text-muted ms-2 d-none d-sm-inline" style={{ fontSize: '0.85rem' }}>
              — {config.title}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {supportsDate && period !== 'all' && (
              <Badge bg="light" text="dark" className="border fw-normal" style={{ fontSize: '0.7rem' }}>
                {periodLabel}
              </Badge>
            )}
            <Badge bg="dark" className="fw-normal" style={{ fontSize: '0.7rem' }}>
              {config.data.length} {config.data.length === 1 ? 'record' : 'records'}
            </Badge>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {isFarmerStatement && !selectedFarmer ? (
            <div className="text-center py-5">
              <i className="bi bi-person-badge text-muted" style={{ fontSize: '2.5rem' }}></i>
              <p className="text-muted mt-3 mb-0 small">Select a farmer to see their statement.</p>
            </div>
          ) : config.data.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem' }}></i>
              <p className="text-muted mt-3 mb-0 small">No data available for this selection.</p>
              {supportsDate && period !== 'all' && (
                <small className="text-muted">Try selecting a wider period.</small>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8f9fa' }}>
                    <tr>
                      {config.columns.map((c) => (
                        <th
                          key={c.key}
                          className="text-uppercase text-muted fw-semibold border-bottom"
                          style={{ fontSize: '0.68rem', letterSpacing: '0.5px', padding: '12px 16px', whiteSpace: 'nowrap' }}
                        >
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {config.data.slice(0, 50).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        {config.columns.map((c) => (
                          <td key={c.key} style={{ padding: '12px 16px' }}>
                            {c.format ? c.format(row[c.key]) : row[c.key] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {config.data.length > 50 && (
                <div className="text-center text-muted small py-3 border-top bg-light">
                  Showing 50 of {config.data.length} records — export to view all
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Reports;