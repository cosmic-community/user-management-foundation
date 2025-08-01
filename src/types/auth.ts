// Form data types
export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  bio?: string;
  profileVisibility: 'public' | 'private' | 'friends';
  newsletterSubscription: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

// API response types
export interface AuthResponse {
  success: boolean;
  message: string;
  errors?: FormErrors;
  data?: any;
}

export interface SignUpResponse extends AuthResponse {
  userId?: string;
}

export interface LoginResponse extends AuthResponse {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  session?: {
    token: string;
    expiresAt: string;
  };
}

// User creation types (for backend)
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  passwordHash: string;
  phone?: string;
  bio?: string;
  profileVisibility: string;
}

export interface CreateUserResult {
  success: boolean;
  message: string;
  userId?: string;
  errors?: Record<string, string>;
}

// Authentication log types
export interface AuthLogData {
  userId?: string;
  actionType: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'email_verification' | 'account_locked' | 'session_expired';
  ipAddress: string;
  deviceInfo?: string;
  success: boolean;
  failureReason?: string;
}

// Session types
export interface UserSession {
  id: string;
  token: string;
  userId: string;
  deviceInfo?: string;
  ipAddress: string;
  loginTimestamp: string;
  expiresAt: string;
  isActive: boolean;
}

// Password validation types
export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar?: boolean;
}

// Profile visibility options
export type ProfileVisibility = 'public' | 'private' | 'friends';

// Theme preferences
export type ThemePreference = 'light' | 'dark' | 'auto';

// Language options
export type LanguageOption = 'en' | 'es' | 'fr' | 'de' | 'zh';

// Privacy levels
export type PrivacyLevel = 'open' | 'moderate' | 'strict';