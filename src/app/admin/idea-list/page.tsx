import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/auth/action'
import AdminIdeaListClient from './AdminIdeaListClient'

// Force dynamic rendering since this page uses cookies for authentication
export const dynamic = 'force-dynamic'

// Server component: handles authentication and redirects
export default async function AdminIdeaListPage() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      console.debug('[admin/idea-list][auth] no user found, redirecting to home')
      redirect('/')  // 👈 redirect to landing page instead of /sign-in
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token

    if (!accessToken) {
      console.debug('[admin/idea-list][auth] no access token, redirecting to home')
      redirect('/')  // 👈 redirect to home
    }

    const endpoint = process.env.SUPABASE_EDGE_FUNCTION_URL
    if (!endpoint || endpoint.trim() === '') {
      console.error('[admin/idea-list][config] Missing or empty SUPABASE_EDGE_FUNCTION_URL')
      return <ConfigError message="Missing Edge Function URL. Please contact your administrator." />
    }

    try {
      new URL(endpoint)
    } catch (urlError) {
      console.error('[admin/idea-list][config] Invalid SUPABASE_EDGE_FUNCTION_URL format', { endpoint, error: urlError })
      return <ConfigError message="Invalid Edge Function URL format. Please contact your administrator." />
    }

    return <AdminIdeaListClient />
  } catch (error) {
    console.error('[admin/idea-list][error] Unexpected error in admin ideas list', error)
    return <UnexpectedError />
  }
}

// Extract fallback UIs into small components for readability
function ConfigError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800">Configuration Error</h2>
          <p className="text-red-700 mb-4">{message}</p>
        </div>
      </div>
    </div>
  )
}

function UnexpectedError() {
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
