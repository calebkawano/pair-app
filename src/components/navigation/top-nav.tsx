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
    <nav className="fixed top-0 inset-x-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-gray-200 dark:border-neutral-700 py-2 px-4 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          pAIr
        </Link>
        <div className="flex items-center gap-4">
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link href="/dashboard/account" className="flex items-center gap-2 text-sm hover:text-primary">
            <User className="h-5 w-5" />
            Account
          </Link>
        </div>
      </div>
    </nav>
  );
} 