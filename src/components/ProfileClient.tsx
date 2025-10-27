'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  sex?: string;
  contact_number?: string;
  investor_bio?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileClient() {
  const { currentUser } = useAuth();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    dob: '',
    sex: '',
    contact_number: '',
    investor_bio: ''
  });

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!currentUser) {
      console.log('No current user, skipping profile fetch');
      return;
    }
    
    try {
      setIsLoading(true);
      

      const apiUrl = `https://acsobefarzmetevcseal.supabase.co/functions/v1/app-user/me`;

      // Fetch profile from API
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentUser.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Extract profile data from nested structure
      const profileData = responseData.profile || responseData;
      
      // Create full profile object with all required fields
      const fullProfileData = {
        id: currentUser.user.id,
        email: currentUser.user.email || '',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        dob: profileData.dob || '',
        sex: profileData.sex || '',
        contact_number: profileData.contact_number || '',
        investor_bio: profileData.investor_bio || '',
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString()
      };
      
      setProfile(fullProfileData);
      
      // Update form data with proper fallbacks
      const newFormData = {
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        dob: profileData.dob || '',
        sex: profileData.sex || '',
        contact_number: profileData.contact_number || '',
        investor_bio: profileData.investor_bio || ''
      };
      
      setFormData(newFormData);
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
      
      // Set empty profile data on error to show placeholders
      setProfile({
        id: currentUser.user.id,
        email: currentUser.user.email || '',
        first_name: '',
        last_name: '',
        dob: '',
        sex: '',
        contact_number: '',
        investor_bio: '',
        created_at: '',
        updated_at: ''
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, supabase]);

  // Update profile
  const updateProfile = async () => {
    if (!currentUser) return;
    
    try {
      setIsSaving(true);
      
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Prepare update data
      const updateFields: Record<string, string> = {};
      if (formData.first_name !== undefined) updateFields.first_name = formData.first_name;
      if (formData.last_name !== undefined) updateFields.last_name = formData.last_name;
      if (formData.dob !== undefined) updateFields.dob = formData.dob;
      if (formData.sex !== undefined) updateFields.sex = formData.sex;
      if (formData.contact_number !== undefined) updateFields.contact_number = formData.contact_number;
      if (formData.investor_bio !== undefined) updateFields.investor_bio = formData.investor_bio;

      // Update profile via API
      const response = await fetch(`https://acsobefarzmetevcseal.supabase.co/functions/v1/app-user/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateFields),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Extract profile data from nested structure
      const profileData = responseData.profile || responseData;
      
      // Create full profile object with all required fields
      const fullProfileData = {
        id: currentUser.user.id,
        email: currentUser.user.email || '',
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        dob: profileData.dob || '',
        sex: profileData.sex || '',
        contact_number: profileData.contact_number || '',
        investor_bio: profileData.investor_bio || '',
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString()
      };
      
      setProfile(fullProfileData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data to original values
      setFormData({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        dob: profile?.dob || '',
        sex: profile?.sex || '',
        contact_number: profile?.contact_number || '',
        investor_bio: profile?.investor_bio || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const router = useRouter();

useEffect(() => {
  if (currentUser) {
    fetchProfile();
  } else {
    // Reset profile data when user is not available
    setProfile(null);
    setFormData({
      first_name: '',
      last_name: '',
      dob: '',
      sex: '',
      contact_number: '',
      investor_bio: ''
    });
    setIsLoading(false);
    router.push('/');
  }
}, [currentUser, fetchProfile, router]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your personal information and investor profile</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchProfile}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh profile data"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                placeholder={!isEditing && !formData.first_name ? "Not provided" : "Enter your first name"}
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                placeholder={!isEditing && !formData.last_name ? "Not provided" : "Enter your last name"}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!isEditing && !formData.dob && (
                <p className="text-xs text-gray-500 mt-1">Not provided</p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="sex"
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">{isEditing ? "Select gender" : "Not provided"}</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="text"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                placeholder={!isEditing && !formData.contact_number ? "Not provided" : "Enter your contact number"}
              />
            </div>

            {/* Investor Bio */}
            <div>
              <label htmlFor="investor_bio" className="block text-sm font-medium text-gray-700 mb-2">
                Investor Bio
              </label>
              <textarea
                id="investor_bio"
                name="investor_bio"
                value={formData.investor_bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                placeholder={!isEditing && !formData.investor_bio ? "Not provided" : "Tell us about your investment experience and interests..."}
              />
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
            {/* Profile Created Info */}
            <div className="mb-2">
              <h3 className="block text-sm font-medium text-gray-700 mb-2">Profile Created</h3>
              <p className="text-gray-600">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Account Information 
      <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <p className="text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Updated
              </label>
              <p className="text-gray-900">
                {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>*/}
      <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        className:
          "bg-transparent border border-blue-200 backdrop-blur-md text-white font-medium shadow-lg rounded-2xl px-4 py-3 flex items-center justify-center",
        style: {
          background: "transparent",
        },
      }}
    />
    </div>
  );
}
