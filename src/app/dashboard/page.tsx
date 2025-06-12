'use client';

import { RecentMealsDialog } from "@/features/meals/components/recent-meals-dialog";
import { dummyMeals } from "@/lib/dummy-data";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import type { User } from "@supabase/supabase-js";
import { Clock, Edit, Settings, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Profile {
  full_name?: string | null;
  [key: string]: unknown;
}

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentMeals] = useState<string[]>(['pasta-carbonara', 'chicken-stir-fry']); // Mock data
  const [shoppingListCount] = useState(7); // Mock data  
  const [showRecentMeals, setShowRecentMeals] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUser(user);

    // Load user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(profileData);
  };

  const lastMeal = recentMeals.length > 0 
    ? dummyMeals.find(meal => meal.id === recentMeals[recentMeals.length - 1])
    : null;

  const handleGoToMeals = () => {
    setShowRecentMeals(false);
    router.push('/dashboard/meals');
  };

  // Generate witty messages based on user patterns
  const getWittyMessage = () => {
    const messages = [
      "Looks like you reallyyy like chicken 🐔",
      "Time to add some more veggies to your life! 🥕",
      "Your pasta game is strong, but variety is the spice of life ✨",
      "We see you avoiding those greens... 👀🥬",
      "Chicken again? Your taste buds might be getting bored! 😄",
      "Your shopping cart needs more colors - think rainbow! 🌈",
      "Beef enthusiast detected! Maybe try some fish? 🐟",
      "Your sweet tooth is showing - balance is key! 🍎",
      "You're practically a pasta connoisseur at this point! 🍝",
      "Time to venture beyond your comfort foods! 🌟"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getUserDisplayName = () => {
    // Check user metadata first, then profile table, then fallback to email
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]; // First name only
    }
    if (profile?.full_name) {
      return profile.full_name.split(' ')[0]; // First name only
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Fallback to email username
    }
    return '';
  };

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Welcome{getUserDisplayName() ? `, ${getUserDisplayName()}` : ''}!</h1>
          <p className="text-muted-foreground mt-2">Here's what's happening with your meals and shopping</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Last Meal Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Recent Meals
              </CardTitle>
              <CardDescription>
                {lastMeal ? `Last planned: ${lastMeal.name}` : 'No recent meals yet'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastMeal && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{lastMeal.name}</p>
                  <p className="text-xs text-muted-foreground">{lastMeal.cookingTime}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setShowRecentMeals(true)}
                  disabled={recentMeals.length === 0}
                >
                  View Recent Meals
                </Button>
                <Link href="/dashboard/meals" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Plan New Meal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Shopping List Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/dashboard/grocery">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  Shopping List
                </CardTitle>
                <CardDescription>
                  {shoppingListCount > 0 
                    ? `${shoppingListCount} items remaining` 
                    : 'Your list is empty'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shoppingListCount > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current List</span>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          {shoppingListCount}
                        </span>
                      </div>
                    </div>
                    <Button variant="secondary" className="w-full">
                      View Shopping List
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" className="w-full">
                    Create Shopping List
                  </Button>
                )}
              </CardContent>
            </Link>
          </Card>

          {/* Edit Grocery Preferences Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/dashboard/edit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-6 w-6" />
                  Edit Grocery Preferences
                </CardTitle>
                <CardDescription>
                  {getWittyMessage()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">
                  Update Preferences
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Settings Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <Link href="/dashboard/account">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Settings
                </CardTitle>
                <CardDescription>
                  Account, preferences, and app settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {user?.user_metadata?.full_name ? (
                      <p>Signed in as {user.user_metadata.full_name}</p>
                    ) : profile?.full_name ? (
                      <p>Signed in as {profile.full_name}</p>
                    ) : user?.email ? (
                      <p>Signed in as {user.email}</p>
                    ) : (
                      <p>Account information</p>
                    )}
                  </div>
                  <Button variant="secondary" className="w-full">
                    Manage Settings
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      <RecentMealsDialog
        isOpen={showRecentMeals}
        onClose={() => setShowRecentMeals(false)}
        recentMealIds={recentMeals}
        onGoToMeals={handleGoToMeals}
      />
    </main>
  );
} 