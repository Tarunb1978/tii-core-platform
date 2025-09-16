import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/auth/action'
import AdminIdeaListClient from './AdminIdeaListClient'

// Server component: handles authentication and redirects
export default async function AdminIdeaListPage() {
  try {
    // Server-side auth
    const supabase = await createSupabaseServerClient()
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    
    if (userErr) {
      console.debug('[admin/idea-list][auth] getUser error', userErr)
    }
    
    const user = userData?.user
    if (!user) {
      console.debug('[admin/idea-list][auth] no user found, redirecting to sign-in')
      redirect('/sign-in')
    }

    // Check if user has access token
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr) {
      console.debug('[admin/idea-list][auth] getSession error', sessionErr)
    }
    
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) {
      console.debug('[admin/idea-list][auth] no access token, redirecting to sign-in')
      redirect('/sign-in')
    }

    // Check for required environment variable
    const endpoint = process.env.SUPABASE_EDGE_FUNCTION_URL
    if (!endpoint || endpoint.trim() === '') {
      console.error('[admin/idea-list][config] Missing or empty SUPABASE_EDGE_FUNCTION_URL')
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800">Configuration Error</h2>
              <p className="text-red-700 mb-4">
                Server configuration error: Missing Edge Function URL. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Validate that the endpoint is a proper URL
    try {
      new URL(endpoint)
    } catch (urlError) {
      console.error('[admin/idea-list][config] Invalid SUPABASE_EDGE_FUNCTION_URL format', { endpoint, error: urlError })
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800">Configuration Error</h2>
              <p className="text-red-700 mb-4">
                Server configuration error: Invalid Edge Function URL format. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // If we get here, authentication passed and configuration is valid
    // Render the client component that handles the actual data fetching and filtering
    return <AdminIdeaListClient />

  } catch (error) {
    // Catch any unexpected errors and provide a fallback UI
    console.error('[admin/idea-list][error] Unexpected error in admin ideas list', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800">Unexpected Error</h2>
            <p className="text-red-700 mb-4">
              An unexpected error occurred while loading the admin panel. Please try refreshing the page.
            </p>
            <p className="text-sm text-red-600">
              If the problem persists, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }
}