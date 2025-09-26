import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Phone, Instagram, Twitter, Video, Image as ImageIcon, Verified, MessageCircle, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile, 
  isPrivateProfile 
} from '@/lib/celebrity-utils';
import ReadMoreText from './ReadMoreText';
import ServicesList from './ServicesList';

interface CelebrityCardProps {
  celebrity: PrivateCelebrityProfile;
  onViewProfile: (id: string) => void;
}

const CelebrityCard: React.FC<CelebrityCardProps> = ({ celebrity, onViewProfile }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileVideo, setProfileVideo] = useState<string | null>(null);
  const [hasVideos, setHasVideos] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchProfileImage();
    fetchProfileVideo();
    checkForVideos();
    checkVIPStatus();
    fetchServices();
  }, [celebrity.id]);

  const fetchProfileImage = async () => {
    try {
      // First try to get the profile picture from celebrity_profiles
      if (celebrity.profile_picture_path) {
        // Check if it's already a full URL or just a path
        if (celebrity.profile_picture_path.startsWith('http')) {
          setProfileImage(celebrity.profile_picture_path);
        } else {
          const { data: urlData } = supabase.storage
            .from('celebrity-photos')
            .getPublicUrl(celebrity.profile_picture_path);
          setProfileImage(urlData.publicUrl);
        }
        return;
      }

      // If no profile picture, try to get latest public image from media
      const { data } = await supabase
        .from('celebrity_media')
        .select('file_path')
        .eq('celebrity_id', celebrity.id)
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

  const fetchProfileVideo = async () => {
    try {
      const { data } = await supabase
        .from('celebrity_media')
        .select('file_path')
        .eq('celebrity_id', celebrity.id)
        .eq('is_public', true)
        .eq('file_type', 'video')
        .order('upload_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.file_path) {
        const { data: urlData } = supabase.storage
          .from('celebrity-videos')
          .getPublicUrl(data.file_path);
        setProfileVideo(urlData.publicUrl);
      }
    } catch (error) {
      console.error('Error fetching profile video:', error);
    }
  };

  const checkForVideos = async () => {
    try {
      const { count } = await supabase
        .from('celebrity_media')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrity.id)
        .eq('is_public', true)
        .eq('file_type', 'video');

      setHasVideos((count || 0) > 0);
    } catch (error) {
      console.error('Error checking for videos:', error);
    }
  };

  const checkVIPStatus = async () => {
    try {
      const { data } = await supabase
        .from('payment_verification')
        .select('*')
        .eq('celebrity_id', celebrity.id)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(1);

      setIsVIP(data && data.length > 0);
    } catch (error) {
      console.error('Error checking VIP status:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data } = await supabase
        .from('celebrity_services')
        .select('service_name, price')
        .eq('celebrity_id', celebrity.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(3);

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-celebrity transition-all duration-300 hover:-translate-y-1 border-primary/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Profile Image/Video - 3/4 of card */}
      <div className="relative h-64 cursor-pointer" onClick={() => onViewProfile(celebrity.id)}>
        {profileVideo && celebrity.is_verified ? (
          <video 
            src={profileVideo}
            className="w-full h-full object-cover"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img 
            src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrity.stage_name}`}
            alt={celebrity.stage_name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* VIP Badge */}
        {isVIP && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-bold">
            VIP
          </div>
        )}
        
        {/* Verified Badge */}
        {celebrity.is_verified && (
          <div className="absolute top-2 right-2 bg-accent rounded-full p-1">
            <Verified className="h-4 w-4 text-accent-foreground" />
          </div>
        )}
        
        {/* Video Indicator */}
        {hasVideos && (
          <div className="absolute bottom-2 right-2 bg-primary rounded-full p-2">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      
      <CardHeader className="text-center space-y-2 relative z-10 py-4">
        
        <div className="space-y-2">
          <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {celebrity.stage_name}
          </h3>
          {/* Show real name for everyone */}
          {celebrity.real_name && (
            <p className="text-sm text-muted-foreground">({celebrity.real_name})</p>
          )}
          <div className="flex items-center justify-center space-x-2">
            <Badge variant={celebrity.is_available ? "default" : "secondary"} className="text-xs">
              {celebrity.is_available ? "Available" : "Busy"}
            </Badge>
            {celebrity.gender && (
              <Badge variant="outline" className="text-xs capitalize">
                {celebrity.gender}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {celebrity.bio && (
          <ReadMoreText 
            text={celebrity.bio}
            maxLength={100}
            className="text-center"
          />
        )}

        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          {celebrity.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{celebrity.location}</span>
            </div>
          )}
        </div>

        {/* Services List */}
        {services.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Services Offered:</h4>
            <ServicesList 
              services={services}
              isEditable={false}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleStatus={() => {}}
            />
          </div>
        )}

        {/* Call Button */}
        {celebrity.phone_number && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-green-500 text-green-600 hover:bg-green-50"
              onClick={() => window.open(`tel:${celebrity.phone_number}`, '_self')}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call me now: {celebrity.phone_number}
            </Button>
          </div>
        )}
        
        {/* Social Media */}
        <div className="flex justify-center space-x-2">
          {celebrity.social_instagram && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Instagram className="h-4 w-4 text-pink-500" />
            </Button>
          )}
          {celebrity.social_twitter && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Twitter className="h-4 w-4 text-blue-500" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CelebrityCard;