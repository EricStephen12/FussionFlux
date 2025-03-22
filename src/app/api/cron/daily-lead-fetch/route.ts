import { NextResponse } from 'next/server';
import { leadService } from '@/services/LeadService';

// This route will be called by a scheduler (e.g., Vercel Cron)
// to fetch leads from all sources once per day
export async function GET() {
  try {
    // Simple API key validation to protect the endpoint
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey) {
      console.error('CRON_API_KEY not configured in environment variables');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }
    
    // Log the start time
    const startTime = new Date();
    console.log(`Starting daily lead fetch at ${startTime.toISOString()}`);
    
    // Run the daily lead fetch operation
    const result = await leadService.dailyLeadFetch();
    
    // Calculate execution time
    const endTime = new Date();
    const executionTime = (endTime.getTime() - startTime.getTime()) / 1000;
    
    // Return the results
    return NextResponse.json({
      success: true,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      executionTime: `${executionTime} seconds`,
      result
    });
  } catch (error) {
    console.error('Error in daily lead fetch cron job:', error);
    return NextResponse.json({
      error: 'Failed to run daily lead fetch',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// For Vercel Cron, we need to specify the schedule
// This will run at midnight UTC every day
export const runtime = "edge"; 