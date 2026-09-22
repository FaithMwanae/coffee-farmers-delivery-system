import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import client from '../../api/client';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.post('/auth/forgot-password', {
        email: email.trim(),
      });

      toast.success('Verification code sent to your email');

      // Navigate to reset page with email in state
      navigate('/reset-password', {
        state: {
          email: email.trim(),
          devCode: data.devCode, // for dev testing
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="text-center mb-1 fw-semibold">Forgot Password</h5>
      <p className="text-muted text-center small mb-4">
        Enter your email to receive a 6-digit verification code
      </p>

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
          <Form.Control
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="you@kaliluni.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
            We'll send a code to this email if it's registered.
          </Form.Text>
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mb-3" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Sending code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      </Form>

      <div className="text-center mt-2">
        <small className="text-muted">
          Remember your password?{' '}
          <Link to="/login" className="text-success fw-semibold text-decoration-none">
            Sign In
          </Link>
        </small>
      </div>
    </>
  );
};

export default ForgotPassword;