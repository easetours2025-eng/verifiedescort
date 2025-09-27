import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MessagingModal from '@/components/MessagingModal';
import MediaCard from '@/components/MediaCard';
import CelebrityMediaVideoCard from '@/components/CelebrityMediaVideoCard';
import VideoModal from '@/components/VideoModal';
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
  ThumbsUp,
  CheckCircle,
  Music,
  Calendar
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
  const [profile, setProfile] = useState<PublicCelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [otherCelebrities, setOtherCelebrities] = useState<PublicCelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [isLoadingOthers, setIsLoadingOthers] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
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
      fetchCelebrityMedia();
      fetchServices();
      fetchOtherCelebrities();
    }
  }, [id]);

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
        .from('media_stats')
        .select('media_id, view_count')
        .in('media_id', mediaIds);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      mediaIds.forEach(id => counts[id] = 0);
      
      // Sum up view counts for each media across all dates
      data?.forEach(stat => {
        counts[stat.media_id] = (counts[stat.media_id] || 0) + (stat.view_count || 0);
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
        .rpc('get_safe_celebrity_profiles', { celebrity_id: id });

      if (celebrityError) throw celebrityError;

      // Use the first result from the function (it returns an array)
      const celebrityProfile = celebrityData?.[0];
      if (!celebrityProfile) {
        throw new Error('Celebrity profile not found');
      }

      setProfile(celebrityProfile);
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

  const fetchCelebrityMedia = async () => {
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
    } finally {
      setIsLoadingMedia(false);
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherCelebrities = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_safe_celebrity_profiles')
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const filteredProfiles = await Promise.all(
          data.map(profile => filterCelebrityData(profile as FullCelebrityProfile))
        );
        setOtherCelebrities(filteredProfiles);
      }
    } catch (error) {
      console.error('Error fetching other celebrities:', error);
    } finally {
      setIsLoadingOthers(false);
    }
  };


  const handleContact = () => {
    // Phone numbers are not available in public profiles for security
    toast({
      title: "Contact Info",
      description: "Direct phone contact is not available. Please use messaging instead.",
      variant: "destructive",
    });
  };

  const handleWhatsApp = () => {
    // Phone numbers are not available in public profiles for security
    toast({
      title: "Contact Info",
      description: "Direct phone contact is not available. Please use messaging instead.",
      variant: "destructive",
    });
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

  const handleVideoPlay = (video: MediaItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
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
            
            {/* Videos and Join Celebrity buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/videos')}
                className="border-primary/20 hover:bg-primary/10 flex items-center"
              >
                <Video className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Videos</span>
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity text-xs sm:text-sm"
              >
                Join as Celebrity
              </Button>
              
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

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Celebrity Profile and Info */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden bg-muted">
                  {profile.profile_picture_path ? (
                    <img 
                      src={profile.profile_picture_path.startsWith('http') ? 
                        profile.profile_picture_path : 
                        `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${profile.profile_picture_path}`
                      }
                      alt={profile.stage_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-semibold text-muted-foreground">
                      {profile.stage_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.stage_name}</h1>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="w-fit mx-auto md:mx-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3 text-sm md:text-base">{profile.bio}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 text-sm text-muted-foreground mb-4">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.location}
                    </span>
                  )}
                  {profile.age && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {profile.age} years old
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                  {profile.social_instagram && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a href={`https://instagram.com/${profile.social_instagram}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="w-3 h-3 mr-1" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {profile.social_twitter && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a href={`https://twitter.com/${profile.social_twitter}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="w-3 h-3 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {profile.social_tiktok && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a href={`https://tiktok.com/@${profile.social_tiktok}`} target="_blank" rel="noopener noreferrer">
                        <Music className="w-3 h-3 mr-1" />
                        TikTok
                      </a>
                    </Button>
                  )}
                </div>
                <div className="flex justify-center md:justify-start">
                  <Button 
                    className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Services */}
          {services.length > 0 && (
            <Card className="p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Services Offered
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg border-primary/20 hover:bg-primary/5 transition-colors">
                    <div className="flex items-center justify-start mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <h3 className="font-medium">{service.service_name}</h3>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground pl-6">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Media Gallery */}
          <Card className="p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Media Gallery</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={mediaFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('all')}
                className="text-xs"
              >
                All ({media.length})
              </Button>
              <Button
                variant={mediaFilter === 'images' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('images')}
                className="text-xs"
              >
                <ImageIcon className="w-3 h-3 mr-1" />
                Images ({media.filter(m => m.file_type === 'image').length})
              </Button>
              <Button
                variant={mediaFilter === 'videos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMediaFilter('videos')}
                className="text-xs"
              >
                <Video className="w-3 h-3 mr-1" />
                Videos ({media.filter(m => m.file_type === 'video').length})
              </Button>
            </div>
            
            {isLoadingMedia ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredMedia && filteredMedia.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredMedia.map((mediaItem) => (
                  mediaItem.file_type === 'video' ? (
                    <CelebrityMediaVideoCard 
                      key={mediaItem.id} 
                      media={mediaItem} 
                      onPlay={() => handleVideoPlay(mediaItem)}
                    />
                  ) : (
                    <MediaCard key={mediaItem.id} media={mediaItem} />
                  )
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No media available</p>
            )}
          </Card>

          {/* Other Celebrities */}
          <Card className="p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">Other Celebrities</h2>
            {isLoadingOthers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : otherCelebrities && otherCelebrities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherCelebrities.map((celebrity) => (
                  <Link 
                    key={celebrity.id} 
                    to={`/celebrity/${celebrity.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={celebrity.profile_picture_path ? 
                            `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${celebrity.profile_picture_path}` : 
                            undefined
                          } 
                          alt={celebrity.stage_name}
                        />
                        <AvatarFallback>{celebrity.stage_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{celebrity.stage_name}</h3>
                          {celebrity.is_verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{celebrity.bio}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No other celebrities available</p>
            )}
          </Card>
        </div>
      </div>

      {showMessaging && (
        <MessagingModal
          open={showMessaging}
          onOpenChange={setShowMessaging}
          celebrityId={id!}
          celebrityName={profile.stage_name}
        />
      )}

      {/* Image Modal */}
      {selectedMedia && selectedMedia.file_type === 'image' && (
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
              <img
                src={getMediaUrl(selectedMedia.file_path, 'image')}
                alt="Celebrity media"
                className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain"
              />
              
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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          videoUrl={getMediaUrl(selectedVideo.file_path, 'video')}
          isOpen={isVideoModalOpen}
          onClose={handleCloseVideoModal}
        />
      )}
    </div>
  );
};

export default CelebrityProfile;