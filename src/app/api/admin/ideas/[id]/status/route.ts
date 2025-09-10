import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/auth/action';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = params.id;
    logDebug('start', 'Admin idea status update request received', { ideaId });

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

    // Parse request body
    const body: StatusUpdateRequest = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      logDebug('validation', 'Invalid status provided', { status });
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, accepted, rejected' },
        { status: 400 }
      );
    }

    logDebug('validation', 'Status validation passed', { status });

    // Check if idea exists
    const { data: existingIdea, error: fetchError } = await supabase
      .from('ideas_submitted')
      .select('id, status')
      .eq('id', ideaId)
      .single();

    if (fetchError) {
      logDebug('query', 'Error fetching existing idea', fetchError);
      if (fetchError.code === 'PGRST116') {
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

    if (!existingIdea) {
      logDebug('query', 'Idea not found', { ideaId });
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    // Update the status
    const { data: updatedIdea, error: updateError } = await supabase
      .from('ideas_submitted')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', ideaId)
      .select('*')
      .single();

    if (updateError) {
      logDebug('update', 'Error updating idea status', updateError);
      return NextResponse.json(
        { error: 'Failed to update idea status' },
        { status: 500 }
      );
    }

    if (!updatedIdea) {
      logDebug('update', 'No idea returned after update', { ideaId });
      return NextResponse.json(
        { error: 'Failed to update idea status' },
        { status: 500 }
      );
    }

    logDebug('success', 'Idea status updated successfully', { 
      ideaId, 
      oldStatus: existingIdea.status, 
      newStatus: status 
    });

    return NextResponse.json(updatedIdea);

  } catch (error) {
    logDebug('error', 'Unexpected error in admin idea status update', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
