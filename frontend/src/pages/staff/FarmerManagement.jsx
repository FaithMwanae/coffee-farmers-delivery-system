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
  const [form, setForm] = useState({ name: '', phone: '', location: '' });

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
    if (!form.name || !form.phone || !form.location) {
      toast.error('Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      const newFarmer = await staffApi.registerFarmer(form);
      toast.success(`Farmer registered: ${newFarmer.memberNo}`);
      setShowModal(false);
      setForm({ name: '', phone: '', location: '' });
      loadFarmers();
    } catch (err) {
      toast.error('Failed to register farmer');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'memberNo', label: 'Member No.', render: (v) => <code>{v}</code> },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'location', label: 'Location' },
    { key: 'totalDelivered', label: 'Total Delivered', render: (v) => formatWeight(v) },
    { key: 'joinDate', label: 'Joined', render: (v) => formatDate(v) },
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
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid>
      <PageHeader
        title="Farmer Management"
        subtitle={`${farmers.length} registered farmers`}
        action={
          <Button variant="success" onClick={() => setShowModal(true)}>
            ➕ Register New Farmer
          </Button>
        }
      />

      <Row className="mb-3">
        <Col md={4} sm={6} className="mb-2">
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body>
              <small className="text-uppercase opacity-75">Active Farmers</small>
              <h3 className="fw-bold mb-0">{farmers.filter((f) => f.status === 'Active').length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} className="mb-2">
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body>
              <small className="text-uppercase opacity-75">Total Delivered</small>
              <h3 className="fw-bold mb-0">
                {formatWeight(farmers.reduce((s, f) => s + f.totalDelivered, 0))}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} sm={6} className="mb-2">
          <Card className="border-0 shadow-sm bg-warning text-white">
            <Card.Body>
              <small className="text-uppercase opacity-75">Locations</small>
              <h3 className="fw-bold mb-0">
                {new Set(farmers.map((f) => f.location)).size}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Register New Farmer</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter farmer's full name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number *</Form.Label>
              <Form.Control
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g., 0712345678"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location *</Form.Label>
              <Form.Control
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g., Kathiani"
                required
              />
            </Form.Group>
            <Alert variant="info" className="mb-0 small">
              A unique member number will be generated automatically.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? 'Saving...' : 'Register Farmer'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default FarmerManagement;