import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { Filter, ChevronDown } from 'lucide-react';

// Define the type
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function getIdeas(): Promise<Idea[]> {
  try {
    const res = await fetch(API_URL, {
      cache: 'no-store', // always fetch fresh data
    });

    if (!res.ok) {
      throw new Error('Failed to fetch ideas');
    }

    const json = await res.json();
    return Array.isArray(json?.ideas) ? json.ideas : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function IdeasForumPage() {
  const ideas = await getIdeas();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Ideas Forum</h1>
            <p className="text-gray-600 mt-1">Discover community-submitted investment ideas.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* These controls need to be client-side for interactivity */}
            {/* So we will make them separate client components */}
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
            {ideas.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
                No ideas found.
              </div>
            ) : (
              <div className="space-y-6">
                {ideas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
          </div>

          <aside>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Market Insights</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-600">Nifty 50</span><span className="font-medium text-gray-900">24,835.75</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Sensex</span><span className="font-medium text-gray-900">81,455.40</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600">Bank Nifty</span><span className="font-medium text-gray-900">52,180.25</span></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
