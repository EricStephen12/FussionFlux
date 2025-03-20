import { db } from '@/utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { creditsService } from '@/services/trial';

export async function POST(request: Request) {
  try {
    const { userId, emailData } = await request.json();

    if (!userId || !emailData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check user's email credits
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userData = userDoc.data();
    if (userData.usedEmails >= userData.totalEmails) {
      return new Response(JSON.stringify({ error: 'Email credits exceeded' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process email sending here
    // ... your email sending logic ...

    // Update user's email usage
    await updateDoc(userRef, {
      usedEmails: userData.usedEmails + 1,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing email:', error);
    return new Response(JSON.stringify({ error: 'Failed to process email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 