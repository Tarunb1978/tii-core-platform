'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

// Define the type for our context
type CurrentUser = (Session & { role?: string | null }) | null;

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
  console.log("Session data:", session);

  if (session?.user) {
    // fetch role from app_user
    const { data: userData, error } = await supabase
      .from('app_user')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      setCurrentUser({ ...session, role: null });
    } else {
      setCurrentUser({ ...session, role: userData.role });
    }
  } else {
    setCurrentUser(null);
  }

  setIsLoading(false);
};

getSession();
console.log("Session data:", currentUser);

// Subscribe to auth state changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log("Auth state changed:", event, session);
    
    // Force a small delay to ensure session is fully established
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      setTimeout(async () => {
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('app_user')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching role:", error);
            setCurrentUser({ ...session, role: null });
          } else {
            setCurrentUser({ ...session, role: userData.role });
          }
        } else {
          setCurrentUser(null);
        }
        setIsLoading(false);
      }, 100);
    } else {
      if (session?.user) {
        const { data: userData, error } = await supabase
          .from('app_user')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching role:", error);
          setCurrentUser({ ...session, role: null });
        } else {
          setCurrentUser({ ...session, role: userData.role });
        }
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