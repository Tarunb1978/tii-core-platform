'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function SubmitIdeaGuidelines() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchProfile = useCallback(async () => {
    if (!currentUser) return; // only fetch if user exists
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No access token');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL}/app-user/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();

      setProfile(data.profile || data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, supabase]);

  useEffect(() => {
    if (currentUser) fetchProfile();
  }, [currentUser, fetchProfile]);

  // ✅ New handler for your button
  const handleProceedToForm = async () => {
    if (!currentUser) {
      router.push('/sign-in'); // redirect only now
      return;
    }

    // optionally verify token before proceeding
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    // ✅ Redirect to submit page only when logged in
    router.push('/submit-idea');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />

      {/* Guidelines Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-6" style={{ color: '#222' }}>Guidelines for Submitting Your Investment Idea</h1>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto" style={{ color: '#444' }}>
              Thank you for your dedication to producing thoughtful research. By sharing your well-crafted investment ideas, you are taking an important step toward contributing to India's investment community.
            </p>
          </div>

          <div className="bg-white rounded-lg p-10 mb-8" style={{ borderRadius: '8px' }}>
            <ol className="space-y-8 text-left max-w-5xl mx-auto">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>1</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>India-centric Research Focus</p>
                  <p style={{ color: '#444' }}>Your thesis must demonstrate a deep understanding of India’s unique business environment, including its regulatory framework, economic policies, regional market dynamics, and relevant government initiatives. Incorporate context-specific factors such as fiscal reforms, sectoral trends, or consumer behavior peculiar to India.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>2</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Responsible Use of AI</p>
                  <p style={{ color: '#444' }}>Submissions should be primarily original and human-driven. AI tools may assist in data gathering or formatting, but all analysis, interpretation, and conclusions must be your own. Please disclose any AI assistance used in your research process.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>3</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Accurate and Recent Financial D</p>
                  <p style={{ color: '#444' }}>Include precise, up-to-date financial metrics such as ticker symbols, stock prices, PE ratios, and other valuation indicators. Use data no older than 30 days prior to submission, sourced from credible platforms like NSE, BSE, or company filings.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>4</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Comprehensive and Structured Write-up</p>
                  <p style={{ color: '#444' }}>Ensure your thesis is clear, complete, and self-sufficient with well-organized sections covering background, financial analysis, competitive landscape, management quality, risks, and investment thesis. Support conclusions with concrete data and references.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>5</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Innovative and Unique Insights</p>
                  <p style={{ color: '#444' }}>Aim to deliver fresh perspectives that go beyond commonly discussed ideas. Highlight underexplored sectors, emerging trends in small or mid-cap stocks, or novel valuation angles. Examples or case studies enhancing the narrative are welcome.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>6</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Concise and Action Oriented</p>
                  <p style={{ color: '#444' }}>Keep submissions focused and practical, with a word limit of approximately 1,200 words. Present at least three actionable takeaways or investment recommendations that avoid speculation and rely on robust evidence.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>7</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Feedback and Reapplication</p>
                  <p style={{ color: '#444' }}>f your thesis is not accepted, you will receive constructive feedback to guide improvements. You may refine and resubmit your thesis after a minimum of two weeks, incorporating recommended changes to enhance quality and clarity.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg mb-8 max-w-4xl mx-auto" style={{ backgroundColor: '#F0F7FF', borderRadius: '8px' }}>
            <p className="text-center font-medium text-lg" style={{ color: '#4A90E2' }}>
              Only members who submit a quality idea gain full access to the latest ideas submitted by community investors. Without submission, you can browse ideas 90 days old or older.
            </p>
          </div>

          <div className="text-center">
  <button
    onClick={handleProceedToForm}
    className="px-8 py-4 text-lg font-medium text-white bg-blue-500 rounded-xl shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all duration-300"
  >
    Proceed to Submit Your Idea
  </button>
</div>

        </div>
      </section>
    </div>
  );
}
