import { useEffect, useState } from 'react';
import { Container, Card, Button, Modal, Form, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { staffApi } from '../../api/staffApi';
import { formatDate, formatWeight } from '../../utils/formatters';
import DataTable from '../../components/common/DataTable';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const FarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ⭐ Added email and password to match the backend requirements
  const [form, setForm] = useState({ 
    name: '', 
    email: '',
    phone: '', 
    location: '',
    password: ''
  });

  const loadFarmers = async () => {
    try {
      const data = await staffApi.getAllFarmers();
      setFarmers(data);
    } catch (err) {
      setError('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.location || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Validate phone number format
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!/^(2547|2541)\d{8}$/.test(cleanPhone)) {
      toast.error('Phone number must be 12 digits starting with 2547 or 2541');
      return;
    }

    setSaving(true);
    try {
      const newFarmer = await staffApi.registerFarmer(form);
      toast.success(`Farmer registered: ${newFarmer.memberNo}`);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', location: '', password: '' });
      loadFarmers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register farmer');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'name', label: 'Name', render: (v) => <span className="fw-semibold">{v}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'totalDelivered', label: 'Total Delivered', render: (v) => <span className="num">{formatWeight(v)}</span> },
    { key: 'joinDate', label: 'Joined', render: (v) => <span className="small text-muted">{formatDate(v)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <Badge bg={v === 'Active' ? 'success' : 'secondary'}>{v}</Badge>,
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-3 small">Loading farmers...</p>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Farmer Management"
        subtitle={`${farmers.length} registered farmers`}
        action={
          <Button variant="success" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus me-1"></i> Register New Farmer
          </Button>
        }
      />

      {/* ⭐ Clean Bootstrap stat cards with accent borders */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-success h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3 text-success">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Active Farmers</div>
                <h3 className="mb-0 fw-bold">{farmers.filter((f) => f.status === 'Active').length}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-info h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded-circle me-3 text-info">
                <i className="bi bi-box-seam fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Delivered</div>
                <h3 className="mb-0 fw-bold">
                  {formatWeight(farmers.reduce((s, f) => s + (Number(f.totalDelivered) || 0), 0))}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-sm border-start border-4 border-warning h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle me-3 text-warning">
                <i className="bi bi-geo-alt fs-4"></i>
              </div>
              <div>
                <div className="text-muted small fw-bold text-uppercase mb-1">Locations</div>
                <h3 className="mb-0 fw-bold">
                  {new Set(farmers.map((f) => f.location).filter(Boolean)).size}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <DataTable
            columns={columns}
            data={farmers}
            searchPlaceholder="Search by name, member no, or phone..."
            searchKeys={['name', 'memberNo', 'phone', 'location']}
            itemsPerPage={10}
          />
        </Card.Body>
      </Card>

      {/* Register Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Register New Farmer</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Full Name *</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter farmer's full name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Email Address *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="farmer@example.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Phone Number *</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g., 254712345678"
                type="tel"
                pattern="^(2547|2541)\d{8}$"
                title="Must be exactly 12 digits starting with 2547 or 2541"
                required
              />
              <Form.Text className="text-muted">
                Must be 12 digits starting with 2547 or 2541.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Location / Village *</Form.Label>
              <Form.Control
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g., Kathiani"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-secondary">Initial Password *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
              <Form.Text className="text-muted">
                The farmer will use this to log in. Share it with them securely.
              </Form.Text>
            </Form.Group>
            <Alert variant="info" className="mb-0 small">
              <i className="bi bi-info-circle me-1"></i>
              A unique member number will be generated automatically.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm" disabled={saving}>
              {saving ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Saving...</> : 'Register Farmer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FarmerManagement;