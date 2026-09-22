import { ProgressBar } from 'react-bootstrap';
import { checkPasswordStrength } from '../../utils/passwordStrength';

const PasswordStrengthMeter = ({ password = '', showRequirements = true }) => {
  if (!password) return null;

  const { percent, variant, label, requirements } = checkPasswordStrength(password);

  return (
    <div className="mt-2 mb-3 password-strength-meter">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <small className="text-muted">Password Strength:</small>
        <small className={`fw-bold text-${variant === 'secondary' ? 'muted' : variant}`}>
          {label}
        </small>
      </div>

      <ProgressBar
        now={percent}
        variant={variant}
        style={{ height: '6px' }}
        className="mb-2"
      />

      {showRequirements && (
        <ul className="list-unstyled mb-0 small text-start">
          {requirements.map((req) => (
            <li
              key={req.id}
              className={`d-flex align-items-center ${
                req.valid ? 'text-success fw-medium' : 'text-muted'
              }`}
              style={{ fontSize: '0.8rem', lineHeight: '1.4' }}
            >
              <span className="me-2">{req.valid ? '✓' : '•'}</span>
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
