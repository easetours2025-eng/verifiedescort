import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Instagram, 
  Twitter,
  Save,
  X,
  Lock,
  Crown,
  Clock
} from "lucide-react";
import { GenderSelect } from "@/components/GenderSelect";
import { CountrySelect } from "@/components/CountrySelect";
import AIBioGenerator from "@/components/AIBioGenerator";

interface SubscriptionPackage {
  id: string;
  tier_name: string;
  duration_type: string;
  price: number;
  is_active: boolean;
}

interface UserManagementProps {
  onUserCreated: () => void;
}

const UserManagement = ({ onUserCreated }: UserManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionPackages, setSubscriptionPackages] = useState<SubscriptionPackage[]>([]);
  const [enableSubscription, setEnableSubscription] = useState(false);
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
    social_instagram: "",
    social_twitter: "",
    social_tiktok: "",
    subscription_tier: "",
    duration_type: "",
    is_available_24h: true,
    availability_start_time: "00:00",
    availability_end_time: "23:59",
  });
  const { toast } = useToast();

  // Fetch subscription packages
  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (!error && data) {
        setSubscriptionPackages(data);
      }
    };
    fetchPackages();
  }, []);

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
      social_instagram: "",
      social_twitter: "",
      social_tiktok: "",
      subscription_tier: "",
      duration_type: "",
      is_available_24h: true,
      availability_start_time: "00:00",
      availability_end_time: "23:59",
    });
    setEnableSubscription(false);
  };

  // Get unique tiers
  const uniqueTiers = [...new Set(subscriptionPackages.map(p => p.tier_name))];
  
  // Get durations for selected tier
  const availableDurations = subscriptionPackages.filter(
    p => p.tier_name === formData.subscription_tier
  );

  // Get selected package price
  const selectedPackage = subscriptionPackages.find(
    p => p.tier_name === formData.subscription_tier && p.duration_type === formData.duration_type
  );

  // Calculate subscription end date based on duration
  const getSubscriptionEndDate = (durationType: string): Date => {
    const now = new Date();
    switch (durationType) {
      case '1_week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1_month':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '3_months':
        return new Date(now.setMonth(now.getMonth() + 3));
      case '6_months':
        return new Date(now.setMonth(now.getMonth() + 6));
      case '1_year':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        return new Date(now.setMonth(now.getMonth() + 1));
    }
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
          social_instagram: formData.social_instagram || null,
          social_twitter: formData.social_twitter || null,
          social_tiktok: formData.social_tiktok || null,
          is_verified: false,
          is_available: true,
          is_available_24h: formData.is_available_24h,
          availability_start_time: formData.is_available_24h ? '00:00:00' : formData.availability_start_time + ':00',
          availability_end_time: formData.is_available_24h ? '23:59:59' : formData.availability_end_time + ':00',
        });

        if (profileError) throw profileError;

        // Get the celebrity profile ID for subscription
        const { data: profileData } = await supabase
          .from('celebrity_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        // Create subscription if enabled
        if (enableSubscription && formData.subscription_tier && formData.duration_type && profileData) {
          const subscriptionEnd = getSubscriptionEndDate(formData.duration_type);
          
          const { error: subError } = await supabase
            .from('celebrity_subscriptions')
            .insert({
              celebrity_id: profileData.id,
              subscription_tier: formData.subscription_tier,
              duration_type: formData.duration_type,
              subscription_start: new Date().toISOString(),
              subscription_end: subscriptionEnd.toISOString(),
              is_active: true,
              amount_paid: selectedPackage?.price || 0,
            });

          if (subError) {
            console.error('Subscription creation error:', subError);
            // Don't throw, just log - user is already created
          }

          // Update profile to verified and available
          await supabase
            .from('celebrity_profiles')
            .update({ is_verified: true, is_available: true })
            .eq('id', profileData.id);
        }

        toast({
          title: "Success",
          description: enableSubscription 
            ? "User account, profile, and subscription created successfully" 
            : "User account and celebrity profile created successfully",
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

                {/* Availability Section */}
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Availability Hours
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">24/7</span>
                        <Switch
                          checked={formData.is_available_24h}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_available_24h: checked })}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {!formData.is_available_24h && (
                    <CardContent className="py-0 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Start Time</Label>
                          <Input
                            type="time"
                            value={formData.availability_start_time}
                            onChange={(e) => setFormData({ ...formData, availability_start_time: e.target.value })}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">End Time</Label>
                          <Input
                            type="time"
                            value={formData.availability_end_time}
                            onChange={(e) => setFormData({ ...formData, availability_end_time: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Subscription Section */}
                <Card className="border-primary/20 bg-accent/5">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Initial Subscription
                      </div>
                      <Switch
                        checked={enableSubscription}
                        onCheckedChange={setEnableSubscription}
                      />
                    </CardTitle>
                  </CardHeader>
                  {enableSubscription && (
                    <CardContent className="py-0 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5 sm:space-y-2 min-w-0">
                          <Label className="text-sm font-medium">Subscription Tier *</Label>
                          <Select
                            value={formData.subscription_tier}
                            onValueChange={(value) => setFormData({ ...formData, subscription_tier: value, duration_type: "" })}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              {uniqueTiers.map((tier) => (
                                <SelectItem key={tier} value={tier}>
                                  {tier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 min-w-0">
                          <Label className="text-sm font-medium">Duration *</Label>
                          <Select
                            value={formData.duration_type}
                            onValueChange={(value) => setFormData({ ...formData, duration_type: value })}
                            disabled={!formData.subscription_tier}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {subscriptionPackages
                                .filter(p => p.tier_name === formData.subscription_tier)
                                .map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.duration_type}>
                                    {pkg.duration_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - KES {pkg.price.toLocaleString()}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {selectedPackage && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Selected: {selectedPackage.tier_name.replace(/_/g, ' ')} - {selectedPackage.duration_type.replace(/_/g, ' ')} at KES {selectedPackage.price.toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>

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
