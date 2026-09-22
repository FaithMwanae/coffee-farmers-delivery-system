import { ProgressBar, Form } from 'react-bootstrap';
import { validateStrongPassword, getPasswordStrength } from '../../utils/passwordValidator';

const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const validation = validateStrongPassword(password);

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <small className="text-muted" style={{ fontSize: '0.72rem' }}>Password strength</small>
        <small className={`text-${strength.color} fw-semibold`} style={{ fontSize: '0.72rem' }}>
          {strength.label}
        </small>
      </div>

      <ProgressBar
        now={strength.percent}
        variant={strength.color}
        style={{ height: '4px', marginBottom: '10px' }}
      />

      {!validation.isValid && (
        <div className="ps-0">
          <small className="text-muted d-block mb-1" style={{ fontSize: '0.7rem' }}>
            Password must contain:
          </small>
          <ul className="mb-0 ps-3" style={{ fontSize: '0.72rem' }}>
            {validation.errors.map((err, i) => (
              <li key={i} className="text-danger">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && (
        <small className="text-success" style={{ fontSize: '0.72rem' }}>
          ✓ Password meets all requirements
        </small>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;