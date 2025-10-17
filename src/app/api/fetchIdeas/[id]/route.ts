// src/app/api/fetchIdeas/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing idea id' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add token only if logged in
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/restful-investment-ideas/${id}`, {
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Failed to fetch idea', details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    const idea = data?.idea ?? null;

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error in fetchIdea API:', err);
    return NextResponse.json(
      { error: 'Server error fetching idea' },
      { status: 500 }
    );
  }
}
