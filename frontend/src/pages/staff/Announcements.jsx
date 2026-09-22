import { useEffect, useState } from 'react';
import {
  Container, Card, Button, Modal, Form, Badge, Spinner, Alert, Row, Col,
} from 'react-bootstrap';
import { announcementApi } from '../../api/announcementApi';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
  });

  const loadAnnouncements = async () => {
    try {
      const data = await announcementApi.getAll();
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', priority: 'normal' });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditing(a.id);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority || 'normal',
    });
    setShowModal(true);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await announcementApi.update(editing, form);
        toast.success('Announcement updated');
      } else {
        await announcementApi.create(form);
        toast.success('Announcement published');
      }
      setShowModal(false);
      setForm({ title: '', content: '', priority: 'normal' });
      setEditing(null);
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Delete announcement "${a.title}"?`)) return;

    try {
      await announcementApi.delete(a.id);
      toast.success('Announcement deleted');
      loadAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

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
        subtitle={`${announcements.length} total — visible to all farmers`}
        action={
          <Button variant="success" size="sm" onClick={openCreate}>
            New Announcement
          </Button>
        }
      />

      {announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-megaphone text-muted" style={{ fontSize: '2.5rem' }}></i>
            <p className="text-muted mt-3 mb-2 small">
              No announcements yet.
            </p>
            <Button variant="success" size="sm" onClick={openCreate}>
              Publish First Announcement
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {announcements.map((a) => (
            <Col lg={6} key={a.id}>
              <Card className="border-0 shadow-sm h-100">
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

                  <p className="mb-3" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {a.content}
                  </p>

                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => openEdit(a)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(a)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {editing ? 'Edit Announcement' : 'New Announcement'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Title *
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Payment Schedule 2026 Season"
                maxLength={200}
                required
                style={{ fontSize: '0.9rem' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Content *
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write the full announcement here..."
                required
                style={{ fontSize: '0.9rem' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">
                Priority
              </Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  id="priority-normal"
                  name="priority"
                  label="Normal"
                  value="normal"
                  checked={form.priority === 'normal'}
                  onChange={handleChange}
                />
                <Form.Check
                  inline
                  type="radio"
                  id="priority-high"
                  name="priority"
                  label="Important (highlighted for farmers)"
                  value="high"
                  checked={form.priority === 'high'}
                  onChange={handleChange}
                />
              </div>
            </Form.Group>

            <Alert variant="light" className="mb-0 small border">
              <i className="bi bi-info-circle me-1"></i>
              This announcement will be visible to <strong>all farmers</strong> on
              their dashboard and announcements page.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowModal(false)}
              size="sm"
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={saving}
              size="sm"
              style={{ fontSize: '0.85rem' }}
            >
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : editing ? (
                'Update'
              ) : (
                'Publish'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Announcements;