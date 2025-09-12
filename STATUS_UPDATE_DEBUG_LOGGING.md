# Status Update Debug Logging Implementation

## Overview
Added comprehensive debug logging to trace the 403 Forbidden issue when updating idea status. The logging covers the entire request path from client component to API route.

## Debug Logging Added

### 1. **Client Component Logging** (`IdeaDetailClient.tsx`)

#### **Session Analysis**
```typescript
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
```

#### **Token Analysis**
```typescript
console.log('[idea-detail-client][status-update-debug] Access token analysis:', {
  tokenLength: accessToken.length,
  tokenPrefix: accessToken.substring(0, 20) + '...',
  tokenSuffix: '...' + accessToken.substring(accessToken.length - 10),
  tokenType: typeof accessToken,
  isJWT: accessToken.includes('.')
})
```

#### **Comparison with Working List-Fetch**
```typescript
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
```

### 2. **API Function Logging** (`adminApi.ts` - `updateIdeaStatus`)

#### **Token Analysis**
```typescript
console.log('[updateIdeaStatus][token] Access token analysis:', {
  callId,
  hasToken: !!accessToken,
  tokenType: typeof accessToken,
  tokenLength: accessToken?.length,
  tokenPrefix: accessToken?.substring(0, 20) + '...',
  tokenSuffix: '...' + accessToken?.substring(accessToken.length - 10)
})
```

#### **Header Construction**
```typescript
console.log('[updateIdeaStatus][headers] Header construction:', {
  callId,
  hasAccessToken: !!accessToken,
  headersGenerated: Object.keys(headers),
  authHeaderPresent: 'Authorization' in (headers as any),
  authHeaderValue: (headers as any).Authorization ? `${(headers as any).Authorization.substring(0, 20)}...` : 'none'
})
```

#### **Request Details**
```typescript
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
```

#### **Response Analysis**
```typescript
console.log('[updateIdeaStatus][response] Response received:', {
  callId,
  status: response.status,
  ok: response.ok,
  statusText: response.statusText,
  ms: Date.now() - start,
  url: response.url
})
```

## What the Debug Logs Will Reveal

### 1. **Token Issues**
- Whether the access token is present and valid
- Token format and structure (JWT validation)
- Token expiration status
- User role information

### 2. **Request Construction**
- Whether headers are properly constructed
- Authorization header presence and format
- Request body structure
- URL construction

### 3. **Network Issues**
- Response status codes
- Error messages from the API
- Request timing
- Network connectivity

### 4. **Authentication Flow**
- Session validity
- Token acquisition process
- Comparison with working list-fetch pattern

## Expected Debug Output

When you click "Accept" or "Update" on an idea, you should see logs like:

```
[idea-detail-client][status-update-debug] Starting status update process: { ideaId: "...", newStatus: "accepted", ... }
[idea-detail-client][status-update-debug] Session analysis: { hasSession: true, hasAccessToken: true, ... }
[idea-detail-client][status-update-debug] Access token analysis: { tokenLength: 1234, isJWT: true, ... }
[updateIdeaStatus][token] Access token analysis: { hasToken: true, tokenLength: 1234, ... }
[updateIdeaStatus][headers] Header construction: { authHeaderPresent: true, ... }
[updateIdeaStatus][request] Full request details: { method: "PATCH", url: "/api/admin/ideas/...", ... }
[updateIdeaStatus][response] Response received: { status: 403, ok: false, ... }
```

## Key Differences to Investigate

### **Working List-Fetch vs Status Update**

| Aspect | List-Fetch (Working) | Status Update (403) |
|--------|---------------------|-------------------|
| **Location** | Server component | Client component |
| **Endpoint** | Direct Edge Function | API route proxy |
| **Method** | GET | PATCH |
| **Auth** | Server-side Supabase client | Client-side Supabase client |
| **Token Source** | Server session | Client session |

## Next Steps

1. **Run the status update** and check browser console for debug logs
2. **Compare token values** between working list-fetch and failing status update
3. **Check API route logs** to see if the request reaches the backend
4. **Verify user role** in the session analysis logs
5. **Check token expiration** and session validity

The debug logs will help identify whether the issue is:
- Missing or invalid access token
- Incorrect header construction
- User role/permission issues
- API route configuration problems
- Network/connectivity issues
