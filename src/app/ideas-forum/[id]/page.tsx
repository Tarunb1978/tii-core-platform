import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

async function getIdea(id: string): Promise<Idea | null> {
  try {
    // Ideally call a single-idea endpoint, but here we fetch all and filter
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch ideas');

    const json = await res.json();
    const ideas: Idea[] = Array.isArray(json?.ideas) ? json.ideas : [];
    return ideas.find(i => i.id === id) || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdea(id);

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

        {!idea ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-8 text-center">
            Idea not found
          </div>
        ) : (
          <IdeaCard idea={idea} showBreadcrumb={false} />
        )}
      </main>
    </div>
  );
}
