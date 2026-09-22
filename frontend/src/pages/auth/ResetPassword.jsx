import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import client from '../../api/client';
import { toast } from 'react-toastify';
import { validateStrongPassword } from '../../utils/passwordValidator';
import PasswordStrengthMeter from '../../components/forms/PasswordStrengthMeter';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState(location.state?.devCode || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !code || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    const passCheck = validateStrongPassword(password);
    if (!passCheck.isValid) {
      setError(passCheck.errors.join(' • '));
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/reset-password', {
        email: email.trim(),
        code,
        password,
        confirmPassword,
      });

      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to reset password. Check your code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="text-center mb-1 fw-semibold">Reset Password</h5>
      <p className="text-muted text-center small mb-4">
        Enter the 6-digit code sent to your email and choose a new password
      </p>

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Email</Form.Label>
          <Form.Control
            type="text"
            inputMode="email"
            placeholder="you@kaliluni.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">
            Verification Code (6 digits)
          </Form.Label>
          <Form.Control
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            style={{
              fontSize: '1.4rem',
              letterSpacing: '8px',
              textAlign: 'center',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">New Password</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{ fontSize: '0.75rem' }}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </Button>
          </InputGroup>
          <PasswordStrengthMeter password={password} />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Confirm Password</Form.Label>
          <Form.Control
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && password && confirmPassword !== password && (
            <Form.Text className="text-danger" style={{ fontSize: '0.72rem' }}>
              Passwords do not match
            </Form.Text>
          )}
          {confirmPassword && password && confirmPassword === password && (
            <Form.Text className="text-success" style={{ fontSize: '0.72rem' }}>
              ✓ Passwords match
            </Form.Text>
          )}
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mb-3" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </Form>

      <div className="text-center mt-2">
        <small className="text-muted">
          Didn't get a code?{' '}
          <Link to="/forgot-password" className="text-success fw-semibold text-decoration-none">
            Resend
          </Link>
        </small>
      </div>
    </>
  );
};

export default ResetPassword;