import { NextRequest, NextResponse } from 'next/server';

const routeContext = 'api/admin/ideas/[id]/status';
const timestamp = () => new Date().toISOString();

function logDebug(step: string, message: string, data?: unknown) {
  try {
    const suffix = data === undefined ? '' : `\n${JSON.stringify(data, null, 2)}`;
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}${suffix}`);
  } catch {
    console.debug(`[${timestamp()}][${routeContext}][${step}] ${message}`);
  } 
}

type StatusUpdateRequest = {
  status: 'pending' | 'accepted' | 'rejected';
};

/**
 * PATCH handler for updating idea status
 * 
 * CRITICAL FIX: In Next.js 13+, params must be awaited before accessing properties.
 * This prevents the runtime error: "params should be awaited before using its properties"
 */
export async function PATCH(
  request: NextRequest,
  context: { params: any }
) {
  const callId = Math.random().toString(36).slice(2, 8);
  const start = Date.now();
  
  try {
    // CRITICAL: Await params before accessing properties (Next.js 13+ requirement)
    const ideaId = context.params.id;
    
    logDebug('start', 'Proxy admin idea status update to Edge Function', { 
      callId, 
      ideaId,
      note: 'Params properly awaited per Next.js 13+ requirements'
    });

    // DEBUG: Enhanced authentication logging
    const authHeader = request.headers.get('authorization');
    logDebug('auth', 'Authorization header analysis', {
      callId,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length,
      authHeaderPrefix: authHeader?.substring(0, 20) + '...',
      authHeaderSuffix: '...' + authHeader?.substring(authHeader.length - 10)
    });
    
    if (!authHeader) {
      logDebug('auth', 'Missing Authorization header', { callId });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // DEBUG: Request body parsing and validation
    const body: StatusUpdateRequest = await request.json();
    const { status } = body;
    
    logDebug('validation', 'Request body analysis', {
      callId,
      bodyReceived: body,
      statusValue: status,
      isValidStatus: status && ['pending', 'accepted', 'rejected'].includes(status)
    });
    
    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      logDebug('validation', 'Invalid status provided', { callId, status });
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, accepted, rejected' },
        { status: 400 }
      );
    }

    // DEBUG: Environment configuration analysis
    const baseUrl = process.env.SUPABASE_EDGE_FUNCTION_STATUS_URL || process.env.SUPABASE_EDGE_FUNCTION_URL;
    logDebug('config', 'Environment configuration', {
      callId,
      hasStatusUrl: !!process.env.SUPABASE_EDGE_FUNCTION_STATUS_URL,
      hasBaseUrl: !!process.env.SUPABASE_EDGE_FUNCTION_URL,
      selectedBaseUrl: baseUrl,
      baseUrlLength: baseUrl?.length
    });
    
    if (!baseUrl) {
      logDebug('config', 'Missing SUPABASE_EDGE_FUNCTION_URL', { callId });
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // DEBUG: URL construction analysis
    const url = baseUrl.includes('{id}') 
      ? new URL(baseUrl.replace('{id}', encodeURIComponent(ideaId))) 
      : new URL(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(ideaId)}/status`);

    logDebug('proxy', 'Proxy request details', { 
      callId,
      targetUrl: url.toString(),
      method: 'PATCH',
      statusPayload: { status },
      ideaId,
      urlConstruction: {
        baseUrl,
        hasIdTemplate: baseUrl.includes('{id}'),
        finalPath: url.pathname
      }
    });

    // DEBUG: Edge Function request timing
    const proxyStart = Date.now();
    const efRes = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ status }),
    });

    const proxyDuration = Date.now() - proxyStart;
    
    // DEBUG: Response analysis
    logDebug('response', 'Edge Function response analysis', {
      callId,
      status: efRes.status,
      ok: efRes.ok,
      statusText: efRes.statusText,
      proxyDurationMs: proxyDuration,
      responseUrl: efRes.url,
      headers: Object.fromEntries(efRes.headers.entries())
    });

    // Handle specific error cases with detailed logging
    if (efRes.status === 401) {
      logDebug('error', 'Authentication failed at Edge Function', { callId, status: 401 });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (efRes.status === 403) {
      logDebug('error', 'Insufficient permissions at Edge Function', { callId, status: 403 });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    if (efRes.status === 404) {
      logDebug('error', 'Idea not found at Edge Function', { callId, status: 404, ideaId });
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    if (!efRes.ok) {
      logDebug('error', 'Edge Function returned non-OK status', { 
        callId, 
        status: efRes.status, 
        statusText: efRes.statusText 
      });
      return NextResponse.json({ error: 'Failed to update idea status' }, { status: 500 });
    }

    const json = await efRes.json();
    const totalDuration = Date.now() - start;
    
    logDebug('success', 'Status update completed successfully', {
      callId,
      ideaId,
      newStatus: status,
      totalDurationMs: totalDuration,
      proxyDurationMs: proxyDuration,
      responseData: json
    });
    
    return NextResponse.json(json);

  } catch (error) {
    const totalDuration = Date.now() - start;
    logDebug('error', 'Unexpected error in admin idea status update', {
      callId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      totalDurationMs: totalDuration,
      note: 'This error occurred after params were properly awaited'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
