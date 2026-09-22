import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Form, Button, Alert, Spinner, InputGroup, Card } from 'react-bootstrap';
import { validateStrongPassword } from '../../utils/passwordValidator';
import PasswordStrengthMeter from '../../components/forms/PasswordStrengthMeter';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  coffeeTrees: '',
  password: '',
  confirmPassword: '',
};

const Register = () => {
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, phone, location, coffeeTrees, password, confirmPassword } = formData;

    if (!name || !email || !phone || !location || !coffeeTrees || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const trees = Number(coffeeTrees);
    if (isNaN(trees) || !Number.isInteger(trees) || trees <= 0) {
      setError('Number of coffee trees must be a positive integer (> 0).');
      return;
    }

    // ✅ Strong password validation
    const passCheck = validateStrongPassword(password);
    if (!passCheck.isValid) {
      setError(passCheck.errors.join(' • '));
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        coffeeTrees: trees,
        password,
      });

      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SUCCESS SCREEN
  // ============================================
  if (successData) {
    const { user, profile } = successData;
    return (
      <div className="py-2">
        <div className="text-center mb-4">
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: '#e6f4ea',
              color: '#1a4d2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            <i className="bi bi-check-lg"></i>
          </div>
          <h4 className="fw-bold mb-1">Registration Successful</h4>
          <p className="text-muted small mb-0">
            Your farmer membership account is ready.
          </p>
        </div>

        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '6px' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted small">Name</span>
              <strong className="text-dark">{user?.name}</strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted small">Email</span>
              <strong className="text-dark">{user?.email}</strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom align-items-center">
              <span className="text-muted small">Member No.</span>
              <span
                className="badge"
                style={{
                  background: '#1a4d2e',
                  fontFamily: 'Courier New, monospace',
                  letterSpacing: '1px',
                  fontSize: '0.85rem',
                  padding: '6px 10px',
                }}
              >
                {profile?.memberNo}
              </span>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted small">Coffee Trees</span>
              <strong className="text-dark">{profile?.coffeeTrees} trees</strong>
            </div>
            <div className="d-flex justify-content-between py-2 align-items-center">
              <span className="text-muted small">Role</span>
              <span
                className="badge"
                style={{
                  background: '#c8952b',
                  letterSpacing: '1px',
                  fontSize: '0.7rem',
                  padding: '6px 10px',
                }}
              >
                FARMER
              </span>
            </div>
          </Card.Body>
        </Card>

        <Alert variant="light" className="border small mb-4">
          <i className="bi bi-info-circle me-1"></i>
          Save your member number — you'll need it for all cooperative transactions.
        </Alert>

        <div className="d-flex gap-2">
          <Button
            variant="success"
            className="w-50 py-2"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
          <Button
            variant="outline-secondary"
            className="w-50 py-2"
            onClick={() => {
              setFormData(initialForm);
              setSuccessData(null);
              setError('');
            }}
          >
            Register Another
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // REGISTRATION FORM
  // ============================================
  return (
    <>
      <h4 className="text-center mb-1 fw-semibold">Farmer Registration</h4>
      <p className="text-muted text-center small mb-4">
        Join Kaliluni Farmers Co-operative Society
      </p>

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      <Form onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Full Name *</Form.Label>
          <Form.Control
            type="text"
            name="name"
            placeholder="e.g., Faith Mumo"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
          />
        </Form.Group>

        {/* Email */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Email Address *</Form.Label>
          <Form.Control
            type="text"
            inputMode="email"
            name="email"
            placeholder="e.g., faith@gmail.com"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </Form.Group>

        {/* Phone */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Phone Number *</Form.Label>
          <Form.Control
            type="tel"
            name="phone"
            placeholder="e.g., 0712345678"
            value={formData.phone}
            onChange={handleChange}
            autoComplete="tel"
          />
        </Form.Group>

        {/* Location */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Location / Village *</Form.Label>
          <Form.Control
            type="text"
            name="location"
            placeholder="e.g., Kathiani"
            value={formData.location}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Coffee Trees */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Number of Coffee Trees *</Form.Label>
          <Form.Control
            type="number"
            name="coffeeTrees"
            min="1"
            step="1"
            placeholder="e.g., 350"
            value={formData.coffeeTrees}
            onChange={handleChange}
          />
          <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
            Approximate total trees on your farm
          </Form.Text>
        </Form.Group>

        {/* Password */}
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Password *</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </Button>
          </InputGroup>
          <PasswordStrengthMeter password={formData.password} />
        </Form.Group>

        {/* Confirm Password */}
        <Form.Group className="mb-4">
          <Form.Label className="small fw-semibold text-secondary">Confirm Password *</Form.Label>
          <InputGroup>
            <Form.Control
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}
            >
              {showConfirmPassword ? 'HIDE' : 'SHOW'}
            </Button>
          </InputGroup>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <small className="text-danger mt-1 d-block" style={{ fontSize: '0.72rem' }}>
              Passwords do not match
            </small>
          )}
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <small className="text-success mt-1 d-block" style={{ fontSize: '0.72rem' }}>
              Passwords match
            </small>
          )}
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mb-3" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Registering farmer...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </Form>

      <div className="text-center">
        <small className="text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-success fw-semibold text-decoration-none">
            Sign In
          </Link>
        </small>
      </div>
    </>
  );
};

export default Register;