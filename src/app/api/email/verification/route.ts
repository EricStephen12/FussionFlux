import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth } from '@/utils/firebase';
import { sendEmailVerification } from 'firebase/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, displayName } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get the current user from Firebase
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    try {
      // Send verification email through Firebase
      await sendEmailVerification(currentUser, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
        handleCodeInApp: true,
      });

      // Send additional welcome email through Resend
      const { data, error } = await resend.emails.send({
        from: `FussionFlux <${process.env.RESEND_FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to FussionFlux - Please Verify Your Email',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Welcome to FussionFlux!</h1>
            <p>Hi ${displayName || 'there'},</p>
            <p>Thank you for signing up! We've sent a verification link to your email address.</p>
            <p>Please check your inbox (and spam folder) for the verification email from Firebase.</p>
            <p>Click the verification link in that email to verify your account.</p>
            <p>If you don't receive the email within a few minutes, you can request a new one from the verification page.</p>
            <p>Best regards,<br>The FussionFlux Team</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API error:', error);
        // Continue even if Resend fails, as Firebase verification is the primary method
      }

      return NextResponse.json({ 
        success: true,
        message: 'Verification email sent successfully' 
      });
    } catch (error: any) {
      console.error('Firebase verification error:', error);
      return NextResponse.json(
        { error: 'Failed to send verification email: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in verification endpoint:', error);
    return NextResponse.json(
      { error: 'Unexpected error: ' + error.message },
      { status: 500 }
    );
  }
} 