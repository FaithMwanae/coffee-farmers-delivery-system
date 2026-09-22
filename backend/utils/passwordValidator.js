// ============================================
// STRONG PASSWORD VALIDATION
// ============================================
export const validateStrongPassword = (password) => {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Password is required.'], message: 'Password is required.' };
  }

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number (0-9)');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('At least one special character (!@#$%^&* etc.)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length === 0 ? 'Password is strong.' : 'Password does not meet requirements.',
  };
};

// ============================================
// PASSWORD STRENGTH SCORE (0-4)
// ============================================
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Empty', color: 'secondary' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  // Normalize to 0-4
  if (score <= 2) return { score: 1, label: 'Weak', color: 'danger' };
  if (score === 3) return { score: 2, label: 'Fair', color: 'warning' };
  if (score === 4) return { score: 3, label: 'Good', color: 'info' };
  return { score: 4, label: 'Strong', color: 'success' };
};