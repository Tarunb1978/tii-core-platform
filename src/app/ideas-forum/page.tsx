'use client';

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { Filter, ChevronDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authProvider';

// Define Comment and Idea types
type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
};

type Idea = {
  id: string;
  data: {
    company_name: string;
    symbol: string;
    main_idea: string;
    long_or_short?: string;
    submitter_name?: string;
    submitted_date?: string;
    number_of_likes?: number;
    stock_price_today?: number;
    stock_price_at_submission?: number;
    fifty_two_wk_high?: number;
    fifty_two_wk_low?: number;
    last_12_months_eps?: number;
    last_12_months_revenues_m?: number;
    long_term_debt_m?: number;
  };
  likes_count?: number;
  bookmarks_count?: number;
  discussions_count?: number;
  created_at?: string;
  status?: string;
  idea_discussion?: Comment[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_URL_ACTIONS = process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';

export default function IdeasForumPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'recent' | 'liked' | 'bookmarked' | 'commented'>('recent');
  const [userActions, setUserActions] = useState<{
    likes: string[];
    bookmarks: string[];
    comments: string[];
  }>({ likes: [], bookmarks: [], comments: [] });
  
  const user = useAuth();
  const isAuthenticated = !!user?.currentUser?.access_token;

  // Fetch ideas
  useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch ideas');
        const json = await res.json();
        const fetchedIdeas = Array.isArray(json?.ideas) ? json.ideas : [];
        setIdeas(fetchedIdeas);
        setFilteredIdeas(fetchedIdeas);
      } catch (e) {
        console.error(e);
        setError('Failed to load ideas');
      } finally {
        setLoading(false);
      }
    }
    fetchIdeas();
  }, []);

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

  // Filter ideas based on selected filter
  useEffect(() => {
    if (!ideas.length) return;

    let filtered: Idea[] = [];

    switch (filterType) {
      case 'recent':
        filtered = [...ideas].sort((a, b) => {
          const dateA = new Date(a.created_at || a.data.submitted_date || '');
          const dateB = new Date(b.created_at || b.data.submitted_date || '');
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'liked':
        filtered = ideas.filter(idea => userActions.likes.includes(idea.id));
        break;
      case 'bookmarked':
        filtered = ideas.filter(idea => userActions.bookmarks.includes(idea.id));
        break;
      case 'commented':
        filtered = ideas.filter(idea => userActions.comments.includes(idea.id));
        break;
      default:
        filtered = ideas;
    }

    setFilteredIdeas(filtered);
  }, [ideas, filterType, userActions]);

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar (can be client) */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ideas Forum
            </h1>
            <p className="text-gray-600 mt-1">
              Discover community-submitted investment ideas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                All Market Caps
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'recent' | 'liked' | 'bookmarked' | 'commented')}
                className="appearance-none flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 pr-8 cursor-pointer"
              >
                <option value="recent">Recent</option>
                <option value="liked">Liked</option>
                <option value="bookmarked">Bookmarked</option>
                <option value="commented">Commented</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">

            {loading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
                Loading ideas...
              </div>
            ) : error ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-red-500">
                {error}
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
                {!isAuthenticated
                  ? 'Login to see latest ideas'
                  : filterType === 'recent' 
                    ? 'No ideas found.'
                    : `No ${filterType} ideas found.`}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    disabledNavigate={false}
                    onIdeaUpdate={handleIdeaUpdate}
                  />
                ))}
              </div>
            )}
          </div>

          <aside>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Market Insights
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nifty 50</span>
                  <span className="font-medium text-gray-900">24,835.75</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sensex</span>
                  <span className="font-medium text-gray-900">81,455.40</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bank Nifty</span>
                  <span className="font-medium text-gray-900">52,180.25</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: { background: '#363636', color: '#fff' },
        }}
      />
    </div>
  );
}
