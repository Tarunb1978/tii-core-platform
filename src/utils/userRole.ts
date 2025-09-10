/**
 * Authentication utilities for API requests
 * 
 * NOTE: This module has been simplified to only handle authentication headers.
 * All role-based authorization is now handled by the backend, which provides
 * better security and eliminates frontend/backend sync issues.
 */

/**
 * Get authorization headers for API requests
 * This is the only function still needed since we defer authorization to backend
 */
export function getAuthHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

