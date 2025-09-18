import { NextRequest, NextResponse } from 'next/server';

const routeContext = 'api/admin/ideas/[id]';
const timestamp = () => new Date().toISOString();

function logDebug(step: string, message: string, data?: unknown) {
  try {
    const suffix = data === undefined ? '' : `\n${JSON.stringify(data, null, 2)}`;
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}${suffix}`);
  } catch {
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}`);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const ideaId = context.params.id;
    logDebug('start', 'Proxy admin idea detail to Edge Function', { ideaId });

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      logDebug('auth', 'Missing Authorization header');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // SUPABASE_EDGE_FUNCTION_DETAIL_URL optionally points to single-idea endpoint; fallback appends id to SUPABASE_EDGE_FUNCTION_URL
    const baseUrl = process.env.SUPABASE_EDGE_FUNCTION_DETAIL_URL || process.env.SUPABASE_EDGE_FUNCTION_URL;
    if (!baseUrl) {
      logDebug('config', 'Missing SUPABASE_EDGE_FUNCTION_URL');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // If single-detail endpoint differs, allow DETAIL_URL; otherwise append id to base
    const url = baseUrl.includes('{id}') ? new URL(baseUrl.replace('{id}', encodeURIComponent(ideaId))) : new URL(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(ideaId)}`);

    logDebug('proxy', 'Forwarding request to Edge Function', { url: url.toString() });
    const efRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (efRes.status === 401) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (efRes.status === 403) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    if (efRes.status === 404) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    if (!efRes.ok) return NextResponse.json({ error: 'Failed to fetch idea' }, { status: 500 });

    const json = await efRes.json();
    logDebug('success', 'Returning Edge Function payload');
    return NextResponse.json(json);

  } catch (error) {
    logDebug('error', 'Unexpected error in admin idea detail', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
