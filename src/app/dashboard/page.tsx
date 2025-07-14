'use client';

import { RecentMealsDialog } from "@/features/meals/components/recent-meals-dialog";
import { getShoppingItemCount } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { User } from "@supabase/supabase-js";
import { ChefHat, Clock, List, ShoppingCart, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Profile {
  full_name?: string | null;
  [key: string]: unknown;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface RecentMeal {
  id: string;
  meal_name: string;
  cooking_time: string;
  rating: number;
  category: string;
  dietary_tags: string[];
  ingredients: string[];
  steps: string[];
  nutrition: NutritionInfo | null;
  created_at: string;
  created_from_groceries: boolean;
}

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [shoppingListCount, setShoppingListCount] = useState(0);
  const [mealCount, setMealCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showRecentMeals, setShowRecentMeals] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [wittyMessage, setWittyMessage] = useState<string>('Welcome to your dashboard!');
  const supabase = createClient();
  const router = useRouter();

  const loadUserData = useCallback(async () => {
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

    // Load recent meals
    const { data: mealsData } = await supabase
      .from('recent_meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (mealsData) {
      setRecentMeals(mealsData);
    }

    // Get total meal count
    const { count: totalMeals } = await supabase
      .from('recent_meals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (typeof totalMeals === 'number') {
      setMealCount(totalMeals);
    }

    // Load shopping list count and last updated
    try {
      const count = await getShoppingItemCount(user.id);
      setShoppingListCount(count);

      // Get the most recent food request
      const { data: latestRequest } = await supabase
        .from('food_requests')
        .select('created_at')
        .in('status', ['pending', 'approved'])
        .eq('is_purchased', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (latestRequest?.[0]) {
        const lastUpdateDate = new Date(latestRequest[0].created_at);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
          setLastUpdated('Today');
        } else if (diffInDays === 1) {
          setLastUpdated('Yesterday');
        } else {
          setLastUpdated(`${diffInDays} days ago`);
        }
      } else {
        setLastUpdated(null);
      }
    } catch (error) {
      console.error('Error loading shopping list data:', error);
    }
  }, [supabase]);

  useEffect(() => {
    setMounted(true);
    
    // Generate the witty message once when component mounts
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
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setWittyMessage(randomMessage);
    
    loadUserData();
  }, [loadUserData]);

  const lastMeal = recentMeals.length > 0 ? recentMeals[0] : null;

  const handleGoToMeals = () => {
    setShowRecentMeals(false);
    router.push('/dashboard/meals');
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Hey {getUserDisplayName()}! 👋
          </h1>
          <p className="text-muted-foreground">
            {mounted ? wittyMessage : 'Welcome to your dashboard!'}
          </p>
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
                {lastMeal ? `Last planned: ${lastMeal.meal_name}` : 'No recent meals yet'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastMeal && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{lastMeal.meal_name}</p>
                  <p className="text-xs text-muted-foreground">{lastMeal.cooking_time}</p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-6 w-6" />
                Shopping Lists
              </CardTitle>
              <CardDescription>
                {shoppingListCount} {shoppingListCount === 1 ? 'item' : 'items'} on your list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">Weekly Groceries</p>
                <p className="text-xs text-muted-foreground">
                  {lastUpdated ? `Last updated ${lastUpdated}` : 'No items yet'}
                </p>
              </div>
              <Link href="/dashboard/grocery">
                <Button variant="secondary" className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Go Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Account & Settings Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-6 w-6" />
                Account & Settings
              </CardTitle>
              <CardDescription>
                Manage your profile, household, and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">Member since {new Date(user?.created_at || '').toLocaleDateString()}</p>
              </div>
              <div className="grid gap-2">
                <Link href="/dashboard/account">
                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </Link>
                <Link href="/dashboard/account/households">
                  <Button variant="outline" className="w-full">
                    Manage Households
                  </Button>
                </Link>
                <Link href="/dashboard/account/dietary-preferences">
                  <Button variant="outline" className="w-full">
                    Dietary Preferences
                  </Button>
                </Link>
                <Link href="/dashboard/account/shopping-settings">
                  <Button variant="outline" className="w-full">
                    Shopping Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Plan Another Meal Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-6 w-6" />
                Plan Another Meal
              </CardTitle>
              <CardDescription>
               Look at all the meals you&apos;ve made with pAIr!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="font-bold text-3xl">{mealCount}</p>
                <p className="text-sm">Meals made with pAIr</p>
                <p className="text-xs text-muted-foreground">Want to make another?</p>
              </div>
              <div className="grid gap-2">
                <Link href="/dashboard/grocery">
                  <Button variant="secondary" className="w-full gap-2">
                    Go Shopping
                  </Button>
                </Link>
                <Link href="/dashboard/meals">
                  <Button variant="outline" className="w-full gap-2">
                    Quick Meal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <RecentMealsDialog
        isOpen={showRecentMeals}
        onClose={() => setShowRecentMeals(false)}
        recentMeals={recentMeals}
        onGoToMeals={handleGoToMeals}
      />
    </main>
  );
} 