"use client";

import { Home as HomeIcon, Info, Pencil, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-t border-gray-200 dark:border-neutral-700 flex justify-around py-2 z-50">
      <NavButton href="/dashboard/grocery" label="Grocery" icon={<ShoppingCart className="h-6 w-6" />} />
      <NavButton href="/" label="Home" icon={<HomeIcon className="h-6 w-6" />} />
      <NavButton href="/dashboard/edit" label="Edit" icon={<Pencil className="h-6 w-6" />} />
      <NavButton href="/dashboard/learn" label="Learn" icon={<Info className="h-6 w-6" />} />
    </nav>
  );
}

function NavButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary">
      {icon}
      {label}
    </Link>
  );
} 