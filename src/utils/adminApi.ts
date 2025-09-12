/**
 * Admin API utilities for managing investment ideas
 * 
 * IMPORTANT: This module defers all authorization checks to the backend.
 * The frontend only handles authentication (user login status) and relies on
 * the backend to enforce role-based access control. This approach ensures:
 * 
 * 1. Security: Backend is the single source of truth for authorization
 * 2. Consistency: No sync issues between frontend role state and backend reality
 * 3. Simplicity: Frontend doesn't need to manage complex role state
 * 
 * When users without admin privileges attempt restricted operations, the backend
 * returns HTTP 403 Forbidden, which the frontend handles by redirecting to
 * the unauthorized page.
 */

import { getAuthHeaders } from './userRole';

export interface IdeaData {
  id: string;
  user_id: string;
  data: {
    title: string;
    description: string;
    company_name?: string;
    position_type?: string;
    investment_horizon?: string;
    word_count?: number;
    submission_timestamp?: string;
  };
  stock_details: {
    ticker: string;
    current_price?: number;
    target_price?: number;
    week52_high?: number;
    week52_low?: number;
    annual_revenue?: number;
    eps?: number;
    pe_ratio?: number;
    currency?: string;
    market?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface IdeaListResponse {
  ideas: IdeaData[];
  total: number;
  page: number;
  limit: number;
}

export interface StatusUpdateRequest {
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Fetch all investment ideas with optional filtering and pagination
 */
export async function fetchIdeas(
  status?: string,
  page: number = 1,
  limit: number = 10,
  accessToken?: string
): Promise<IdeaListResponse> {
  try {
    const callId = Math.random().toString(36).slice(2, 8)
    const start = Date.now()
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    console.debug('[adminApi.fetchIdeas][start]', { callId, status, page, limit })
    const response = await fetch(`/api/admin/ideas?${params.toString()}`, {
      method: 'GET',
      headers,
    });
    console.debug('[adminApi.fetchIdeas][response]', { callId, statusCode: response.status, ms: Date.now() - start })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.debug('[adminApi.fetchIdeas][error]', { callId, errorData })
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const jsonStart = Date.now()
    const json = await response.json();
    console.debug('[adminApi.fetchIdeas][success]', { callId, items: json?.ideas?.length ?? 0, parseMs: Date.now() - jsonStart, totalMs: Date.now() - start })
    return json;
  } catch (error) {
    console.error('[adminApi.fetchIdeas] Error fetching ideas:', error);
    throw error;
  }
}

/**
 * Fetch a single investment idea by ID
 * Refactored to use Supabase Edge Function directly, mirroring fetchIdeas structure
 * for consistent auth handling, error processing, and environment variable usage
 */
export async function fetchIdeaById(id: string, accessToken?: string): Promise<IdeaData> {
  try {
    const callId = Math.random().toString(36).slice(2, 8)
    const start = Date.now()

    // DEBUG: Comprehensive environment variable and execution context logging
    console.log('[adminApi.fetchIdeaById][env-debug] Environment check - SUPABASE_EDGE_FUNCTION_URL:', process.env.SUPABASE_EDGE_FUNCTION_URL);
    console.log('[adminApi.fetchIdeaById][env-debug] Environment check - typeof window:', typeof window !== 'undefined' ? 'client' : 'server');
    console.log('[adminApi.fetchIdeaById][env-debug] Environment check - NODE_ENV:', process.env.NODE_ENV);
    console.log('[adminApi.fetchIdeaById][env-debug] Environment check - all env keys containing SUPABASE:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
    console.log('[adminApi.fetchIdeaById][env-debug] Environment check - all process.env keys:', Object.keys(process.env));
    
    // DEBUG: Detailed env var analysis
    const envVar = process.env.SUPABASE_EDGE_FUNCTION_URL;
    console.log('[adminApi.fetchIdeaById][env-debug] Env var analysis - type:', typeof envVar);
    console.log('[adminApi.fetchIdeaById][env-debug] Env var analysis - length:', envVar?.length);
    console.log('[adminApi.fetchIdeaById][env-debug] Env var analysis - truthy:', !!envVar);
    console.log('[adminApi.fetchIdeaById][env-debug] Env var analysis - trimmed length:', envVar?.trim()?.length);

    // Validate required environment variable to prevent runtime crashes
    const baseUrl = process.env.SUPABASE_EDGE_FUNCTION_URL
    if (!baseUrl || baseUrl.trim() === '') {
      console.error('[adminApi.fetchIdeaById][config-error] Missing SUPABASE_EDGE_FUNCTION_URL');
      console.error('[adminApi.fetchIdeaById][config-error] Env var value:', envVar);
      console.error('[adminApi.fetchIdeaById][config-error] Env var type:', typeof envVar);
      console.error('[adminApi.fetchIdeaById][config-error] Available SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
      throw new Error('Server configuration error: Missing Edge Function URL')
    }

    // Construct the single idea endpoint URL by appending the idea ID
    const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(id)}`

    // DEBUG: Comprehensive URL construction and execution context logging
    console.log('[adminApi.fetchIdeaById][url-debug] Pre-fetch debug - constructed URL:', url);
    console.log('[adminApi.fetchIdeaById][url-debug] Pre-fetch debug - baseUrl:', baseUrl);
    console.log('[adminApi.fetchIdeaById][url-debug] Pre-fetch debug - encoded id:', encodeURIComponent(id));
    console.log('[adminApi.fetchIdeaById][url-debug] Pre-fetch debug - execution context:', typeof window !== 'undefined' ? 'client-side' : 'server-side');
    console.log('[adminApi.fetchIdeaById][url-debug] Pre-fetch debug - URL validation:', {
      isValidUrl: url.startsWith('http'),
      hasProtocol: url.includes('://'),
      endsWithId: url.endsWith(encodeURIComponent(id))
    });

    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    console.debug('[adminApi.fetchIdeaById][start]', { callId, id, url })
    console.log('[adminApi.fetchIdeaById][fetch-debug] About to make fetch request with:', {
      url,
      method: 'GET',
      hasAuthHeader: !!(headers as any).Authorization,
      headers: Object.keys(headers)
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    console.debug('[adminApi.fetchIdeaById][response]', { callId, statusCode: response.status, ms: Date.now() - start })
    console.log('[adminApi.fetchIdeaById][response-debug] Fetch response details:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.debug('[adminApi.fetchIdeaById][error]', { callId, errorData })
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const jsonStart = Date.now()
    const json = await response.json();
    console.debug('[adminApi.fetchIdeaById][success]', { callId, ideaId: json?.id, parseMs: Date.now() - jsonStart, totalMs: Date.now() - start })
    console.log('[adminApi.fetchIdeaById][success-debug] JSON response analysis:', {
      hasIdeaProperty: 'idea' in json,
      hasIdProperty: 'id' in json,
      responseKeys: Object.keys(json),
      ideaId: json?.id || json?.idea?.id,
      responseType: typeof json
    });
    
    // Return the idea object directly (Edge Function returns { idea: IdeaData } shape)
    // Extract the idea from the response if it's wrapped, otherwise return the response as-is
    const result = json.idea || json;
    console.log('[adminApi.fetchIdeaById][return-debug] Returning idea data:', {
      hasResult: !!result,
      resultId: result?.id,
      resultKeys: result ? Object.keys(result) : 'null'
    });
    
    return result;
  } catch (error) {
    console.error('[adminApi.fetchIdeaById] Error fetching idea:', error);
    throw error;
  }
}

/**
 * Update the status of an investment idea
 */
export async function updateIdeaStatus(
  id: string,
  status: 'pending' | 'accepted' | 'rejected',
  accessToken?: string
): Promise<IdeaData> {
  try {
    const callId = Math.random().toString(36).slice(2, 8)
    const start = Date.now()

    // DEBUG: Comprehensive token and request logging
    console.log('[updateIdeaStatus][token] Access token analysis:', {
      callId,
      hasToken: !!accessToken,
      tokenType: typeof accessToken,
      tokenLength: accessToken?.length,
      tokenPrefix: accessToken?.substring(0, 20) + '...',
      tokenSuffix: '...' + accessToken?.substring(accessToken.length - 10)
    })

    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    // DEBUG: Log header construction details
    console.log('[updateIdeaStatus][headers] Header construction:', {
      callId,
      hasAccessToken: !!accessToken,
      headersGenerated: Object.keys(headers),
      authHeaderPresent: 'Authorization' in (headers as any),
      authHeaderValue: (headers as any).Authorization ? `${(headers as any).Authorization.substring(0, 20)}...` : 'none'
    })

    const requestBody = { status }
    const url = `/api/admin/ideas/${id}/status`

    // DEBUG: Log complete request details
    console.log('[updateIdeaStatus][request] Full request details:', {
      callId,
      method: 'PATCH',
      url,
      headers: {
        'Content-Type': (headers as any)['Content-Type'],
        'Authorization': (headers as any).Authorization ? 'Bearer [MASKED]' : 'none'
      },
      body: requestBody,
      ideaId: id,
      newStatus: status
    })

    console.log('[updateIdeaStatus][fetch] Making PATCH request to:', url)
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('[updateIdeaStatus][response] Response received:', {
      callId,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      ms: Date.now() - start,
      url: response.url
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[updateIdeaStatus][error] Request failed:', {
        callId,
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestUrl: url,
        requestMethod: 'PATCH'
      })
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json()
    console.log('[updateIdeaStatus][success] Status update successful:', {
      callId,
      ideaId: result?.id,
      newStatus: result?.status,
      ms: Date.now() - start
    })

    return result;
  } catch (error) {
    console.error('[updateIdeaStatus][catch] Error updating idea status:', error);
    throw error;
  }
}

/**
 * Get status badge styling based on status
 */
export function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
