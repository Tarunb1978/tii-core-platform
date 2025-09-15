// app/auth/actions.ts
'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Provider } from '@supabase/supabase-js'

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
    console.error('Sign in error:', error.message)
    return redirect('/login?message=Could not authenticate user')
  }

  return redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const firstName = String(formData.get('firstName'))
  const secondName = String(formData.get('secondName'))
  const dob = String(formData.get('dob'))
  const sex = String(formData.get('sex'))
  const contactNumber = String(formData.get('contactNumber'))
  const supabase = await createSupabaseServerClient() // This now works correctly

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error('Sign up error:', error.message)
    return redirect('/sign-up?message=Could not create user')
  }

    // Update user profile
  const { error: updateError } = await supabase
    .from('app_user')
    .update({
      first_name: firstName,
      last_name: secondName,
      dob,
      sex,
      contact_number: contactNumber,
    })
    .eq('email', email)

  if (updateError) {
    console.error('Update error:', updateError.message)
    return redirect('/sign-up?message=Could not save profile')
  }

  // Successful now store the data to app_user

  return redirect('/')
  }

export async function signInWithOAuth(provider: Provider) {

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  })
console.log('OAuth data:', data);
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