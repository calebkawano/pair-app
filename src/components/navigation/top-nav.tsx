"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function TopNav() {
  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    setDark((d) => !d);
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full flex items-center justify-between">
        <a href="/" className="font-semibold text-lg pl-6">
          p<span className="text-primary">AI</span>r
        </a>
        <div className="flex items-center gap-1 pr-6">
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link href="/dashboard/account" className="flex items-center gap-2 text-sm hover:text-primary">
            <User className="h-5 w-5" />
            Account
          </Link>
        </div>
      </div>
    </header>
  );
} 