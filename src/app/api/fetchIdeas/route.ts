// src/app/api/fetchIdeas/route.ts (App Router)
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
        return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
        }
        const res = await fetch(`${SUPABASE_URL}/functions/v1/restful-investment-ideas`, {
        headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
        },
        });

        if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: 'Failed to fetch ideas', details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error('Error in fetchIdeas API:', err);
        return NextResponse.json({ error: 'Server error fetching ideas' }, { status: 500 });
    }
}
