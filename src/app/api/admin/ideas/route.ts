import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/auth/action';

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
    logDebug('start', 'Admin ideas list request received');

    // Create Supabase client
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      logDebug('auth', 'User not authenticated', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has super_admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'super_admin') {
      logDebug('auth', 'User does not have super_admin role', { profileError, profile });
      return NextResponse.json(
        { error: 'Insufficient permissions. Super admin access required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    logDebug('params', 'Query parameters', { status, page, limit, offset });

    // Build query
    let query = supabase
      .from('ideas_submitted')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: ideas, error: ideasError, count } = await query;

    if (ideasError) {
      logDebug('query', 'Error fetching ideas', ideasError);
      return NextResponse.json(
        { error: 'Failed to fetch ideas' },
        { status: 500 }
      );
    }

    logDebug('success', 'Ideas fetched successfully', { count: ideas?.length, total: count });

    return NextResponse.json({
      ideas: ideas || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    logDebug('error', 'Unexpected error in admin ideas list', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
