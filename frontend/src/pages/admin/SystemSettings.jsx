import { useEffect, useState } from 'react';
import {
  Container, Card, Form, Button, Spinner, Alert, Row, Col, Badge, Modal,
} from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-toastify';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);

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

  // Confirmation before turning maintenance ON
  const handleMaintenanceToggle = (e) => {
    const turningOn = e.target.checked;
    if (turningOn && !settings.maintenanceMode) {
      // Intercept — show confirmation modal
      setShowMaintenanceConfirm(true);
    } else {
      // Turning off — allow directly
      setSettings({ ...settings, maintenanceMode: false });
    }
  };

  const confirmMaintenanceOn = () => {
    setSettings({ ...settings, maintenanceMode: true });
    setShowMaintenanceConfirm(false);
    toast.warning('Maintenance mode enabled. All non-admin users will be blocked.');
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

  const isMaintenanceActive = settings.maintenanceMode;

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
                  <Form.Label className="small fw-semibold text-secondary">Rate per Kg (KES)</Form.Label>
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

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Advance Rate per Kg (KES)</Form.Label>
                  <Form.Control
                    type="number"
                    name="advanceRatePerKg"
                    value={settings.advanceRatePerKg ?? 30}
                    onChange={handleChange}
                    min="0"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Maximum advance a farmer can receive per kg delivered
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Cooperative Fee (KES/year)</Form.Label>
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
                  <Form.Label className="small fw-semibold text-secondary">Loan Interest Rate (%)</Form.Label>
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
                  <Form.Label className="small fw-semibold text-secondary">Current Season</Form.Label>
                  <Form.Control
                    name="currentSeason"
                    value={settings.currentSeason}
                    onChange={handleChange}
                    placeholder="e.g., 2026"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">Season Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="seasonStart"
                    value={settings.seasonStart}
                    onChange={handleChange}
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label className="small fw-semibold text-secondary">Season End Date</Form.Label>
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

          {/* System Maintenance — IMPROVED */}
          <Col lg={6}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Header
                className="bg-white border-bottom d-flex justify-content-between align-items-center"
                style={{ padding: '14px 20px' }}
              >
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                  System Maintenance
                </span>
                <Badge
                  bg={isMaintenanceActive ? 'danger' : 'success'}
                  className="fw-normal"
                  style={{ fontSize: '0.65rem', letterSpacing: '0.5px', padding: '4px 8px' }}
                >
                  {isMaintenanceActive ? 'MAINTENANCE ACTIVE' : 'SYSTEM ONLINE'}
                </Badge>
              </Card.Header>
              <Card.Body style={{ padding: '20px' }}>
                <Form.Check
                  type="switch"
                  id="maintenance-mode"
                  name="maintenanceMode"
                  label={
                    <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>
                      Enable Maintenance Mode
                    </span>
                  }
                  checked={settings.maintenanceMode}
                  onChange={handleMaintenanceToggle}
                  className="mb-3"
                />

                {isMaintenanceActive && (
                  <Alert variant="warning" className="py-2 px-3 small mb-3">
                    <strong>Active:</strong> Only administrators can access the system.
                    All other users see the maintenance page.
                  </Alert>
                )}

                {/* Maintenance Message */}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Maintenance Message
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="maintenanceMessage"
                    value={settings.maintenanceMessage || ''}
                    onChange={handleChange}
                    placeholder="Message displayed to users during maintenance"
                    maxLength={300}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {300 - (settings.maintenanceMessage?.length || 0)} characters remaining
                  </Form.Text>
                </Form.Group>

                {/* Scheduled Maintenance */}
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">
                        Scheduled Start
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="maintenanceStart"
                        value={settings.maintenanceStart || ''}
                        onChange={handleChange}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-secondary">
                        Scheduled End
                      </Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="maintenanceEnd"
                        value={settings.maintenanceEnd || ''}
                        onChange={handleChange}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Optional — schedule when maintenance should begin and end.
                </Form.Text>
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

      {/* Confirmation Modal */}
      <Modal
        show={showMaintenanceConfirm}
        onHide={() => setShowMaintenanceConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Enable Maintenance Mode?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3 small">
            <strong>Warning:</strong> This will block all non-administrator users
            from accessing the system.
          </Alert>
          <p className="small mb-0">
            Users will see the following message:
          </p>
          <div
            className="border rounded p-3 mt-2 small"
            style={{ background: '#f8f9fa', fontStyle: 'italic' }}
          >
            "{settings.maintenanceMessage}"
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowMaintenanceConfirm(false)}
          >
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={confirmMaintenanceOn}>
            Yes, Enable Maintenance
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SystemSettings;