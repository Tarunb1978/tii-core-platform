'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  updateIdeaStatus, 
  getStatusBadgeStyle, 
  formatDate,
  type IdeaData 
} from '@/utils/adminApi'
import { createClient } from '@/lib/supabase/client'

interface IdeaDetailClientProps {
  initialIdea: IdeaData
  ideaId: string
}

export default function IdeaDetailClient({ initialIdea, ideaId }: IdeaDetailClientProps) {
  const router = useRouter()
  const [idea, setIdea] = useState<IdeaData>(initialIdea)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)

  const handleStatusUpdate = async (newStatus: 'pending' | 'accepted' | 'rejected') => {
    if (!idea) return
    
    try {
      setStatusUpdateLoading(true)
      setStatusUpdateError(null)
      setStatusUpdateSuccess(false)

      console.log('[idea-detail-client][status-update-debug] Starting status update process:', {
        ideaId,
        newStatus,
        currentStatus: idea.status,
        timestamp: new Date().toISOString()
      })

      // Get access token from Supabase client instead of localStorage
      const supabase = createClient()
      console.log('[idea-detail-client][status-update-debug] Created Supabase client, getting session...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // DEBUG: Comprehensive session analysis
      console.log('[idea-detail-client][status-update-debug] Session analysis:', {
        hasSession: !!session,
        hasSessionError: !!sessionError,
        sessionError: sessionError?.message,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        tokenType: session?.token_type,
        expiresAt: session?.expires_at,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'unknown'
        } : null
      })
      
      if (sessionError) {
        console.error('[idea-detail-client][status-update-debug] Session error:', sessionError)
        setStatusUpdateError('Authentication error. Please sign in again.')
        router.replace('/sign-in')
        return
      }
      
      const accessToken = session?.access_token
      if (!accessToken) {
        console.log('[idea-detail-client][status-update-debug] No access token found, redirecting to sign-in')
        router.replace('/sign-in')
        return
      }

      // DEBUG: Token analysis before making request
      console.log('[idea-detail-client][status-update-debug] Access token analysis:', {
        tokenLength: accessToken.length,
        tokenPrefix: accessToken.substring(0, 20) + '...',
        tokenSuffix: '...' + accessToken.substring(accessToken.length - 10),
        tokenType: typeof accessToken,
        isJWT: accessToken.includes('.')
      })

      console.log('[idea-detail-client][status-update-debug] About to call updateIdeaStatus with:', {
        ideaId,
        newStatus,
        hasAccessToken: !!accessToken
      })

      // DEBUG: Compare with working list-fetch pattern
      console.log('[idea-detail-client][status-update-debug] Comparison with working list-fetch:', {
        listFetchPattern: 'Direct Edge Function call with Authorization header',
        statusUpdatePattern: 'API route proxy call with Authorization header',
        listFetchUrl: 'SUPABASE_EDGE_FUNCTION_URL (server-side)',
        statusUpdateUrl: '/api/admin/ideas/[id]/status (client-side)',
        listFetchMethod: 'GET',
        statusUpdateMethod: 'PATCH',
        listFetchAuth: 'Bearer token in Authorization header',
        statusUpdateAuth: 'Bearer token in Authorization header (same)',
        note: 'Both use same auth pattern, but different endpoints'
      })
      
      const updatedIdea = await updateIdeaStatus(ideaId, newStatus, accessToken)
      
      console.log('[idea-detail-client][status-update-debug] Status update completed successfully:', {
        ideaId: updatedIdea?.id,
        oldStatus: idea.status,
        newStatus: updatedIdea?.status
      })
      
      setIdea(updatedIdea)
      setStatusUpdateSuccess(true)
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusUpdateSuccess(false), 3000)
    } catch (err: any) {
      console.error('[idea-detail-client][status-update-debug] Error updating status:', {
        error: err,
        message: err.message,
        stack: err.stack,
        ideaId,
        newStatus
      })
      
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setStatusUpdateError('Authentication required. Please sign in again.')
        router.replace('/sign-in')
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setStatusUpdateError('Access denied. Super admin privileges required.')
        router.replace('/unauthorized')
      } else {
        setStatusUpdateError(err.message || 'Failed to update status. Please try again.')
      }
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  if (!idea) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No idea data available</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/idea-list" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ideas List
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{idea.data.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                User ID: {idea.user_id}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(idea.created_at)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeStyle(idea.status)}`}>
              {idea.status === 'accepted' && <CheckCircle className="w-4 h-4" />}
              {idea.status === 'rejected' && <XCircle className="w-4 h-4" />}
              {idea.status === 'pending' && <Clock className="w-4 h-4" />}
              {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
        
        {statusUpdateError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{statusUpdateError}</p>
          </div>
        )}
        
        {statusUpdateSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">Status updated successfully!</p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => handleStatusUpdate('pending')}
            disabled={statusUpdateLoading || idea.status === 'pending'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              idea.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {statusUpdateLoading ? 'Updating...' : 'Set Pending'}
          </button>
          
          <button
            onClick={() => handleStatusUpdate('accepted')}
            disabled={statusUpdateLoading || idea.status === 'accepted'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              idea.status === 'accepted'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {statusUpdateLoading ? 'Updating...' : 'Accept'}
          </button>
          
          <button
            onClick={() => handleStatusUpdate('rejected')}
            disabled={statusUpdateLoading || idea.status === 'rejected'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              idea.status === 'rejected'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {statusUpdateLoading ? 'Updating...' : 'Reject'}
          </button>
        </div>
      </div>

      {/* Idea Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investment Thesis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Thesis</h2>
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: idea.data.description }}
          />
        </div>

        {/* Stock Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-900">{idea.data.company_name || '—'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Ticker</p>
                <p className="font-medium text-gray-900">{idea.stock_details.ticker}</p>
              </div>
            </div>
            
            {idea.stock_details.current_price && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Current Price</p>
                  <p className="font-medium text-gray-900">${idea.stock_details.current_price}</p>
                </div>
              </div>
            )}
            
            {idea.stock_details.target_price && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Target Price</p>
                  <p className="font-medium text-gray-900">${idea.stock_details.target_price}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
