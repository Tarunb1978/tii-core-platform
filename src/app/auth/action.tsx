// app/auth/actions.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'
import { BASE_URL } from '@/lib/constants'

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Corrected env var name
    {
      cookies: {
        // The `getAll` method is used to read all cookies.
        getAll() {
          return cookieStore.getAll()
        },
        // The `setAll` method is used to set multiple cookies at once.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const supabase = await createSupabaseServerClient() // This now works correctly

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Request a password reset email. Supabase will send a magic link to update the password.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email'))
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE_URL}/update-password`,
  })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

// Complete the password update after user follows recovery link
export async function updatePassword(formData: FormData) {
  const newPassword = String(formData.get('password'))
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const firstName = String(formData.get('firstName'))
  const secondName = String(formData.get('secondName'))
  const dob = String(formData.get('dob'))
  const sex = String(formData.get('sex'))
  const contactNumber = String(formData.get('contactNumber'))

  const supabase = await createSupabaseServerClient()

   const { data: existingUser, error: checkError } = await supabase
    .from('app_user')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (checkError) {
    return { error: 'Something went wrong while checking your email. Please try again.' }
  }

  if (existingUser) {
    // ❌ Email already registered
    return { error: 'An account with this email already exists. Please sign in instead.' }
  }

  // 1️⃣ Create auth user
  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${secondName}`,
        dob,
        sex,
        contact_number: contactNumber,
      },
    },
  })

  if (error) {
    console.error('Sign up error:', error.message)
    return { error: error.message }
  }

  // 2️⃣ Use a Supabase service role client for DB insert
  // (bypasses RLS safely, only on the server)
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 👈 safe only in server env
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  const { error: insertError } = await serviceClient
    .from('app_user')
    .upsert(
      {
        id: user?.user?.id,
        email,
        first_name: firstName,
        last_name: secondName,
        dob,
        sex,
        contact_number: contactNumber,
        role: 'user',
      },
      { onConflict: 'id' }
    )

  if (insertError) {
    console.error('Insert error:', insertError.message)
    return { error: insertError.message }
  }

  return { success: true }
}



export async function signInWithOAuth(provider: Provider) {

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
    },
  })
  if (error) {
    console.error('OAuth error:', error.message);
    return redirect('/login?message=Could not authenticate with provider');
  }

  return redirect(data.url);
}


export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  return redirect('/login')
}