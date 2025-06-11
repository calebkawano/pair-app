'use client';

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSaveSuccess: () => void;
}

export function EditProfileDialog({ isOpen, onClose, user, onSaveSuccess }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    age: '',
    location: '',
    location_enabled: true,
    family_shopping_size: 1
  });
  const [originalData, setOriginalData] = useState({
    email: '',
    full_name: '',
    age: '',
    location: '',
    location_enabled: true,
    family_shopping_size: 1
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && user) {
      loadUserProfile();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Check if form data has changed
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(changed);
  }, [formData, originalData]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Load profile data from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error);
      }

      // Use the same data source as the account page
      const profileData = {
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || profile?.full_name || '',
        age: profile?.age || '',
        location: profile?.location || '',
        location_enabled: profile?.location_enabled !== false,
        family_shopping_size: profile?.family_shopping_size || 1
      };

      setFormData(profileData);
      setOriginalData(profileData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update auth user email and metadata if changed
      const userUpdates: any = {};
      if (formData.email !== originalData.email) {
        userUpdates.email = formData.email;
      }
      if (formData.full_name !== originalData.full_name) {
        userUpdates.data = { full_name: formData.full_name };
      }
      
      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase.auth.updateUser(userUpdates);
        if (userError) throw userError;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: formData.email,
          full_name: formData.full_name,
          age: formData.age ? parseInt(formData.age) : null,
          location: formData.location,
          location_enabled: formData.location_enabled,
          family_shopping_size: formData.family_shopping_size
        });

      if (profileError) throw profileError;

      setOriginalData(formData);
      toast.success('Profile updated successfully');
      onSaveSuccess();
      onClose();
      router.push('/dashboard/account?profileUpdated=true');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowExitWarning(true);
    } else {
      onClose();
    }
  };

  const confirmExit = () => {
    setShowExitWarning(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your account information
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location_enabled">Enable Location</Label>
                  <Switch
                    id="location_enabled"
                    checked={formData.location_enabled}
                    onCheckedChange={(checked) => handleInputChange('location_enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter your city or address"
                    disabled={!formData.location_enabled}
                    className={!formData.location_enabled ? "opacity-50" : ""}
                  />
                </div>

                {!formData.location_enabled && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      We cannot find local stores if location is off, making less accurate shopping lists.
                    </p>
                  </div>
                )}
              </div>

              {/* Family Shopping Size */}
              <div className="space-y-2">
                <Label htmlFor="family_size">Family Shopping Size</Label>
                <Input
                  id="family_size"
                  type="number"
                  min="1"
                  value={formData.family_shopping_size}
                  onChange={(e) => handleInputChange('family_shopping_size', parseInt(e.target.value) || 1)}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={!hasChanges || saving}
                  className="min-w-[100px]"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exit Warning Dialog */}
      {showExitWarning && (
        <Dialog open={showExitWarning} onOpenChange={setShowExitWarning}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                Your information will not be saved if you exit now.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowExitWarning(false)}
              >
                Return to Edit
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmExit}
              >
                Exit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
} 