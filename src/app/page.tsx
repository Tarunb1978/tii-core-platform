'use client';

import Navbar from '@/components/Navbar';
import { useAuth } from "@/context/authProvider";
export default function Home() {
  const user = useAuth();
  console.log(user,'user NOice');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-36">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Building India's{" "}
            <span className="text-indigo-600">Research-Driven</span>{" "}
            Investment Community
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thoughtful, long-term investors who share research, build conviction together, 
            and grow wealth through collective wisdom—not speculation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Join the Community
            </a>
            <a
              href="/submit-idea"
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Share Your Investment Conviction
            </a>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mt-16 max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Inspired by Napoleon Hill's mastermind principle, we've created a collaborative alliance 
              where serious investors share research, challenge assumptions, and build conviction together. 
              This isn't about quick tips or market speculation—it's about systematic, research-backed 
              investing through collective intelligence.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-indigo-600 mb-2">50K+</div>
            <div className="text-gray-600">Active Members</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-indigo-600 mb-2">₹100Cr+</div>
            <div className="text-gray-600">Portfolio Value</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-indigo-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Join Our Research Community?</h3>
            <p className="text-xl text-gray-600">Collaborative analysis, shared research, and collective conviction building</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Research Sharing</h4>
              <p className="text-gray-600">Share your investment research and analysis with fellow investors who value deep, fundamental thinking</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Collaborative Analysis</h4>
              <p className="text-gray-600">Engage in thoughtful discussions that challenge assumptions and strengthen your investment thesis</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Collective Wisdom</h4>
              <p className="text-gray-600">Build conviction through shared knowledge and learn from diverse perspectives on long-term value creation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">What Our Community Members Say</h3>
            <p className="text-xl text-gray-600">Stories from investors who've found value in collaborative research</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">A</span>
                </div>
                <p className="text-gray-600 italic mb-4">
                  "The collaborative analysis here has completely changed how I approach investment research. 
                  Having my assumptions challenged by thoughtful investors has made me a better analyst."
                </p>
                <div className="text-sm text-gray-500">- Early Member, Mumbai</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">R</span>
                </div>
                <p className="text-gray-600 italic mb-4">
                  "This isn't about quick tips or speculation. It's about building conviction through 
                  shared research and collective wisdom. Exactly what I was looking for."
                </p>
                <div className="text-sm text-gray-500">- Research Analyst, Bangalore</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">S</span>
                </div>
                <p className="text-gray-600 italic mb-4">
                  "The quality of research shared here is exceptional. It's refreshing to find a community 
                  focused on long-term value creation rather than short-term gains."
                </p>
                <div className="text-sm text-gray-500">- Portfolio Manager, Delhi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Join Our Research Community?</h3>
          <p className="text-xl text-indigo-100 mb-8">Start sharing your investment research and learn from fellow thoughtful investors</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sign-up"
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Join the Community
            </a>
            <a
              href="/submit-idea"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Share Your Research
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">₹</span>
                </div>
                <span className="ml-2 text-xl font-bold">Indian Investors</span>
              </div>
              <p className="text-gray-400">Building India's research-driven investment community through collaborative wisdom and shared conviction.</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Our Mission</a></li>
                <li><a href="/topic-of-the-week" className="hover:text-white transition-colors">Research Topics</a></li>
                <li><a href="/ideas-forum" className="hover:text-white transition-colors">Ideas Forum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Research Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investment Methodology</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Research Newsletter</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Telegram</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Indian Investors Community. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
