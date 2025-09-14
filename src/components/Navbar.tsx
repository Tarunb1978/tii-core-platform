'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  
  // State for mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for user dropdown menu
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get authentication state from AuthProvider
  const { currentUser } = useAuth();
  
  // Supabase client for sign out
  const supabase = createClient();
  const router = useRouter();
  

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside (optional enhancement)
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Extract initials from full name
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2); // Limit to 2 characters
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsUserDropdownOpen(false);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return;
      }
      
      
      // Force redirect in case auth state change doesn't trigger
      setTimeout(() => {
        router.push('/');
        window.location.reload(); // Force page reload to clear any cached state
      }, 100);
      
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <Link 
              href="/ideas-forum" 
              className="text-gray-600 hover:text-gray-800 transition-all duration-200 hover:-translate-y-0.5 text-sm font-medium"
            >
              Ideas Forum
            </Link>
            <Link 
              href="/topic-of-the-week" 
              className="text-gray-600 hover:text-gray-800 transition-all duration-200 hover:-translate-y-0.5 text-sm font-medium"
            >
              Trending Topics
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
            
            {/* User Authentication Section */}
            {currentUser ? (
              // User is signed in - show initials button with dropdown
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 transition-all duration-200"
                  aria-label="User menu"
                >
                  {currentUser.user.user_metadata?.full_name 
                    ? getInitials(currentUser.user.user_metadata.full_name)
                    : 'U'
                  }
                </button>
                
                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Edit Profile
                      <span className="block text-xs text-gray-400 mt-1">
                        {/* TODO: Replace with real profile page URL */}
                        Placeholder - replace with real profile page
                      </span>
                    </Link>
                    <Link
                      href="/admin/idea-list"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Admin Panel
                      <span className="block text-xs text-gray-400 mt-1">
                        Manage investment ideas
                      </span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleSignOut();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // User is not signed in - show sign in button
              <Link 
                href="/sign-in"
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
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
                <Link 
                  href="/ideas-forum" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-right"
                  onClick={closeMobileMenu}
                >
                  Ideas Forum
                </Link>
                <Link 
                  href="/topic-of-the-week" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-right"
                  onClick={closeMobileMenu}
                >
                  Trending Topics
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
                
                {/* Mobile User Authentication Section */}
                {currentUser ? (
                  // User is signed in - show user info and sign out
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm text-gray-600 border-t border-gray-100 pt-3 text-right">
                      Welcome, {currentUser.user.user_metadata?.full_name || 'User'}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200 text-right"
                      onClick={closeMobileMenu}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      href="/admin/idea-list"
                      className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200 text-right"
                      onClick={closeMobileMenu}
                    >
                      Admin Panel
                    </Link>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSignOut();
                        closeMobileMenu();
                      }}
                      className="w-full text-right px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  // User is not signed in - show sign in button
                  <Link 
                    href="/sign-in"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors duration-200 text-right"
                    onClick={closeMobileMenu}
                  >
                    Sign In
                  </Link>
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
