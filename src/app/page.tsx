'use client';

import Navbar from '@/components/Navbar';
import OnboardingModal from '@/components/OnboardingModal';
import { useAuth } from "@/context/authProvider";
import Link from "next/link";
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const { currentUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  console.log(currentUser,'user NOice');

  // Check if user should see onboarding modal
  useEffect(() => {
    // Only show onboarding for non-logged-in users on their first visit
    if (!currentUser) {
      const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
      const hasVisitedBefore = localStorage.getItem('has_visited_before');
      
      if (!hasCompletedOnboarding && !hasVisitedBefore) {
        // Mark as visited to prevent showing on subsequent visits
        localStorage.setItem('has_visited_before', 'true');
        // Show onboarding after a short delay for better UX
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    }
  }, [currentUser]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
      />

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-24 pt-40">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ color: '#222' }}>
            Building India&apos;s{" "}
            <span style={{ color: '#4A90E2' }}>Research-Driven</span>{" "}
            Investment Community
          </h2>
          <p className="text-xl mb-12 max-w-4xl mx-auto leading-relaxed" style={{ color: '#444' }}>
            Join thoughtful, long-term investors who share research, build conviction together, 
            and grow wealth through collective wisdom—not speculation.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href={currentUser ? "/ideas-forum" : "/sign-up"}
              className="px-10 py-4 text-lg font-medium transition-colors border"
              style={{ 
                backgroundColor: '#4A90E2', 
                color: 'white', 
                borderColor: '#4A90E2',
                borderRadius: '4px'
              }}
            >
              {currentUser ? "Go to Ideas Forum" : "Join the Community"}
            </a>
            <a
              href="/submit-idea-guidelines"
              className="px-10 py-4 text-lg font-medium transition-colors border"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#4A90E2', 
                borderColor: '#4A90E2',
                borderRadius: '4px'
              }}
            >
              Share Your Investment Conviction
            </a>
          </div>
          <p className="mt-6 text-sm text-center" style={{ color: '#666' }}>
            Members who share a quality investment idea gain full, real-time access to all new research and discussions.<br />
            Without a submission, you can browse ideas that are 45 days old.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mt-12 max-w-5xl mx-auto text-center">
          <div className="p-12" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <h3 className="text-3xl font-bold mb-6" style={{ color: '#222' }}>Our Mission</h3>
            <p className="text-lg leading-relaxed" style={{ color: '#444' }}>
              We believe lasting wealth is built through patient, research-driven investing in India&apos;s growing economy. 
              Guided by the &apos;mastermind&apos; principle—that collective insight exceeds individual thinking—we invite passionate investors who seek to deeply understand businesses and build conviction together. 
              India&apos;s journey mirrors the rise of global capitalism, offering exceptional opportunities for those committed to thoughtful, long-term investing—not speculation.
            </p>

          </div>
        </div>

        {/* Research Value Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-8" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#222' }}>Featured Investment Thesis</h3>
            <p className="text-sm mb-4" style={{ color: '#444' }}>D-Mart&apos;s Edge in Indian Retail</p>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Deep dive into how D-Mart&apos;s operational efficiency creates sustainable competitive advantages in India&apos;s fragmented retail market.</p>
            <Link href="/ideas-forum" className="text-sm font-medium" style={{ color: "#4A90E2" }}> → Read Research </Link>
          </div>

          <div className="p-8" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#222' }}>Investment Principle of the Week</h3>
            <p className="text-sm mb-4" style={{ color: '#444' }}>Margin of Safety—Why it Matters Most</p>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Understanding how Benjamin Graham&apos;s margin of safety principle protects capital and creates opportunities in volatile markets.</p>
            <Link href="/topic-of-the-week" className="text-sm font-medium" style={{ color: '#4A90E2' }}>→ Learn More</Link>
          </div>

          <div className="p-8" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
            <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#222' }}>Editor&apos;s Pick</h3>
            <p className="text-sm mb-4" style={{ color: '#444' }}>Dr. Lal Pathlabs&apos; Business Model Analysis</p>
            <p className="text-xs mb-4" style={{ color: '#888' }}>Comprehensive analysis of how Dr. Lal Pathlabs built a defensible moat in India&apos;s diagnostic services sector.</p>
            <Link href="/ideas-forum" className="text-sm font-medium" style={{ color: '#4A90E2' }}>→ Explore Analysis</Link>
          </div>
        </div>
      </main>

      {/* Buddha Image Section */}
      <div className="buddha-container">
        <img 
          className="buddha-image"
          src="/assets/images/Final.jpeg" 
          alt="Buddha in golden lotus mandala representing mindful investing"
        />
      </div>

      <style jsx global>{`
        .buddha-container {
          width: 100%;
          min-height: 220px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #FAFAFA;
          padding: 0;
          margin: 0;
          box-sizing: border-box;
        }

        .buddha-image {
          max-width: 320px;
          width: 90%;
          min-width: 180px;
          height: auto;
          display: block;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .buddha-container {
            width: 100% !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          .buddha-image {
            width: 90% !important;
            max-width: 320px !important;
            min-width: 180px !important;
            margin: 0 auto !important;
            display: block !important;
          }
        }
      `}</style>

      {/* Features Section */}
      <section className="py-12" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-3" style={{ color: '#222' }}>Why Join Our Research Community?</h3>
            <p className="text-xl" style={{ color: '#888' }}>Collaborative analysis, shared research, and collective conviction building</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-5">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: '#222' }}>Research Sharing</h4>
              <p style={{ color: '#444' }}>Share your investment research and analysis with fellow investors who value deep, fundamental thinking</p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: '#222' }}>Collaborative Analysis</h4>
              <p style={{ color: '#444' }}>Engage in thoughtful discussions that challenge assumptions and strengthen your investment thesis</p>
            </div>

            <div className="text-center p-5">
              <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#666' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: '#222' }}>Collective Wisdom</h4>
              <p style={{ color: '#444' }}>Build conviction through shared knowledge and learn from diverse perspectives on long-term value creation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Value Testimonials */}
      <section className="py-12" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-3" style={{ color: '#222' }}>Research That Drives Results</h3>
            <p className="text-xl" style={{ color: '#888' }}>How our community&apos;s research approach creates real investment value</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                  <span className="text-lg font-medium" style={{ color: '#666' }}>A</span>
                </div>
                <p className="italic mb-4" style={{ color: '#444' }}>
                  &quot;The D-Mart analysis here helped me understand retail moats better than any brokerage report. 
                  The community&apos;s deep-dive approach is unmatched.&quot;
                </p>
                <div className="text-sm" style={{ color: '#888' }}>- Arjun, Portfolio Manager, Mumbai</div>
              </div>
            </div>
            
            <div className="p-5" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                  <span className="text-lg font-medium" style={{ color: '#666' }}>R</span>
                </div>
                <p className="italic mb-4" style={{ color: '#444' }}>
                  &quot;Margin of safety discussions here saved me from three potential value traps. 
                  The principle-focused approach works.&quot;
                </p>
                <div className="text-sm" style={{ color: '#888' }}>- Rajesh, Research Analyst, Bangalore</div>
              </div>
            </div>
            
            <div className="p-5" style={{ backgroundColor: 'white', borderRadius: '8px' }}>
              <div className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F5F5F5', borderRadius: '6px' }}>
                  <span className="text-lg font-medium" style={{ color: '#666' }}>S</span>
                </div>
                <p className="italic mb-4" style={{ color: '#444' }}>
                  &quot;Dr. Lal Pathlabs analysis here was more thorough than my own research. 
                  This community&apos;s standards are exceptional.&quot;
                </p>
                <div className="text-sm" style={{ color: '#888' }}>- Suresh, Fund Manager, Delhi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Integrity Pledge Section */}
      <section className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-6" style={{ color: '#222' }}>Research Integrity Pledge</h3>
            <p className="text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: '#444' }}>
              Our unwavering commitment to quality, principle-driven research that builds lasting wealth through thoughtful analysis
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="p-8" style={{ backgroundColor: '#F8F9FA', borderRadius: '12px', border: '2px solid #E8F4FD' }}>
              <h4 className="text-2xl font-semibold mb-8 text-center" style={{ color: '#222' }}>Our Pledge to You</h4>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#4A90E2', borderRadius: '50%', flexShrink: 0 }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: '#222' }}>Zero Noise, Maximum Signal</h5>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                      Every piece of research undergoes rigorous quality control. We filter out speculation, hype, and short-term noise to deliver only actionable, fundamental analysis that drives long-term wealth creation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#4A90E2', borderRadius: '50%', flexShrink: 0 }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: '#222' }}>Ad-Free, Bias-Free Research</h5>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                      No sponsored content, no hidden agendas, no promotional bias. Our research is driven solely by fundamental analysis and conviction-building insights that serve your long-term investment success.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#4A90E2', borderRadius: '50%', flexShrink: 0 }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: '#222' }}>Principle-Driven Analysis</h5>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                      Every research piece is grounded in timeless investment principles—margin of safety, competitive moats, management quality, and sustainable growth. We build conviction through rigorous fundamental analysis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#4A90E2', borderRadius: '50%', flexShrink: 0 }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: '#222' }}>Collective Wisdom, Individual Conviction</h5>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                      We believe in the power of collaborative analysis while respecting individual investment decisions. Our community strengthens your research process without compromising your independent judgment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 flex items-center justify-center mr-4 mt-1" style={{ backgroundColor: '#4A90E2', borderRadius: '50%', flexShrink: 0 }}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-lg font-semibold mb-2" style={{ color: '#222' }}>Long-Term Wealth Creation Focus</h5>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                      We're not here for quick gains or market timing. Our research is designed to help you build generational wealth through patient, thoughtful investing in India's growth story.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-10">
                <h4 className="text-2xl font-bold mb-4" style={{ color: '#222' }}>Join the Conviction Movement</h4>
                <p className="text-lg mb-8" style={{ color: '#444' }}>
                  Be part of a community that values quality over quantity, conviction over consensus, and long-term wealth over short-term gains.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/sign-up"
                    className="px-8 py-3 text-lg font-medium transition-all duration-200 border"
                    style={{ 
                      backgroundColor: '#4A90E2', 
                      color: 'white', 
                      borderColor: '#4A90E2',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.backgroundColor = '#357ABD';
                      target.style.borderColor = '#357ABD';
                      target.style.transform = 'translateY(-2px)';
                      target.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.backgroundColor = '';
                      target.style.borderColor = '';
                      target.style.transform = '';
                      target.style.boxShadow = '';
                    }}
                  >
                    Join the Conviction Movement
                  </a>
                  <a
                    href="/submit-idea-guidelines"
                    className="px-8 py-3 text-lg font-medium transition-all duration-200 border"
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: '#4A90E2', 
                      borderColor: '#4A90E2',
                      borderRadius: '6px'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.backgroundColor = '#4A90E2';
                      target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLElement;
                      target.style.backgroundColor = 'transparent';
                      target.style.color = '#4A90E2';
                    }}
                  >
                    Share Your Research
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" style={{ backgroundColor: '#4A90E2' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h3 className="text-3xl font-bold mb-6" style={{ color: 'white' }}>Ready to Join Our Research Community?</h3>
          <p className="text-xl mb-12" style={{ color: '#E8F4FD' }}>Start sharing your investment research and learn from fellow thoughtful investors</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/sign-up"
              className="px-10 py-4 text-lg font-medium transition-colors border"
              style={{ 
                backgroundColor: 'white', 
                color: '#4A90E2', 
                borderColor: 'white',
                borderRadius: '4px'
              }}
            >
              Join the Community
            </a>
            <a
              href="/submit-idea-guidelines"
              className="px-10 py-4 text-lg font-medium transition-colors border"
              style={{ 
                backgroundColor: 'transparent', 
                color: 'white', 
                borderColor: 'white',
                borderRadius: '4px'
              }}
            >
              Share Your Investment Conviction
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ backgroundColor: '#222' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-3">
                <Link href="/" className="navbar-brand flex items-center">
                  {/* Logo Image - Using Next.js Image component for optimization */}
                  <Image 
                    src="/assets/images/logo.svg" 
                    alt="The Indian Investors Logo" 
                    width={40} 
                    height={40} 
                    className="mr-2"
                  />
                  </Link>
              </div>
              <div className="flex items-center mb-3">
                  <span className="text-xl font-bold text-white transition-colors hover:text-white">The Indian Investors</span>
                
              </div>
              
              
              <p className="text-sm leading-relaxed" style={{ color: '#888' }}>Building India&apos;s research-driven investment community through collaborative wisdom and shared conviction.</p>
            </div>

            {/* Quick Links Column */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-6" style={{ color: 'white' }}>Quick Links</h4>
              <ul className="space-y-3" style={{ color: '#888' }}>
                <li><Link href="#" className="text-sm transition-colors hover:text-white">Our Mission</Link></li>
                <li><Link href="/topic-of-the-week" className="text-sm transition-colors hover:text-white">Trending Topics</Link></li>
                <li><Link href="/ideas-forum" className="text-sm transition-colors hover:text-white">Ideas Forum</Link></li>
                <li><Link href="#" className="text-sm transition-colors hover:text-white">Contact</Link></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-6" style={{ color: 'white' }}>Resources</h4>
              <ul className="space-y-3" style={{ color: '#888' }}>
                <li><a href="#" className="text-sm transition-colors hover:text-white">Research Library <span className="text-xs" style={{ color: '#666' }}>(Coming Soon)</span></a></li>
                <li><a href="#" className="text-sm transition-colors hover:text-white">Investment Methodology <span className="text-xs" style={{ color: '#666' }}>(Coming Soon)</span></a></li>
                <li><a href="#" className="text-sm transition-colors hover:text-white">Community Guidelines <span className="text-xs" style={{ color: '#666' }}>(Coming Soon)</span></a></li>
                <li><a href="#" className="text-sm transition-colors hover:text-white">Research Newsletter <span className="text-xs" style={{ color: '#666' }}>(Coming Soon)</span></a></li>
              </ul>
            </div>

            {/* Connect/Contact Column */}
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold mb-6" style={{ color: 'white' }}>Connect</h4>
              
              {/* Twitter Section */}
              <div className="mb-6">
                <a href="https://x.com/TheIndInvestors" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors hover:text-white" style={{ color: '#888' }}>Twitter/X</a>
                <p className="text-xs mt-1" style={{ color: '#666' }}>Follow us on X (formerly Twitter) for news and insights.</p>
              </div>

              {/* Contact Section */}
              <div>
                <h5 className="text-sm font-semibold mb-3" style={{ color: 'white' }}>Contact</h5>
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  For feedback or suggestions, email us at contact@indianinvestors.com. We read every message and value your input.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px solid #444' }}>
            <p className="text-sm" style={{ color: '#888' }}>&copy; 2024 Indian Investors Community. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
