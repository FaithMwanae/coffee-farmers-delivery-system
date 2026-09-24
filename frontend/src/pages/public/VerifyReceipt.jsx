import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Spinner, Badge, Button, Alert } from 'react-bootstrap';
import client from '../../api/client';
import { formatDate, formatWeight } from '../../utils/formatters';

const VerifyReceipt = () => {
  const { receipt } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get(`/verify/${receipt}`);
        setData(data);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Receipt not found or invalid.'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [receipt]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'var(--kl-bg)', padding: '20px' }}
    >
      <Container>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            {/* Brand Header */}
            <div className="text-center mb-4">
              <h1
                className="fw-bold text-dark mb-1"
                style={{ letterSpacing: '2px', fontSize: '1.3rem' }}
              >
                KALILUNI FACTORY
              </h1>
              <p
                className="text-muted small mb-0"
                style={{ letterSpacing: '2px', fontSize: '0.7rem', fontWeight: 600 }}
              >
                RECEIPT VERIFICATION
              </p>
            </div>

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4 p-md-5">
                {loading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="success" />
                    <p className="text-muted mt-3 small">Verifying receipt...</p>
                  </div>
                )}

                {error && (
                  <>
                    <div
                      className="text-center mb-4"
                      style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: '#fce8e6',
                        color: '#c5221f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </div>
                    <h5 className="text-center fw-semibold mb-2">
                      Invalid Receipt
                    </h5>
                    <p className="text-muted text-center small mb-4">{error}</p>
                    <div className="text-center">
                      <Button as={Link} to="/login" variant="outline-secondary" size="sm">
                        Back to Login
                      </Button>
                    </div>
                  </>
                )}

                {data?.valid && (
                  <>
                    <div
                      className="text-center mb-4"
                      style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        background: '#e6f4ea',
                        color: '#1a4d2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      <i className="bi bi-check-lg"></i>
                    </div>

                    <h5 className="text-center fw-semibold mb-1">
                      Verified Receipt
                    </h5>
                    <p className="text-center text-muted small mb-4">
                      This receipt is authentic and was issued by Kaliluni Factory.
                    </p>

                    <div className="border rounded p-3 mb-3" style={{ background: '#fafbfc' }}>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Receipt No.</span>
                        <code className="fw-bold">{data.receipt.receiptNo}</code>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Date Issued</span>
                        <strong className="small">{formatDate(data.receipt.date)}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Farmer</span>
                        <strong className="small">{data.receipt.farmerName}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Member No.</span>
                        <code>{data.receipt.memberNo}</code>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Location</span>
                        <strong className="small">{data.receipt.location}</strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Weight</span>
                        <strong className="text-success">
                          {formatWeight(data.receipt.weight)}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between py-2 border-bottom">
                        <span className="text-muted small">Quality</span>
                        <Badge bg="success">{data.receipt.quality}</Badge>
                      </div>
                      <div className="d-flex justify-content-between py-2">
                        <span className="text-muted small">Status</span>
                        <Badge bg="success">{data.receipt.status}</Badge>
                      </div>
                    </div>

                    <Alert variant="light" className="small border mb-0">
                      <i className="bi bi-shield-check me-1"></i>
                      Verified by <strong>Kaliluni Farmers Co-operative Society</strong>.
                      For any questions, contact the cooperative office.
                    </Alert>
                  </>
                )}

                <div className="text-center mt-4 text-muted" style={{ fontSize: '0.72rem' }}>
                  &copy; 2026 Kaliluni Farmers Co-operative Society
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default VerifyReceipt;