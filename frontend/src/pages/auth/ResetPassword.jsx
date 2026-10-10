import { useState, useEffect } from 'react';
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
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 min

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is required');
      return;
    }
    setResending(true);
    try {
      await client.post('/auth/forgot-password', { email: email.trim() });
      toast.success('New code sent. Check your email.');
      setSecondsLeft(600);
      setCode('');
    } catch (err) {
      toast.error('Failed to resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

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

      toast.success('Password reset successful! Please sign in.');
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
            type="email"
            placeholder="you@kaliluni.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="small fw-semibold text-secondary mb-0">
              Verification Code (6 digits)
            </Form.Label>
            <small
              className={secondsLeft < 60 ? 'text-danger' : 'text-muted'}
              style={{ fontSize: '0.72rem' }}
            >
              <i className="bi bi-clock me-1"></i>
              {secondsLeft > 0 ? `Expires in ${formatTime(secondsLeft)}` : 'Code expired'}
            </small>
          </div>
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
          <button
            type="button"
            className="btn btn-link p-0 text-success fw-semibold text-decoration-none align-baseline"
            style={{ fontSize: 'inherit' }}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </small>
      </div>

      <div className="text-center mt-2">
        <small className="text-muted">
          <Link to="/login" className="text-muted text-decoration-none">
            ← Back to Sign In
          </Link>
        </small>
      </div>
    </>
  );
};

export default ResetPassword;