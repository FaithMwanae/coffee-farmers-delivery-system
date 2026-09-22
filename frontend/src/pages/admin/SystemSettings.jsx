import { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="System Settings"
        subtitle="Configure system parameters and cooperative rules"
      />

      <Form onSubmit={handleSubmit}>
        <Row className="g-3">
          {/* Pricing & Financial */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Pricing & Financial</span>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Rate per Kg (KES)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="ratePerKg"
                    value={settings.ratePerKg}
                    onChange={handleChange}
                    min="1"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Payment per kilogram of coffee cherry delivered
                  </Form.Text>
                </Form.Group>

                {/* ⭐ NEW — Advance Rate per Kg */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Advance Rate per Kg (KES)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="advanceRatePerKg"
                    value={settings.advanceRatePerKg ?? 30}
                    onChange={handleChange}
                    min="0"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Maximum advance a farmer can receive per kg delivered (e.g., 30)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Cooperative Fee (KES/year)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="cooperativeFee"
                    value={settings.cooperativeFee}
                    onChange={handleChange}
                    min="0"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Annual membership fee deducted from payments
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label className="small fw-semibold text-secondary">
                    Loan Interest Rate (%)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="loanInterestRate"
                    value={settings.loanInterestRate}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Applied to farmer advances and loans
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Season Configuration */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Season Configuration</span>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Current Season
                  </Form.Label>
                  <Form.Control
                    name="currentSeason"
                    value={settings.currentSeason}
                    onChange={handleChange}
                    placeholder="e.g., 2026"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Season Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="seasonStart"
                    value={settings.seasonStart}
                    onChange={handleChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label className="small fw-semibold text-secondary">
                    Season End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="seasonEnd"
                    value={settings.seasonEnd}
                    onChange={handleChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Notifications */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>Notifications</span>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Check
                  type="switch"
                  id="sms-notifications"
                  name="smsNotifications"
                  label="Enable SMS Notifications"
                  checked={settings.smsNotifications}
                  onChange={handleChange}
                  className="mb-1"
                />
                <Form.Text className="text-muted d-block mb-3" style={{ fontSize: '0.72rem' }}>
                  Send SMS alerts to farmers about payments and announcements
                </Form.Text>

                <Form.Check
                  type="switch"
                  id="email-notifications"
                  name="emailNotifications"
                  label="Enable Email Notifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  className="mb-1"
                />
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Send email notifications for system events
                </Form.Text>
              </Card.Body>
            </Card>
          </Col>

          {/* System Maintenance */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>System Maintenance</span>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Check
                  type="switch"
                  id="maintenance-mode"
                  name="maintenanceMode"
                  label="Enable Maintenance Mode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="mb-3"
                />
                <Alert variant="warning" className="mb-0 small">
                  When enabled, only administrators can access the system. All other users will see a maintenance page.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button
            variant="outline-secondary"
            type="button"
            onClick={() => window.location.reload()}
            size="sm"
            style={{ fontSize: '0.85rem', padding: '8px 20px' }}
          >
            Reset
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={saving}
            size="sm"
            style={{ fontSize: '0.85rem', padding: '8px 20px' }}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default SystemSettings;