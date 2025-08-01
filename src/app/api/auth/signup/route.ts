import { NextRequest, NextResponse } from 'next/server';
import { createUserProfile, createAuthenticationLog } from '@/src/lib/auth';
import { validateSignUpForm } from '@/src/utils/validation';
import { SignUpFormData, CreateUserData } from '@/src/types/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIGNUP API CALLED ===');
    
    // Parse request body
    let body: SignUpFormData;
    try {
      body = await request.json();
      console.log('Request body parsed successfully for email:', body.email);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid request format'
      }, { status: 400 });
    }
    
    // Validate the form data
    console.log('Validating form data...');
    const validationErrors = validateSignUpForm(body);
    if (Object.keys(validationErrors).length > 0) {
      console.log('Validation errors found:', validationErrors);
      return NextResponse.json({
        success: false,
        message: 'Please correct the errors below',
        errors: validationErrors
      }, { status: 400 });
    }
    console.log('Form validation passed');

    // Prepare user data (password will be hashed in createUserProfile)
    const userData: CreateUserData = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.toLowerCase().trim(),
      username: body.username.trim(),
      passwordHash: body.password, // This will be hashed in createUserProfile
      phone: body.phone?.trim() || undefined,
      bio: body.bio?.trim() || undefined,
      profileVisibility: body.profileVisibility
    };

    console.log('User data prepared, creating profile...');

    // Create the user profile
    const result = await createUserProfile(userData);

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (result.success) {
      console.log('✅ User created successfully! ID:', result.userId);
      
      // Log the successful registration
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
      console.log('❌ User creation failed:', result.message);
      
      // Log the failed registration attempt
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

  } catch (error: any) {
    console.error('❌ SIGNUP API ERROR:', error);
    
    // More detailed error logging
    if (error?.message) {
      console.error('Error message:', error.message);
    }
    if (error?.stack) {
      console.error('Error stack:', error.stack);
    }
    if (error?.cause) {
      console.error('Error cause:', error.cause);
    }
    
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.'
    }, { status: 500 });
  }
}