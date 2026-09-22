import { useEffect, useState } from 'react';
import {
  Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup,
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import PageHeader from '../../components/common/PageHeader';
import { validateStrongPassword } from '../../utils/passwordValidator';
import PasswordStrengthMeter from '../../components/forms/PasswordStrengthMeter';
import { toast } from 'react-toastify';

const FarmerProfile = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Personal info form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    memberNo: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await farmerApi.getProfile();
        setProfile({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          location: data.location || '',
          memberNo: data.memberNo || data.member_no || '',
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleProfileChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // ------- Save profile -------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await farmerApi.updateProfile({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ------- Change password -------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    const passCheck = validateStrongPassword(passwordForm.newPassword);
    if (!passCheck.isValid) {
      setPasswordError(passCheck.errors.join(' • '));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await farmerApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error(err);
      setPasswordError(
        err.response?.data?.message || 'Failed to update password'
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3 small">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Container fluid className="px-0">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account security"
      />

      <Row className="g-3">
        {/* ============================ */}
        {/* PERSONAL INFORMATION */}
        {/* ============================ */}
        <Col lg={7}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Personal Information
              </span>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Member Number
                  </Form.Label>
                  <Form.Control
                    value={profile.memberNo}
                    disabled
                    style={{ fontSize: '0.9rem', background: '#f8f9fa' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Assigned by the cooperative. Cannot be changed.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Full Name
                  </Form.Label>
                  <Form.Control
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Your full name"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Email Address
                  </Form.Label>
                  <Form.Control
                    value={profile.email}
                    disabled
                    style={{ fontSize: '0.9rem', background: '#f8f9fa' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Contact administration to update your email.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Phone Number
                  </Form.Label>
                  <Form.Control
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g., 0712345678"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-secondary">
                    Location / Village
                  </Form.Label>
                  <Form.Control
                    name="location"
                    value={profile.location}
                    onChange={handleProfileChange}
                    placeholder="e.g., Kathiani"
                    style={{ fontSize: '0.9rem' }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
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
                    'Save Changes'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* ============================ */}
        {/* SECURITY & PASSWORD */}
        {/* ============================ */}
        <Col lg={5}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom" style={{ padding: '14px 20px' }}>
              <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                Security & Password
              </span>
            </Card.Header>
            <Card.Body style={{ padding: '20px' }}>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Current Password
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showCurrent ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      style={{ fontSize: '0.9rem' }}
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      tabIndex={-1}
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      {showCurrent ? 'HIDE' : 'SHOW'}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    New Password
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showNew ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter strong new password"
                      autoComplete="new-password"
                      style={{ fontSize: '0.9rem' }}
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      tabIndex={-1}
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      {showNew ? 'HIDE' : 'SHOW'}
                    </Button>
                  </InputGroup>
                  <PasswordStrengthMeter password={passwordForm.newPassword} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Confirm New Password
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      style={{ fontSize: '0.9rem' }}
                    />
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
                    >
                      {showConfirm ? 'HIDE' : 'SHOW'}
                    </Button>
                  </InputGroup>
                  {passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <Form.Text className="text-danger" style={{ fontSize: '0.72rem' }}>
                        Passwords do not match
                      </Form.Text>
                    )}
                  {passwordForm.confirmPassword &&
                    passwordForm.newPassword === passwordForm.confirmPassword && (
                      <Form.Text className="text-success" style={{ fontSize: '0.72rem' }}>
                        Passwords match
                      </Form.Text>
                    )}
                </Form.Group>

                {passwordError && (
                  <Alert variant="danger" className="py-2 small">
                    {passwordError}
                  </Alert>
                )}

                <Alert variant="light" className="small border">
                  <strong>Password requirements:</strong>
                  <ul className="mb-0 ps-3 mt-1" style={{ fontSize: '0.72rem' }}>
                    <li>At least 8 characters</li>
                    <li>One uppercase and one lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (!@#$%^&*)</li>
                  </ul>
                </Alert>

                <Button
                  type="submit"
                  variant="success"
                  disabled={savingPassword}
                  size="sm"
                  style={{ fontSize: '0.85rem', padding: '8px 20px' }}
                >
                  {savingPassword ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FarmerProfile;