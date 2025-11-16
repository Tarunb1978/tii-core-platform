// src/app/api/fetchBlogs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_EDGE_FUNCTION_URL = process.env.SUPABASE_EDGE_FUNCTION_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    if (!SUPABASE_EDGE_FUNCTION_URL) {
      console.error('SUPABASE_EDGE_FUNCTION_URL is not set');
      return NextResponse.json({ error: 'Server configuration error: SUPABASE_EDGE_FUNCTION_URL missing' }, { status: 500 });
    }

    if (!SUPABASE_ANON_KEY) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error: SUPABASE_ANON_KEY missing' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };
    
    // Use auth token if provided, otherwise use anon key for Authorization header
    if (authHeader) {
      headers['Authorization'] = authHeader;
    } else {
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    
    const edgeFunctionUrl = `${SUPABASE_EDGE_FUNCTION_URL}/blogs`;
    console.log('Fetching blogs from:', edgeFunctionUrl);
    
    const res = await fetch(edgeFunctionUrl, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase Edge Function error:', res.status, text);
      return NextResponse.json({ error: 'Failed to fetch blogs', details: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in fetchBlogs API:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Server error fetching blogs', details: errorMessage }, { status: 500 });
  }
}

