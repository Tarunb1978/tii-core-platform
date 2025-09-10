'use client';

import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TestSignOutPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleTestSignOut = async () => {
    console.log('Test sign out initiated...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
        router.push('/');
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Sign Out</h1>
      <div className="mb-4">
        <p>Current User: {currentUser ? 'Logged in' : 'Not logged in'}</p>
        <p>User ID: {currentUser?.user?.id || 'N/A'}</p>
      </div>
      <button
        onClick={handleTestSignOut}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Test Sign Out
      </button>
    </div>
  );
}

