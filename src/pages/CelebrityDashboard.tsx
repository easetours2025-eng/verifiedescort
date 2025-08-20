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
import MediaUpload from '@/components/MediaUpload';
import PaymentVerificationModal from '@/components/PaymentVerificationModal';
import SubscriptionTab from '@/components/SubscriptionTab';
import { 
  User, 
  Settings, 
  Upload, 
  DollarSign, 
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
  Clock
} from 'lucide-react';

interface CelebrityProfile {
  id: string;
  stage_name: string;
  real_name?: string;
  bio?: string;
  phone_number?: string;
  location?: string;
  gender?: string;
  base_price: number;
  hourly_rate?: number;
  social_instagram?: string;
  social_twitter?: string;
  is_verified: boolean;
  is_available: boolean;
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
}

const CelebrityDashboard = () => {
  const [profile, setProfile] = useState<CelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
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
    fetchMedia();
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
        .select('*')
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
    }
  }, [profile?.id]);

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_media')
        .select('*')
        .eq('celebrity_id', profile?.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back to Home
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Celebrity Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/celebrity/${profile.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Public Profile
              </Button>
              <Button variant="ghost" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Visibility Status Banner */}
        <div className="mb-6">
          <VisibilityStatusBanner 
            subscriptionStatus={subscriptionStatus} 
            profile={profile} 
          />
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Media</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab profile={profile} onUpdate={handleProfileUpdate} saving={saving} />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab 
              profile={profile} 
              subscriptionStatus={subscriptionStatus}
              onOpenPaymentModal={() => setShowPaymentModal(true)}
            />
          </TabsContent>

          <TabsContent value="media">
            <MediaTab 
              profile={profile} 
              media={media} 
              onUpload={handleMediaUpload}
              onDelete={deleteMedia}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab profile={profile} onUpdate={handleProfileUpdate} saving={saving} />
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
  const isPubliclyVisible = subscriptionStatus?.is_active && 
    subscriptionStatus.subscription_end && 
    new Date(subscriptionStatus.subscription_end) > new Date();

  return (
    <Card className={`border-2 ${isPubliclyVisible ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          {isPubliclyVisible ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Your Profile is Publicly Visible</h3>
                <p className="text-sm text-green-700">
                  Users can discover and book you. Subscription expires on{' '}
                  {subscriptionStatus.subscription_end && new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Profile Not Publicly Visible</h3>
                <p className="text-sm text-yellow-700">
                  Your profile is hidden from public view. Submit payment verification to become visible to users.
                </p>
              </div>
              <Badge variant="secondary" className="text-yellow-800 bg-yellow-100">
                <Clock className="h-3 w-3 mr-1" />
                Pending Payment
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Profile Tab Component
const ProfileTab = ({ profile, onUpdate, saving }: {
  profile: CelebrityProfile;
  onUpdate: (data: Partial<CelebrityProfile>) => void;
  saving: boolean;
}) => {
  const [formData, setFormData] = useState({
    stage_name: profile.stage_name,
    real_name: profile.real_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    gender: profile.gender || '',
    phone_number: profile.phone_number || '',
    social_instagram: profile.social_instagram || '',
    social_twitter: profile.social_twitter || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Profile Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stage Name *</label>
              <Input
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Real Name</label>
              <Input
                value={formData.real_name}
                onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Tell people about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Phone Number</span>
            </label>
            <Input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </label>
              <Input
                value={formData.social_instagram}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Twitter className="h-4 w-4" />
                <span>Twitter</span>
              </label>
              <Input
                value={formData.social_twitter}
                onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                placeholder="@username"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
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
    <div className="space-y-6">
      <MediaUpload celebrityId={profile.id} onUpload={onUpload} />
      
      <Card>
        <CardHeader>
          <CardTitle>Your Media ({media.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No media uploaded yet. Upload your first photo or video above!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={item.is_public ? "default" : "secondary"}>
                          {item.is_public ? "Public" : "Private"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{item.title || 'Untitled'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.file_type.toUpperCase()}
                        </span>
                        <span className="font-medium text-primary">
                          ${item.price}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ profile, onUpdate, saving }: {
  profile: CelebrityProfile;
  onUpdate: (data: Partial<CelebrityProfile>) => void;
  saving: boolean;
}) => {
  const [formData, setFormData] = useState({
    base_price: profile.base_price,
    hourly_rate: profile.hourly_rate || 0,
    is_available: profile.is_available,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Pricing & Availability</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Price ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hourly Rate ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="rounded border-input"
            />
            <label htmlFor="available" className="text-sm font-medium">
              Available for bookings
            </label>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CelebrityDashboard;