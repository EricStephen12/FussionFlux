import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { verifyAuth } from '@/utils/auth-server';
import { sendEmail } from '@/utils/email-service';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const session = await verifyAuth(token);
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { templateId, testEmail } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }
    
    // Get template
    const templateRef = db.collection('templates').doc(templateId);
    const templateDoc = await templateRef.get();
    
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const templateData = templateDoc.data();
    
    // Verify ownership
    if (templateData?.userId !== session.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get user data for sender information
    const userRef = db.collection('users').doc(session.sub);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Send test email
    await sendEmail({
      to: testEmail,
      from: userData?.email || 'noreply@dropshipemailplatform.com',
      subject: `TEST: ${templateData?.subject || 'Email Template Test'}`,
      html: templateData?.content || '<p>Test email content</p>',
      text: templateData?.plainText || 'Test email content',
    });
    
    return NextResponse.json({ 
      success: true,
      message: `Test email sent to ${testEmail}`
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    );
  }
} 