// Validation utilities

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidMobile = (mobile: string): boolean => {
  // Basic mobile validation - accepts digits only, 10-15 digits
  const mobileRegex = /^\d{10,15}$/;
  return mobileRegex.test(mobile.replace(/\s+/g, ''));
};

export const isEmail = (input: string): boolean => {
  return isValidEmail(input);
};

export const isMobile = (input: string): boolean => {
  return isValidMobile(input);
};

export const detectInputType = (input: string): 'email' | 'mobile' | 'invalid' => {
  if (isEmail(input)) {
    return 'email';
  }
  if (isMobile(input)) {
    return 'mobile';
  }
  return 'invalid';
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

