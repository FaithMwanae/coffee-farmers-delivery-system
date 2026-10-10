import { useEffect, useState } from 'react';
import {
  Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup, Badge,
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { farmerApi } from '../../api/farmerApi';
import PageHeader from '../../components/common/PageHeader';
import { validateStrongPassword } from '../../utils/passwordValidator';
import PasswordStrengthMeter from '../../components/forms/PasswordStrengthMeter';
import { toast } from 'react-toastify';

const KENYAN_BANKS = [
  'Equity Bank',
  'KCB Bank',
  'Co-operative Bank',
  'NCBA Bank',
  'Absa Bank',
  'Stanbic Bank',
  'Family Bank',
  'DTB Bank',
  'Standard Chartered',
  'Barclays',
  'Other',
];

const FarmerProfile = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Personal info
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    memberNo: '',
  });

  // Payment details
  const [paymentDetails, setPaymentDetails] = useState({
    mpesaNumber: '',
    bankName: '',
    bankAccountNo: '',
    bankBranch: '',
    preferredPaymentMethod: 'M-Pesa',
    paymentDetailsVerified: false,
  });
  const [savingPayment, setSavingPayment] = useState(false);

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
        const [profileData, paymentData] = await Promise.all([
          farmerApi.getProfile(),
          farmerApi.getPaymentDetails().catch(() => null),
        ]);

        setProfile({
          name: profileData.name || user?.name || '',
          email: profileData.email || user?.email || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          memberNo: profileData.memberNo || profileData.member_no || '',
        });

        if (paymentData) {
          setPaymentDetails({
            mpesaNumber: paymentData.mpesaNumber || '',
            bankName: paymentData.bankName || '',
            bankAccountNo: paymentData.bankAccountNo || '',
            bankBranch: paymentData.bankBranch || '',
            preferredPaymentMethod: paymentData.preferredPaymentMethod || 'M-Pesa',
            paymentDetailsVerified: paymentData.paymentDetailsVerified || false,
          });
        }
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

  const handlePaymentChange = (e) =>
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  // ============================================
  // Save profile
  // ============================================
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

  // ============================================
  // Save payment details
  // ============================================
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (
      !paymentDetails.mpesaNumber &&
      !paymentDetails.bankAccountNo &&
      paymentDetails.preferredPaymentMethod === 'Bank Transfer'
    ) {
      toast.error('Please add either an M-Pesa number or bank account');
      return;
    }

    setSavingPayment(true);
    try {
      const result = await farmerApi.updatePaymentDetails({
        mpesaNumber: paymentDetails.mpesaNumber,
        bankName: paymentDetails.bankName,
        bankAccountNo: paymentDetails.bankAccountNo,
        bankBranch: paymentDetails.bankBranch,
        preferredPaymentMethod: paymentDetails.preferredPaymentMethod,
      });

      // Update local state with response
      if (result.paymentDetails) {
        setPaymentDetails({ ...paymentDetails, ...result.paymentDetails });
      }

      toast.success('Payment details saved — will be verified by staff');
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || 'Failed to save payment details'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  // ============================================
  // Change password
  // ============================================
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
        subtitle="Manage your personal information, payment details, and account security"
      />

      <Row className="g-3 mb-3">
        {/* ============================ */}
        {/* PERSONAL INFORMATION */}
        {/* ============================ */}
        <Col lg={7}>
          <Card className="h-100">
            <Card.Header>
              <span>Personal Information</span>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Member Number
                  </Form.Label>
                  <Form.Control
                    value={profile.memberNo}
                    disabled
                    style={{ background: '#f8f9fa' }}
                  />
                  <Form.Text className="text-muted">
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
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold text-secondary">
                    Email Address
                  </Form.Label>
                  <Form.Control
                    value={profile.email}
                    disabled
                    style={{ background: '#f8f9fa' }}
                  />
                  <Form.Text className="text-muted">
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
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  disabled={saving}
                  size="sm"
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
          <Card className="h-100">
            <Card.Header>
              <span>Security & Password</span>
            </Card.Header>
            <Card.Body>
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
                      <Form.Text className="text-danger">
                        Passwords do not match
                      </Form.Text>
                    )}
                  {passwordForm.confirmPassword &&
                    passwordForm.newPassword === passwordForm.confirmPassword && (
                      <Form.Text className="text-success">
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

      {/* ============================ */}
      {/* PAYMENT DETAILS */}
      {/* ============================ */}
      <Row className="g-3">
        <Col lg={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>
                <i className="bi bi-credit-card me-2"></i>
                Payment Details
              </span>
              {paymentDetails.paymentDetailsVerified ? (
                <Badge bg="success" className="fw-normal">
                  <i className="bi bi-patch-check-fill me-1"></i>Verified
                </Badge>
              ) : (
                <Badge bg="warning" text="dark" className="fw-normal">
                  <i className="bi bi-clock me-1"></i>Pending Verification
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              <Alert variant="light" className="small border mb-4">
                <i className="bi bi-info-circle me-1"></i>
                These details are used to send your payments. Make sure they're correct.
                Staff will verify them before processing.
              </Alert>

              <Form onSubmit={handlePaymentSubmit}>
                {/* Preferred method */}
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-secondary">
                    Preferred Payment Method *
                  </Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      id="pref-mpesa"
                      name="preferredPaymentMethod"
                      value="M-Pesa"
                      label="M-Pesa"
                      checked={paymentDetails.preferredPaymentMethod === 'M-Pesa'}
                      onChange={handlePaymentChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id="pref-bank"
                      name="preferredPaymentMethod"
                      value="Bank Transfer"
                      label="Bank Transfer"
                      checked={paymentDetails.preferredPaymentMethod === 'Bank Transfer'}
                      onChange={handlePaymentChange}
                    />
                  </div>
                </Form.Group>

                <Row className="g-3">
                  {/* M-Pesa */}
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <h6 className="fw-semibold mb-3">
                          <i className="bi bi-phone text-success me-2"></i>
                          M-Pesa
                        </h6>
                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">
                            M-Pesa Phone Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="mpesaNumber"
                            value={paymentDetails.mpesaNumber}
                            onChange={handlePaymentChange}
                            placeholder="e.g., 0712345678"
                          />
                          <Form.Text className="text-muted">
                            Payments will be sent to this number.
                          </Form.Text>
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Bank */}
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body>
                        <h6 className="fw-semibold mb-3">
                          <i className="bi bi-bank text-primary me-2"></i>
                          Bank Account
                        </h6>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-semibold text-secondary">
                            Bank Name
                          </Form.Label>
                          <Form.Select
                            name="bankName"
                            value={paymentDetails.bankName}
                            onChange={handlePaymentChange}
                          >
                            <option value="">Select your bank...</option>
                            {KENYAN_BANKS.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="small fw-semibold text-secondary">
                            Account Number
                          </Form.Label>
                          <Form.Control
                            name="bankAccountNo"
                            value={paymentDetails.bankAccountNo}
                            onChange={handlePaymentChange}
                            placeholder="e.g., 0123456789"
                          />
                        </Form.Group>

                        <Form.Group>
                          <Form.Label className="small fw-semibold text-secondary">
                            Branch (optional)
                          </Form.Label>
                          <Form.Control
                            name="bankBranch"
                            value={paymentDetails.bankBranch}
                            onChange={handlePaymentChange}
                            placeholder="e.g., Machakos Branch"
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-4 d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant="success"
                    disabled={savingPayment}
                    size="sm"
                  >
                    {savingPayment ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2 me-1"></i>
                        Save Payment Details
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FarmerProfile;