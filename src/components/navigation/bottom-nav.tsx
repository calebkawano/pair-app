"use client";

import { Home as HomeIcon, Info, Pencil, ShoppingCart, Utensils } from "lucide-react";
import Link from "next/link";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="h-full flex items-center justify-around">
          <NavButton href="/dashboard/grocery" label="Grocery" icon={<ShoppingCart className="h-6 w-6" />} />
          <NavButton href="/dashboard/meals" label="Meals" icon={<Utensils className="h-6 w-6" />} />
          <NavButton href="/" label="Home" icon={<HomeIcon className="h-6 w-6" />} />
          <NavButton href="/dashboard/edit" label="Edit" icon={<Pencil className="h-6 w-6" />} />
          <NavButton href="/learn" label="Learn" icon={<Info className="h-6 w-6" />} />
        </div>
      </div>
    </nav>
  );
}

function NavButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
} 