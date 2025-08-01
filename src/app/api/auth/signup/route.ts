import { NextRequest, NextResponse } from 'next/server';
import { createUserProfile, createAuthenticationLog } from '@/src/lib/auth';
import { validateSignUpForm } from '@/src/utils/validation';
import { SignUpFormData, CreateUserData } from '@/src/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: SignUpFormData = await request.json();
    
    // Validate the form data
    const validationErrors = validateSignUpForm(body);
    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Please correct the errors below',
        errors: validationErrors
      }, { status: 400 });
    }

    // Prepare user data (password will be handled differently - not stored in user profile)
    const userData: CreateUserData = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      username: body.username.trim(),
      passwordHash: body.password, // This will be handled properly in createUserProfile
      phone: body.phone?.trim() || undefined,
      bio: body.bio?.trim() || undefined,
      profileVisibility: body.profileVisibility
    };

    // Create the user profile
    const result = await createUserProfile(userData);

    if (result.success) {
      // Log the successful registration
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
      
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await createAuthenticationLog({
        userId: result.userId,
        actionType: 'email_verification',
        ipAddress: clientIP,
        deviceInfo: userAgent,
        success: true
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        userId: result.userId
      });
    } else {
      // Log the failed registration attempt
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
      
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await createAuthenticationLog({
        actionType: 'login_failed',
        ipAddress: clientIP,
        deviceInfo: userAgent,
        success: false,
        failureReason: result.message
      });

      return NextResponse.json({
        success: false,
        message: result.message,
        errors: result.errors
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Sign up API error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred. Please try again.'
    }, { status: 500 });
  }
}