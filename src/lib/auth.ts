import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cosmicWrite, getUserProfileByEmail, getUserProfileBySlug } from './cosmic';
import { CreateUserData, AuthResponse } from '@/src/types/auth';
import { UserProfile } from '@/src/types/user';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
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
    const existingUser = await getUserProfileByEmail(email);
    return existingUser !== null;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  try {
    // First check if the username exists as a slug
    const existingUser = await getUserProfileBySlug(username.toLowerCase());
    if (existingUser) return true;
    
    // Also check if any user has this username in their metadata
    const users = await cosmicWrite.objects
      .find({ 
        type: 'user-profiles',
        'metadata.username': username
      })
      .props(['id']);
    
    return users.objects.length > 0;
  } catch (error) {
    console.error('Error checking username existence:', error);
    return false;
  }
}

export async function createUserProfile(userData: CreateUserData): Promise<AuthResponse> {
  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(userData.email);
    if (emailExists) {
      return {
        success: false,
        message: 'An account with this email already exists',
        errors: { email: 'Email already registered' }
      };
    }

    // Check if username already exists
    const usernameExists = await checkUsernameExists(userData.username);
    if (usernameExists) {
      return {
        success: false,
        message: 'This username is already taken',
        errors: { username: 'Username already taken' }
      };
    }

    // Generate a unique slug
    let slug = generateSlug(userData.firstName, userData.lastName, userData.username);
    let slugExists = await getUserProfileBySlug(slug);
    let counter = 1;

    while (slugExists) {
      const newSlug = `${slug}-${counter}`;
      slugExists = await getUserProfileBySlug(newSlug);
      if (!slugExists) {
        slug = newSlug;
        break;
      }
      counter++;
    }

    // Create the user profile
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const newUser = await cosmicWrite.objects.insertOne({
      title: `${userData.firstName} ${userData.lastName}`,
      slug: slug,
      type: 'user-profiles',
      status: 'published',
      metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        username: userData.username,
        phone: userData.phone || '',
        bio: userData.bio || '',
        date_joined: currentDate,
        is_active: true,
        email_verified: false, // Will be true after email verification
        profile_visibility: {
          key: userData.profileVisibility,
          value: userData.profileVisibility === 'public' ? 'Public' : 
                 userData.profileVisibility === 'private' ? 'Private' : 'Friends Only'
        }
      }
    });

    // Create default user preferences
    await createDefaultUserPreferences(newUser.object.id);

    return {
      success: true,
      message: 'Account created successfully! Welcome aboard!',
      userId: newUser.object.id
    };

  } catch (error) {
    console.error('Error creating user profile:', error);
    return {
      success: false,
      message: 'Failed to create account. Please try again.',
    };
  }
}

async function createDefaultUserPreferences(userId: string): Promise<void> {
  try {
    await cosmicWrite.objects.insertOne({
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
    });
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
  } catch (error) {
    console.error('Error creating authentication log:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
}