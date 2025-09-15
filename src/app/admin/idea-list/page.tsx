import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createSupabaseServerClient } from '@/app/auth/action'
import {
  Search,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

// Types for ideas list payload from Edge Function
type IdeaData = {
  id: string
  user_id: string
  data: {
    title: string
    description: string
    company_name?: string
  }
  stock_details: {
    ticker: string
  }
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

type IdeaListResponse = {
  ideas: IdeaData[]
  total: number
  page: number
  limit: number
}

// Error UI component for configuration issues
function ConfigurationError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Configuration Error</h2>
          </div>
          <p className="text-red-700 mb-4">{message}</p>
          <p className="text-sm text-red-600">
            Please contact your administrator or check the server configuration.
          </p>
        </div>
      </main>
    </div>
  )
}

// Error UI component for data fetching issues
function DataError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Unable to Load Ideas</h2>
          </div>
          <p className="text-yellow-700 mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'accepted':
      return <CheckCircle className="w-4 h-4" />
    case 'rejected':
      return <XCircle className="w-4 h-4" />
    case 'pending':
    default:
      return <Clock className="w-4 h-4" />
  }
}

// Server component: all data fetching is server-side.
// Authorization: Enforce super_admin access on the server before rendering.
// Note on Next.js routing API change:
// In Next.js 13+ (and enforced in 15+), `searchParams` in server components
// is provided as an async value that must be awaited. Accessing properties
// synchronously (e.g., `searchParams.page`) throws a runtime error.
// We therefore type it as a Promise and await it before reading properties.
export default async function AdminIdeaListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    const pageStart = Date.now()
    const params = await searchParams
    const status = typeof params?.status === 'string' ? params.status : ''
    const pageParam = typeof params?.page === 'string' ? params.page : '1'
    const limitParam = typeof params?.limit === 'string' ? params.limit : '10'

    const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
    const limit = Math.max(1, parseInt(limitParam || '10', 10) || 10)

    // Server-side auth
    console.debug('[admin/idea-list][start] rendering with params', { status, page, limit })
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
    // Authorization is enforced by the Edge Function via app_user role check (super_admin required)
    // We do not query the legacy profiles table here to avoid schema issues.
    // Frontend passes the user's JWT via Authorization header; Edge Function validates JWT and role.

    // Get user access token for Edge Function call
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr) {
      console.debug('[admin/idea-list][auth] getSession error', sessionErr)
    }
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) {
      console.debug('[admin/idea-list][auth] no access token, redirecting to sign-in')
      redirect('/sign-in')
    }

    // Safely check for required environment variable
    // This is a server-only variable that should not be exposed to the client
    const endpoint = process.env.SUPABASE_EDGE_FUNCTION_URL
    if (!endpoint || endpoint.trim() === '') {
      console.error('[admin/idea-list][config] Missing or empty SUPABASE_EDGE_FUNCTION_URL')
      return <ConfigurationError message="Server configuration error: Missing Edge Function URL. Please contact your administrator." />
    }

    // Validate that the endpoint is a proper URL
    let edgeFunctionUrl: URL
    try {
      edgeFunctionUrl = new URL(endpoint)
    } catch (urlError) {
      console.error('[admin/idea-list][config] Invalid SUPABASE_EDGE_FUNCTION_URL format', { endpoint, error: urlError })
      return <ConfigurationError message="Server configuration error: Invalid Edge Function URL format. Please contact your administrator." />
    }

    // Ensure the URL points to the rest-idea-submitted Edge Function endpoint.
    const url = new URL(edgeFunctionUrl.toString())

    console.debug('[admin/idea-list][fetch] requesting ideas', { url: url.toString() })
    const fetchStart = Date.now()
    console.log(`${url.toString()}/rest-idea-submitted`);
    
    let response: Response
    try {
      response = await fetch(`${url.toString()}/rest-idea-submitted`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      })
    } catch (fetchError) {
      console.error('[admin/idea-list][fetch] Network error', { error: fetchError })
      return <DataError message="Unable to connect to the ideas service. Please check your connection and try again." />
    }

    console.debug('[admin/idea-list][fetch] response received', { status: response.status, ms: Date.now() - fetchStart })

    if (response.status === 401) {
      console.debug('[admin/idea-list][fetch] 401 from API, redirecting')
      redirect('/sign-in')
    }
    if (response.status === 403) {
      console.debug('[admin/idea-list][fetch] 403 from API, redirecting')
      redirect('/unauthorized')
    }
    if (!response.ok) {
      console.error('[admin/idea-list][fetch] non-OK response', { statusCode: response.status })
      const errorText = await response.text().catch(() => 'Unknown error')
      return <DataError message={`Failed to load ideas (${response.status}): ${errorText}`} />
    }

    let data: IdeaListResponse
    try {
      data = (await response.json()) as IdeaListResponse
    } catch (jsonError) {
      console.error('[admin/idea-list][fetch] JSON parse error', { error: jsonError })
      return <DataError message="Invalid response format from the ideas service. Please try again." />
    }

    const ideas = data.ideas || []
    const total = data.total || 0
    const currentPage = data.page || page
    const perPage = data.limit || limit

    console.debug('[admin/idea-list][success] ideas fetched', { count: ideas.length, total, currentPage, perPage, ms: Date.now() - pageStart })

    const start = total === 0 ? 0 : (currentPage - 1) * perPage + 1
    const end = Math.min(currentPage * perPage, total)

    const buildQuery = (next: Partial<{ page: number; limit: number; status: string }>) => {
      const q = new URLSearchParams()
      const nextStatus = next.status !== undefined ? next.status : status
      return `${q.toString()}`
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Ideas Admin</h1>
            <p className="text-lg text-gray-600">Review and manage submitted investment ideas</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search (UI placeholder; not wired to server query here) */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Search (coming soon)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="lg:w-64 grid grid-cols-2 gap-2">
                <Link href={buildQuery({ status: '' , page: 1})} className={`px-4 py-2 text-center rounded-lg border ${!status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>All</Link>
                <Link href={buildQuery({ status: 'pending', page: 1 })} className={`px-4 py-2 text-center rounded-lg border ${status === 'pending' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Pending</Link>
                <Link href={buildQuery({ status: 'rejected', page: 1 })} className={`px-4 py-2 text-center rounded-lg border ${status === 'rejected' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Rejected</Link>
              </div>
            </div>
          </div>

          {/* Ideas List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {ideas.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No ideas found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idea</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ideas.map((idea) => (
                        <tr key={idea.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <Link href={`/admin/idea/${idea.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                                  {idea.data.title}
                                </Link>
                                <div className="text-xs text-gray-500 line-clamp-1">{truncateText(idea.data.description, 100)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{idea.data.company_name || '—'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              {idea.stock_details.ticker}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium border ${getStatusBadgeStyle(idea.status)}`}>
                              {getStatusIcon(idea.status)}
                              {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(idea.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Link href={`/admin/idea/${idea.id}`} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
                              <Eye className="w-4 h-4" />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-700">
                    {total === 0 ? 'Showing 0 results' : `Showing ${start}-${end} of ${total} results`}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={buildQuery({ page: Math.max(1, currentPage - 1) })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm ${currentPage === 1 ? 'text-gray-400 bg-white border-gray-200 pointer-events-none' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Link>
                    <Link
                      href={buildQuery({ page: currentPage + 1 })}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm ${end >= total ? 'text-gray-400 bg-white border-gray-200 pointer-events-none' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    )

  } catch (error) {
    // Catch any unexpected errors and provide a fallback UI
    console.error('[admin/idea-list][error] Unexpected error in admin ideas list', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Unexpected Error</h2>
            </div>
            <p className="text-red-700 mb-4">
              An unexpected error occurred while loading the admin panel. Please try refreshing the page.
            </p>
            <p className="text-sm text-red-600">
              If the problem persists, please contact your administrator.
            </p>
          </div>
        </main>
      </div>
    )
  }
}