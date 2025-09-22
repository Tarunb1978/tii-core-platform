'use client'

import { useState, useEffect, useMemo } from 'react'
import { redirect, useRouter } from 'next/navigation'
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
  type IdeaData 
} from '@/utils/adminApi'
import { createClient } from '@/lib/supabase/client'

interface IdeaDetailClientProps {
  initialIdea: IdeaData
  ideaId: string,
  supabaseUrl: string
}

export default function IdeaDetailClient({ initialIdea, ideaId, supabaseUrl }: IdeaDetailClientProps) {
  const router = useRouter()
  const [idea, setIdea] = useState<IdeaData>(initialIdea)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const [authorName, setAuthorName] = useState<string | null>(null)

  // ✅ Format UTC -> IST
  function formatISTDateTime(utcDate: string | undefined) {
    if (!utcDate) return ""
    const normalizedDate = utcDate.endsWith("Z") ? utcDate : utcDate + "Z"
    return new Date(normalizedDate).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  // ✅ Fetch username from app_user using idea.user_id
  useEffect(() => {
    const fetchAuthor = async () => {
      if (!idea?.user_id) return
      try {
        const { data, error } = await supabase
          .from("app_user")
          .select("id, name, email")
          .eq("id", idea.user_id)
          .single()

        if (error) {
          console.error("Error fetching author:", error)
          setAuthorName(null)
        } else {
          setAuthorName(data?.name || data?.email || "Market Expert")
        }
      } catch (err) {
        console.error("Author fetch error:", err)
        setAuthorName(null)
      }
    }

    fetchAuthor()
  }, [idea?.user_id, supabase])

  const handleStatusUpdate = async (newStatus: 'pending' | 'accepted' | 'rejected') => {
    if (!idea) return
    
    try {
      setStatusUpdateLoading(true)
      setStatusUpdateError(null)
      setStatusUpdateSuccess(false)

      const supabaseClient = await createClient()
      const { data: sessionData } = await supabaseClient.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const edgeFunctionUrl = supabaseUrl
      const url = `${edgeFunctionUrl}/rest-idea-submitted/${ideaId}/status`
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }
      const requestBody = {
        status: newStatus === 'accepted' ? 'approved' : newStatus,
      }

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`)
      }

      setStatusUpdateSuccess(true)
      setTimeout(() => setStatusUpdateSuccess(false), 3000)
      router.push('/admin/idea-list')

    } catch (err: any) {
      console.error('[idea-detail-client][status-update-debug] Error updating status:', err)
      if (err.message?.includes('401')) {
        setStatusUpdateError('Authentication required. Please sign in again.')
        router.replace('/sign-in')
      } else if (err.message?.includes('403')) {
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
      <div className="mb-4">
        <Link 
          href="/admin/idea-list" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ideas List
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{idea.data.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {authorName || "Market Expert"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatISTDateTime(idea.created_at)}
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Update Status</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate('accepted')}
              disabled={statusUpdateLoading || idea.status === 'accepted'}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                idea.status === 'rejected'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {statusUpdateLoading ? 'Updating...' : 'Reject'}
            </button>
          </div>
        </div>
        
        {statusUpdateError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <p className="text-red-700">{statusUpdateError}</p>
          </div>
        )}
        
        {statusUpdateSuccess && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
            <p className="text-green-700">Status updated successfully!</p>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Thesis - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Investment Thesis</h2>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: idea.data.description }}
            />
          </div>
        </div>

        {/* Right Sidebar - All Details Stacked */}
        <div className="lg:col-span-1 space-y-4">
          {/* Submission Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Submission Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Submitted By</p>
                  <p className="font-medium text-gray-900">{authorName || "Market Expert"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium text-gray-900">{formatISTDateTime(idea.created_at)}</p>
                </div>
              </div>

              {idea.data.submission_timestamp && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Submission Timestamp</p>
                    <p className="font-medium text-gray-900">{formatISTDateTime(idea.data.submission_timestamp)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Idea ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{idea.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company & Investment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Company & Investment Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium text-gray-900">{idea.data.company_name || '—'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ticker Symbol</p>
                  <p className="font-medium text-gray-900">{idea.stock_details.ticker || idea.data.ticker || '—'}</p>
                </div>
              </div>

              {idea.data.position_type && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Position Type</p>
                    <p className="font-medium text-gray-900">{idea.data.position_type}</p>
                  </div>
                </div>
              )}

              {idea.data.investment_horizon && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Investment Horizon</p>
                    <p className="font-medium text-gray-900">{idea.data.investment_horizon}</p>
                  </div>
                </div>
              )}

              {idea.data.market_cap && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Market Cap</p>
                    <p className="font-medium text-gray-900">{idea.data.market_cap}</p>
                  </div>
                </div>
              )}

              {idea.data.word_count && (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Word Count</p>
                    <p className="font-medium text-gray-900">{idea.data.word_count} words</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Data */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Financial Data</h2>
            <div className="space-y-4">
              {idea.stock_details.current_price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.current_price}</p>
                  </div>
                </div>
              )}
              
              {idea.stock_details.target_price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Target Price</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.target_price}</p>
                  </div>
                </div>
              )}

              {idea.stock_details.week52_high && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">52 Week High</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.week52_high}</p>
                  </div>
                </div>
              )}

              {idea.stock_details.week52_low && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">52 Week Low</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.week52_low}</p>
                  </div>
                </div>
              )}

              {idea.stock_details.annual_revenue && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Annual Revenue</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.annual_revenue} Cr</p>
                  </div>
                </div>
              )}

              {idea.stock_details.eps && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Earnings Per Share (EPS)</p>
                    <p className="font-medium text-gray-900">₹{idea.stock_details.eps}</p>
                  </div>
                </div>
              )}

              {idea.stock_details.pe_ratio && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">P/E Ratio</p>
                    <p className="font-medium text-gray-900">{idea.stock_details.pe_ratio}</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </>
  )
}
