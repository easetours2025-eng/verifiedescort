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
import ImageModal from '@/components/ImageModal';
import { 
  filterCelebrityData, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile, 
  CelebrityProfile as FullCelebrityProfile,
  isPrivateProfile 
} from '@/lib/celebrity-utils';
import NavigationHeader from '@/components/NavigationHeader';
import PayPalPayment from '@/components/PayPalPayment';
import Footer from '@/components/Footer';
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
  Calendar,
  X,
  Users
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
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | null>(null);
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
      window.scrollTo(0, 0);
      fetchProfile();
      fetchCelebrityMedia();
      fetchServices();
      fetchOtherCelebrities();
      recordProfileView();
    }
  }, [id]);

  // Generate comprehensive SEO meta tags and structured data
  useEffect(() => {
    if (profile) {
      const profileUrl = `https://royalescortsworld.com/celebrity/${profile.id}`;
      const pageTitle = `${profile.stage_name} - Royal Escorts | Premium Companion in ${profile.location || 'Kenya'}`;
      const pageDescription = profile.bio?.substring(0, 155) || 
        `Meet ${profile.stage_name}, a verified celebrity companion in ${profile.location || 'Kenya'}. Available for exclusive meetings and premium companionship services.`;
      const profileImage = profile.profile_picture_path 
        ? getMediaUrl(profile.profile_picture_path, 'image')
        : 'https://royalescortsworld.com/icon-512.png';

      // Helper function to update or create meta tag
      const updateMetaTag = (selector: string, attribute: string, attrValue: string, content: string) => {
        let tag = document.querySelector(selector);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute(attribute, attrValue);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
      };

      // Update page title
      document.title = pageTitle;

      // Update canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', profileUrl);

      // Primary meta tags
      updateMetaTag('meta[name="description"]', 'name', 'description', pageDescription);
      updateMetaTag('meta[name="title"]', 'name', 'title', pageTitle);
      
      // Keywords
      const keywords = [
        profile.stage_name,
        profile.location || 'Kenya',
        'Royal Escorts',
        'celebrity companion',
        'premium escort',
        'verified companion',
        ...(profile.gender || []).map(g => `${g} companion`)
      ].filter(Boolean).join(', ');
      updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);

      // Robots
      updateMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large');

      // Open Graph / Facebook
      updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'profile');
      updateMetaTag('meta[property="og:url"]', 'property', 'og:url', profileUrl);
      updateMetaTag('meta[property="og:title"]', 'property', 'og:title', pageTitle);
      updateMetaTag('meta[property="og:description"]', 'property', 'og:description', pageDescription);
      updateMetaTag('meta[property="og:image"]', 'property', 'og:image', profileImage);
      updateMetaTag('meta[property="og:image:width"]', 'property', 'og:image:width', '1200');
      updateMetaTag('meta[property="og:image:height"]', 'property', 'og:image:height', '630');
      updateMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Royal Escorts Kenya');
      updateMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_KE');
      updateMetaTag('meta[property="profile:first_name"]', 'property', 'profile:first_name', profile.stage_name);
      if (profile.gender?.[0]) {
        updateMetaTag('meta[property="profile:gender"]', 'property', 'profile:gender', profile.gender[0]);
      }

      // Twitter Card
      updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
      updateMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', profileUrl);
      updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle);
      updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', pageDescription);
      updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', profileImage);

      // JSON-LD Structured Data for Person
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": profile.stage_name,
        "description": pageDescription,
        "image": profileImage,
        "url": profileUrl,
        "jobTitle": "Celebrity Companion",
        "address": profile.location ? {
          "@type": "PostalAddress",
          "addressLocality": profile.location,
          "addressCountry": "KE"
        } : undefined,
        "gender": profile.gender?.[0] || undefined,
        "sameAs": [
          profile.social_instagram ? `https://instagram.com/${profile.social_instagram.replace('@', '')}` : null,
          profile.social_twitter ? `https://twitter.com/${profile.social_twitter.replace('@', '')}` : null,
          profile.social_tiktok ? `https://tiktok.com/@${profile.social_tiktok.replace('@', '')}` : null,
        ].filter(Boolean),
        "offers": services.length > 0 ? services.map(service => ({
          "@type": "Offer",
          "name": service.service_name,
          "description": service.description,
          "price": service.price,
          "priceCurrency": "KES",
          "availability": "https://schema.org/InStock"
        })) : profile.base_price > 0 ? {
          "@type": "Offer",
          "price": profile.base_price,
          "priceCurrency": "KES",
          "availability": "https://schema.org/InStock"
        } : undefined,
        "priceRange": profile.base_price > 0 && profile.hourly_rate > 0
          ? `KES ${profile.base_price} - ${profile.hourly_rate}`
          : profile.base_price > 0 
            ? `KES ${profile.base_price}`
            : undefined,
      };

      // Remove undefined properties
      Object.keys(structuredData).forEach(key => 
        structuredData[key as keyof typeof structuredData] === undefined && delete structuredData[key as keyof typeof structuredData]
      );

      // Add or update Person structured data
      const existingScript = document.getElementById('celebrity-structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'celebrity-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);

      // Breadcrumb structured data
      const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://royalescortsworld.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Celebrities",
            "item": "https://royalescortsworld.com/#celebrities"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": profile.stage_name,
            "item": profileUrl
          }
        ]
      };

      const existingBreadcrumbScript = document.getElementById('breadcrumb-structured-data');
      if (existingBreadcrumbScript) {
        existingBreadcrumbScript.remove();
      }

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'breadcrumb-structured-data';
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.text = JSON.stringify(breadcrumbData);
      document.head.appendChild(breadcrumbScript);

      // Cleanup on unmount
      return () => {
        const script = document.getElementById('celebrity-structured-data');
        const breadcrumbScript = document.getElementById('breadcrumb-structured-data');
        if (script) script.remove();
        if (breadcrumbScript) breadcrumbScript.remove();
        
        // Reset to default meta tags
        document.title = 'Royal Escorts Kenya - Premium Verified Celebrity Escorts in Kenya';
        updateMetaTag('meta[name="description"]', 'name', 'description', 
          'Royal Escorts Kenya - Connect with verified celebrity escorts in Kenya. Premium escort services in Nairobi, Mombasa, Kisumu, and across Kenya.');
      };
    }
  }, [profile, services]);

  const recordProfileView = async () => {
    if (!id) return;
    
    try {
      const userIP = await getUserIP();
      await supabase
        .from('profile_views')
        .insert({
          celebrity_id: id,
          user_ip: userIP
        });
    } catch (error) {
      console.error('Error recording profile view:', error);
    }
  };

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
        .rpc('get_media_statistics');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      mediaIds.forEach(id => counts[id] = 0);
      
      // Sum up view counts for each media across all dates
      if (data) {
        data.forEach((row: any) => {
          if (mediaIds.includes(row.media_id)) {
            counts[row.media_id] += row.view_count || 0;
          }
        });
      }
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
      
      // Use secure function to get like counts
      const likesPromises = mediaIds.map(id => 
        supabase.rpc('get_media_like_count', { media_uuid: id })
      );
      const likesResults = await Promise.all(likesPromises);
      
      const counts: Record<string, { likes: number; loves: number }> = {};
      mediaIds.forEach((id, index) => {
        counts[id] = { 
          likes: likesResults[index]?.data || 0, 
          loves: 0 // Simplified - no type breakdown
        };
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
      
      // Use secure function to check user likes
      const userLikesPromises = mediaIds.map(id => 
        supabase.rpc('has_user_liked_media', { 
          media_uuid: id, 
          user_ip_param: userIP 
        })
      );
      const userLikesResults = await Promise.all(userLikesPromises);
      
      const likes: Record<string, string[]> = {};
      mediaIds.forEach((id, index) => {
        likes[id] = userLikesResults[index]?.data ? ['like'] : [];
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

      if (!celebrityData) {
        throw new Error('Celebrity profile not found');
      }

      // Cast gender to correct type
      const profileData = {
        ...celebrityData,
        gender: Array.isArray(celebrityData.gender) ? celebrityData.gender : (celebrityData.gender ? [celebrityData.gender as string] : null)
      } as PublicCelebrityProfile;

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Celebrity profile not found",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
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
      // Use the database function to get non-admin celebrities
      const { data, error } = await supabase
        .rpc('get_non_admin_celebrities');

      if (error) throw error;
      
      if (data) {
        // Filter out current celebrity and limit to 6, cast gender to correct type
        const filteredData = data
          .filter(profile => profile.id !== id)
          .slice(0, 6)
          .map(profile => ({
            ...profile,
            gender: Array.isArray(profile.gender) ? profile.gender : (profile.gender ? [profile.gender as string] : null)
          })) as PublicCelebrityProfile[];
        setOtherCelebrities(filteredData);
      }
    } catch (error) {
      console.error('Error fetching other celebrities:', error);
    } finally {
      setIsLoadingOthers(false);
    }
  };


  const handleContact = async () => {
    // Record the call click
    if (profile) {
      try {
        await supabase.from('call_clicks').insert({
          celebrity_id: profile.id,
          user_ip: null,
          clicked_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to record call click:', error);
      }
    }

    // Check if profile has a phone number
    if (profile && (profile as any).phone_number) {
      const phoneNumber = (profile as any).phone_number;
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast({
        title: "Contact Info",
        description: "Phone contact is not available for this profile.",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = async () => {
    // Check if profile has a phone number
    if (profile && (profile as any).phone_number) {
      // Record the WhatsApp click
      try {
        await supabase.from('whatsapp_clicks').insert({
          celebrity_id: profile.id,
          user_ip: null, // Will be handled by backend if needed
          clicked_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to record WhatsApp click:', error);
      }

      const phoneNumber = (profile as any).phone_number.replace(/\D/g, ''); // Remove non-digits
      const message = encodeURIComponent(
        `Royal Escorts | Finest Escort services and Hookups\n\nMeet escorts for discreet companionship and relaxation.\n\n I'm So much interested with you ${profile.stage_name}.`
      );
      // Open WhatsApp with the celebrity's phone number and pre-filled message
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      toast({
        title: "Contact Info",
        description: "WhatsApp contact is not available for this profile.",
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
    // Check if the file path is already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    // Otherwise, construct the URL from the bucket
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
      {/* Navigation Header */}
      <NavigationHeader sticky={true} showBackButton={true} />
      
      <div className="container mx-auto px-4 py-6 md:py-8 pt-20">
        <div className="space-y-6 md:space-y-8">
          {/* Celebrity Profile and Info */}
          <Card className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={async () => {
                    if (profile.profile_picture_path) {
                      const imageUrl = profile.profile_picture_path.startsWith('http') ? 
                        profile.profile_picture_path : 
                        `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${profile.profile_picture_path}`;
                      setSelectedProfileImage(imageUrl);
                      
                      // Track profile picture view
                      try {
                        const userIP = await getUserIP();
                        await supabase
                          .from('profile_views')
                          .insert({
                            celebrity_id: id,
                            user_ip: userIP
                          });
                      } catch (error) {
                        console.error('Error recording profile picture view:', error);
                      }
                    }
                  }}
                >
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
                  {profile.gender && profile.gender.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {profile.gender.join(', ')}
                    </span>
                  )}
                  {(profile as any).phone_number && (
                    <span className="flex items-center gap-1 font-medium text-green-600">
                      <Phone className="w-3 h-3" />
                      {(profile as any).phone_number}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {profile.social_instagram && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a 
                        href={`https://instagram.com/${profile.social_instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Instagram className="w-3 h-3 mr-1" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {profile.social_twitter && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a 
                        href={`https://twitter.com/${profile.social_twitter.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Twitter className="w-3 h-3 mr-1" />
                        Twitter
                      </a>
                    </Button>
                  )}
                  {profile.social_tiktok && (
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <a 
                        href={`https://tiktok.com/@${profile.social_tiktok.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Music className="w-3 h-3 mr-1" />
                        TikTok
                      </a>
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-2">
                  <Button 
                    className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white" 
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white" 
                    onClick={handleContact}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
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
                    <MediaCard 
                      key={mediaItem.id} 
                      media={mediaItem} 
                      onMediaClick={handleMediaClick}
                    />
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
                          src={celebrity.profile_picture_path && celebrity.profile_picture_path.startsWith('http') ? 
                            celebrity.profile_picture_path : 
                            celebrity.profile_picture_path ?
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

      {/* Profile Picture Modal */}
      <ImageModal
        imageUrl={selectedProfileImage || ''}
        isOpen={!!selectedProfileImage}
        onClose={() => setSelectedProfileImage(null)}
        title={`${profile.stage_name}'s Profile Picture`}
      />

      {/* Image Modal */}
      {selectedMedia && selectedMedia.file_type === 'image' && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border border-white/20"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="h-5 w-5 mr-2" />
              Close
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

      <Footer />
    </div>
  );
};

export default CelebrityProfile;