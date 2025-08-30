'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in logic here
    console.log('Sign in:', { email, password });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-4rem)]">
        {/* Avatar */}
        <div className="w-10 h-10 bg-black rounded-full mb-8"></div>

        {/* Main Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-12">Sign In</h1>

        {/* Main Content Container */}
        <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8">
          {/* Left Panel - Sign In Form */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors mt-6"
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="w-px h-32 bg-gray-300"></div>
            <span className="bg-white px-4 text-gray-500 font-medium">OR</span>
            <div className="w-px h-32 bg-gray-300"></div>
          </div>

          {/* Right Panel - Social Sign In */}
          <div className="flex-1 mt-8 lg:mt-20">
            <div className="space-y-4">
              {/* Google Sign In */}
              <button className="w-full border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </button>

              {/* X.com Sign In */}
              <button className="w-full border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-gray-700 font-medium">Continue with X</span>
              </button>

              {/* Create Account */}
              <a 
                href="/sign-up"
                className="w-full border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-gray-700 font-medium">Create an account</span>
              </a>
            </div>
          </div>
        </div>

        {/* Can't Sign In Link */}
        <div className="mt-12 text-center">
          <a href="#" className="text-black font-bold hover:underline transition-colors">
            Can&apos;t sign in?
          </a>
        </div>

        {/* Fine Print */}
        <div className="mt-8 text-center text-xs text-gray-500 max-w-md">
          Secure Login with reCAPTCHA subject to Google{' '}
          <a href="#" className="underline hover:text-gray-700">Terms</a> &{' '}
          <a href="#" className="underline hover:text-gray-700">Privacy</a>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
        <Link href="/"  className="text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
