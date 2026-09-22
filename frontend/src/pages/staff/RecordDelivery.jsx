import { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import PageHeader from '../../components/common/PageHeader';
import FarmerSearchSelect from '../../components/forms/FarmerSearchSelect';
import { toast } from 'react-toastify';
import { formatWeight } from '../../utils/formatters';

const RecordDelivery = () => {
  const [farmers, setFarmers] = useState([]);
  const [form, setForm] = useState({
    farmerId: '',
    weight: '',
    quality: 'Good',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await staffApi.getAllFarmers();
        setFarmers(data);
      } catch (err) {
        setError('Failed to load farmers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFarmerChange = (farmerId) => {
    setForm({ ...form, farmerId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLastReceipt(null);

    if (!form.farmerId || !form.weight) {
      setError('Please select a farmer and enter weight');
      return;
    }

    if (Number(form.weight) <= 0) {
      setError('Weight must be greater than zero');
      return;
    }

    setSubmitting(true);
    try {
      const result = await staffApi.recordDelivery(form);

      const updatedFarmers = await staffApi.getAllFarmers();
      setFarmers(updatedFarmers);
      const updatedFarmer = updatedFarmers.find(
        (f) => String(f.id) === String(form.farmerId)
      );

      setLastReceipt({
        ...result,
        cumulativeTotal:
          result.cumulativeTotal ??
          (updatedFarmer
            ? Number(updatedFarmer.totalDelivered || updatedFarmer.total_delivered || 0)
            : Number(result.weight || 0)),
      });

      toast.success(`Delivery recorded — Receipt ${result.receipt}`);
      setForm({ farmerId: '', weight: '', quality: 'Good', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record delivery');
      toast.error('Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading farmers...</p>
        </div>
      </div>
    );
  }

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Record Coffee Delivery"
        subtitle="Log a new cherry delivery from a farmer"
      />

      <Row className="g-3">
        {/* ============================== */}
        {/* DELIVERY FORM */}
        {/* ============================== */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Delivery Details
              </span>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <FarmerSearchSelect
                    farmers={farmers}
                    value={form.farmerId}
                    onChange={handleFarmerChange}
                    required
                  />
                </div>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary">
                        Weight (kg) *
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="weight"
                        min="1"
                        step="0.1"
                        placeholder="e.g., 78.5"
                        value={form.weight}
                        onChange={handleChange}
                        required
                        style={{ fontSize: '0.9rem' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold text-secondary">
                        Quality
                      </Form.Label>
                      <Form.Select
                        name="quality"
                        value={form.quality}
                        onChange={handleChange}
                        style={{ fontSize: '0.9rem' }}
                      >
                        <option>Excellent</option>
                        <option>Good</option>
                        <option>Fair</option>
                        <option>Poor</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-secondary">
                    Notes (Optional)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    placeholder="Any additional observations..."
                    value={form.notes}
                    onChange={handleChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  disabled={submitting}
                  className="w-100"
                  size="sm"
                  style={{ fontSize: '0.9rem', padding: '10px' }}
                >
                  {submitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Recording...
                    </>
                  ) : (
                    'Record Delivery'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ============================== */}
        {/* RECEIPT PREVIEW */}
        {/* ============================== */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom no-print" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Last Receipt
              </span>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              {!lastReceipt ? (
                <div className="text-center py-5 no-print">
                  <i className="bi bi-receipt text-muted" style={{ fontSize: '2.5rem' }}></i>
                  <p className="text-muted mt-3 mb-0 small">
                    No delivery recorded yet in this session.
                  </p>
                </div>
              ) : (
                <>
                  {/* PRINTABLE RECEIPT */}
                  <div className="border rounded p-3 print-receipt" style={{ background: '#fafbfc' }}>
                    <div className="text-center mb-3">
                      <h6 className="fw-bold mb-0" style={{ letterSpacing: '1px' }}>
                        KALILUNI FACTORY
                      </h6>
                      <small className="text-muted">Coffee Delivery Receipt</small>
                    </div>
                    <hr />

                    <p className="mb-1 small">
                      <strong>Receipt No:</strong>{' '}
                      <code>{lastReceipt.receipt || lastReceipt.receipt_no}</code>
                    </p>
                    <p className="mb-1 small">
                      <strong>Farmer:</strong> {lastReceipt.farmerName || lastReceipt.farmer_name}
                    </p>
                    <p className="mb-1 small">
                      <strong>Member No:</strong>{' '}
                      {lastReceipt.memberNo || lastReceipt.member_no}
                    </p>
                    <p className="mb-1 small">
                      <strong>This Delivery:</strong> {formatWeight(lastReceipt.weight)}
                    </p>
                    <p className="mb-1 small">
                      <strong>Cumulative Total:</strong>{' '}
                      <span className="fw-bold">{formatWeight(lastReceipt.cumulativeTotal)}</span>
                    </p>
                    <p className="mb-1 small">
                      <strong>Quality:</strong> {lastReceipt.quality}
                    </p>
                    <p className="mb-1 small">
                      <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
                    </p>

                    <hr />
                    <div className="text-center">
                      <small className="text-muted">Thank you for your delivery</small>
                    </div>
                  </div>

                  {/* Cumulative Badge — DARK for uniformity */}
                  <div className="mt-3 no-print">
                    <div
                      className="text-white p-2 rounded text-center small fw-semibold"
                      style={{ background: '#1f2937', letterSpacing: '0.3px' }}
                    >
                      {lastReceipt.farmerName || lastReceipt.farmer_name}'s Total: {formatWeight(lastReceipt.cumulativeTotal)}
                    </div>
                  </div>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="w-100 mt-3 no-print"
                    onClick={handlePrint}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Print Receipt
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RecordDelivery;