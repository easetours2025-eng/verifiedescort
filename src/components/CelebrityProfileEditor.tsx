import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GenderSelect } from '@/components/GenderSelect';
import { CountrySelect } from '@/components/CountrySelect';
import AIBioGenerator from '@/components/AIBioGenerator';
import ProfilePictureUpload from './ProfilePictureUpload';
import { 
  Save, 
  Upload, 
  Trash2, 
  User, 
  Image as ImageIcon, 
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Instagram,
  Twitter,
  X
} from 'lucide-react';

interface CelebrityProfile {
  id: string;
  user_id: string;
  stage_name: string;
  real_name?: string;
  bio?: string;
  email?: string;
  phone_number?: string;
  location?: string;
  country?: string;
  age?: number;
  date_of_birth?: string;
  gender?: string[];
  profile_picture_path?: string;
  base_price?: number;
  hourly_rate?: number;
  social_instagram?: string;
  social_twitter?: string;
  social_tiktok?: string;
  is_verified?: boolean;
  is_available?: boolean;
}

interface Service {
  id: string;
  service_name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  is_active: boolean;
}

interface MediaItem {
  id: string;
  file_path: string;
  file_type: string;
  title?: string;
  description?: string;
  is_public: boolean;
  upload_date: string;
}

interface CelebrityProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrityId: string;
  onSave: () => void;
}

