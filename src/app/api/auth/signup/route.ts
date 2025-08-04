import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cosmicWrite } from '@/lib/cosmic';
import { validateEmail, validatePassword } from '@/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, phone, username } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { error: emailError },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // Check if user already exists
    try {
      const { objects: existingUsers } = await cosmicWrite.objects
        .find({ type: 'user-profiles', 'metadata.email': email })
        .props(['id', 'metadata.email'])
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    } catch (error: any) {
      // If no users found (404), continue with registration
      if (error?.status !== 404) {
        throw error;
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user profile
    const userProfile = {
      title: `${firstName} ${lastName}`,
      type: 'user-profiles',
      status: 'published',
      metadata: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password_hash: hashedPassword,
        username: username || '',
        phone: phone || '',
        bio: '',
        date_joined: new Date().toISOString().split('T')[0],
        is_active: true,
        email_verified: false,
        profile_visibility: {
          key: 'public',
          value: 'Public'
        }
      }
    };

    // Create user profile in Cosmic
    const { object: newUser } = await cosmicWrite.objects.insertOne(userProfile);

    // Log successful registration
    const authLog = {
      title: `Registration Success - ${firstName} ${lastName}`,
      type: 'authentication-logs',
      status: 'published',
      metadata: {
        user: newUser.id,
        action_type: {
          key: 'registration_success',
          value: 'Registration Success'
        },
        timestamp: new Date().toISOString().split('T')[0],
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1',
        device_info: request.headers.get('user-agent') || 'Unknown',
        success: true,
        failure_reason: ''
      }
    };

    try {
      await cosmicWrite.objects.insertOne(authLog);
    } catch (logError) {
      console.error('Failed to log registration:', logError);
      // Don't fail the registration if logging fails
    }

    // Create default user preferences
    const userPreferences = {
      title: `${firstName} ${lastName} Preferences`,
      type: 'user-preferences',
      status: 'published',
      metadata: {
        user: newUser.id,
        theme_preference: {
          key: 'light',
          value: 'Light'
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

    try {
      await cosmicWrite.objects.insertOne(userPreferences);
    } catch (prefError) {
      console.error('Failed to create user preferences:', prefError);
      // Don't fail the registration if preferences creation fails
    }

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: email,
          firstName: firstName,
          lastName: lastName
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Log failed registration attempt
    try {
      const body = await request.clone().json();
      const authLog = {
        title: `Registration Failed - ${body.email || 'Unknown'}`,
        type: 'authentication-logs',
        status: 'published',
        metadata: {
          action_type: {
            key: 'registration_failed',
            value: 'Registration Failed'
          },
          timestamp: new Date().toISOString().split('T')[0],
          ip_address: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1',
          device_info: request.headers.get('user-agent') || 'Unknown',
          success: false,
          failure_reason: 'Server error during registration'
        }
      };
      
      await cosmicWrite.objects.insertOne(authLog);
    } catch (logError) {
      console.error('Failed to log registration error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}