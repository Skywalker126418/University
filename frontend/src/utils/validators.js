/**
 * Form validation helpers
 */

export const required = (value) => {
  if (value === null || value === undefined || value === '') return 'This field is required';
  if (typeof value === 'string' && value.trim() === '') return 'This field is required';
  return null;
};

export const email = (value) => {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : 'Please enter a valid email address';
};

export const minLength = (len) => (value) => {
  if (!value) return null;
  return value.length >= len ? null : `Must be at least ${len} characters`;
};

export const maxLength = (len) => (value) => {
  if (!value) return null;
  return value.length <= len ? null : `Must be no more than ${len} characters`;
};

export const numeric = (value) => {
  if (!value && value !== 0) return null;
  return !isNaN(value) ? null : 'Must be a number';
};

export const range = (min, max) => (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return 'Must be a number';
  if (num < min || num > max) return `Must be between ${min} and ${max}`;
  return null;
};

export const password = (value) => {
  if (!value) return null;
  if (value.length < 8) return 'Password must be at least 8 characters';
  return null;
};

export const confirmPassword = (original) => (value) => {
  if (!value) return null;
  return value === original ? null : 'Passwords do not match';
};

export const phoneNumber = (value) => {
  if (!value) return null;
  const re = /^\+?[\d\s\-()]{7,15}$/;
  return re.test(value) ? null : 'Please enter a valid phone number';
};

/**
 * Run multiple validators and return first error
 */
export const validate = (value, ...validators) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

/**
 * Validate entire form object
 * @param {Object} values - form values
 * @param {Object} rules - { fieldName: [validator1, validator2] }
 * @returns {Object} errors object
 */
export const validateForm = (values, rules) => {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
};
