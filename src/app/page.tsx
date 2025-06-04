import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to <span className="text-primary">pAIr</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Your AI-powered meal planning and grocery shopping assistant
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Quick Meals</h2>
            <p className="text-muted-foreground">
              Get instant meal suggestions based on your preferences and dietary needs
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Smart Shopping</h2>
            <p className="text-muted-foreground">
              AI-optimized grocery lists from stores near you
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/grocery">Plan Your Shopping</Link>
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
