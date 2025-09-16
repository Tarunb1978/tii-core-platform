'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import {
  Eye,
  Calendar,
  TrendingUp,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
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

type FilterStatus = 'all' | 'pending' | 'rejected'

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

export default function AdminIdeaListClient() {
  const [allIdeas, setAllIdeas] = useState<IdeaData[]>([])
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaData[]>([])
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch all ideas from API
  const fetchIdeas = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/ideas/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (response.status === 401) {
        throw new Error('Authentication required')
      }
      if (response.status === 403) {
        throw new Error('Access denied')
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.status}`)
      }

      const data: IdeaListResponse = await response.json()
      setAllIdeas(data.ideas || [])
      setFilteredIdeas(data.ideas || [])
    } catch (err) {
      console.error('Error fetching ideas:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter ideas based on current filter
  const filterIdeas = (filter: FilterStatus) => {
    setCurrentFilter(filter)
    
    if (filter === 'all') {
      setFilteredIdeas(allIdeas)
    } else {
      const filtered = allIdeas.filter(idea => idea.status === filter)
      setFilteredIdeas(filtered)
    }
  }

  // Load ideas on component mount
  useEffect(() => {
    fetchIdeas()
  }, [])

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    fetchIdeas()
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-600">Loading ideas...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error state
  if (error) {
    if (error === 'Authentication required') {
      window.location.href = '/sign-in'
      return null
    }
    if (error === 'Access denied') {
      window.location.href = '/unauthorized'
      return null
    }
    if (error === 'Edge function URL not configured') {
      return <ConfigurationError message="Server configuration error: Missing Edge Function URL. Please contact your administrator." />
    }
    return <DataError message={error} onRetry={handleRetry} />
  }

  const total = filteredIdeas.length
  const start = total === 0 ? 0 : 1
  const end = total

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
          <div className="flex justify-center">
            {/* Status Filter */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => filterIdeas('all')}
                className={`px-6 py-2 text-center rounded-lg border transition-colors ${
                  currentFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => filterIdeas('pending')}
                className={`px-6 py-2 text-center rounded-lg border transition-colors ${
                  currentFilter === 'pending'
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => filterIdeas('rejected')}
                className={`px-6 py-2 text-center rounded-lg border transition-colors ${
                  currentFilter === 'rejected'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredIdeas.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentFilter === 'all' ? 'No ideas found' : `No ${currentFilter} ideas found`}
              </p>
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
                    {filteredIdeas.map((idea) => (
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

              {/* Results Summary */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  {total === 0 ? 'Showing 0 results' : `Showing ${start}-${end} of ${total} results`}
                  {currentFilter !== 'all' && (
                    <span className="ml-2 text-gray-500">
                      (filtered by {currentFilter})
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
