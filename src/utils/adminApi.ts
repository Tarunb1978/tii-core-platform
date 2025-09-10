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
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`/api/admin/ideas?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching ideas:', error);
    throw error;
  }
}

/**
 * Fetch a single investment idea by ID
 */
export async function fetchIdeaById(id: string, accessToken?: string): Promise<IdeaData> {
  try {
    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`/api/admin/ideas/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching idea:', error);
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
    const headers = accessToken ? getAuthHeaders(accessToken) : {
      'Content-Type': 'application/json',
    };

    const response = await fetch(`/api/admin/ideas/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating idea status:', error);
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
