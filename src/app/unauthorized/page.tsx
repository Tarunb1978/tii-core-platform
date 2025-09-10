'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/context/authProvider';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [currentUser, isLoading, router]);

  // Show loading state while authentication is being checked
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
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
            <ShieldX className="h-12 w-12 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          {/* Description */}
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-lg text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              This area is restricted to admin users only. If you believe you should have access, 
              please contact your system administrator.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </button>
          </div>

          {/* Additional Help */}
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Need Admin Access?
            </h3>
            <p className="text-sm text-blue-700">
              If you believe you should have access to this page, please contact your system administrator 
              to request admin privileges.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

