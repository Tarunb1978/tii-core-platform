'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

// Define the type for our context
type CurrentUser = (Session & { role?: string | null } & { first_name?: string | null } & { last_name?: string | null } & { submitted_idea?: string | null }) | null;

// Helper function to handle role fetching with proper error handling
const fetchUserRole = async (supabase: any, userId: string) => {
  try {
    const { data: userData, error } = await supabase
      .from('app_user')
      .select('role, first_name, last_name, submitted_idea')
      .eq('id', userId)
      .single();

    if (error) {
      // Handle "no rows found" error silently (PGRST116)
      if (error.code === 'PGRST116') {
        console.warn(`No profile found for user ${userId}. Using default role.`);
        return { role: null, first_name: null, last_name: null, submitted_idea: null };
      }
      
      // Handle other errors with proper logging
      console.error("Error fetching user profile:", error);
      return { role: null, first_name: null, last_name: null, submitted_idea: null };
    }

    // Handle empty or null role data
    if (!userData || userData.role === null || userData.role === undefined) {
      console.warn(`No role data found for user ${userId}. Using default role.`);
      return { 
        role: null, 
        first_name: userData?.first_name || null, 
        last_name: userData?.last_name || null, 
        submitted_idea: userData?.submitted_idea || null 
      };
    }

    return {
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name,
      submitted_idea: userData.submitted_idea
    };
  } catch (err) {
    console.error("Unexpected error fetching user profile:", err);
    return { role: null, first_name: null, last_name: null, submitted_idea: null };
  }
};

type AuthContextType = {
  currentUser: CurrentUser
  isLoading: boolean
}

// Create the context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
})

// Create the Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // fetch role from app_user using helper function
        const userData = await fetchUserRole(supabase, session.user.id);
        setCurrentUser({ 
          ...session, 
          role: userData.role, 
          first_name: userData.first_name, 
          last_name: userData.last_name, 
          submitted_idea: userData.submitted_idea 
        });
      } else {
        setCurrentUser(null);
      }

      setIsLoading(false);
    };

getSession();

// Subscribe to auth state changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
//Please remove in production
    
    // Force a small delay to ensure session is fully established
    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
      setTimeout(async () => {
        if (session?.user) {
          const userData = await fetchUserRole(supabase, session.user.id);
          setCurrentUser({ 
            ...session, 
            role: userData.role, 
            first_name: userData.first_name, 
            last_name: userData.last_name, 
            submitted_idea: userData.submitted_idea 
          });
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      }, 100);
    } else {
      if (session?.user) {
        const userData = await fetchUserRole(supabase, session.user.id);
        setCurrentUser({ 
          ...session, 
          role: userData.role, 
          first_name: userData.first_name, 
          last_name: userData.last_name, 
          submitted_idea: userData.submitted_idea 
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    }
  }
);


    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const value = {
    currentUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Create a custom hook for easy access to the context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}