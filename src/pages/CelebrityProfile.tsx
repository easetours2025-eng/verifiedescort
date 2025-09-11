import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from '@/components/MessagingModal';
import { 
  filterCelebrityData, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile, 
  CelebrityProfile as FullCelebrityProfile,
  isPrivateProfile 
} from '@/lib/celebrity-utils';
import { 
  ArrowLeft,
  Star, 
  MapPin, 
  Phone, 
  Instagram, 
  Twitter,
  Video,
  Image as ImageIcon,
  Verified,
  DollarSign,
  Clock,
  Heart,
  Share2,
  MessageCircle,
  Briefcase,
  MessageSquare
} from 'lucide-react';

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

const CelebrityProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicCelebrityProfile | PrivateCelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchMedia();
      fetchServices();
      generateViewCounts();
    }
  }, [id]);

  useEffect(() => {
    if (profile) {
      fetchProfileImage();
    }
  }, [profile]);

  const generateViewCounts = () => {
    // Generate random view counts for demo purposes
    const counts: Record<string, number> = {};
    media.forEach(item => {
      counts[item.id] = Math.floor(Math.random() * 1000) + 50;
    });
    setViewCounts(counts);
  };

  useEffect(() => {
    generateViewCounts();
  }, [media]);

  const fetchProfile = async () => {
    try {
      // First check if this celebrity has an active subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('celebrity_subscriptions')
        .select('is_active, subscription_end')
        .eq('celebrity_id', id)
        .eq('is_active', true)
        .gte('subscription_end', new Date().toISOString())
        .maybeSingle();

      // Check if current user is the celebrity themselves
      const { data: { user } } = await supabase.auth.getUser();
      const { data: celebrityData, error: celebrityError } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (celebrityError) throw celebrityError;

      // If no active subscription and user is not the celebrity themselves, deny access
      if (!subscriptionData && (!user || celebrityData.user_id !== user.id)) {
        toast({
          title: "Profile Not Available",
          description: "This celebrity profile is not currently available for public viewing.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Filter sensitive data based on user permissions
      const filteredProfile = await filterCelebrityData(celebrityData as FullCelebrityProfile);
      setProfile(filteredProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Celebrity profile not found",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const fetchMedia = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('celebrity_media')
        .select('*')
        .eq('celebrity_id', id)
        .eq('is_public', true)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const fetchServices = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('celebrity_services')
        .select('*')
        .eq('celebrity_id', id)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileImage = async () => {
    if (!id || !profile) return;
    
    try {
      // First try to get the profile picture from celebrity_profiles
      if (profile.profile_picture_path) {
        const { data: urlData } = supabase.storage
          .from('celebrity-photos')
          .getPublicUrl(profile.profile_picture_path);
        setProfileImage(urlData.publicUrl);
        return;
      }

      // If no profile picture, try to get latest public image from media
      const { data } = await supabase
        .from('celebrity_media')
        .select('file_path')
        .eq('celebrity_id', id)
        .eq('is_public', true)
        .eq('file_type', 'image')
        .order('upload_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.file_path) {
        const { data: urlData } = supabase.storage
          .from('celebrity-photos')
          .getPublicUrl(data.file_path);
        setProfileImage(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const handleContact = () => {
    if (isPrivateProfile(profile) && profile?.phone_number) {
      window.open(`tel:${profile.phone_number}`, '_self');
    } else {
      toast({
        title: "Contact Info",
        description: "Phone number not available for this celebrity",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = () => {
    if (isPrivateProfile(profile) && profile?.phone_number) {
      const cleanPhone = profile.phone_number.replace(/[^\d+]/g, '');
      const message = encodeURIComponent(`Hi ${profile.stage_name}, I'm interested in booking you through Celebrity Connect.`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      toast({
        title: "Contact Info",
        description: "Phone number not available for this celebrity",
        variant: "destructive",
      });
    }
  };

  const handleSocialClick = (platform: 'instagram' | 'twitter') => {
    const username = platform === 'instagram' ? profile?.social_instagram : profile?.social_twitter;
    if (username) {
      const url = platform === 'instagram' 
        ? `https://instagram.com/${username.replace('@', '')}`
        : `https://twitter.com/${username.replace('@', '')}`;
      window.open(url, '_blank');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMediaUrl = (filePath: string, type: 'image' | 'video') => {
    const bucket = type === 'video' ? 'celebrity-videos' : 'celebrity-photos';
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleMediaClick = (item: MediaItem) => {
    // Increment view count when media is clicked
    setViewCounts(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
    setSelectedMedia(item);
  };

  const filteredMedia = media.filter(item => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'images') return item.file_type === 'image';
    if (mediaFilter === 'videos') return item.file_type === 'video';
    return true;
  });

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
            <CardTitle>Celebrity Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The celebrity profile you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-lg">
                      <AvatarImage src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.stage_name}`} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-2xl font-bold">
                        {getInitials(profile.stage_name)}
                      </AvatarFallback>
                    </Avatar>
                    {profile.is_verified && (
                      <div className="absolute -bottom-2 -right-2 bg-accent rounded-full p-2">
                        <Verified className="h-6 w-6 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {profile.stage_name}
                  </h1>
                  {/* Only show real name if user has access to private data */}
                  {isPrivateProfile(profile) && profile.real_name && (
                    <p className="text-muted-foreground">({profile.real_name})</p>
                  )}
                  
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant={profile.is_available ? "default" : "secondary"}>
                      {profile.is_available ? "Available" : "Busy"}
                    </Badge>
                    {profile.gender && (
                      <Badge variant="outline" className="capitalize">
                        {profile.gender}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {profile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                <Separator />

                {/* Contact Info - Only show if user has access to private data */}
                {isPrivateProfile(profile) && (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Contact Information</h3>
                      
                      {profile.location && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      
                      {profile.phone_number && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm font-medium">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.phone_number}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleContact}
                              className="flex-1"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleWhatsApp}
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />
                  </>
                )}

                {/* Location for public users (sanitized) */}
                {!isPrivateProfile(profile) && profile.location && (
                  <>
                    <div className="space-y-3">
                      <h3 className="font-semibold">Location</h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                {/* Services */}
                {services.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center space-x-2">
                      <Briefcase className="h-4 w-4" />
                      <span>Services Offered</span>
                    </h3>
                    
                    <div className="space-y-2">
                      {services.slice(0, 3).map((service) => (
                        <div key={service.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <div>
                            <p className="text-sm font-medium">{service.service_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.duration_minutes} minutes
                            </p>
                          </div>
                          <span className="font-bold text-primary text-sm">
                            KSh {service.price}
                          </span>
                        </div>
                      ))}
                      {services.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{services.length - 3} more services
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {services.length > 0 && <Separator />}

                {/* Pricing */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Base Pricing</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Starting Price:</span>
                      <span className="font-bold text-primary">KSh {profile.base_price}</span>
                    </div>
                    {profile.hourly_rate && (
                      <div className="flex justify-between">
                        <span className="text-sm">Per Hour:</span>
                        <span className="font-bold text-accent">KSh {profile.hourly_rate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Social Links */}
                {(profile.social_instagram || profile.social_twitter) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Social Media</h3>
                    <div className="flex space-x-2">
                      {profile.social_instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocialClick('instagram')}
                        >
                          <Instagram className="h-4 w-4 mr-2 text-pink-500" />
                          Instagram
                        </Button>
                      )}
                      {profile.social_twitter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocialClick('twitter')}
                        >
                          <Twitter className="h-4 w-4 mr-2 text-blue-500" />
                          Twitter
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Media Gallery */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Media Gallery ({filteredMedia.length})</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={mediaFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={mediaFilter === 'images' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('images')}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Images ({media.filter(m => m.file_type === 'image').length})
                    </Button>
                    <Button
                      variant={mediaFilter === 'videos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('videos')}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Videos ({media.filter(m => m.file_type === 'video').length})
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredMedia.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center space-x-2 mb-4">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Media Available</h3>
                    <p className="text-muted-foreground">
                      {mediaFilter === 'all' 
                        ? "This celebrity hasn't uploaded any public media yet."
                        : `This celebrity hasn't uploaded any ${mediaFilter} yet.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMedia.map((item) => (
                      <Card 
                        key={item.id} 
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden relative"
                        onClick={() => handleMediaClick(item)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                          {item.file_type === 'video' ? (
                            <>
                              <video
                                src={getMediaUrl(item.file_path, 'video')}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="bg-white/90 rounded-full p-3">
                                  <Video className="h-6 w-6 text-primary" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <img 
                                src={getMediaUrl(item.file_path, 'image')}
                                alt="Celebrity media"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <ImageIcon className="h-12 w-12 text-primary hidden" />
                            </>
                          )}
                        </div>
                        
                        {/* View Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                          👁 {viewCounts[item.id] || 0}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
              onClick={() => setSelectedMedia(null)}
            >
              ✕ Close
            </Button>
            {selectedMedia.file_type === 'video' ? (
              <video
                src={getMediaUrl(selectedMedia.file_path, 'video')}
                className="w-full h-auto max-h-[80vh] rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <img
                src={getMediaUrl(selectedMedia.file_path, 'image')}
                alt="Celebrity media"
                className="w-full h-auto max-h-[80vh] rounded-lg object-contain"
              />
            )}
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
              Views: {viewCounts[selectedMedia.id] || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebrityProfile;