// ============================================
// Format currency in KES
// ============================================
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'KES 0';
  return `KES ${Number(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// ============================================
// Format weight in kg
// ============================================
export const formatWeight = (kg) => {
  if (!kg) return '0 kg';
  return `${Number(kg).toLocaleString()} kg`;
};

// ============================================
// Format date (e.g., "24 Sept 2026")
// ============================================
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ============================================
// Format date with time in 24-hour format
// Example: "24 Sept 2026, 16:45"
// ============================================
export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,          // ⭐ 24-hour format (16:45 instead of 04:45 PM)
  });
};

// ============================================
// Format time only in 24-hour format
// Example: "16:45"
// ============================================
export const formatTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// ============================================
// Format relative time ("2 minutes ago", "3 hours ago")
// ============================================
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr === 1) return '1 hour ago';
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ============================================
// Check if user is "online" (logged in within last 5 minutes)
// ============================================
export const isUserOnline = (dateString) => {
  if (!dateString) return false;
  const diffMs = new Date() - new Date(dateString);
  return diffMs < 5 * 60 * 1000; // 5 minutes
};