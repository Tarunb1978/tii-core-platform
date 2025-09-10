import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/auth/action';

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
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = params.id;
    logDebug('start', 'Admin idea detail request received', { ideaId });

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

    // Fetch the idea
    const { data: idea, error: ideaError } = await supabase
      .from('ideas_submitted')
      .select('*')
      .eq('id', ideaId)
      .single();

    if (ideaError) {
      logDebug('query', 'Error fetching idea', ideaError);
      if (ideaError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Idea not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch idea' },
        { status: 500 }
      );
    }

    if (!idea) {
      logDebug('query', 'Idea not found', { ideaId });
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    logDebug('success', 'Idea fetched successfully', { ideaId });

    return NextResponse.json(idea);

  } catch (error) {
    logDebug('error', 'Unexpected error in admin idea detail', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
