# Admin Panel Documentation

## Overview
The admin panel provides super_admin users with the ability to review, manage, and approve/reject submitted investment ideas.

## Features

### 1. Admin Idea List Page (`/admin/idea-list`)
- **View all submitted ideas** in a paginated table format
- **Filter by status**: pending, accepted, rejected
- **Search functionality** across title, description, company name, and ticker
- **Real-time statistics** showing total ideas and status breakdown
- **Responsive design** with mobile-friendly interface

### 2. Admin Idea Detail Page (`/admin/idea/[id]`)
- **Complete idea details** including all form data and stock details
- **Status management** with one-click status updates (pending/accepted/rejected)
- **Rich text display** of investment thesis with HTML formatting
- **User information** and submission metadata
- **Real-time status updates** with success/error feedback

### 3. API Endpoints

#### GET `/api/admin/ideas`
- Fetches all ideas with optional filtering and pagination
- **Query Parameters**:
  - `status`: Filter by status (pending, accepted, rejected)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response**: List of ideas with pagination metadata

#### GET `/api/admin/ideas/[id]`
- Fetches a single idea by ID
- **Response**: Complete idea object with all details

#### PATCH `/api/admin/ideas/[id]/status`
- Updates the status of an idea
- **Body**: `{ "status": "pending" | "accepted" | "rejected" }`
- **Response**: Updated idea object

## Access Control

### Authentication
- All admin endpoints require valid JWT authentication
- User must be logged in to access admin pages

### Authorization
- Only users with `super_admin` role can access admin functionality
- Role validation happens server-side in API endpoints
- Frontend shows admin links only to authenticated users

### Database Schema
The admin panel works with the existing `ideas_submitted` table:
```sql
CREATE TABLE ideas_submitted (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  stock_details JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### For Super Admin Users
1. **Access**: Click "Admin Panel" in the user dropdown menu or visit `/admin/idea-list`
2. **Review Ideas**: Browse through submitted ideas with filtering and search
3. **View Details**: Click "View" on any idea to see complete details
4. **Update Status**: Use the status buttons to approve/reject ideas
5. **Monitor Progress**: Track idea statistics and submission trends

### For Developers
1. **API Integration**: Use the provided API utilities in `src/utils/adminApi.ts`
2. **Customization**: Modify the UI components in `src/app/admin/`
3. **Extending**: Add new admin features by following the existing patterns

## File Structure
```
src/
├── app/
│   ├── admin/
│   │   ├── idea-list/
│   │   │   └── page.tsx          # Admin ideas list page
│   │   └── idea/
│   │       └── [id]/
│   │           └── page.tsx      # Admin idea detail page
│   └── api/
│       └── admin/
│           └── ideas/
│               ├── route.ts      # GET /api/admin/ideas
│               ├── [id]/
│               │   ├── route.ts  # GET /api/admin/ideas/[id]
│               │   └── status/
│               │       └── route.ts # PATCH /api/admin/ideas/[id]/status
├── utils/
│   └── adminApi.ts               # API utilities and types
└── components/
    └── Navbar.tsx               # Updated with admin links
```

## Testing

### Test Access
- **Direct URL**: Visit `/admin/idea-list` directly
- **Navigation**: Use the "Admin Panel" link in the user dropdown
- **Landing Page**: Use the "Admin Panel (Test)" button on the homepage

### Test Data
- Submit ideas using the regular `/submit-idea` form
- Ideas will appear in the admin panel with "pending" status
- Test status updates by clicking the status buttons

## Security Notes

1. **Role-based Access**: Only super_admin users can access admin functionality
2. **Server-side Validation**: All authorization checks happen in API endpoints
3. **JWT Authentication**: All requests require valid authentication tokens
4. **Input Validation**: Status updates are validated against allowed values
5. **Error Handling**: Proper error messages for unauthorized access

## Future Enhancements

1. **Bulk Actions**: Select multiple ideas for bulk status updates
2. **Advanced Filtering**: Date ranges, user filters, etc.
3. **Email Notifications**: Notify users when their ideas are approved/rejected
4. **Audit Log**: Track all admin actions and changes
5. **Analytics Dashboard**: Detailed statistics and reporting
6. **Export Functionality**: Export ideas to CSV/Excel
7. **Comments System**: Allow admins to add comments to ideas
