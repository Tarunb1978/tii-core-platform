'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalSteps = 4;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleClose = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg flex flex-col mx-auto"
        style={{ 
          animation: 'modalSlideIn 0.3s ease-out',
          width: '600px',
          height: '500px',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        {/* Minimal Header with Step Indicator */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i + 1 === currentStep 
                      ? 'bg-gray-800' 
                      : i + 1 < currentStep 
                        ? 'bg-gray-400' 
                        : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Fixed Layout */}
        <div className={`flex-1 px-6 flex items-center justify-center ${currentStep === 3 ? 'py-2' : 'py-4'}`}>
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-2xl font-light mb-4 text-gray-900">
                  Welcome to India's Research-Driven Investment Community
                </h3>
                <p className="text-base leading-relaxed text-gray-600 mb-4">
                  Join thoughtful, long-term investors who share research, build conviction together, 
                  and grow wealth through collective wisdom—not speculation.
                </p>
                
                <blockquote className="text-sm font-light text-gray-700 italic">
                  "We believe lasting wealth is built through patient, research-driven investing in India's growing economy."
                </blockquote>
              </div>
            )}

            {/* Step 2: Our Philosophy */}
            {currentStep === 2 && (
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-2xl font-light mb-4 text-gray-900">
                  Here, Noise Ends and Conviction Begins
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-light mb-2 text-gray-800">Our Unique 90-Day Rule</h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Only members who submit a high-quality, research-backed investment idea gain access to full discussions and real-time ideas. 
                      Others see content with a 90-day delay, ensuring quality over quantity.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-light mb-2 text-gray-800">No Stock Tips—Just Conviction</h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                      We don't provide stock tips or trading advice. Instead, we build conviction through rigorous research, 
                      fundamental analysis, and collaborative wisdom that helps you make informed long-term investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: How to Participate */}
            {currentStep === 3 && (
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-light mb-3 text-gray-900">
                  How to Participate
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="w-4 h-4 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-light text-gray-600">1</span>
                    </div>
                    <h4 className="text-base font-light mb-1 text-gray-800">Submit Your Highest-Conviction Idea</h4>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Share your most researched, analytical, long-term thesis on an Indian market opportunity. 
                      Quality over quantity—we want your best thinking.
                    </p>
                  </div>

                  <div>
                    <div className="w-4 h-4 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-light text-gray-600">2</span>
                    </div>
                    <h4 className="text-base font-light mb-1 text-gray-800">Participate in Collaborative Discussions</h4>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Engage in thoughtful discussions that challenge assumptions and strengthen your investment thesis. 
                      Learn from diverse perspectives while building conviction.
                    </p>
                  </div>

                  <div>
                    <div className="w-4 h-4 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-light text-gray-600">3</span>
                    </div>
                    <h4 className="text-base font-light mb-1 text-gray-800">Gain Instant Access to New Research</h4>
                    <p className="text-xs leading-relaxed text-gray-600">
                      Once you contribute quality research, you get immediate access to all new ideas and discussions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Our Commitment & Call-to-Action */}
            {currentStep === 4 && (
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-2xl font-light mb-4 text-gray-900">
                  Our Commitment to You
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-light mb-3 text-gray-800">Our Pledge</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>Noise-free, principle-driven research</div>
                      <div>Ad-free, bias-free analysis</div>
                      <div>Long-term wealth creation focus</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-light mb-2 text-gray-800">Ready to Share Your Conviction?</h4>
                    <p className="text-sm text-gray-600">
                      Join India's most thoughtful investment community and start building wealth through research-driven conviction.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Navigation */}
        <div className="bg-gray-50 border-t border-gray-200 flex-shrink-0">
          {/* Navigation Buttons */}
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200 font-medium text-base rounded-lg border border-gray-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                )}
              </div>
              
              <div className="flex items-center">
                {currentStep < totalSteps ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-base rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <Link
                    href="/"
                    onClick={handleClose}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium text-base rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-center"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Step Progress Indicator */}
          <div className="px-6 pb-4">
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i + 1 === currentStep 
                        ? 'bg-gray-800' 
                        : i + 1 < currentStep 
                          ? 'bg-gray-400' 
                          : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
