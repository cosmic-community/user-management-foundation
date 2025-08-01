import bcrypt from 'bcryptjs';
import { cosmicWrite, getUserProfileByEmail, getUserProfileByUsername } from './cosmic';
import { CreateUserData, AuthResponse } from '@/src/types/auth';

export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export function generateSlug(firstName: string, lastName: string, username: string): string {
  // Try username first, fallback to name-based slug
  const baseSlug = username || `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
  return baseSlug.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log('Checking if email exists:', email);
    const existingUser = await getUserProfileByEmail(email);
    const exists = existingUser !== null;
    console.log('Email exists check result:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    console.log('Checking if username exists:', username);
    const existingUser = await getUserProfileByUsername(username);
    const exists = existingUser !== null;
    console.log('Username exists check result:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking username existence:', error);
    return false;
  }
}

export async function createUserProfile(userData: CreateUserData): Promise<AuthResponse> {
  try {
    console.log('Starting user profile creation for:', userData.email);

    // Check if email already exists
    const emailExists = await checkEmailExists(userData.email);
    if (emailExists) {
      console.log('Email already exists:', userData.email);
      return {
        success: false,
        message: 'An account with this email already exists',
        errors: { email: 'Email already registered' }
      };
    }

    // Check if username already exists
    const usernameExists = await checkUsernameExists(userData.username);
    if (usernameExists) {
      console.log('Username already exists:', userData.username);
      return {
        success: false,
        message: 'This username is already taken',
        errors: { username: 'Username already taken' }
      };
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(userData.passwordHash);
    console.log('Password hashed successfully');

    // Generate a unique slug
    let slug = generateSlug(userData.firstName, userData.lastName, userData.username);
    let counter = 1;

    // Keep trying until we find a unique slug
    console.log('Generating unique slug, starting with:', slug);
    while (counter < 100) { // Prevent infinite loops
      try {
        const response = await cosmicWrite.objects.findOne({
          type: 'user-profiles',
          slug: slug
        });
        
        // If we found a user with this slug, try a different one
        if (response?.object) {
          slug = `${generateSlug(userData.firstName, userData.lastName, userData.username)}-${counter}`;
          counter++;
          console.log('Slug exists, trying:', slug);
        } else {
          break;
        }
      } catch (error: any) {
        // If we get a 404, the slug is available
        if (error?.status === 404) {
          console.log('Slug is available:', slug);
          break;
        }
        console.error('Error checking slug uniqueness:', error);
        throw error;
      }
    }

    console.log('Creating user with slug:', slug);

    // Create the user profile
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const userPayload = {
      title: `${userData.firstName} ${userData.lastName}`,
      slug: slug,
      type: 'user-profiles',
      status: 'published',
      metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        username: userData.username,
        password_hash: hashedPassword,
        phone: userData.phone || '',
        bio: userData.bio || '',
        date_joined: currentDate,
        is_active: true,
        email_verified: false,
        profile_visibility: {
          key: userData.profileVisibility,
          value: userData.profileVisibility === 'public' ? 'Public' : 
                 userData.profileVisibility === 'private' ? 'Private' : 'Friends Only'
        }
      }
    };

    console.log('Creating user with payload:', {
      ...userPayload,
      metadata: { ...userPayload.metadata, password_hash: '[HIDDEN]' }
    });

    const newUser = await cosmicWrite.objects.insertOne(userPayload);

    console.log('User created successfully with ID:', newUser.object.id);

    // Create default user preferences
    await createDefaultUserPreferences(newUser.object.id);

    return {
      success: true,
      message: 'Account created successfully! Welcome aboard!',
      userId: newUser.object.id
    };

  } catch (error: any) {
    console.error('Error creating user profile:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      stack: error?.stack
    });
    
    // Provide more specific error messages based on the error
    let errorMessage = 'Failed to create account. Please try again.';
    
    if (error?.message?.includes('validation')) {
      errorMessage = 'Please check your information and try again.';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error?.message?.includes('bucket') || error?.message?.includes('key')) {
      errorMessage = 'Configuration error. Please contact support.';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

async function createDefaultUserPreferences(userId: string): Promise<void> {
  try {
    console.log('Creating default preferences for user:', userId);
    
    const preferencesPayload = {
      title: `User Preferences - ${userId}`,
      slug: `preferences-${userId}`,
      type: 'user-preferences',
      status: 'published',
      metadata: {
        user: userId,
        theme_preference: {
          key: 'auto',
          value: 'Auto (System)'
        },
        notification_email: true,
        notification_push: false,
        newsletter_subscription: false,
        privacy_level: {
          key: 'moderate',
          value: 'Moderate'
        },
        language: {
          key: 'en',
          value: 'English'
        },
        timezone: {
          key: 'UTC',
          value: 'UTC'
        }
      }
    };

    await cosmicWrite.objects.insertOne(preferencesPayload);
    
    console.log('Default preferences created successfully');
  } catch (error) {
    console.error('Error creating default user preferences:', error);
    // Don't throw here - user creation should still succeed even if preferences fail
  }
}

export async function createAuthenticationLog(data: {
  userId?: string;
  actionType: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'email_verification' | 'account_locked' | 'session_expired';
  ipAddress: string;
  deviceInfo?: string;
  success: boolean;
  failureReason?: string;
}): Promise<void> {
  try {
    const actionTypeMap = {
      login_success: 'Login Success',
      login_failed: 'Login Failed', 
      logout: 'Logout',
      password_reset: 'Password Reset',
      email_verification: 'Email Verification',
      account_locked: 'Account Locked',
      session_expired: 'Session Expired'
    };

    const logData: any = {
      title: `${actionTypeMap[data.actionType]} - ${new Date().toISOString()}`,
      type: 'authentication-logs',
      status: 'published',
      metadata: {
        action_type: {
          key: data.actionType,
          value: actionTypeMap[data.actionType]
        },
        timestamp: new Date().toISOString().split('T')[0],
        ip_address: data.ipAddress,
        success: data.success
      }
    };

    if (data.userId) {
      logData.metadata.user = data.userId;
    }

    if (data.deviceInfo) {
      logData.metadata.device_info = data.deviceInfo;
    }

    if (data.failureReason) {
      logData.metadata.failure_reason = data.failureReason;
    }

    await cosmicWrite.objects.insertOne(logData);
    console.log('Authentication log created successfully');
  } catch (error) {
    console.error('Error creating authentication log:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}