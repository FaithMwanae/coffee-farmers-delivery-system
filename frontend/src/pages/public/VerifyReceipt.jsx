import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import client from '../../api/client';
import ReceiptCard from '../../components/common/ReceiptCard';

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
            {/* Brand header */}
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
                    <h5 className="text-center fw-semibold mb-2">Invalid Receipt</h5>
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
                    {/* Success icon */}
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

                    <h5 className="text-center fw-semibold mb-1">Verified Receipt</h5>
                    <p className="text-center text-muted small mb-4">
                      This receipt is authentic and was issued by Kaliluni Factory.
                    </p>

                    {/* Shared receipt card */}
                    <ReceiptCard
                      variant="verify"
                      receiptNo={data.receipt.receiptNo}
                      date={data.receipt.date}
                      farmerName={data.receipt.farmerName}
                      memberNo={data.receipt.memberNo}
                      location={data.receipt.location}
                      weight={data.receipt.weight}
                      quality={data.receipt.quality}
                      status={data.receipt.status}
                    />
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