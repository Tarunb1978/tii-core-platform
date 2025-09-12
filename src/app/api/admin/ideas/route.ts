import { NextRequest, NextResponse } from 'next/server';

const routeContext = 'api/admin/ideas';
const timestamp = () => new Date().toISOString();

function logDebug(step: string, message: string, data?: unknown) {
  try {
    const suffix = data === undefined ? '' : `\n${JSON.stringify(data, null, 2)}`;
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}${suffix}`);
  } catch {
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    const reqStart = Date.now();
    logDebug('start', 'Proxy admin ideas list to Edge Function');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      logDebug('auth', 'Missing Authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // SUPABASE_EDGE_FUNCTION_URL should point to the rest-idea-submitted list endpoint
    const baseUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
    if (!baseUrl) {
      logDebug('config', 'Missing SUPABASE_EDGE_FUNCTION_URL');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    const url = new URL(baseUrl);
    if (status) url.searchParams.set('status', status);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    logDebug('proxy', 'Forwarding request to Edge Function', { url: url.toString() });
    const efStart = Date.now();
    const efRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });
    const efMs = Date.now() - efStart;
    logDebug('proxy', 'Edge Function responded', { status: efRes.status, ms: efMs });

    if (efRes.status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (efRes.status === 403) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    if (!efRes.ok) {
      const errBody = await efRes.text().catch(() => '');
      logDebug('proxy', 'Edge Function error body', { errBody });
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }

    const json = await efRes.json();
    logDebug('success', 'Returning Edge Function payload', { total: json?.total, count: json?.ideas?.length, totalMs: Date.now() - reqStart });
    return NextResponse.json(json);

  } catch (error) {
    logDebug('error', 'Unexpected error in admin ideas list proxy', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
