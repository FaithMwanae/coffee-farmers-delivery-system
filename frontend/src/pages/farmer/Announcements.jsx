import { useEffect, useState } from 'react';
import { Container, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { farmerApi } from '../../api/farmerApi';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await farmerApi.getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading announcements...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Announcements"
        subtitle="Latest news and updates from Kaliluni Factory"
      />

      {announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem' }}></i>
            <p className="text-muted mt-3 mb-0 small">
              No announcements available right now.
            </p>
          </Card.Body>
        </Card>
      ) : (
        announcements.map((a) => (
          <Card key={a.id} className="border-0 shadow-sm mb-3">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                <h5 className="fw-semibold mb-0">{a.title}</h5>
                {a.priority === 'high' && (
                  <Badge
                    bg="danger"
                    className="fw-normal"
                    style={{
                      fontSize: '0.65rem',
                      letterSpacing: '0.5px',
                      padding: '5px 8px',
                      flexShrink: 0,
                    }}
                  >
                    IMPORTANT
                  </Badge>
                )}
              </div>

              <div className="small text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                {formatDate(a.date)} · {a.author}
              </div>

              <p className="mb-0" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                {a.content}
              </p>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default Announcements;