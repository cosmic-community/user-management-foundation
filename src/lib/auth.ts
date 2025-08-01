import bcrypt from 'bcryptjs';
import { cosmicWrite, getUserProfileByEmail, getUserProfileByUsername } from './cosmic';
import { UserProfile } from '@/src/types/user';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  passwordHash: string; // This will actually be the plain password, will be hashed here
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

export interface AuthLogData {
  userId?: string;
  actionType: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'email_verification' | 'account_locked' | 'session_expired';
  ipAddress: string;
  deviceInfo?: string;
  success: boolean;
  failureReason?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUserProfile(userData: CreateUserData): Promise<CreateUserResult> {
  try {
    console.log('Creating user profile for:', userData.email);

    // Check if user already exists by email
    console.log('Checking if email already exists...');
    const existingUserByEmail = await getUserProfileByEmail(userData.email);
    if (existingUserByEmail) {
      console.log('❌ Email already exists');
      return {
        success: false,
        message: 'An account with this email already exists',
        errors: { email: 'This email is already registered' }
      };
    }

    // Check if username already exists
    console.log('Checking if username already exists...');
    const existingUserByUsername = await getUserProfileByUsername(userData.username);
    if (existingUserByUsername) {
      console.log('❌ Username already exists');
      return {
        success: false,
        message: 'This username is already taken',
        errors: { username: 'This username is already taken' }
      };
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await hashPassword(userData.passwordHash);

    // Generate slug from username
    const slug = userData.username.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Create title from first and last name
    const title = `${userData.firstName} ${userData.lastName}`;

    // Get current date for date_joined
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('Creating user profile in Cosmic...');

    // Create the user profile object
    const profileData = {
      title: title,
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
        email_verified: false, // Will be true after email verification
        profile_visibility: {
          key: userData.profileVisibility,
          value: userData.profileVisibility === 'public' ? 'Public' : 
                 userData.profileVisibility === 'private' ? 'Private' : 
                 'Friends Only'
        }
      }
    };

    console.log('Profile data prepared:', {
      ...profileData,
      metadata: {
        ...profileData.metadata,
        password_hash: '[HIDDEN]'
      }
    });

    const response = await cosmicWrite.objects.insertOne(profileData);
    
    console.log('✅ User profile created successfully with ID:', response.object.id);

    return {
      success: true,
      message: 'Account created successfully! Welcome to the platform.',
      userId: response.object.id
    };

  } catch (error: any) {
    console.error('❌ Error creating user profile:', error);
    
    // Handle specific Cosmic errors
    if (error?.message?.includes('duplicate') || error?.message?.includes('already exists')) {
      return {
        success: false,
        message: 'User with this information already exists',
        errors: { general: 'User already exists' }
      };
    }

    return {
      success: false,
      message: 'Failed to create account. Please try again.',
      errors: { general: 'Account creation failed' }
    };
  }
}

export async function createAuthenticationLog(logData: AuthLogData): Promise<void> {
  try {
    console.log('Creating authentication log...');

    // Generate a descriptive title
    const actionTypeMap = {
      'login_success': 'Login Success',
      'login_failed': 'Login Failed', 
      'logout': 'Logout',
      'password_reset': 'Password Reset',
      'email_verification': 'Email Verification',
      'account_locked': 'Account Locked',
      'session_expired': 'Session Expired'
    };

    const title = logData.userId ? 
      `${actionTypeMap[logData.actionType]} - User ${logData.userId}` :
      actionTypeMap[logData.actionType];

    // Get current date for timestamp
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const logEntry = {
      title: title,
      type: 'authentication-logs',
      status: 'published',
      metadata: {
        ...(logData.userId && { user: logData.userId }),
        action_type: {
          key: logData.actionType,
          value: actionTypeMap[logData.actionType]
        },
        timestamp: currentDate,
        ip_address: logData.ipAddress,
        device_info: logData.deviceInfo || '',
        success: logData.success,
        failure_reason: logData.failureReason || ''
      }
    };

    await cosmicWrite.objects.insertOne(logEntry);
    console.log('✅ Authentication log created successfully');

  } catch (error: any) {
    console.error('❌ Error creating authentication log:', error);
    // Don't throw error as this is supplementary logging
  }
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    await cosmicWrite.objects.updateOne(userId, {
      metadata: {
        last_login: currentDate
      }
    });
    
    console.log('✅ User last login updated');
  } catch (error: any) {
    console.error('❌ Error updating user last login:', error);
    // Don't throw error as this is supplementary
  }
}