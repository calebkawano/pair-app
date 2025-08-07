import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard/meals'

  if (code) {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful login - redirect to the next page
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth callback error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=No_code_provided`)
}