'use client';

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';

type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
};

type Idea = {
  id: string;
  user_id?: string;
  data: {
    title: string;
    ticker: string;
    description: string; // HTML
    company_name: string;
    market_cap: string; // 'Large' | 'Mid' | 'Small'
    position_type?: string; // Long/Short
    investment_horizon?: string;
    current_price?: number;
    submission_timestamp?: string;
    week52_low?: number;
    week52_high?: number;
    target_price?: number;
  };
  likes_count?: number;
  bookmarks_count?: number;
  discussions_count?: number;
  created_at?: string;
  status?: string;
  idea_discussion?: Comment[];
};


const API_URL_ACTIONS = process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>('');
  const [userActions, setUserActions] = useState<{
    likes: string[];
    bookmarks: string[];
    comments: string[];
  }>({ likes: [], bookmarks: [], comments: [] });
  const user = useAuth();

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    getParams();
  }, [params]);

useEffect(() => {
  if (!id) return;

  async function getIdea() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn("No access token found – user may not be signed in");
        setIdea(null);
        setLoading(false);
        return;
      }

      // ✅ Use dynamic route instead of query param
      const res = await fetch(`/api/fetchIdeas/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error fetching idea:", errorText);
        throw new Error("Failed to fetch idea");
      }

      const json = await res.json();
      setIdea(json.idea || null);
    } catch (e) {
      console.error(e);
      setIdea(null);
    } finally {
      setLoading(false);
    }
  }

  getIdea();
}, [id]);

// Fetch user actions
  useEffect(() => {
    async function fetchUserActions() {
      if (!user?.currentUser?.access_token) return;

      try {
        const res = await fetch(`${API_URL_ACTIONS}/self`, {
          headers: {
            Authorization: `Bearer ${user.currentUser.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserActions({
            likes: data.likes || [],
            bookmarks: data.bookmarks || [],
            comments: data.comments || [],
          });
        }
      } catch (err) {
        console.error('Error fetching user actions:', err);
      }
    }

    fetchUserActions();
  }, [user?.currentUser?.access_token]);

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdea(updatedIdea);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/ideas-forum"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm font-medium">Back to Ideas Forum</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
            Loading idea...
          </div>
        ) : !idea ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-8 text-center">
            Idea not found
          </div>
        ) : (
          <IdeaCard 
            idea={idea} 
            showBreadcrumb={false} 
            onIdeaUpdate={handleIdeaUpdate}
          />
        )}
      </main>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}