'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  // State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Placeholder for authentication state (can be replaced with actual auth logic)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside (optional enhancement)
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white shadow-sm border-b border-gray-200 font-sans z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section - Logo and Company Name */}
          <div className="flex items-center">
            <Link href="/" className="navbar-brand flex items-center">
              {/* Logo Image - Using Next.js Image component for optimization */}
              <Image 
                src="/assets/images/logo.svg" 
                alt="The Indian Investors Logo" 
                width={40} 
                height={40} 
                className="mr-3"
              />
              {/* Company Name */}
              <span className="text-lg font-bold text-black">The Indian Investors</span>
            </Link>
          </div>

          {/* Center Section - Navigation Links (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#ideas-forum" 
              className="text-gray-600 hover:text-gray-800 transition-all duration-200 hover:-translate-y-0.5 text-sm font-medium"
            >
              Ideas Forum
            </a>
            <Link 
              href="/topic-of-the-week" 
              className="text-gray-600 hover:text-gray-800 transition-all duration-200 hover:-translate-y-0.5 text-sm font-medium"
            >
              Topic of the Week
            </Link>
            <a 
              href="#resources" 
              className="text-gray-600 hover:text-gray-800 transition-all duration-200 hover:-translate-y-0.5 text-sm font-medium"
            >
              Resources
            </a>
          </div>

          {/* Right Section - Info Text and Submit Button (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Informational Text */}
            <span className="text-sm text-gray-400">Showing 30-day old ideas</span>
            
            {/* Submit Idea Button */}
            <Link 
              href="/submit-idea"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
            >
              Submit Idea
            </Link>
            
            {/* Sign In/Out Button */}
            {isAuthenticated ? (
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            ) : (
              <a 
                href="/sign-in"
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {/* Hamburger Icon */}
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  // Close icon (X)
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  // Hamburger icon
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="flex justify-end">
              <div className="w-auto min-w-[200px] px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-bl-lg border-l border-b border-gray-200">
                {/* Mobile Navigation Links */}
                <a 
                  href="#ideas-forum" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-right"
                  onClick={closeMobileMenu}
                >
                  Ideas Forum
                </a>
                <Link 
                  href="/topic-of-the-week" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-right"
                  onClick={closeMobileMenu}
                >
                  Topic of the Week
                </Link>
                <a 
                  href="#resources" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-right"
                  onClick={closeMobileMenu}
                >
                  Resources
                </a>
                
                {/* Mobile Submit Idea Button */}
                <div className="flex justify-end">
                  <Link 
                    href="/submit-idea"
                    className="w-auto px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    Submit Idea
                  </Link>
                </div>
                
                {/* Mobile Sign In/Out Button */}
                {isAuthenticated ? (
                  <button 
                    onClick={() => {
                      setIsAuthenticated(false);
                      closeMobileMenu();
                    }}
                    className="w-full text-right px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                ) : (
                  <a 
                    href="/sign-in"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200 text-right"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </a>
                )}
                
                {/* Mobile Info Text */}
                <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 pt-3 text-right">
                  Showing 30-day old ideas
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
