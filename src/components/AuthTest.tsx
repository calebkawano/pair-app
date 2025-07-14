'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthTest() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        // Only handle sign out navigation here
        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword',
    });
    if (error) console.error('Error:', error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('Error:', error.message);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error:', error.message);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {user ? (
        <div className="space-y-4">
          <p>Logged in as: {user.email}</p>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={handleGoogleLogin} className="w-full">
            Login with Google
          </Button>
          <Button onClick={handleEmailLogin} variant="outline" className="w-full">
            Test Email Login
          </Button>
        </div>
      )}
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-60">
        {JSON.stringify({ user }, null, 2)}
      </pre>
    </div>
  );
} 