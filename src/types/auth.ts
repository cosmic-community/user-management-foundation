export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  bio?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  errors?: FormErrors;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: string;
  ipAddress: string;
}

export interface PasswordResetData {
  email: string;
  token?: string;
  newPassword?: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
}