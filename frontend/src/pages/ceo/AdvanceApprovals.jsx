import { useEffect, useState } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert, Row, Col, Modal, Form } from 'react-bootstrap';
import { ceoApi } from '../../api/ceoApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const AdvanceApprovals = () => {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      const data = await ceoApi.getPendingAdvances();
      setAdvances(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load pending advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this advance?')) return;
    setProcessing(id);
    try {
      await ceoApi.approveAdvance(id);
      toast.success('Advance approved');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    try {
      await ceoApi.rejectAdvance(rejecting.id, rejectReason);
      toast.success('Advance rejected');
      setRejecting(null);
      setRejectReason('');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading pending advances...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Advance Approvals"
        subtitle={`${advances.length} pending request${advances.length === 1 ? '' : 's'} awaiting your decision`}
      />

      {advances.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-3 mb-0 small">
              No pending advance requests.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {advances.map((a) => (
            <Col lg={6} key={a.id}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="fw-semibold" style={{ fontSize: '1rem' }}>{a.farmer_name}</div>
                      <code style={{ fontSize: '0.78rem', color: '#1a4d2e', background: '#f0f4f1', padding: '2px 6px', borderRadius: '3px' }}>
                        {a.member_no}
                      </code>
                    </div>
                    <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                      PENDING
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted small mb-1">Amount Requested</div>
                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#8B1A1A' }}>
                      {formatCurrency(a.amount)}
                    </div>
                  </div>

                  <Row className="g-2 mb-3 small">
                    <Col xs={6}>
                      <div className="text-muted">Purpose</div>
                      <div>{a.description || '—'}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted">Date</div>
                      <div>{formatDate(a.date)}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted">Location</div>
                      <div>{a.location || '—'}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted">Total Delivered</div>
                      <div>{a.total_delivered} kg</div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      className="flex-grow-1"
                      size="sm"
                      disabled={processing === a.id}
                      onClick={() => handleApprove(a.id)}
                    >
                      {processing === a.id ? (
                        <><Spinner as="span" animation="border" size="sm" className="me-1" /> Approving...</>
                      ) : (
                        'Approve'
                      )}
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="flex-grow-1"
                      size="sm"
                      onClick={() => setRejecting(a)}
                    >
                      Reject
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Reject Modal */}
      <Modal show={!!rejecting} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem' }}>Reject Advance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rejecting && (
            <p className="small">
              Reject advance of <strong>{formatCurrency(rejecting.amount)}</strong> for{' '}
              <strong>{rejecting.farmer_name}</strong>?
            </p>
          )}
          <Form.Group>
            <Form.Label className="small fw-semibold">Reason (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected?"
              style={{ fontSize: '0.9rem' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleReject}>Reject Advance</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdvanceApprovals;