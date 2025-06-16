'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Home, ShoppingCart, User, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'Grocery',
    href: '/dashboard/grocery',
    icon: ShoppingCart
  },
  {
    name: 'Meals',
    href: '/dashboard/meals',
    icon: UtensilsCrossed
  },
  {
    name: 'Account',
    href: '/dashboard/account',
    icon: User
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 pb-20">
        {children}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container max-w-4xl mx-auto">
          <div className="flex justify-around py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Button
                  key={item.name}
                  asChild
                  variant="ghost"
                  className={cn(
                    "flex-1 flex-col gap-1 h-auto py-2 px-0",
                    isActive && "text-primary"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
} 