import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const BecomeFarmer = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    phone: '',
    location: '',
    coffeeTrees: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.phone || !form.location || !form.coffeeTrees) {
      setError('Please fill in all fields');
      return;
    }

    const trees = Number(form.coffeeTrees);
    if (isNaN(trees) || trees <= 0) {
      setError('Number of coffee trees must be a positive number');
      return;
    }

    setSubmitting(true);
    try {
      await farmerApi.enableFarmerProfile({
        phone: form.phone.trim(),
        location: form.location.trim(),
        coffeeTrees: trees,
      });

      await refreshUser();
      toast.success('You are now registered as a farmer!');
      navigate('/farmer/dashboard');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to enable farmer profile'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="Become a Farmer"
        subtitle="Register yourself as a coffee farmer in addition to your current role"
      />

      <div className="d-flex justify-content-center">
        <Card className="border-0 shadow-sm" style={{ maxWidth: '600px', width: '100%' }}>
          <Card.Body className="p-4 p-md-5">
            
            {/* ⭐ REMOVED the info icon here */}
            <Alert variant="info" className="small mb-4" style={{ background: '#e8f0fe', borderColor: '#c6dafc', color: '#1a73e8' }}>
              As a <strong>{user?.role}</strong> at Kaliluni, you can also register as a coffee farmer. You'll be able to deliver cherries, receive payments, and track your own coffee — while keeping your current role.
            </Alert>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Full Name
                </Form.Label>
                <Form.Control
                  type="text"
                  value={user?.name || ''}
                  disabled
                  style={{ background: '#f8f9fa' }}
                />
              </Form.Group>

              {/* ⭐ NEW: Read-only Email Address field */}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Email Address
                </Form.Label>
                <Form.Control
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f8f9fa' }}
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Your login email will be linked to this farmer profile.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Phone Number *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder="e.g., 0712345678"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">
                  Location / Village *
                </Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  placeholder="e.g., Kathiani"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-secondary">
                  Number of Coffee Trees *
                </Form.Label>
                <Form.Control
                  type="number"
                  name="coffeeTrees"
                  min="1"
                  placeholder="e.g., 350"
                  value={form.coffeeTrees}
                  onChange={handleChange}
                  required
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Approximate total trees on your farm
                </Form.Text>
              </Form.Group>

              <Button
                type="submit"
                variant="success"
                className="w-100 py-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Enabling Profile...
                  </>
                ) : (
                  <>
                    <i className="bi bi-flower1 me-2"></i>
                    Enable Farmer Profile
                  </>
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default BecomeFarmer;