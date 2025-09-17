'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function SubmitIdeaGuidelines() {
  const router = useRouter();

  const handleProceedToForm = () => {
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
                  <p style={{ color: '#444' }}>Your thesis should demonstrate deep understanding of India's unique business environment, regulatory landscape, and economic context.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F0F7FF', color: '#4A90E2' }}>2</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>No AI-Generated Ideas</p>
                  <p style={{ color: '#444' }}>Purely AI-generated submissions will be rejected immediately. Original, human-driven research and insight are essential.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>3</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Accurate Financial Details</p>
                  <p style={{ color: '#444' }}>Include up-to-date and precise details like current ticker symbols, stock prices, PE ratios, and other key financial metrics to avoid rejection.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>4</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Write-Up Completeness</p>
                  <p style={{ color: '#444' }}>Your submission must be clear, comprehensive, and well-supported, standing confidently on its own.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>5</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Unique Insights Only</p>
                  <p style={{ color: '#444' }}>We encourage ideas that bring fresh perspectives rather than repeating commonly discussed themes.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>6</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Concise and Actionable</p>
                  <p style={{ color: '#444' }}>Submissions should be realistic, actionable, and avoid speculation or vagueness.</p>
                </div>
              </li>

              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm font-semibold mr-4" style={{ backgroundColor: '#F5F5F5', color: '#666' }}>7</span>
                <div>
                  <p className="font-semibold text-lg mb-2" style={{ color: '#222' }}>Reapply After Refinement</p>
                  <p style={{ color: '#444' }}>If not admitted, refine your thesis and reapply after two weeks.</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg mb-8 max-w-4xl mx-auto" style={{ backgroundColor: '#F0F7FF', borderRadius: '8px' }}>
            <p className="text-center font-medium text-lg" style={{ color: '#4A90E2' }}>
              Only members who submit a quality idea gain full access to the latest ideas submitted by community investors. Without submission, you can browse ideas 45 days old or older.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={handleProceedToForm}
              className="inline-block px-8 py-4 text-lg font-medium transition-colors hover:opacity-90"
              style={{ 
                backgroundColor: '#4A90E2', 
                color: 'white', 
                borderRadius: '4px'
              }}
            >
              Proceed to Submit Your Idea
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
