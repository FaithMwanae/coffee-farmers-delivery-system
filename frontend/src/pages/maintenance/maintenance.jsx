import { useEffect, useState } from 'react';
import { Container, Card, Spinner, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import client from '../../api/client';

const Maintenance = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get('/auth/maintenance-status');
        setInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();

    // Auto-refresh every 30s — if maintenance ends, user can retry login
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'var(--kl-bg)', padding: '20px' }}
    >
      <Container>
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5 text-center">
                {loading ? (
                  <Spinner animation="border" variant="success" />
                ) : (
                  <>
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto 20px',
                        borderRadius: '50%',
                        background: '#fef7e0',
                        color: '#B45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}
                    >
                      <i className="bi bi-tools"></i>
                    </div>

                    <Badge
                      bg="dark"
                      className="mb-3"
                      style={{
                        fontSize: '0.7rem',
                        letterSpacing: '1px',
                        padding: '6px 10px',
                      }}
                    >
                      MAINTENANCE MODE
                    </Badge>

                    <h4 className="fw-semibold mb-2">
                      System Under Maintenance
                    </h4>

                    <p className="text-muted small mb-4">
                      {info?.message ||
                        'We are currently performing scheduled maintenance. Please check back shortly.'}
                    </p>

                    {(info?.start || info?.end) && (
                      <div
                        className="small text-muted mb-4"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {info.start && (
                          <>
                            <strong>Start:</strong>{' '}
                            {new Date(info.start).toLocaleString('en-GB')}
                            <br />
                          </>
                        )}
                        {info.end && (
                          <>
                            <strong>Expected end:</strong>{' '}
                            {new Date(info.end).toLocaleString('en-GB')}
                          </>
                        )}
                      </div>
                    )}

                    <div
                      className="border rounded p-3 mb-4 small text-muted"
                      style={{ background: '#f8f9fa', fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-info-circle me-1"></i>
                      This page refreshes every 30 seconds.
                      You'll be notified when the system is back online.
                    </div>

                    <div className="d-flex gap-2 justify-content-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => window.location.reload()}
                        style={{ fontSize: '0.85rem' }}
                      >
                        Check Again
                      </Button>
                      <Button
                        as={Link}
                        to="/login"
                        variant="success"
                        size="sm"
                        style={{ fontSize: '0.85rem' }}
                      >
                        Administrator Login
                      </Button>
                    </div>
                  </>
                )}

                <div
                  className="text-muted mt-4"
                  style={{ fontSize: '0.72rem' }}
                >
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

export default Maintenance;