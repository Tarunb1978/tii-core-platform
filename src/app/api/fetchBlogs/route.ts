// src/app/api/fetchBlogs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const res = await fetch(`${SUPABASE_URL}/functions/v1/blogs`, {
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Failed to fetch blogs', details: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in fetchBlogs API:', err);
    return NextResponse.json({ error: 'Server error fetching blogs' }, { status: 500 });
  }
}

