import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const BecomeFarmer = () => {
  const { user, refreshUser, hasFarmerProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', location: '', coffeeTrees: '' });
  const [saving, setSaving] = useState(false);
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

    setSaving(true);
    try {
      const result = await farmerApi.enableFarmerProfile(form);
      await refreshUser();
      toast.success('Farmer profile enabled!');
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable farmer profile');
    } finally {
      setSaving(false);
    }
  };

  if (hasFarmerProfile) {
    return (
      <Container fluid>
        <PageHeader title="Farmer Profile" />
        <Alert variant="info">
          ✅ You already have a farmer profile (Member No:{' '}
          <strong>{user.profile?.memberNo}</strong>).
          <br />
          <Button
            variant="success"
            className="mt-3"
            onClick={() => navigate('/farmer/dashboard')}
          >
            🌾 Go to Farmer Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <PageHeader
        title="Become a Farmer"
        subtitle="Register yourself as a coffee farmer in addition to your current role"
        />

      <Card className="shadow-sm border-0" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <Alert variant="info" className="small">
            ℹ️ As a <strong>{user?.role}</strong> at Kaliluni, you can also register
            as a coffee farmer. You'll be able to deliver cherries, receive payments,
            and track your own coffee — while keeping your current role.
          </Alert>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
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
              <Form.Label>Location / Village *</Form.Label>
              <Form.Control
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g., Kathiani"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Number of Coffee Trees *</Form.Label>
              <Form.Control
                type="number"
                name="coffeeTrees"
                min="1"
                value={form.coffeeTrees}
                onChange={handleChange}
                placeholder="e.g., 350"
                required
              />
              <Form.Text className="text-muted">
                Approximate total trees on your farm
              </Form.Text>
            </Form.Group>

            <Button type="submit" variant="success" disabled={saving} className="w-100">
              {saving ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Registering...
                </>
              ) : (
                '🌾 Enable Farmer Profile'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BecomeFarmer;