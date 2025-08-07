'use client'

import AuthTest from '@/components/AuthTest'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      setSuccess('Check your email for the magic link!')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!phone) {
      setError('Please enter your phone number')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to send OTP to:', phone)
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      })

      if (error) {
        console.error('Phone OTP error:', error)
        throw error
      }

      console.log('Phone OTP response:', data)
      setOtpSent(true)
      setSuccess('Check your phone for the verification code!')
    } catch (error: unknown) {
      console.error('Detailed phone error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!otp) {
      setError('Please enter the verification code')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to verify OTP for phone:', phone, 'with code:', otp)
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        console.error('OTP verification error:', error)
        throw error
      }

      console.log('OTP verification response:', data)
      if (data.user) {
        console.log('User verified successfully, redirecting to dashboard')
        router.replace('/dashboard/meals')
      }
    } catch (error: unknown) {
      console.error('Detailed OTP verification error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
        }
      })

      if (error) throw error

      // If we have a URL to redirect to, use it
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No redirect URL received from Supabase')
      }
    } catch (error: unknown) {
      console.error('Google login error:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Email/Phone Toggle and Forms */}
            <div className="space-y-4">
              <div className="flex justify-center space-x-1 mb-4">
                <Button
                  variant={!otpSent && authMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMethod('email')
                    setOtpSent(false)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="flex-1"
                >
                  Email
                </Button>
                <Button
                  variant={!otpSent && authMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAuthMethod('phone')
                    setOtpSent(false)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="flex-1"
                >
                  Phone
                </Button>
              </div>

              {/* Dynamic Form Based on Method */}
              {!otpSent && authMethod === 'email' && (
                <form onSubmit={handleEmailMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </form>
              )}

              {!otpSent && authMethod === 'phone' && (
                <form onSubmit={handlePhoneOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +1 for US)
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Code'}
                  </Button>
                </form>
              )}

              {otpSent && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to {phone}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setOtpSent(false)}
                  >
                    Back to Phone Number
                  </Button>
                </form>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            {/* Messages */}
            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
            {success && <p className="text-sm text-green-600 mt-4">{success}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Auth Test Component - Remove this in production */}
      <div className="fixed bottom-4 right-4 w-96">
        <Card>
          <CardHeader>
            <CardTitle>Auth Test</CardTitle>
            <CardDescription>Test authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthTest />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 