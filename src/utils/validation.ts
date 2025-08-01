import { SignUpFormData, ValidationError, FormErrors } from '@/src/types/auth';

export function validateEmail(email: string): string | null {
  const emailRegex = /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/;
  
  if (!email) {
    return 'Email is required';
  }
  
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username) {
    return 'Username is required';
  }
  
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  
  if (username.length > 30) {
    return 'Username must be less than 30 characters';
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) {
    return null; // Phone is optional
  }
  
  const phoneRegex = /^[\+]?[1-9]?\d{1,14}$/;
  
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  
  return null;
}

export function validateSignUpForm(formData: SignUpFormData): FormErrors {
  const errors: FormErrors = {};
  
  // Validate first name
  const firstNameError = validateRequired(formData.firstName, 'First name');
  if (firstNameError) errors.firstName = firstNameError;
  
  // Validate last name
  const lastNameError = validateRequired(formData.lastName, 'Last name');
  if (lastNameError) errors.lastName = lastNameError;
  
  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  // Validate username
  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;
  
  // Validate password
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  // Validate password confirmation
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Validate phone (optional)
  const phoneError = validatePhone(formData.phone || '');
  if (phoneError) errors.phone = phoneError;
  
  // Validate bio length
  if (formData.bio && formData.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
  }
  
  return errors;
}