const CelebrityProfileEditor = ({ open, onOpenChange, celebrityId, onSave }: CelebrityProfileEditorProps) => {
  const [profile, setProfile] = useState<CelebrityProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && celebrityId) {
      fetchProfile();
      fetchServices();
      fetchMedia();
    }
  }, [open, celebrityId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('id', celebrityId)
        .maybeSingle();

      if (!data && !error) {
        const result = await supabase
          .from('celebrity_profiles')
          .select('*')
          .eq('user_id', celebrityId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) {
        throw new Error('Profile not found. Please ensure the user has a celebrity profile.');
      }
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_services')
        .select('*')
        .eq('celebrity_id', celebrityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_media')
        .select('*')
        .eq('celebrity_id', celebrityId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      console.error('Error fetching media:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error("Admin session expired. Please sign in again.");
      }

      const response = await fetch(`https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/admin-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTY3NTksImV4cCI6MjA3MTI5Mjc1OX0.Guwh9JOeCCYUsqQfVANA-Kiqwl9yi_jGv92ZARqxl1w`,
        },
        body: JSON.stringify({
          action: 'update_celebrity_profile',
          profileId: celebrityId,
          profileData: {
            stage_name: profile.stage_name,
            real_name: profile.real_name,
            bio: profile.bio,
            email: profile.email,
            phone_number: profile.phone_number,
            location: profile.location,
            country: profile.country,
            age: profile.age,
            date_of_birth: profile.date_of_birth,
            gender: profile.gender,
            social_instagram: profile.social_instagram,
            social_twitter: profile.social_twitter,
            social_tiktok: profile.social_tiktok,
            is_verified: profile.is_verified,
            is_available: profile.is_available,
          },
          adminEmail: session.user.email
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${celebrityId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('celebrity-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase
          .from('celebrity_media')
          .insert({
            celebrity_id: celebrityId,
            file_path: filePath,
            file_type: file.type.startsWith('image/') ? 'image' : 'video',
            is_public: true,
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
      
      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('celebrity-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('celebrity_media')
        .delete()
        .eq('id', mediaId);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
      
      fetchMedia();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleAddService = async () => {
    try {
      const { error } = await supabase
        .from('celebrity_services')
        .insert({
          celebrity_id: celebrityId,
          service_name: 'New Service',
          description: '',
          price: 0,
          duration_minutes: 60,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service added successfully",
      });
      
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add service",
        variant: "destructive",
      });
    }
  };

  const handleUpdateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from('celebrity_services')
        .update(updates)
        .eq('id', serviceId);

      if (error) throw error;

      setServices(services.map(s => s.id === serviceId ? { ...s, ...updates } : s));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('celebrity_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      
      fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const getMediaUrl = (filePath: string) => {
    return `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${filePath}`;
  };

  if (loading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Celebrity Profile</span>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="media">
              <ImageIcon className="h-4 w-4 mr-2" />
              Media ({media.length})
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="h-4 w-4 mr-2" />
              Services ({services.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* Profile Information Card - Same layout as user dashboard */}
            <Card className="max-w-full overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span className="truncate">Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 max-w-full overflow-hidden">
                <div className="space-y-4 sm:space-y-6 max-w-full">
                  {/* Stage Name and Real Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium">Stage Name *</Label>
                      <Input
                        value={profile.stage_name}
                        onChange={(e) => setProfile({ ...profile, stage_name: e.target.value })}
                        required
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium">Real Name</Label>
                      <Input
                        value={profile.real_name || ''}
                        onChange={(e) => setProfile({ ...profile, real_name: e.target.value })}
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-1.5 sm:space-y-2 max-w-full">
                    <Label className="text-sm sm:text-sm font-medium">Bio</Label>
                    <Textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
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
                      onBioGenerated={(bio) => setProfile({ ...profile, bio })}
                    />
                  </div>

                  {/* Location and Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium">Location (City)</Label>
                      <Input
                        value={profile.location || ''}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="City"
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <CountrySelect
                        value={profile.country || ''}
                        onChange={(country) => setProfile({ ...profile, country })}
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0 sm:col-span-2">
                      <GenderSelect
                        value={profile.gender || []}
                        onChange={(genders) => setProfile({ ...profile, gender: genders })}
                      />
                    </div>
                  </div>

                  {/* Age and Profile Picture */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium">Age *</Label>
                      <Input
                        type="number"
                        min="18"
                        max="100"
                        value={profile.age || 18}
                        onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 18 })}
                        placeholder="25"
                        required
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                      <p className="text-xs sm:text-xs text-muted-foreground">18+ only</p>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium">Profile Picture</Label>
                      <ProfilePictureUpload
                        profileId={profile.id}
                        currentImagePath={profile.profile_picture_path}
                        onUpload={(imagePath) => {
                          setProfile({ ...profile, profile_picture_path: imagePath });
                          fetchProfile();
                        }}
                        initials={profile.stage_name.charAt(0).toUpperCase()}
                      />
                    </div>
                  </div>

                  {/* Email and Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-full">
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>Email</span>
                      </Label>
                      <Input
                        type="email"
                        value={profile.email || ''}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="email@example.com"
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 min-w-0">
                      <Label className="text-sm sm:text-sm font-medium flex items-center gap-1.5">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>Phone Number</span>
                      </Label>
                      <Input
                        type="tel"
                        value={profile.phone_number || ''}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
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
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
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
                        value={profile.social_instagram || ''}
                        onChange={(e) => setProfile({ ...profile, social_instagram: e.target.value })}
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
                        value={profile.social_twitter || ''}
                        onChange={(e) => setProfile({ ...profile, social_twitter: e.target.value })}
                        placeholder="@username"
                        className="text-sm sm:text-base h-10 sm:h-10 w-full"
                      />
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5 sm:space-y-2 max-w-full">
                    <Label className="text-sm sm:text-sm font-medium">TikTok</Label>
                    <Input
                      value={profile.social_tiktok || ''}
                      onChange={(e) => setProfile({ ...profile, social_tiktok: e.target.value })}
                      placeholder="@username"
                      className="text-sm sm:text-base h-10 sm:h-10 w-full"
                    />
                  </div>

                  {/* Admin Controls - Verified and Available */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Admin Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <Label className="text-sm">Verified</Label>
                          <Switch
                            checked={profile.is_verified || false}
                            onCheckedChange={(checked) => setProfile({ ...profile, is_verified: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                          <Label className="text-sm">Available</Label>
                          <Switch
                            checked={profile.is_available || false}
                            onCheckedChange={(checked) => setProfile({ ...profile, is_available: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving} 
                    className="w-full h-10 sm:h-11 text-sm sm:text-base mt-4 sm:mt-6"
                  >
                    <Save className="h-4 w-4 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Media Gallery</span>
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="media-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="media-upload">
                      <Button asChild disabled={uploading}>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload Media'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {media.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No media uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {media.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          {item.file_type === 'image' ? (
                            <img
                              src={getMediaUrl(item.file_path)}
                              alt={item.title || 'Media'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={getMediaUrl(item.file_path)}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteMedia(item.id, item.file_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Badge className="absolute bottom-2 left-2">
                          {item.file_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Services</span>
                  <Button onClick={handleAddService}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No services added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Input
                                value={service.service_name}
                                onChange={(e) => handleUpdateService(service.id, { service_name: e.target.value })}
                                className="font-semibold"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <Textarea
                              value={service.description || ''}
                              onChange={(e) => handleUpdateService(service.id, { description: e.target.value })}
                              placeholder="Service description..."
                              rows={2}
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Price (KSH)</Label>
                                <Input
                                  type="number"
                                  value={service.price || 0}
                                  onChange={(e) => handleUpdateService(service.id, { price: parseFloat(e.target.value) || 0 })}
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={service.duration_minutes || 60}
                                  onChange={(e) => handleUpdateService(service.id, { duration_minutes: parseInt(e.target.value) || 60 })}
                                  min="0"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="flex items-center space-x-2">
                                  <Label className="text-xs">Active</Label>
                                  <Switch
                                    checked={service.is_active}
                                    onCheckedChange={(checked) => handleUpdateService(service.id, { is_active: checked })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrityProfileEditor;
