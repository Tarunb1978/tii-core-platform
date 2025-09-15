import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createSupabaseServerClient } from '@/app/auth/action'
import { 
  ArrowLeft, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  AlertCircle
} from 'lucide-react'
import { 
  getStatusBadgeStyle, 
  formatDate,
  type IdeaData 
} from '@/utils/adminApi'
import IdeaDetailClient from './IdeaDetailClient'


export default async function AdminIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: ideaId } = await params

  // Validate environment variable on server
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL
  if (!edgeFunctionUrl || edgeFunctionUrl.trim() === '') {
    console.error('[idea-detail][server-error] Missing SUPABASE_EDGE_FUNCTION_URL on server')
    throw new Error('Server configuration error: Missing Edge Function URL')
  }

  // Server-side authentication
  const supabase = await createSupabaseServerClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData?.user) {
    console.log('[idea-detail][server-debug] No authenticated user, redirecting to sign-in')
    redirect('/sign-in')
  }

  // Get access token for Edge Function call
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token
  
  if (!accessToken) {
    console.log('[idea-detail][server-debug] No access token, redirecting to sign-in')
    redirect('/sign-in')
  }

  
  try {
    const idea = await fetchIdeaByIdServer(ideaId, accessToken, edgeFunctionUrl)
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <IdeaDetailClient initialIdea={idea} ideaId={ideaId} supabaseUrl={edgeFunctionUrl} />
        </main>
      </div>
    )
  } catch (error: any) {
    console.error('[idea-detail][server-error] Failed to fetch idea:', error)
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      notFound()
    }
    
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      redirect('/unauthorized')
    }
    
    // Return error UI for other cases
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-800">Error Loading Idea</h2>
            </div>
            <p className="text-red-700 mb-4">{error.message || 'Failed to load idea. Please try again.'}</p>
            <Link
              href="/admin/idea-list"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Ideas List
            </Link>
          </div>
        </main>
      </div>
    )
  }
}

// Server-side fetch function that uses environment variables
async function fetchIdeaByIdServer(
  id: string, 
  accessToken: string, 
  baseUrl: string
): Promise<IdeaData> {
  const callId = Math.random().toString(36).slice(2, 8)
  const start = Date.now()


  // Construct the single idea endpoint URL
  const url = `${baseUrl.replace(/\/$/, '')}/rest-idea-submitted/${encodeURIComponent(id)}`
  

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  console.log('[idea-detail][server-fetch] Response received:', { 
    status: response.status, 
    ok: response.ok, 
    ms: Date.now() - start 
  })

  if (response.status === 401) {
    throw new Error('Authentication required')
  }
  
  if (response.status === 403) {
    throw new Error('Access denied. Super admin privileges required.')
  }
  
  if (response.status === 404) {
    throw new Error('Idea not found')
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  const json = await response.json()
  console.log('[idea-detail][server-fetch] Successfully parsed response:', { 
    hasIdeaProperty: 'idea' in json,
    responseKeys: Object.keys(json)
  })
  
  // Return the idea object directly (Edge Function returns { idea: IdeaData } shape)
  return json.idea || json
}
