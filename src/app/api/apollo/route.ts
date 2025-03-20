import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
    let contactsQuery = query(
      collection(db, 'leads'),
      orderBy('score', 'desc'),
      limit(limitValue)
    );
    
    if (title && title.length > 0 && title[0] !== '') {
      contactsQuery = query(contactsQuery, where('title', 'array-contains-any', title));
    }
    
    if (industry && industry.length > 0 && industry[0] !== '') {
      contactsQuery = query(contactsQuery, where('industry', 'array-contains-any', industry));
    }
    
    // Execute the query
    const snapshot = await getDocs(contactsQuery);
    
    // Format the results
    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}

// Handle POST request to enrich a contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Get the API key
    const apiKey = await getApolloApiKey();
    
    // Call the Apollo API to enrich the contact
    const response = await axios.post(`${APOLLO_API_URL}/people/match`, {
      api_key: apiKey,
      email
    });
    
    if (response.data.person) {
      return NextResponse.json(response.data.person);
    } else {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error enriching contact:', error);
    return NextResponse.json(
      { error: 'Failed to enrich contact' },
      { status: 500 }
    );
  }
} 