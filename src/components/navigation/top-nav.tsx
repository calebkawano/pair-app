"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TopNav() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold text-lg pl-6">
          p<span className="text-primary">AI</span>r
        </Link>
        <div className="flex items-center gap-4 pr-6">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          )}
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Logout
            </Button>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-sm hover:text-primary">
              <User className="h-5 w-5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 