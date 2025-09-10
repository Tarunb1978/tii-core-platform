'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
} from 'lucide-react';
import { useAuth } from '@/context/authProvider';
import { 
  fetchIdeaById, 
  updateIdeaStatus, 
  getStatusBadgeStyle, 
  formatDate,
  type IdeaData 
} from '@/utils/adminApi';

export default function AdminIdeaDetailPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  
  // State management
  const [idea, setIdea] = useState<IdeaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  // Authentication check - only check if user is logged in
  // Authorization is handled by backend which returns 403 for non-super_admin users
  // This approach ensures backend is the single source of truth for permissions
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [currentUser, isLoading, router]);

  // Fetch idea when component mounts
  useEffect(() => {
    if (currentUser && ideaId) {
      loadIdea();
    }
  }, [currentUser, ideaId]);

  const loadIdea = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = currentUser?.access_token;
      const ideaData = await fetchIdeaById(ideaId, accessToken);
      setIdea(ideaData);
    } catch (err: any) {
      console.error('Error loading idea:', err);
      
      // Handle specific error cases
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Authentication required. Please sign in again.');
        router.replace('/sign-in');
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setError('Access denied. Super admin privileges required.');
        router.replace('/unauthorized');
      } else {
        setError(err.message || 'Failed to load idea. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'pending' | 'accepted' | 'rejected') => {
    if (!idea) return;
    
    try {
      setStatusUpdateLoading(true);
      setStatusUpdateError(null);
      setStatusUpdateSuccess(false);
      
      const accessToken = currentUser?.access_token;
      const updatedIdea = await updateIdeaStatus(ideaId, newStatus, accessToken);
      setIdea(updatedIdea);
      setStatusUpdateSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setStatusUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      
      // Handle specific error cases
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setStatusUpdateError('Authentication required. Please sign in again.');
        router.replace('/sign-in');
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        setStatusUpdateError('Access denied. Super admin privileges required.');
        router.replace('/unauthorized');
      } else {
        setStatusUpdateError(err.message || 'Failed to update status. Please try again.');
      }
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5" />;
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Prevent rendering if user is not authenticated
  // Authorization is handled by backend - if user doesn't have admin privileges,
  // they'll get a 403 error and be redirected to unauthorized page
  if (!currentUser) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Idea</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={loadIdea}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <Link
                href="/admin/idea-list"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back to List
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show loading state for idea
  if (loading || !idea) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading idea details...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/idea-list"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideas List
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {idea.data.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Submitted {formatDate(idea.created_at)}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  User ID: {idea.user_id.substring(0, 8)}...
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeStyle(idea.status)}`}>
                  {getStatusIcon(idea.status)}
                  <span className="ml-2 capitalize">{idea.status}</span>
                </span>
              </div>
              
              {/* Status Update Controls */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Update Status:</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate('pending')}
                    disabled={statusUpdateLoading || idea.status === 'pending'}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      idea.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={statusUpdateLoading || idea.status === 'accepted'}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      idea.status === 'accepted'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={statusUpdateLoading || idea.status === 'rejected'}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      idea.status === 'rejected'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Messages */}
        {statusUpdateSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Status Updated Successfully</h3>
                <p className="text-sm text-green-700">The idea status has been updated.</p>
              </div>
            </div>
          </div>
        )}

        {statusUpdateError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <XCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Update Failed</h3>
                <p className="text-sm text-red-700">{statusUpdateError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Company Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <p className="text-sm text-gray-900">{idea.data.company_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Symbol
                </label>
                <p className="text-sm text-gray-900">{idea.stock_details.ticker}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Type
                </label>
                <p className="text-sm text-gray-900">{idea.data.position_type || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Horizon
                </label>
                <p className="text-sm text-gray-900">{idea.data.investment_horizon || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Financial Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Financial Data</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock Price
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.current_price ? `₹${idea.stock_details.current_price}` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  52 Week High
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.week52_high ? `₹${idea.stock_details.week52_high}` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  52 Week Low
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.week52_low ? `₹${idea.stock_details.week52_low}` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.annual_revenue ? `₹${idea.stock_details.annual_revenue} Cr` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EPS
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.eps ? `₹${idea.stock_details.eps}` : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  P/E Ratio
                </label>
                <p className="text-sm text-gray-900">
                  {idea.stock_details.pe_ratio || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Investment Thesis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Investment Thesis</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investment Idea Description
              </label>
              <div 
                className="prose max-w-none text-sm text-gray-900"
                dangerouslySetInnerHTML={{ __html: idea.data.description }}
              />
              {idea.data.word_count && (
                <p className="text-xs text-gray-500 mt-2">
                  Word count: {idea.data.word_count}
                </p>
              )}
            </div>
          </div>

          {/* Additional Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission ID
                </label>
                <p className="text-sm text-gray-900 font-mono">{idea.id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <p className="text-sm text-gray-900 font-mono">{idea.user_id}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">{formatDate(idea.created_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Market
                </label>
                <p className="text-sm text-gray-900">{idea.stock_details.market || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
