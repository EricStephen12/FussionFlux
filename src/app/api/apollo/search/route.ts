import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { verifyAuth } from '@/utils/auth-server';

// Mock data for Apollo contacts since we don't have actual Apollo API integration
const MOCK_CONTACTS = [
  {
    id: 'contact1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    title: 'Marketing Director',
    company: 'Acme Inc',
    industry: 'Marketing and Advertising',
    location: 'New York, NY',
    linkedinUrl: 'https://linkedin.com/in/johnsmith',
    phoneNumber: '+1234567890',
    enriched: true,
    score: 85,
    lastActivity: new Date().toISOString(),
    engagementRate: 0.75
  },
  {
    id: 'contact2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@techcorp.com',
    title: 'CTO',
    company: 'TechCorp',
    industry: 'Software',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
    enriched: true,
    score: 92,
    lastActivity: new Date().toISOString(),
    engagementRate: 0.82
  },
  {
    id: 'contact3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@retailshop.com',
    title: 'E-commerce Manager',
    company: 'RetailShop',
    industry: 'E-Commerce',
    location: 'Chicago, IL',
    enriched: true,
    score: 78,
    lastActivity: new Date().toISOString(),
    engagementRate: 0.65
  }
];

// Generate more mock contacts based on industry and title filters
function generateMockContacts(industry?: string[], title?: string[], limit: number = 10) {
  const industries = industry || ['Software', 'E-Commerce', 'Marketing and Advertising'];
  const titles = title || ['Manager', 'Director', 'VP', 'CEO'];
  
  const firstNames = ['James', 'Robert', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'David', 'William', 'Richard'];
  const lastNames = ['Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'];
  const companies = ['TechGiant', 'RetailMaster', 'MarketPro', 'DigitalSolutions', 'EcomStore', 'CloudServices', 'DataInsights', 'WebWorks'];
  const locations = ['New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Los Angeles, CA'];
  
  const contacts = [];
  
  // Always include our base mock contacts that match the filters
  for (const contact of MOCK_CONTACTS) {
    if (
      (!industry || industry.includes(contact.industry)) &&
      (!title || title.some(t => contact.title.includes(t)))
    ) {
      contacts.push(contact);
    }
  }
  
  // Generate additional contacts to meet the limit
  while (contacts.length < limit) {
    const randomIndustry = industries[Math.floor(Math.random() * industries.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    contacts.push({
      id: `contact${contacts.length + 1}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(' ', '')}.com`,
      title: randomTitle,
      company,
      industry: randomIndustry,
      location,
      enriched: Math.random() > 0.3, // 70% chance of being enriched
      score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 30 days
      engagementRate: Math.random() * 0.5 + 0.3 // Engagement rate between 0.3-0.8
    });
    
    // Avoid infinite loop if we can't meet the criteria
    if (contacts.length === 3 && limit > 3) {
      break;
    }
  }
  
  return contacts.slice(0, limit);
}

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
    
    // Get user subscription to check credits
    const userRef = db.collection('users').doc(session.sub);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    
    // Check if user has enough credits for Apollo search
    const apolloCredits = userData?.credits?.apollo || 0;
    if (apolloCredits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient Apollo credits. Please upgrade your plan.' },
        { status: 403 }
      );
    }
    
    // Parse search parameters
    const { industry, title, limit = 10 } = await request.json();
    
    // In a real implementation, this would call the Apollo API
    // For now, we'll return mock data based on the filters
    const contacts = generateMockContacts(industry, title, limit);
    
    // Deduct one credit for the search
    await userRef.update({
      'credits.apollo': apolloCredits - 1
    });
    
    return NextResponse.json({
      success: true,
      contacts,
      remainingCredits: apolloCredits - 1
    });
  } catch (error: any) {
    console.error('Error in Apollo search:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search contacts' },
      { status: 500 }
    );
  }
} 