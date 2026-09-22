/**
 * Password Strength Utility
 * Checks password against strong authentication requirements:
 * 1. Min 8 characters
 * 2. At least 1 uppercase letter
 * 3. At least 1 lowercase letter
 * 4. At least 1 number
 * 5. At least 1 special character
 */

export const checkPasswordStrength = (password = '') => {
  const requirements = [
    {
      id: 'length',
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least one uppercase letter (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least one lowercase letter (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*)',
      valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
    },
  ];

  const passedCount = requirements.filter((r) => r.valid).length;
  const isValid = passedCount === requirements.length;

  let label = 'Weak';
  let variant = 'danger';
  let percent = (passedCount / requirements.length) * 100;

  if (password.length === 0) {
    label = 'None';
    variant = 'secondary';
    percent = 0;
  } else if (passedCount <= 2) {
    label = 'Weak';
    variant = 'danger';
  } else if (passedCount === 3) {
    label = 'Fair';
    variant = 'warning';
  } else if (passedCount === 4) {
    label = 'Good';
    variant = 'info';
  } else if (passedCount === 5) {
    label = 'Strong';
    variant = 'success';
  }

  return {
    score: passedCount,
    maxScore: requirements.length,
    percent,
    label,
    variant,
    requirements,
    isValid,
  };
};
