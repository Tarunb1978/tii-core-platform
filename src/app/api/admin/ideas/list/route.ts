import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/auth/action'

// API route to proxy the ideas list request for client components
export async function GET(request: NextRequest) {
  try {
    // Server-side authentication
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    
    if (userErr) {
      console.debug('[api/admin/ideas/list][auth] getUser error', userErr)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
    
    const user = userData?.user
    if (!user) {
      console.debug('[api/admin/ideas/list][auth] no user found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user access token for Edge Function call
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr) {
      console.debug('[api/admin/ideas/list][auth] getSession error', sessionErr)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) {
      console.debug('[api/admin/ideas/list][auth] no access token')
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    // Check for required environment variable
    const endpoint = process.env.SUPABASE_EDGE_FUNCTION_URL
    if (!endpoint || endpoint.trim() === '') {
      console.error('[api/admin/ideas/list][config] Missing SUPABASE_EDGE_FUNCTION_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Validate that the endpoint is a proper URL
    let edgeFunctionUrl: URL
    try {
      edgeFunctionUrl = new URL(endpoint)
    } catch (urlError) {
      console.error('[api/admin/ideas/list][config] Invalid SUPABASE_EDGE_FUNCTION_URL format', { endpoint, error: urlError })
      return NextResponse.json({ error: 'Invalid server configuration' }, { status: 500 })
    }

    // Make request to Edge Function
    const response = await fetch(`${edgeFunctionUrl.toString()}/rest-idea-submitted`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (response.status === 401) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (response.status === 403) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    if (!response.ok) {
      console.error('[api/admin/ideas/list][fetch] non-OK response', { statusCode: response.status })
      const errorText = await response.text().catch(() => 'Unknown error')
      return NextResponse.json({ error: `Failed to fetch ideas: ${errorText}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[api/admin/ideas/list][error] Unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
