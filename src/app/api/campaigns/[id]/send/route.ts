import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/utils/firebase';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { to, subject, template } = await request.json();

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'noreply@yourdomain.com',
      to,
      subject,
      html: template,
    });

    if (error) {
      throw error;
    }

    // Update campaign status in database
    await db.collection('campaigns').doc(id).update({
      status: 'sent',
      sentAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
} 