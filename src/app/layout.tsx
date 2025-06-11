import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopNav } from "@/components/navigation/top-nav";
import { ToastProvider } from "@/providers/toast-provider";
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
        <div className="flex flex-col min-h-screen relative">
          <TopNav />
          <div className="flex-1 pt-14 pb-16">
            {children}
          </div>
          <BottomNav />
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
