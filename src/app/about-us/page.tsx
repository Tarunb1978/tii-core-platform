'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { faqs } from '@/data/faq';

export default function AboutUsPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Main Heading */}
          <h1 className="text-4xl font-bold text-black mb-8 text-center">
            About Us
          </h1>

          {/* Philosophy Section */}
          <section className="mb-8">
            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-black mb-6">Our Story and Values</h2>
              <div className="text-gray-700 leading-relaxed space-y-4" style={{ fontSize: '15px' }}>
                <p>
                  TheIndianInvestors.com is a community-driven platform founded by a group of Indian investors who are passionate about long-term, evidence-based investing and collaborative learning. Built out of a desire to foster rigorous investment research specifically tailored for Indian markets, our platform brings together serious investors seeking high standards of transparency, analysis, and quality in every idea shared.
                </p>
                <p>
                Inspired by best practices in global value investing communities, we strive to foster excellence and meaningful exchange tailored specifically for Indian markets. Recognizing the unique dynamics of our local context, we decided to provide a dedicated platform that facilitates focused research collaboration. We firmly believe India is entering a new wave of capitalism, unveiling unprecedented opportunities for long-term investment
                </p>
                <p>
                  Through shared research and collective wisdom, our community aims to empower members to recognize, research, and capitalize on these transformative trends. We are not SEBI registered investment advisors, but strive to be a trusted forum where investors can exchange insights, support each other's learning, and make better investment decisions based on rigorous, well-researched ideas.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-2xl font-semibold text-black mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    aria-expanded={openFaqIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {openFaqIndex === index ? (
                        <svg
                          className="w-5 h-5 text-gray-500 transition-all duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-500 transition-all duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg font-medium text-gray-800 flex-1">
                      {faq.question}
                    </span>
                  </button>
                  
                  <div
                    id={`faq-answer-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaqIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    aria-hidden={openFaqIndex !== index}
                  >
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
