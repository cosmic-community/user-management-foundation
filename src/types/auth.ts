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

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  passwordHash: string;
  phone?: string;
  bio?: string;
  profileVisibility: 'public' | 'private' | 'friends';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  userId?: string;
  errors?: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}