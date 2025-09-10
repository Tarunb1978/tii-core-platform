# Authentication & Authorization Implementation

## Overview
This document outlines the complete authentication and authorization implementation for the admin panel, ensuring secure access control for super_admin users.

## 🔐 **Authentication & Authorization Flow**

### 1. **Extended AuthProvider** (`src/context/authProvider.tsx`)

#### New Features Added:
- **User Profile Fetching**: Automatically fetches user profile and role from Supabase
- **Role-based Access**: Provides `isSuperAdmin` and `isAdmin` boolean flags
- **Profile Refresh**: `refreshUserProfile()` function to update user data
- **Loading States**: Combined loading state for both auth and profile data

#### New Context Properties:
```typescript
type AuthContextType = {
  currentUser: Session | null
  isLoading: boolean
  userProfile: UserProfile | null
  userRole: UserRole | null
  isSuperAdmin: boolean
  isAdmin: boolean
  refreshUserProfile: () => Promise<void>
}
```

### 2. **User Role Utilities** (`src/utils/userRole.ts`)

#### Key Functions:
- **`fetchUserProfile(userId)`**: Fetches user profile from Supabase profiles table
- **`isSuperAdmin(role)`**: Checks if user has super_admin role
- **`isAdmin(role)`**: Checks if user has admin or super_admin role
- **`getAuthHeaders(accessToken)`**: Creates Authorization headers for API requests

#### User Role Types:
```typescript
type UserRole = 'user' | 'super_admin' | 'admin';

interface UserProfile {
  id: string;
  role: UserRole;
  full_name?: string;
  email?: string;
}
```

### 3. **Enhanced API Functions** (`src/utils/adminApi.ts`)

#### Updated Functions with Authentication:
- **`fetchIdeas(status, page, limit, accessToken)`**: Includes JWT token in headers
- **`fetchIdeaById(id, accessToken)`**: Authenticated single idea fetch
- **`updateIdeaStatus(id, status, accessToken)`**: Authenticated status updates

#### Security Features:
- **JWT Token Validation**: All API calls include Authorization headers
- **Error Handling**: Proper handling of 401/403 responses
- **Token Refresh**: Automatic token handling through Supabase

## 🛡️ **Admin Page Security Implementation**

### 1. **Admin Idea List Page** (`src/app/admin/idea-list/page.tsx`)

#### Authentication Gating:
```typescript
// Redirect unauthenticated users
useEffect(() => {
  if (!isLoading && !currentUser) {
    router.replace('/sign-in');
  } else if (!isLoading && currentUser && !isSuperAdmin) {
    router.replace('/unauthorized');
  }
}, [currentUser, isLoading, isSuperAdmin, router]);
```

#### Authorization Features:
- **Role Check**: Only renders for `isSuperAdmin` users
- **Data Protection**: API calls only execute for authorized users
- **Error Handling**: Specific error messages for auth failures
- **Token Passing**: All API calls include access tokens

### 2. **Admin Idea Detail Page** (`src/app/admin/idea/[id]/page.tsx`)

#### Security Implementation:
- **Same Auth Gating**: Identical authentication and authorization checks
- **Protected Actions**: Status updates require super_admin role
- **Error Handling**: Comprehensive error handling for all operations
- **Token Security**: All API calls authenticated with JWT tokens

### 3. **Unauthorized Access Page** (`src/app/unauthorized/page.tsx`)

#### Features:
- **User-friendly Error**: Clear message about access requirements
- **Role Display**: Shows current user role for transparency
- **Navigation Options**: Easy return to previous page or home
- **Help Information**: Guidance for requesting admin access

## 🔒 **Security Features**

### 1. **Multi-layer Protection**
- **Frontend Gating**: UI components only render for authorized users
- **API Authentication**: All backend calls require valid JWT tokens
- **Role Validation**: Server-side role checking in API endpoints
- **Error Handling**: Graceful handling of authentication failures

### 2. **Token Management**
- **Automatic Headers**: JWT tokens automatically included in API requests
- **Token Refresh**: Supabase handles token refresh automatically
- **Secure Storage**: Tokens stored securely in Supabase session

### 3. **Error Handling**
- **401 Unauthorized**: Redirects to sign-in page
- **403 Forbidden**: Redirects to unauthorized page
- **Network Errors**: User-friendly error messages
- **Loading States**: Clear loading indicators during auth checks

## 📋 **Database Requirements**

### Profiles Table Schema:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Required RLS Policies:
```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 🚀 **Usage Examples**

### 1. **Checking User Role in Components**
```typescript
const { currentUser, isLoading, isSuperAdmin, userRole } = useAuth();

if (isLoading) return <LoadingSpinner />;
if (!currentUser) return <SignInPrompt />;
if (!isSuperAdmin) return <UnauthorizedMessage />;
```

### 2. **Making Authenticated API Calls**
```typescript
const accessToken = currentUser?.access_token;
const ideas = await fetchIdeas(status, page, limit, accessToken);
```

### 3. **Handling Authentication Errors**
```typescript
try {
  const data = await fetchIdeas(accessToken);
} catch (error) {
  if (error.message?.includes('401')) {
    router.replace('/sign-in');
  } else if (error.message?.includes('403')) {
    router.replace('/unauthorized');
  }
}
```

## ✅ **Testing Checklist**

### Authentication Flow:
- [ ] Unauthenticated users redirected to sign-in
- [ ] Authenticated non-admin users redirected to unauthorized page
- [ ] Super admin users can access admin pages
- [ ] Loading states display correctly during auth checks

### API Security:
- [ ] All API calls include Authorization headers
- [ ] 401 errors redirect to sign-in
- [ ] 403 errors redirect to unauthorized page
- [ ] Network errors show user-friendly messages

### User Experience:
- [ ] Clear error messages for all failure cases
- [ ] Smooth navigation between auth states
- [ ] Loading indicators during data fetching
- [ ] Responsive design on all devices

## 🔧 **Configuration**

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup:
1. Enable RLS on profiles table
2. Create profiles table with role column
3. Set up RLS policies for profile access
4. Create super_admin users in profiles table

## 📝 **Notes**

- **Role-based Access**: Currently supports 'user', 'admin', 'super_admin' roles
- **Token Security**: JWT tokens are handled securely by Supabase
- **Error Handling**: Comprehensive error handling for all auth scenarios
- **User Experience**: Clear feedback for all authentication states
- **Scalability**: Easy to extend for additional roles and permissions

This implementation provides a robust, secure foundation for admin panel access control while maintaining excellent user experience.

