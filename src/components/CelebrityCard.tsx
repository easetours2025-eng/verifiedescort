import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Phone, Instagram, Twitter, Video, Image as ImageIcon, Verified } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface CelebrityCardProps {
  celebrity: CelebrityProfile;
  onViewProfile: (id: string) => void;
}

const CelebrityCard: React.FC<CelebrityCardProps> = ({ celebrity, onViewProfile }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileImage();
  }, [celebrity.id]);

  const fetchProfileImage = async () => {
    try {
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-celebrity transition-all duration-300 hover:-translate-y-1 border-primary/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="text-center space-y-4 relative z-10">
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg">
              <AvatarImage src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrity.stage_name}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-lg font-bold">
                {getInitials(celebrity.stage_name)}
              </AvatarFallback>
            </Avatar>
            {celebrity.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                <Verified className="h-4 w-4 text-accent-foreground" />
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {celebrity.stage_name}
          </h3>
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
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            {celebrity.bio}
          </p>
        )}

        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
          {celebrity.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{celebrity.location}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Base Price:</span>
            <span className="font-bold text-primary">${celebrity.base_price}</span>
          </div>
          {celebrity.hourly_rate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Per Hour:</span>
              <span className="font-bold text-accent">${celebrity.hourly_rate}</span>
            </div>
          )}
        </div>

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
          {celebrity.phone_number && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Phone className="h-4 w-4 text-green-500" />
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={() => onViewProfile(celebrity.id)}
            className="flex-1 bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity"
            size="sm"
          >
            <Star className="h-4 w-4 mr-2" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CelebrityCard;