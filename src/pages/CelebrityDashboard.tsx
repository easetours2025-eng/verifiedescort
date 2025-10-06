import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { default as MediaUploadComponent } from '@/components/MediaUpload';
import BulkMediaUpload from '@/components/BulkMediaUpload';
import CelebrityServices from '@/components/CelebrityServices';
import MediaManagement from '@/components/MediaManagement';
import SubscriptionUpgrade from '@/components/SubscriptionUpgrade';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import PaymentVerificationModal from '@/components/PaymentVerificationModal';
import SubscriptionTab from '@/components/SubscriptionTab';
import { 
  User, 
  Settings, 
  Upload, 
  Phone, 
  MapPin, 
  Instagram, 
  Twitter,
  Save,
  Eye,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Camera,
  Briefcase
} from 'lucide-react';

interface CelebrityProfile {
  id: string;
  stage_name: string;
  real_name?: string;
  bio?: string;
  phone_number?: string;
  location?: string;
  gender?: string;
  age?: number;
  date_of_birth?: string;
  profile_picture_path?: string;
  social_instagram?: string;
  social_twitter?: string;
  is_verified: boolean;
  is_available: boolean;
  credit_balance?: number;
}

interface MediaItem {
  id: string;
  title?: string;
  description?: string;
  file_path: string;
  file_type: string;
  price: number;
  is_premium: boolean;
  is_public: boolean;
  upload_date: string;
}

interface SubscriptionStatus {
  is_active: boolean;
  subscription_end?: string;
  subscription_start?: string;
  subscription_tier?: string;
  duration_type?: string;
  amount_paid?: number;
}

