/**
 * Date formatters
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

/**
 * Grade formatters
 */
export const getGrade = (mark) => {
  if (mark === null || mark === undefined) return '—';
  if (mark >= 80) return 'A';
  if (mark >= 70) return 'B';
  if (mark >= 60) return 'C';
  if (mark >= 50) return 'D';
  return 'F';
};

export const getGradePoints = (mark) => {
  if (mark === null || mark === undefined) return 0;
  if (mark >= 80) return 4.0;
  if (mark >= 70) return 3.0;
  if (mark >= 60) return 2.0;
  if (mark >= 50) return 1.0;
  return 0.0;
};

export const calculateGrade = (mark) => {
  if (mark === null || mark === undefined || isNaN(mark)) {
    return { grade: '—', points: 0 };
  }
  const m = parseFloat(mark);
  if (m >= 90) return { grade: 'A+', points: 4.0 };
  if (m >= 80) return { grade: 'A', points: 4.0 };
  if (m >= 75) return { grade: 'B+', points: 3.5 };
  if (m >= 70) return { grade: 'B', points: 3.0 };
  if (m >= 65) return { grade: 'C+', points: 2.5 };
  if (m >= 60) return { grade: 'C', points: 2.0 };
  if (m >= 50) return { grade: 'D', points: 1.0 };
  return { grade: 'F', points: 0.0 };
};

export const getGradeStatus = (mark) => {
  if (mark === null || mark === undefined) return 'Pending';
  return mark >= 50 ? 'Passed' : 'Failed';
};

export const formatGPA = (gpa) => {
  if (gpa === null || gpa === undefined) return '0.00';
  return Number(gpa).toFixed(2);
};

/**
 * Name/Text formatters
 */
export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'Unknown';
  return [firstName, lastName].filter(Boolean).join(' ');
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, len = 50) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

/**
 * Number formatters
 */
export const formatCredits = (credits) => {
  if (credits === null || credits === undefined) return '0';
  return `${credits} ${credits === 1 ? 'credit' : 'credits'}`;
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${Math.round(value)}%`;
};

/**
 * Role formatters
 */
export const formatRole = (role) => {
  const map = {
    admin: 'Administrator',
    student: 'Student',
    lecturer: 'Lecturer',
    registrar: 'Registrar',
  };
  return map[role] || capitalize(role);
};

export const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};
