import { NextResponse } from 'next/server';
import { firestoreService } from '@/services/firestore';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { firstName, lastName, email, phone, company, message } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the contact submission in Firestore
    await firestoreService.addDocument('contact_submissions', {
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    });

    // Here you would typically also send an email notification to your team
    // and/or set up an auto-responder email to the user
    // This would be integrated with your email service (SendGrid)

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