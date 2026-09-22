import { useEffect, useState } from 'react';
import { Container, Card, Button, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const DownloadForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await farmerApi.getForms();
        setForms(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ============================================
  // OPEN IN NEW TAB — bypasses IDM entirely
  // ============================================
  const handleDownload = (form) => {
    const API_BASE =
      import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    // Build URL with token as query param
    const url = `${API_BASE}/forms/${form.id}/download?token=${encodeURIComponent(token)}`;

    // Open in new tab — browser handles the download natively
    window.open(url, '_blank', 'noopener,noreferrer');

    toast.success(`Opening ${form.title}...`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Downloadable Forms"
        subtitle="Download and print cooperative forms"
      />

      {forms.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-file-earmark-text text-muted" style={{ fontSize: '2.5rem' }}></i>
            <p className="text-muted mt-3 mb-0 small">
              No forms available at this time.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {forms.map((form) => (
            <Col md={6} lg={4} key={form.id}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex flex-column" style={{ padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-semibold mb-0" style={{ fontSize: '1rem' }}>
                      {form.title}
                    </h5>
                    <Badge
                      bg="dark"
                      className="fw-normal"
                      style={{ fontSize: '0.65rem', letterSpacing: '0.5px', padding: '5px 8px' }}
                    >
                      {form.type || 'PDF'}
                    </Badge>
                  </div>

                  <p
                    className="text-muted small flex-grow-1"
                    style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                  >
                    {form.description}
                  </p>

                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {form.size || '—'} · {formatDate(form.uploadDate || form.upload_date)}
                    </small>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleDownload(form)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Download
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default DownloadForms;