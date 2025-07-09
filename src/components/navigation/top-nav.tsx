"use client";

import { Logo } from "@/components/ui/logo";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Home, Info, Moon, Sun, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function TopNav() {
  const [isDark, toggleDark, mounted] = useDarkMode();
  const [isToggling, setIsToggling] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        logger.warn({ error }, "Failed to fetch Supabase user");
      }
      setUser(data.user ?? null);
    })();

    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"] | undefined;
    try {
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null);
      }));
    } catch (err) {
      logger.warn({ error: err }, "Supabase auth listener error");
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleThemeToggle = () => {
    if (isToggling) return; // debounce 200 ms
    toggleDark();
    setIsToggling(true);
    setTimeout(() => setIsToggling(false), 200);
  };

  const isLearn = pathname.startsWith("/learn");
  const isAccount = pathname.startsWith("/dashboard/account");

  return mounted ? (
    <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50" suppressHydrationWarning>
      <div className="container h-full flex items-center justify-between">
        <Link href={user ? "/dashboard" : "/"} className="pl-6">
          <Logo variant="minimal" size={32} />
        </Link>
        <div className="flex items-center gap-4 pr-6">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleThemeToggle}
            aria-label="toggle theme"
            disabled={isToggling}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {isLearn ? (
            <Link href={user ? "/dashboard" : "/"}>
              <Button
                size="icon"
                variant="ghost"
                aria-label="home"
                aria-current={!isLearn ? "page" : undefined}
                className={cn(!isLearn && "text-primary")}
              >
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/learn">
              <Button
                size="icon"
                variant="ghost"
                aria-label="learn"
                aria-current={isLearn ? "page" : undefined}
                className={cn(isLearn && "text-primary")}
              >
                <Info className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {user ? (
            <Link href="/dashboard/account">
              <Button
                size="icon"
                variant="ghost"
                aria-label="account"
                aria-current={isAccount ? "page" : undefined}
                className={cn(isAccount && "text-primary")}
              >
                <UserIcon className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-sm hover:text-primary">
              <UserIcon className="h-5 w-5" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  ) : null;
} 