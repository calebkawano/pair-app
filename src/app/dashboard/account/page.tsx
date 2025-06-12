"use client";

import { EditProfileDialog } from "@/features/account/components/edit-profile-dialog";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    getUser();
    // Show success toast if redirected from profile edit
    if (searchParams.get('profileUpdated') === 'true') {
      toast.success('Profile updated successfully');
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete('profileUpdated');
      window.history.replaceState({}, '', url);
    }
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleProfileSaveSuccess = () => {
    // Refresh user data after successful save
    getUser();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container max-w-2xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Account</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleLogout}
          className="h-10"
        >
          Logout
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Profile Overview</h2>
              <p className="text-sm text-muted-foreground">Your basic account information</p>
            </div>
            <div className="grid gap-2">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-sm text-muted-foreground">{user?.user_metadata?.full_name || 'Not set'}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowEditProfile(true)}
            >
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Household Management Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Household Management</h2>
              <p className="text-sm text-muted-foreground">Manage your household members and their preferences</p>
            </div>
            <div className="grid gap-2">
              <Link href="/dashboard/account/households">
                <Button variant="outline" className="w-full">Manage Households</Button>
              </Link>
              <Link href="/dashboard/account/dietary-preferences">
                <Button variant="outline" className="w-full">Dietary Preferences</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Shopping Preferences Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Shopping Preferences</h2>
              <p className="text-sm text-muted-foreground">Customize your shopping experience</p>
            </div>
            <div className="grid gap-2">
              <Link href="/dashboard/account/shopping-preferences">
                <Button variant="outline" className="w-full">Shopping Settings</Button>
              </Link>
              <Link href="/dashboard/account/favorite-stores">
                <Button variant="outline" className="w-full">Favorite Stores</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <EditProfileDialog
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
        onSaveSuccess={handleProfileSaveSuccess}
      />
    </main>
  );
} 