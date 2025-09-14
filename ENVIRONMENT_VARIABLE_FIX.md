# Environment Variable Fix: Server vs Client Component Issue

## Problem Analysis

### Root Cause
The idea detail page (`/admin/idea/[id]`) was failing because it was trying to access `process.env.SUPABASE_EDGE_FUNCTION_URL` in a **client component** (`'use client'`), where server-only environment variables are not available.

### Why This Happened
1. **Server-only env vars** (without `NEXT_PUBLIC_` prefix) are only accessible in server-side code
2. **Client components** run in the browser where these variables are `undefined`
3. **The idea detail page** was a client component using `useEffect` to fetch data
4. **Next.js 13+** enforces this separation for security and performance reasons

### Why Idea List Worked
The idea list page (`/admin/idea-list`) worked because it's a **server component** that fetches data server-side where environment variables are available.

## Solution Implemented

### Architecture Change
- **Converted** the idea detail page from a client component to a server component
- **Created** a separate client component (`IdeaDetailClient`) for interactive features
- **Moved** data fetching to server-side where env vars are accessible
- **Passed** fetched data as props to the client component

### File Structure
```
src/app/admin/idea/[id]/
├── page.tsx              # Server component (data fetching)
└── IdeaDetailClient.tsx  # Client component (interactivity)
```

## Code Examples

### Server Component (page.tsx)
```typescript
// Server component: fetches data server-side where env vars are available
export default async function AdminIdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: ideaId } = await params

  // Environment variable is available on server
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL
  if (!edgeFunctionUrl || edgeFunctionUrl.trim() === '') {
    throw new Error('Server configuration error: Missing Edge Function URL')
  }

  // Server-side authentication and data fetching
  const supabase = await createSupabaseServerClient()
  // ... auth logic ...

  try {
    const idea = await fetchIdeaByIdServer(ideaId, accessToken, edgeFunctionUrl)
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <IdeaDetailClient initialIdea={idea} ideaId={ideaId} />
        </main>
      </div>
    )
  } catch (error) {
    // Error handling...
  }
}
```

### Client Component (IdeaDetailClient.tsx)
```typescript
'use client'

interface IdeaDetailClientProps {
  initialIdea: IdeaData
  ideaId: string
}

export default function IdeaDetailClient({ initialIdea, ideaId }: IdeaDetailClientProps) {
  const [idea, setIdea] = useState<IdeaData>(initialIdea)
  // ... interactive logic for status updates ...

  return (
    // UI components with interactivity
  )
}
```

## Alternative Solutions

### Option 1: API Route Proxy (Not Implemented)
```typescript
// src/app/api/admin/ideas/[id]/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_URL // Available on server
  // ... proxy logic ...
}
```

### Option 2: Public Environment Variable (Not Recommended)
```env
# .env.local
NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL=https://...
```
**Security Risk**: Exposes the URL to client-side code.

## Debugging Steps

### 1. Check Environment Variable Availability
```typescript
// Server component
console.log('Server - SUPABASE_EDGE_FUNCTION_URL:', process.env.SUPABASE_EDGE_FUNCTION_URL)

// Client component
console.log('Client - SUPABASE_EDGE_FUNCTION_URL:', process.env.SUPABASE_EDGE_FUNCTION_URL) // undefined
```

### 2. Verify Execution Context
```typescript
console.log('typeof window:', typeof window !== 'undefined' ? 'client' : 'server')
```

### 3. Check All Environment Variables
```typescript
console.log('All env vars:', Object.keys(process.env))
console.log('SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
```

## Best Practices

### 1. Server vs Client Component Guidelines
- **Use server components** for data fetching with server-only env vars
- **Use client components** for interactivity (forms, state, event handlers)
- **Pass data as props** from server to client components

### 2. Environment Variable Naming
- **Server-only**: `SUPABASE_EDGE_FUNCTION_URL` (no prefix)
- **Public**: `NEXT_PUBLIC_SUPABASE_URL` (with prefix)
- **Never expose** sensitive URLs or keys to client

### 3. Data Fetching Patterns
```typescript
// ✅ Good: Server component
export default async function ServerPage() {
  const data = await fetchData() // Uses server-only env vars
  return <ClientComponent data={data} />
}

// ❌ Bad: Client component
'use client'
export default function ClientPage() {
  const data = await fetchData() // Can't access server-only env vars
  return <div>{data}</div>
}
```

### 4. Error Handling
- **Validate env vars** on server-side
- **Provide meaningful errors** for missing configuration
- **Handle auth failures** with proper redirects

## Testing the Fix

### 1. Verify Server-Side Logs
Check server console for:
```
[idea-detail][server-debug] Server component - SUPABASE_EDGE_FUNCTION_URL: https://...
[idea-detail][server-fetch] Environment check - baseUrl: https://...
```

### 2. Verify Client-Side Behavior
- Page loads without environment variable errors
- Data is displayed correctly
- Interactive features work (status updates)

### 3. Check Network Requests
- Verify requests are made to correct Edge Function URL
- Check authentication headers are present
- Confirm response data structure

## Summary

The fix successfully resolves the environment variable issue by:
1. **Moving data fetching to server-side** where env vars are available
2. **Maintaining interactivity** through a separate client component
3. **Preserving all existing functionality** while fixing the core issue
4. **Following Next.js 13+ best practices** for server/client component separation

This approach is more secure, performant, and follows React Server Components patterns correctly.
