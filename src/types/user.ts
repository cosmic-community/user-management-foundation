// Base Cosmic object interface
export interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  bucket: string;
  created_at: string;
  modified_at: string;
  status: string;
  thumbnail?: string;
  published_at?: string;
  modified_by?: string;
  created_by?: string;
  type: string;
}

// User Profile Types
export interface UserProfileMetadata {
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  password_hash?: string; // Added password hash field
  phone?: string;
  avatar?: {
    url: string;
    imgix_url: string;
  };
  bio?: string;
  date_joined: string;
  last_login?: string;
  is_active: boolean;
  email_verified: boolean;
  profile_visibility: {
    key: string;
    value: string;
  };
}

export interface UserProfile extends CosmicObject {
  type: 'user-profiles';
  metadata: UserProfileMetadata;
}

// User Preferences Types
export interface UserPreferencesMetadata {
  user: UserProfile | string; // Can be either full object or ID
  theme_preference: {
    key: string;
    value: string;
  };
  notification_email: boolean;
  notification_push: boolean;
  newsletter_subscription: boolean;
  privacy_level: {
    key: string;
    value: string;
  };
  language: {
    key: string;
    value: string;
  };
  timezone: {
    key: string;
    value: string;
  };
}

export interface UserPreferences extends CosmicObject {
  type: 'user-preferences';
  metadata: UserPreferencesMetadata;
}

// User Session Types
export interface UserSessionMetadata {
  user: UserProfile | string; // Can be either full object or ID
  session_token: string;
  device_info?: string;
  ip_address: string;
  login_timestamp: string;
  expires_at: string;
  is_active: boolean;
}

export interface UserSession extends CosmicObject {
  type: 'user-sessions';
  metadata: UserSessionMetadata;
}

// Authentication Log Types
export interface AuthenticationLogMetadata {
  user?: UserProfile | string; // Can be either full object or ID
  action_type: {
    key: string;
    value: string;
  };
  timestamp: string;
  ip_address: string;
  device_info?: string;
  success: boolean;
  failure_reason?: string;
}

export interface AuthenticationLog extends CosmicObject {
  type: 'authentication-logs';
  metadata: AuthenticationLogMetadata;
}

// Union type for all user-related objects
export type UserObject = UserProfile | UserPreferences | UserSession | AuthenticationLog;

// API Response types
export interface CosmicResponse<T> {
  objects: T[];
  total: number;
}

export interface CosmicSingleResponse<T> {
  object: T;
}