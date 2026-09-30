import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';

const PURPOSES = [
  'School fees',
  'Farm inputs',
  'Medical',
  'Labour',
  'Household needs',
  'Other',
];

const RequestAdvanceModal = ({ show, onHide, onSuccess, initialEligibility }) => {
  const [eligibility, setEligibility] = useState(initialEligibility || null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('School fees');
  const [customPurpose, setCustomPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Refresh eligibility every time the modal opens
  useEffect(() => {
    if (!show) return;
    const load = async () => {
      try {
        const data = await farmerApi.getAdvanceEligibility();
        setEligibility(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
    setAmount('');
    setPurpose('School fees');
    setCustomPurpose('');
    setError('');
  }, [show]);

  const maxAmount = eligibility?.available || 0;
  const requested = Number(amount) || 0;
  const remaining = Math.max(0, maxAmount - requested);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!requested || requested <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (requested > maxAmount) {
      setError(`Amount exceeds your available balance of ${formatCurrency(maxAmount)}.`);
      return;
    }
    if (purpose === 'Other' && !customPurpose.trim()) {
      setError('Please describe the purpose.');
      return;
    }

    setSubmitting(true);
    try {
      const finalPurpose = purpose === 'Other' ? customPurpose.trim() : purpose;
      const result = await farmerApi.requestAdvance({
        amount: requested,
        purpose: finalPurpose,
      });

      toast.success(
        `Request submitted — KES ${requested.toLocaleString()} pending approval.`
      );

      if (onSuccess) await onSuccess();
      onHide();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton={!submitting}>
        <Modal.Title style={{ fontSize: '1.05rem' }}>
          Request Salary Advance
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="py-2 small">
              {error}
            </Alert>
          )}

          {/* Available summary */}
          {eligibility && (
            <div
              className="border rounded p-3 mb-4"
              style={{ background: '#fafbfc' }}
            >
              <Row className="text-center">
                <Col xs={4}>
                  <div className="text-muted small">Eligible</div>
                  <div className="fw-semibold num">{formatCurrency(eligibility.eligible)}</div>
                </Col>
                <Col xs={4} className="border-start border-end">
                  <div className="text-muted small">Already Used</div>
                  <div className="fw-semibold num text-danger">
                    {formatCurrency(eligibility.totalAdvanced)}
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="text-muted small">Available</div>
                  <div className="fw-bold num text-success" style={{ fontSize: '1.1rem' }}>
                    {formatCurrency(eligibility.available)}
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">
              Amount (KES) *
            </Form.Label>
            <Form.Control
              type="number"
              min="100"
              step="100"
              placeholder={`Max ${formatCurrency(maxAmount)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
              required
            />
            <div className="d-flex justify-content-between mt-1">
              <Form.Text className="text-muted">
                Enter an amount between 100 and {formatCurrency(maxAmount)}.
              </Form.Text>
              {requested > 0 && requested <= maxAmount && (
                <Form.Text className="text-success">
                  Remaining: {formatCurrency(remaining)}
                </Form.Text>
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold text-secondary">
              Purpose *
            </Form.Label>
            <Form.Select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={submitting}
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {purpose === 'Other' && (
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Describe purpose *
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Emergency travel"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                disabled={submitting}
                required
              />
            </Form.Group>
          )}

          <Alert variant="light" className="small border mb-0">
            <i className="bi bi-info-circle me-1"></i>
            Your request will be reviewed by the CEO. You'll see the status in
            your Transaction History.
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            size="sm"
            type="submit"
            disabled={submitting || maxAmount === 0}
          >
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <i className="bi bi-send me-1"></i>Submit Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RequestAdvanceModal;