interface Service {
  id: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

const CelebrityDashboard = () => {
  const [profile, setProfile] = useState<CelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    // fetchMedia and fetchServices are called in the second useEffect after profile is loaded
    fetchSubscriptionStatus();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user || !profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('celebrity_subscriptions')
        .select('is_active, subscription_start, subscription_end, subscription_tier, duration_type, amount_paid')
        .eq('celebrity_id', profile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchSubscriptionStatus();
      fetchServices();
      fetchMedia(); // Fetch media after profile is loaded
    }
  }, [profile?.id]);

  const fetchMedia = async () => {
    if (!profile?.id) return; // Don't fetch if profile ID is not available
    
    try {
      const { data, error } = await supabase
        .from('celebrity_media')
        .select('*')
        .eq('celebrity_id', profile.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      
      // Add price field with default value for existing media without price
      const mediaWithPrice = (data || []).map(item => ({
        ...item,
        price: item.price || 0
      }));
      
      setMedia(mediaWithPrice);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const fetchServices = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('celebrity_services')
        .select('*')
        .eq('celebrity_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleProfileUpdate = async (updatedProfile: Partial<CelebrityProfile>) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('celebrity_profiles')
        .update(updatedProfile)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, ...updatedProfile });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = () => {
    fetchMedia(); // Refresh media list after upload
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('celebrity_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setMedia(media.filter(item => item.id !== mediaId));
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load your celebrity profile.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80 sticky top-0 z-50 overflow-x-hidden w-full">
        <div className="max-w-full mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 sm:justify-between max-w-full">
            {/* Title and Back Button */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-1 min-w-0 max-w-full">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')} 
                className="text-xs sm:text-sm px-1.5 sm:px-3 h-8 sm:h-9 shrink-0"
              >
                ← <span className="hidden min-[400px]:inline ml-1">Home</span>
              </Button>
              <h1 className="text-sm sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate min-w-0 flex-1">
                Dashboard
              </h1>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto shrink-0">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/celebrity/${profile.id}`)}
                size="sm"
                className="text-[10px] sm:text-sm px-1.5 sm:px-3 h-8 sm:h-9 flex-1 sm:flex-initial whitespace-nowrap"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden min-[400px]:inline">View</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={signOut} 
                size="sm" 
                className="text-[10px] sm:text-sm px-1.5 sm:px-3 h-8 sm:h-9 shrink-0 whitespace-nowrap"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-2 sm:px-4 py-3 sm:py-8 overflow-x-hidden">
        {/* Visibility Status Banner */}
        <div className="mb-3 sm:mb-6 max-w-full overflow-x-hidden">
          <VisibilityStatusBanner 
            subscriptionStatus={subscriptionStatus} 
            profile={profile} 
          />
        </div>

        <Tabs defaultValue="profile" className="space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-0.5 sm:gap-1 p-0.5 sm:p-1 h-auto bg-muted rounded-lg overflow-hidden">
            <TabsTrigger 
              value="profile" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[9px] min-[400px]:text-[10px] sm:text-sm py-1.5 sm:py-2.5 px-0.5 sm:px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="leading-tight">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscription" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[9px] min-[400px]:text-[10px] sm:text-sm py-1.5 sm:py-2.5 px-0.5 sm:px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="leading-tight">Sub</span>
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[9px] min-[400px]:text-[10px] sm:text-sm py-1.5 sm:py-2.5 px-0.5 sm:px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="leading-tight">Media</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[9px] min-[400px]:text-[10px] sm:text-sm py-1.5 sm:py-2.5 px-0.5 sm:px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="leading-tight">Services</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="max-w-full overflow-x-hidden">
            <ProfileTab profile={profile} onUpdate={handleProfileUpdate} saving={saving} />
          </TabsContent>

          <TabsContent value="subscription" className="max-w-full overflow-x-hidden">
            <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
              <SubscriptionTab 
                profile={profile} 
                subscriptionStatus={subscriptionStatus}
                onOpenPaymentModal={() => setShowPaymentModal(true)}
              />
              
              {/* Upgrade Option for subscribers */}
              {subscriptionStatus?.is_active && subscriptionStatus.subscription_tier && subscriptionStatus.amount_paid && subscriptionStatus.subscription_start && subscriptionStatus.duration_type && (
                <SubscriptionUpgrade
                  celebrityId={profile.id}
                  currentSubscription={{
                    subscription_tier: subscriptionStatus.subscription_tier,
                    duration_type: subscriptionStatus.duration_type,
                    amount_paid: subscriptionStatus.amount_paid,
                    subscription_end: subscriptionStatus.subscription_end || '',
                    subscription_start: subscriptionStatus.subscription_start
                  }}
                  creditBalance={profile.credit_balance || 0}
                  onUpgradeSubmit={() => {
                    fetchSubscriptionStatus();
                    fetchProfile();
                    toast({
                      title: "Upgrade Submitted",
                      description: "Your upgrade request is being processed",
                    });
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="media" className="max-w-full overflow-x-hidden">
            <MediaTab 
              profile={profile} 
              media={media} 
              onUpload={handleMediaUpload}
              onDelete={deleteMedia}
            />
          </TabsContent>

          <TabsContent value="services" className="max-w-full overflow-x-hidden">
            <CelebrityServices
              celebrityId={profile?.id || ''}
              services={services}
              onServicesUpdate={fetchServices}
              isEditable={true}
            />
          </TabsContent>
        </Tabs>
      </div>

      <PaymentVerificationModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        celebrityId={profile?.id || ''}
      />
    </div>
  );
};

// Visibility Status Banner Component
const VisibilityStatusBanner = ({ 
  subscriptionStatus, 
  profile 
}: {
  subscriptionStatus: SubscriptionStatus | null;
  profile: CelebrityProfile;
}) => {
  const [specialOfferStatus, setSpecialOfferStatus] = useState<{
    isActive: boolean;
    daysLeft: number;
    registeredAt?: string;
  } | null>(null);

  useEffect(() => {
    checkSpecialOfferStatus();
  }, [profile]);

  const checkSpecialOfferStatus = async () => {
    if (!profile?.id) return;

    try {
      // Get the full profile to check special offer status
      const { data: fullProfile, error } = await supabase
        .from('celebrity_profiles')
        .select('special_offer_registered_at, is_special_offer_active, created_at')
        .eq('id', profile.id)
        .single();

      if (error || !fullProfile) return;

      const now = new Date();
      const offerStartDate = new Date('2025-01-27T00:00:00Z');
      const offerEndDate = new Date('2025-02-01T23:59:59Z');
      
      // Check if user registered during offer period
      const registeredAt = fullProfile.special_offer_registered_at 
        ? new Date(fullProfile.special_offer_registered_at)
        : new Date(fullProfile.created_at);

      const isInOfferPeriod = now >= offerStartDate && now <= offerEndDate;
      const registeredDuringOffer = fullProfile.special_offer_registered_at && 
        registeredAt >= offerStartDate && registeredAt <= offerEndDate;

      if (registeredDuringOffer) {
        // Calculate days left in 5-day period
        const offerExpiryDate = new Date(registeredAt.getTime() + (5 * 24 * 60 * 60 * 1000));
        const timeLeft = offerExpiryDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

        setSpecialOfferStatus({
          isActive: timeLeft > 0,
          daysLeft,
          registeredAt: fullProfile.special_offer_registered_at
        });
      } else if (isInOfferPeriod && !fullProfile.special_offer_registered_at) {
        // Show offer availability for new users
        setSpecialOfferStatus({
          isActive: false,
          daysLeft: 0
        });
      }
    } catch (error) {
      console.error('Error checking special offer status:', error);
    }
  };

  const isPaidSubscriptionActive = subscriptionStatus?.is_active && 
    subscriptionStatus.subscription_end && 
    new Date(subscriptionStatus.subscription_end) > new Date();

  const isSpecialOfferActive = specialOfferStatus?.isActive || false;
  const isPubliclyVisible = isPaidSubscriptionActive || isSpecialOfferActive;

  // Show special offer banner if currently in offer period
  const now = new Date();
  const offerStartDate = new Date('2025-01-27T00:00:00Z');
  const offerEndDate = new Date('2025-02-01T23:59:59Z');
  const isCurrentlyInOfferPeriod = now >= offerStartDate && now <= offerEndDate;

  return (
    <div className="space-y-3">
      {/* Special 5-Day Offer Banner */}
      {isCurrentlyInOfferPeriod && (
        <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎉</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-orange-800 text-sm sm:text-base">🔥 Special Joining Offer!</h3>
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                    Limited Time
                  </Badge>
                </div>
                {specialOfferStatus?.isActive ? (
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700 font-medium">
                      ✅ Your profile is publicly visible for FREE! 
                    </p>
                    <p className="text-xs text-orange-600">
                      {specialOfferStatus.daysLeft} day{specialOfferStatus.daysLeft !== 1 ? 's' : ''} left in your 5-day free visibility period
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs sm:text-sm text-orange-700 font-medium">
                      🚀 Get 5 days of FREE public visibility! No payment required.
                    </p>
                    <p className="text-xs text-orange-600">
                      Complete your profile setup to activate this limited-time offer
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Visibility Status */}
      <Card className={`border-2 ${isPubliclyVisible ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-3">
            {isPubliclyVisible ? (
              <>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-800 text-sm sm:text-base">Your Profile is Publicly Visible</h3>
                  {isSpecialOfferActive ? (
                    <p className="text-xs sm:text-sm text-green-700">
                      🎉 Active via Special 5-Day Offer! {specialOfferStatus?.daysLeft} day{specialOfferStatus?.daysLeft !== 1 ? 's' : ''} remaining
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-green-700">
                      Users can discover and book you. Subscription expires on{' '}
                      {subscriptionStatus?.subscription_end && new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">Profile Not Publicly Visible</h3>
                  <p className="text-xs sm:text-sm text-yellow-700">
                    {isCurrentlyInOfferPeriod 
                      ? "Complete your profile setup to activate the 5-day free visibility offer!"
                      : "Your profile is hidden from public view. Submit payment verification to become visible to users."
                    }
                  </p>
                </div>
                <Badge variant="secondary" className="text-yellow-800 bg-yellow-100 ml-2 sm:ml-0 flex-shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">
                    {isCurrentlyInOfferPeriod ? "Setup Required" : "Pending Payment"}
                  </span>
                  <span className="sm:hidden">
                    {isCurrentlyInOfferPeriod ? "Setup" : "Pending"}
                  </span>
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ profile, onUpdate, saving }: {
  profile: CelebrityProfile;
  onUpdate: (data: Partial<CelebrityProfile>) => void;
  saving: boolean;
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    stage_name: profile.stage_name,
    real_name: profile.real_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    gender: profile.gender || '',
    phone_number: profile.phone_number || '',
    age: profile.age || 18,
    social_instagram: profile.social_instagram || '',
    social_twitter: profile.social_twitter || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that gender is selected if it's not empty
    if (formData.gender === '') {
      toast({
        title: "Validation Error",
        description: "Please select a gender or leave it unset",
        variant: "destructive",
      });
      return;
    }
    
    // Only include gender in update if it has a valid value
    const updateData = {
      ...formData,
      gender: formData.gender || null, // Send null instead of empty string
    };
    
    onUpdate(updateData);
  };

  return (
    <Card className="max-w-full overflow-hidden">
      <CardHeader className="pb-3 sm:pb-6 px-2 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-xl">
          <User className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Profile Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6 max-w-full overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 max-w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Stage Name *</label>
              <Input
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                required
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Real Name</label>
              <Input
                value={formData.real_name}
                onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 max-w-full">
            <label className="text-xs sm:text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              placeholder="Tell people about yourself..."
              className="text-xs sm:text-base resize-none min-h-[80px] w-full"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              Write an engaging bio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City"
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-9 sm:h-10 px-2 sm:px-3 border border-input rounded-md bg-background text-xs sm:text-base"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Age *</label>
              <Input
                type="number"
                min="18"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 18 })}
                placeholder="25"
                required
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">18+ only</p>
            </div>
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium">Profile Picture</label>
              <ProfilePictureUpload
                profileId={profile.id}
                currentImagePath={profile.profile_picture_path}
                onUpload={(imagePath) => onUpdate({ profile_picture_path: imagePath })}
                initials={profile.stage_name.charAt(0).toUpperCase()}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2 max-w-full">
            <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span>Phone Number</span>
            </label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+254..."
              className="text-xs sm:text-base h-9 sm:h-10 w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <Instagram className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>Instagram</span>
              </label>
              <Input
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                placeholder="@username"
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <Twitter className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>Twitter</span>
              </label>
              <Input
                value={formData.social_twitter}
                onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                placeholder="@username"
                className="text-xs sm:text-base h-9 sm:h-10 w-full"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full h-9 sm:h-11 text-xs sm:text-base mt-4 sm:mt-6">
            <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Media Tab Component
const MediaTab = ({ profile, media, onUpload, onDelete }: {
  profile: CelebrityProfile;
  media: MediaItem[];
  onUpload: () => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Media Management */}
      <div className="max-w-full overflow-x-hidden">
        <MediaManagement 
          profile={profile}
          media={media}
          onMediaUpdate={onUpload}
        />
      </div>
      
      {/* Bulk Upload */}
      <div className="max-w-full overflow-x-hidden">
        <BulkMediaUpload 
          celebrityId={profile.id} 
          onUpload={onUpload}
        />
      </div>
      
      {/* Individual Upload */}
      <div className="max-w-full overflow-x-hidden">
        <MediaUploadComponent 
          celebrityId={profile.id} 
          onUpload={onUpload}
        />
      </div>
    </div>
  );
};


export default CelebrityDashboard;