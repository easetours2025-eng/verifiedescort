import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Instagram, 
  Twitter,
  Save,
  X,
  Lock
} from "lucide-react";
import { GenderSelect } from "@/components/GenderSelect";
import { CountrySelect } from "@/components/CountrySelect";
import AIBioGenerator from "@/components/AIBioGenerator";

interface UserManagementProps {
  onUserCreated: () => void;
}

const UserManagement = ({ onUserCreated }: UserManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    stage_name: "",
    real_name: "",
    bio: "",
    location: "",
    country: "",
    phone_number: "",
    date_of_birth: "",
    gender: [] as string[],
    age: "",
    base_price: "0",
    hourly_rate: "",
    social_instagram: "",
    social_twitter: "",
    social_tiktok: "",
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      stage_name: "",
      real_name: "",
      bio: "",
      location: "",
      country: "",
      phone_number: "",
      date_of_birth: "",
      gender: [],
      age: "",
      base_price: "0",
      hourly_rate: "",
      social_instagram: "",
      social_twitter: "",
      social_tiktok: "",
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.stage_name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (email, password, stage name)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user in auth.users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            stage_name: formData.stage_name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create celebrity profile
        const { error: profileError } = await supabase.from("celebrity_profiles").insert({
          user_id: authData.user.id,
          stage_name: formData.stage_name,
          real_name: formData.real_name || null,
          email: formData.email,
          phone_number: formData.phone_number || null,
          bio: formData.bio || null,
          location: formData.location || null,
          country: formData.country || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender.length > 0 ? formData.gender : null,
          age: formData.age ? parseInt(formData.age) : null,
          base_price: parseFloat(formData.base_price) || 0,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          social_instagram: formData.social_instagram || null,
          social_twitter: formData.social_twitter || null,
          social_tiktok: formData.social_tiktok || null,
          is_verified: false,
          is_available: true,
        });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "User account and celebrity profile created successfully",
        });

        resetForm();
        setIsOpen(false);
        onUserCreated();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center justify-center space-x-2 w-full">
          <UserPlus className="h-4 w-4" />
          <span>Create New User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create New Celebrity User</span>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateUser}>
          {/* Profile Information Card - Same layout as CelebrityProfileEditor */}
          <Card className="max-w-full overflow-hidden">
            <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                <User className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 max-w-full overflow-hidden">
              <div className="space-y-4 sm:space-y-6 max-w-full">
                {/* Account Credentials */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Account Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2 min-w-0">
                        <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span>Email *</span>
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          required
                          className="text-sm sm:text-base h-10 sm:h-10 w-full"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2 min-w-0">
                        <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                          <Lock className="h-4 w-4 shrink-0" />
                          <span>Password *</span>
                        </Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Min 6 characters"
                          required
                          minLength={6}
                          className="text-sm sm:text-base h-10 sm:h-10 w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stage Name and Real Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium">Stage Name *</Label>
                    <Input
                      value={formData.stage_name}
                      onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                      required
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium">Real Name</Label>
                    <Input
                      value={formData.real_name}
                      onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1.5 sm:space-y-2 max-w-full">
                  <Label className="text-sm sm:text-sm font-medium">Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    placeholder="Tell people about yourself..."
                    className="text-sm sm:text-base resize-none min-h-[80px] w-full"
                  />
                  <p className="text-xs sm:text-xs text-muted-foreground break-words">
                    Write an engaging bio or use AI to generate one below.
                  </p>
                </div>

                {/* AI Bio Generator */}
                <div className="max-w-full">
                  <AIBioGenerator 
                    onBioGenerated={(bio) => setFormData({ ...formData, bio })}
                  />
                </div>

                {/* Location and Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium">Location (City)</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <CountrySelect
                      value={formData.country}
                      onChange={(country) => setFormData({ ...formData, country })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0 sm:col-span-2">
                    <GenderSelect
                      value={formData.gender}
                      onChange={(genders) => setFormData({ ...formData, gender: genders })}
                    />
                  </div>
                </div>

                {/* Age and Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium">Age *</Label>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="25"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                    <p className="text-xs sm:text-xs text-muted-foreground">18+ only</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>Phone Number</span>
                    </Label>
                    <Input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+254..."
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5 sm:space-y-2 max-w-full">
                  <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Date of Birth</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="text-sm sm:text-base h-10 sm:h-10 w-full"
                  />
                </div>

                {/* Base Price and Hourly Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 shrink-0" />
                      <span>Base Price (KSH)</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      min="0"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 shrink-0" />
                      <span>Hourly Rate (KSH)</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      min="0"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                      <Instagram className="h-4 w-4 shrink-0" />
                      <span>Instagram</span>
                    </Label>
                    <Input
                      value={formData.social_instagram}
                      onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                      placeholder="@username"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                      <Twitter className="h-4 w-4 shrink-0" />
                      <span>Twitter</span>
                    </Label>
                    <Input
                      value={formData.social_twitter}
                      onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                      placeholder="@username"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div className="space-y-1.5 sm:space-y-2 max-w-full">
                  <Label className="text-sm sm:text-sm font-medium">TikTok</Label>
                  <Input
                    value={formData.social_tiktok}
                    onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                    placeholder="@username"
                    className="text-sm sm:text-base h-10 sm:h-10 w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagement;
