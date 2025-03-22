import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { getApolloApiKey } from '@/utils/api-keys';
import axios from 'axios';

const APOLLO_API_URL = 'https://api.apollo.io/v1';

// Handle GET request to search for contacts
export async function GET(request: Request) {
  try {
    // Parse search parameters from the request
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title')?.split(',');
    const industry = searchParams.get('industry')?.split(',');
    const limitParam = searchParams.get('limit');
    const limitValue = limitParam ? parseInt(limitParam, 10) : 100;
    
    // Set up the query based on the parameters
    const contactsRef = db.collection('contacts');
    let contactsQuery = contactsRef;
    
    if (title && title.length > 0) {
      contactsQuery = contactsQuery.where('title', 'in', title);
    }
    
    if (industry && industry.length > 0) {
      contactsQuery = contactsQuery.where('industry', 'in', industry);
    }
    
    contactsQuery = contactsQuery.limit(limitValue);
    
    // Execute the query
    const snapshot = await contactsQuery.get();
    const contacts = [];
    
    snapshot.forEach((doc) => {
      contacts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return NextResponse.json({ contacts });
    
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
  }
}

// Handle POST request to save contacts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contacts } = body;
    
    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Invalid contacts data' }, { status: 400 });
    }
    
    const batch = db.batch();
    const contactsRef = db.collection('contacts');
    
    contacts.forEach((contact) => {
      const docRef = contactsRef.doc();
      batch.set(docRef, {
        ...contact,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error saving contacts:', error);
    return NextResponse.json({ error: 'Failed to save contacts' }, { status: 500 });
  }
} 