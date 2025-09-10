'use client';

import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DebugNavbarPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [testResult, setTestResult] = useState('');

  const testSignOut = async () => {
    console.log('=== DEBUG TEST SIGN OUT ===');
    setTestResult('Testing...');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setTestResult(`Error: ${error.message}`);
        console.error('Sign out error:', error);
      } else {
        setTestResult('Success! Check console for logs.');
        console.log('Sign out successful');
        setTimeout(() => router.push('/'), 1000);
      }
    } catch (error) {
      setTestResult(`Exception: ${error}`);
      console.error('Sign out exception:', error);
    }
  };

  const testSignIn = async () => {
    console.log('=== DEBUG TEST SIGN IN ===');
    setTestResult('Redirecting to sign in...');
    router.push('/sign-in');
  };

  const testClick = () => {
    console.log('=== CLICK TEST SUCCESSFUL ===');
    setTestResult('Click test successful!');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug Navbar & Sign Out</h1>
      
      <div className="space-y-4 mb-8">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Auth State</h2>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Current User: {currentUser ? 'Yes' : 'No'}</p>
          <p>User ID: {currentUser?.user?.id || 'N/A'}</p>
        </div>

        <div className="p-4 bg-blue-100 rounded">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <p>{testResult || 'No tests run yet'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test Buttons</h2>
          <div className="space-x-4 space-y-2">
            <button
              onClick={testClick}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Click Handler
            </button>
            
            <button
              onClick={testSignIn}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Sign In
            </button>
            
            <button
              onClick={testSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Test Sign Out
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Console Logs</h2>
          <p className="text-sm text-gray-600">
            Open browser console (F12) to see detailed logs. Look for:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
            <li>"=== NAVBAR COMPONENT RENDERING ==="</li>
            <li>"handleSignOut function defined: function"</li>
            <li>"=== CLICK TEST SUCCESSFUL ==="</li>
            <li>"=== DEBUG TEST SIGN OUT ==="</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
