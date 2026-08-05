const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';

  return errors;
}

export interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export function validateRegisterForm(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  if (!name.trim()) errors.name = 'Full name is required';

  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters';

  if (!passwordConfirmation) errors.password_confirmation = 'Please confirm your password';
  else if (passwordConfirmation !== password) errors.password_confirmation = 'Passwords do not match';

  return errors;
}
