'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import IdeaCard from '@/components/IdeaCard';

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

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ideaId, setIdeaId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setIdeaId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!ideaId) return;

    const fetchIdea = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First try to fetch from the list endpoint and find the specific idea
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch ideas');
        }
        const json = await res.json();
        const ideas: Idea[] = Array.isArray(json?.ideas) ? json.ideas : [];
        const foundIdea = ideas.find(i => i.id === ideaId);
        
        if (foundIdea) {
          setIdea(foundIdea);
        } else {
          setError('Idea not found');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to fetch idea');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIdea();
  }, [ideaId]);

  const handleBackClick = () => {
    router.push('/ideas-forum');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Reddit-style back button */}
          <div className="mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </div>
              <span className="text-sm font-medium">Back to Ideas Forum</span>
            </button>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500">
            Loading idea...
          </div>
        </main>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Reddit-style back button */}
          <div className="mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </div>
              <span className="text-sm font-medium">Back to Ideas Forum</span>
            </button>
          </div>
          
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-8 text-center">
            {error || 'Idea not found'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Reddit-style back button */}
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </div>
            <span className="text-sm font-medium">Back to Ideas Forum</span>
          </button>
        </div>
        
        <IdeaCard 
          idea={idea} 
          showBreadcrumb={false}
        />
      </main>
    </div>
  );
}


