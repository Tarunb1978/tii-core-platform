'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { signUpWithEmail } from '../auth/action';


export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign up logic here
    console.log('Sign up:', { firstName, secondName, age, sex, email, password, contactNumber });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4 py-8 pt-24 min-h-[calc(100vh-4rem)]">
        {/* Avatar */}
        <div className="w-10 h-10 bg-black rounded-full mb-8"></div>

        {/* Main Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
        <p className="text-gray-600 mb-8">Join our community and start your journey today</p>

        {/* Sign Up Form Card */}
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <form action={signUpWithEmail} className="space-y-6">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name='firstName'
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              {/* Second Name */}
              <div>
                <label htmlFor="secondName" className="block text-sm font-medium text-gray-700 mb-2">
                  Second Name *
                </label>
                <input
                  type="text"
                  id="secondName"
                  name='secondName'
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your second name"
                  required
                />
              </div>
            </div>

            {/* Age and Sex Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date
                </label>
                <input
                  type="date"
                  id="age"
                  name='age'
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Enter your DOB"
                />
              </div>

              {/* Sex */}
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
                  Sex
                </label>
                <select
                  id="sex"
                  value={sex}
                  name='sex'
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                >
                  <option value="">Select your sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
                <span className="ml-2 text-xs text-gray-500" title="We will use your email as your user ID.">
                  ℹ️
                </span>
              </label>
              <input
                type="email"
                id="email"
                name='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter your email address"
                required
              />
              <p className="mt-1 text-xs text-gray-500">We will use your email as your user ID.</p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="Create a strong password"
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
              {/* Password Hints */}
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>✓ 8+ characters</div>
                <div>✓ Uppercase & lowercase</div>
                <div>✓ Number</div>
                <div>✓ Symbol</div>
              </div>
            </div>

            {/* Contact Number (Optional) */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                id="contactNumber"
                value={contactNumber}
                name='contactNumber'
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter your phone number"
              />
              <p className="mt-1 text-xs text-gray-500">
                We strongly recommend adding a phone number. This will help verify your account and keep it safe.
              </p>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors mt-6"
            >
              Sign Up
            </button>

            {/* Terms Agreement */}
            <p className="text-xs text-gray-600 text-center">
              By creating an account, you agree to the{' '}
              <a href="#" className="underline hover:text-gray-800">Terms of use</a> and{' '}
              <a href="#" className="underline hover:text-gray-800">Privacy Policy</a>.
            </p>
          </form>
        </div>

        {/* Top Right Links */}
        <div className="absolute top-24 right-8 text-right hidden md:block">
          <div className="space-y-2">
            <a href="/sign-in" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Already have an account? <span className="font-semibold">Log in</span>
            </a>
            <a href="#" className="block text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Forgot your user ID or password?
            </a>
          </div>
        </div>

        {/* Mobile Links - Positioned below avatar */}
        <div className="md:hidden mt-4 text-center">
          <div className="space-y-2">
            <a href="/sign-in" className="block text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Already have an account? <span className="font-semibold">Log in</span>
            </a>
            <a href="#" className="block text-xs text-gray-500 hover:text-gray-700 transition-colors">
              Forgot your user ID or password?
            </a>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
