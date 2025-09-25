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
  MessageSquare,
  Eye,
  ThumbsUp
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
  const [profile, setProfile] = useState<PrivateCelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, { likes: number; loves: number }>>({});
  const [userLikes, setUserLikes] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get user IP for tracking views and likes
  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchMedia();
      fetchServices();
    }
  }, [id]);

  useEffect(() => {
    if (profile) {
      fetchProfileImage();
    }
  }, [profile]);

  useEffect(() => {
    if (media.length > 0) {
      fetchViewCounts();
      fetchLikeCounts();
      fetchUserLikes();
    }
  }, [media]);

  const fetchViewCounts = async () => {
    try {
      const mediaIds = media.map(m => m.id);
      const { data, error } = await supabase
        .from('media_views')
        .select('media_id, id')
        .in('media_id', mediaIds);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      mediaIds.forEach(id => counts[id] = 0);
      
      data?.forEach(view => {
        counts[view.media_id] = (counts[view.media_id] || 0) + 1;
      });
      
      setViewCounts(counts);
    } catch (error) {
      console.error('Error fetching view counts:', error);
    }
  };

  const fetchLikeCounts = async () => {
    try {
      const mediaIds = media.map(m => m.id);
      const { data, error } = await supabase
        .from('media_likes')
        .select('media_id, like_type')
        .in('media_id', mediaIds);
      
      if (error) throw error;
      
      const counts: Record<string, { likes: number; loves: number }> = {};
      mediaIds.forEach(id => counts[id] = { likes: 0, loves: 0 });
      
      data?.forEach(like => {
        if (like.like_type === 'like') {
          counts[like.media_id].likes++;
        } else if (like.like_type === 'love') {
          counts[like.media_id].loves++;
        }
      });
      
      setLikeCounts(counts);
    } catch (error) {
      console.error('Error fetching like counts:', error);
    }
  };

  const fetchUserLikes = async () => {
    try {
      const userIP = await getUserIP();
      const mediaIds = media.map(m => m.id);
      const { data, error } = await supabase
        .from('media_likes')
        .select('media_id, like_type')
        .in('media_id', mediaIds)
        .eq('user_ip', userIP);
      
      if (error) throw error;
      
      const likes: Record<string, string[]> = {};
      mediaIds.forEach(id => likes[id] = []);
      
      data?.forEach(like => {
        likes[like.media_id].push(like.like_type);
      });
      
      setUserLikes(likes);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: celebrityData, error: celebrityError } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (celebrityError) throw celebrityError;

      // Return all data as public since authorization is removed
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
    if (profile?.phone_number) {
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
    if (profile?.phone_number) {
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

  const handleMediaClick = async (item: MediaItem) => {
    try {
      const userIP = await getUserIP();
      
      // Record view
      await supabase
        .from('media_views')
        .insert({ 
          media_id: item.id, 
          user_ip: userIP 
        });
      
      // Update local view count
      setViewCounts(prev => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + 1
      }));
      
      setSelectedMedia(item);
    } catch (error) {
      console.error('Error recording view:', error);
      setSelectedMedia(item);
    }
  };

  const handleLike = async (mediaId: string, type: 'like' | 'love') => {
    try {
      const userIP = await getUserIP();
      
      // Check if user already liked/loved this media
      const currentLikes = userLikes[mediaId] || [];
      
      if (currentLikes.includes(type)) {
        // Remove like/love
        await supabase
          .from('media_likes')
          .delete()
          .eq('media_id', mediaId)
          .eq('user_ip', userIP)
          .eq('like_type', type);
        
        // Update local state
        setUserLikes(prev => ({
          ...prev,
          [mediaId]: prev[mediaId]?.filter(t => t !== type) || []
        }));
        
        setLikeCounts(prev => ({
          ...prev,
          [mediaId]: {
            ...prev[mediaId],
            [type === 'like' ? 'likes' : 'loves']: Math.max(0, (prev[mediaId]?.[type === 'like' ? 'likes' : 'loves'] || 0) - 1)
          }
        }));
      } else {
        // Add like/love
        await supabase
          .from('media_likes')
          .insert({ 
            media_id: mediaId, 
            user_ip: userIP,
            like_type: type
          });
        
        // Update local state
        setUserLikes(prev => ({
          ...prev,
          [mediaId]: [...(prev[mediaId] || []), type]
        }));
        
        setLikeCounts(prev => ({
          ...prev,
          [mediaId]: {
            ...prev[mediaId],
            [type === 'like' ? 'likes' : 'loves']: (prev[mediaId]?.[type === 'like' ? 'likes' : 'loves'] || 0) + 1
          }
        }));
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Could not update like status",
        variant: "destructive",
      });
    }
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 sm:px-4">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" className="p-2">
                <Heart className="h-4 w-4" />
                <span className="sr-only">Favorite</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card className="lg:sticky lg:top-24">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20 shadow-lg">
                        <AvatarImage src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.stage_name}`} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xl sm:text-2xl font-bold">
                          {getInitials(profile.stage_name)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.is_verified && (
                        <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-accent rounded-full p-1.5 sm:p-2">
                          <Verified className="h-4 w-4 sm:h-6 sm:w-6 text-accent-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {profile.stage_name}
                    </h1>
                    {profile.real_name && (
                      <p className="text-sm sm:text-base text-muted-foreground">({profile.real_name})</p>
                    )}
                    
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant={profile.is_available ? "default" : "secondary"} className="text-xs">
                        {profile.is_available ? "Available" : "Busy"}
                      </Badge>
                      {profile.gender && (
                        <Badge variant="outline" className="capitalize text-xs">
                          {profile.gender}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
                  {profile.bio && (
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">About</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">{profile.bio}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm sm:text-base">Contact Information</h3>
                    
                    {profile.location && (
                      <div className="flex items-center space-x-2 text-xs sm:text-sm">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    
                    {profile.phone_number && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                          <span className="break-all">{profile.phone_number}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContact}
                            className="flex-1 text-xs"
                          >
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleWhatsApp}
                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-300 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Services */}
                  {services.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center space-x-2 text-sm sm:text-base">
                        <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Services Offered</span>
                      </h3>
                      
                      <div className="space-y-2">
                        {services.slice(0, 3).map((service) => (
                          <div key={service.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs sm:text-sm">
                            <div>
                              <p className="font-medium">{service.service_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {service.duration_minutes} minutes
                              </p>
                            </div>
                            <span className="font-bold text-primary text-xs sm:text-sm">
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
                    <h3 className="font-semibold flex items-center space-x-2 text-sm sm:text-base">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Base Pricing</span>
                    </h3>
                    
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span>Starting Price:</span>
                        <span className="font-bold text-primary">KSh {profile.base_price}</span>
                      </div>
                      {profile.hourly_rate && (
                        <div className="flex justify-between">
                          <span>Per Hour:</span>
                          <span className="font-bold text-accent">KSh {profile.hourly_rate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Social Links */}
                  {(profile.social_instagram || profile.social_twitter) && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm sm:text-base">Social Media</h3>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        {profile.social_instagram && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSocialClick('instagram')}
                            className="text-xs"
                          >
                            <Instagram className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-pink-500" />
                            Instagram
                          </Button>
                        )}
                        {profile.social_twitter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSocialClick('twitter')}
                            className="text-xs"
                          >
                            <Twitter className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500" />
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
            <div className="lg:col-span-2 order-1 lg:order-2">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Media Gallery ({filteredMedia.length})</CardTitle>
                  <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
                    <Button
                      variant={mediaFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('all')}
                      className="text-xs whitespace-nowrap"
                    >
                      All
                    </Button>
                    <Button
                      variant={mediaFilter === 'images' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('images')}
                      className="text-xs whitespace-nowrap"
                    >
                      <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Images ({media.filter(m => m.file_type === 'image').length})
                    </Button>
                    <Button
                      variant={mediaFilter === 'videos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaFilter('videos')}
                      className="text-xs whitespace-nowrap"
                    >
                      <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Videos ({media.filter(m => m.file_type === 'video').length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {filteredMedia.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="flex justify-center space-x-2 mb-4">
                        <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                        <Video className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold mb-2">No Media Available</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {mediaFilter === 'all' 
                          ? "This celebrity hasn't uploaded any public media yet."
                          : `This celebrity hasn't uploaded any ${mediaFilter} yet.`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {filteredMedia.map((item) => (
                        <Card 
                          key={item.id} 
                          className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden relative"
                        >
                          <div 
                            className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden"
                            onClick={() => handleMediaClick(item)}
                          >
                            {item.file_type === 'video' ? (
                              <>
                                <video
                                  src={getMediaUrl(item.file_path, 'video')}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <div className="bg-white/90 rounded-full p-2 sm:p-3">
                                    <Video className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
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
                                <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-primary hidden" />
                              </>
                            )}
                            
                            {/* View Counter */}
                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{viewCounts[item.id] || 0}</span>
                            </div>
                          </div>
                          
                          {/* Like/Love Actions */}
                          <div className="p-2 bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(item.id, 'like');
                                }}
                                className={`p-1 h-auto ${userLikes[item.id]?.includes('like') ? 'text-blue-600' : 'text-muted-foreground'}`}
                              >
                                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="ml-1 text-xs">{likeCounts[item.id]?.likes || 0}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(item.id, 'love');
                                }}
                                className={`p-1 h-auto ${userLikes[item.id]?.includes('love') ? 'text-red-600' : 'text-muted-foreground'}`}
                              >
                                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="ml-1 text-xs">{likeCounts[item.id]?.loves || 0}</span>
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.file_type === 'video' ? 'Video' : 'Photo'}
                            </div>
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="relative max-w-4xl w-full max-h-full overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 z-10"
                onClick={() => setSelectedMedia(null)}
              >
                ✕ Close
              </Button>
              
              <div className="bg-card rounded-lg overflow-hidden">
                {selectedMedia.file_type === 'video' ? (
                  <video
                    src={getMediaUrl(selectedMedia.file_path, 'video')}
                    className="w-full h-auto max-h-[70vh] sm:max-h-[80vh]"
                    controls
                    autoPlay
                  />
                ) : (
                  <img
                    src={getMediaUrl(selectedMedia.file_path, 'image')}
                    alt="Celebrity media"
                    className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain"
                  />
                )}
                
                {/* Modal Stats and Actions */}
                <div className="p-3 sm:p-4 bg-card border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{viewCounts[selectedMedia.id] || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(selectedMedia.id, 'like')}
                          className={`p-2 ${userLikes[selectedMedia.id]?.includes('like') ? 'text-blue-600' : 'text-muted-foreground'}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="ml-1">{likeCounts[selectedMedia.id]?.likes || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(selectedMedia.id, 'love')}
                          className={`p-2 ${userLikes[selectedMedia.id]?.includes('love') ? 'text-red-600' : 'text-muted-foreground'}`}
                        >
                          <Heart className="h-4 w-4" />
                          <span className="ml-1">{likeCounts[selectedMedia.id]?.loves || 0}</span>
                        </Button>
                      </div>
                    </div>
                    {selectedMedia.title && (
                      <h3 className="font-semibold text-sm sm:text-base">{selectedMedia.title}</h3>
                    )}
                  </div>
                  {selectedMedia.description && (
                    <p className="text-muted-foreground text-xs sm:text-sm mt-2">{selectedMedia.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default CelebrityProfile;