// src/app/api/fetchIdeas/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        };
        if (authHeader) headers['Authorization'] = authHeader;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/restful-investment-ideas`, {
        headers,
        });

        if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: 'Failed to fetch ideas', details: text }, { status: res.status });
        }

        const data = await res.json();
        
        // Debug logging: Print what's coming from the database
        console.log('📥 Raw API Response from Supabase Edge Function:');
        console.log('Full response:', JSON.stringify(data, null, 2));
        console.log('Ideas array exists?', Array.isArray(data.ideas));
        console.log('Number of ideas:', data.ideas?.length || 0);
        
        // If there are ideas, log the first one's structure
        if (data.ideas && data.ideas.length > 0) {
          console.log('Sample idea structure (first item):');
          console.log(JSON.stringify(data.ideas[0], null, 2));
        }
        
        return NextResponse.json(data);
    } catch (err) {
        console.error('Error in fetchIdeas API:', err);
        return NextResponse.json({ error: 'Server error fetching ideas' }, { status: 500 });
    }
}
