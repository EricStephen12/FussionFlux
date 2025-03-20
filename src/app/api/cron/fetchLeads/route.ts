import { NextResponse } from 'next/server';
import { validateCronApiKey } from '@/utils/security';
import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { apolloService } from '@/services/apollo';

// This is a secured endpoint for scheduled lead fetching
export async function GET(request: Request) {
  try {
    // Get the API key from the request headers or URL parameters
    const url = new URL(request.url);
    const headerKey = request.headers.get('x-api-key');
    const queryKey = url.searchParams.get('key');
    const apiKey = headerKey || queryKey;
    
    // Validate the API key
    if (!apiKey || !validateCronApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key' }, 
        { status: 401 }
      );
    }
    
    // Fetch leads from Apollo
    const searchParams = {
      industry: ['ecommerce', 'retail', 'technology'],
      title: ['marketer', 'sales', 'owner'],
      limit: 50
    };

    const leads = await apolloService.searchContactsFirebase(searchParams);
    
    // Store leads in Firestore
    if (leads && leads.length > 0) {
      await storeAndProcessLeads(leads);
      
      return NextResponse.json({
        success: true,
        message: `Successfully fetched and stored ${leads.length} leads`,
        count: leads.length
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No leads found or error occurred'
      });
    }
  } catch (error) {
    console.error('Error in fetchLeads cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

// Helper function to store and process leads
async function storeAndProcessLeads(leads: any[]) {
  try {
    const leadsRef = collection(db, 'leads');
    
    // Process each lead
    for (const lead of leads) {
      // Check if lead already exists
      const existingLeadQuery = query(
        leadsRef, 
        where('email', '==', lead.email)
      );
      
      const existingLeadSnapshot = await getDocs(existingLeadQuery);
      
      // Only add if lead doesn't exist
      if (existingLeadSnapshot.empty) {
        await addDoc(leadsRef, {
          ...lead,
          createdAt: serverTimestamp(),
          status: 'new'
        });
      }
    }
    
    // Log the activity
    await addDoc(collection(db, 'system_logs'), {
      type: 'cron_job',
      action: 'fetch_leads',
      count: leads.length,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error storing leads:', error);
    throw error;
  }
}

/*
To set up this cron job:

1. Generate a secure CRON_API_KEY and add it to your environment variables
   - You can generate one with: openssl rand -base64 32
   - Add it to your .env file as CRON_API_KEY=your_generated_key

2. Set up a cron job service (like cron-job.org, GitHub Actions, or Vercel Cron) to call:
   https://your-site.com/api/cron/fetchLeads?limit=100&source=all

3. Ensure the service sends the Authorization header:
   Authorization: Bearer your_generated_key

Recommended schedule: Daily at off-peak hours
*/ 