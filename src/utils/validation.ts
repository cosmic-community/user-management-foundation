export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/;
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
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return 'Password must contain uppercase, lowercase, number, and special character';
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

export function validateUsername(username: string): string | null {
  if (!username) {
    return null; // Username is optional
  }
  
  if (username.length < 3 || username.length > 30) {
    return 'Username must be between 3 and 30 characters';
  }
  
  return null;
}