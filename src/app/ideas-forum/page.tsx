// app/ideas/page.tsx (Server Component by default in Next.js App Router)

import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { Filter, ChevronDown } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { cookies } from 'next/headers'; // to access auth cookies (if any)

// Define Idea type
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
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || '';

// ✅ Server Component
export default async function IdeasForumPage() {
  let ideas: Idea[] = [];
  let error = null;

  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch ideas');
    const json = await res.json();
    ideas = Array.isArray(json?.ideas) ? json.ideas : [];
  } catch (e) {
    console.error(e);
    error = 'Failed to load ideas';
  }

  // Example authentication check (using cookies/session)
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get('auth_token'); // adjust to your auth logic

  const displayIdeas = ideas;

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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">

            {error ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-red-500">
                {error}
              </div>
            ) : displayIdeas.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
                {!isAuthenticated
                  ? 'Login to see latest ideas'
                  : 'No ideas found.'}
              </div>
            ) : (
              <div className="space-y-6">
                {displayIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    disabledNavigate={!isAuthenticated}
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
