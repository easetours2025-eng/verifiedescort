import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GenderSelect } from '@/components/GenderSelect';
import { CountrySelect } from '@/components/CountrySelect';
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
  DollarSign,
  Instagram,
  Twitter,
  X
} from 'lucide-react';
import ProfilePictureUpload from './ProfilePictureUpload';

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
      // First try to fetch by celebrity profile id
      let { data, error } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('id', celebrityId)
        .maybeSingle();

      // If not found by id, try by user_id (in case celebrityId is actually a user_id)
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
      const { error } = await supabase
        .from('celebrity_profiles')
        .update({
          stage_name: profile.stage_name,
          real_name: profile.real_name,
          bio: profile.bio,
          email: profile.email,
          phone_number: profile.phone_number,
          location: profile.location,
          age: profile.age,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          base_price: profile.base_price,
          hourly_rate: profile.hourly_rate,
          social_instagram: profile.social_instagram,
          social_twitter: profile.social_twitter,
          social_tiktok: profile.social_tiktok,
          is_verified: profile.is_verified,
          is_available: profile.is_available,
        })
        .eq('id', celebrityId);

      if (error) throw error;

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

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('celebrity-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create media record
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('celebrity-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
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
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePictureUpload
                  profileId={celebrityId}
                  currentImagePath={profile.profile_picture_path}
                  onUpload={(imagePath) => {
                    setProfile({ ...profile, profile_picture_path: imagePath });
                    fetchProfile();
                  }}
                  initials={profile.stage_name.charAt(0).toUpperCase()}
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stage Name *</Label>
                    <Input
                      value={profile.stage_name}
                      onChange={(e) => setProfile({ ...profile, stage_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Real Name</Label>
                    <Input
                      value={profile.real_name || ''}
                      onChange={(e) => setProfile({ ...profile, real_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={profile.email || ''}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.phone_number || ''}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        placeholder="254XXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.location || ''}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                      min="18"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={profile.date_of_birth || ''}
                      onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <GenderSelect
                    value={profile.gender || []}
                    onChange={(genders) => setProfile({ ...profile, gender: genders })}
                  />
                </div>

                <div className="space-y-2">
                  <CountrySelect
                    value={profile.country || ''}
                    onChange={(country) => setProfile({ ...profile, country })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price (KSH)</Label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={profile.base_price || 0}
                        onChange={(e) => setProfile({ ...profile, base_price: parseFloat(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate (KSH)</Label>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={profile.hourly_rate || ''}
                        onChange={(e) => setProfile({ ...profile, hourly_rate: parseFloat(e.target.value) || undefined })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <div className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.social_instagram || ''}
                        onChange={(e) => setProfile({ ...profile, social_instagram: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter</Label>
                    <div className="flex items-center space-x-2">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.social_twitter || ''}
                        onChange={(e) => setProfile({ ...profile, social_twitter: e.target.value })}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label>Verified</Label>
                      <input
                        type="checkbox"
                        checked={profile.is_verified || false}
                        onChange={(e) => setProfile({ ...profile, is_verified: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label>Available</Label>
                      <input
                        type="checkbox"
                        checked={profile.is_available || false}
                        onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
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
                                  <input
                                    type="checkbox"
                                    checked={service.is_active}
                                    onChange={(e) => handleUpdateService(service.id, { is_active: e.target.checked })}
                                    className="h-4 w-4"
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
