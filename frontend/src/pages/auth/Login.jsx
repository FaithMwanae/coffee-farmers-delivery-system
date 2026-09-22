import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="text-center mb-1 fw-semibold">Sign In</h5>
      <p className="text-muted text-center small mb-4">Access your Kaliluni account</p>

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
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="small fw-semibold text-secondary mb-0">Password</Form.Label>
            <Link to="/forgot-password" className="text-success small text-decoration-none">
              Forgot Password?
            </Link>
          </div>
          <InputGroup>
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </Form.Group>

        <Button type="submit" variant="success" className="w-100 mb-3 py-2" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </Form>

      <div className="text-center mt-3">
        <small className="text-muted">
          New farmer?{' '}
          <Link to="/register" className="text-success fw-semibold text-decoration-none">
            Register here
          </Link>
        </small>
      </div>
    </>
  );
};

export default Login;