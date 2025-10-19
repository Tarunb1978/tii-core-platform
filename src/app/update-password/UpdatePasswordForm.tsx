'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { updatePassword } from '../auth/action';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient();

  // Extract values inside useEffect
  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      // Optionally set Supabase session
      // supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' });
    }
  }, [params]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    const formData = new FormData()
    formData.append('password', password)
    const result = await updatePassword(formData)
    setLoading(false)
    if ((result as any)?.error) {
      toast.error((result as any).error)
    } else {
      toast.success('Password updated. You are now signed in!')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-8 pt-24 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Set a new password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter a strong password"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
              <input
                type="password"
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Re-enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



