import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopNav } from "@/components/navigation/top-nav";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "pAIr - Practical AI Recipes",
  description: "Smart meal planning and grocery shopping assistant powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TopNav />
        <div className="min-h-screen bg-background pb-16 pt-14">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
