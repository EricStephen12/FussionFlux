import { NextResponse } from 'next/server';
import { verifyAuth } from '@/utils/auth-server';
import { db } from '@/utils/firebase-admin';

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

    const data = await request.json();
    const { firstName, lastName, email, phone, company, message } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the contact submission in Firestore using Admin SDK
    const contactSubmissionsRef = db.collection('contact_submissions');
    await contactSubmissionsRef.add({
      userId: session.sub,
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    });

    return NextResponse.json(
      { message: 'Contact form submitted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
} 