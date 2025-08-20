import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  MessageCircle
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
  created_at: string;
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

const CelebrityProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CelebrityProfile | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchMedia();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
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
      setLoading(false);
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
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.stage_name}`} />
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
                  {profile.real_name && (
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

                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Contact Information</h3>
                  
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.phone_number && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleContact}
                      className="w-full justify-start"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Pricing</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Base Price:</span>
                      <span className="font-bold text-primary">${profile.base_price}</span>
                    </div>
                    {profile.hourly_rate && (
                      <div className="flex justify-between">
                        <span className="text-sm">Per Hour:</span>
                        <span className="font-bold text-accent">${profile.hourly_rate}</span>
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

                <Button className="w-full bg-gradient-to-r from-primary to-accent" size="lg">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Book Meeting
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Media Gallery */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Media Gallery ({media.length})</span>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <Video className="h-4 w-4" />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {media.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="flex justify-center space-x-2 mb-4">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Media Available</h3>
                    <p className="text-muted-foreground">
                      This celebrity hasn't uploaded any public media yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {media.map((item) => (
                      <Card 
                        key={item.id} 
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                        onClick={() => setSelectedMedia(item)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative">
                          {item.file_type === 'video' ? (
                            <Video className="h-12 w-12 text-primary" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-primary" />
                          )}
                          
                          {item.is_premium && (
                            <Badge className="absolute top-2 right-2">
                              Premium
                            </Badge>
                          )}
                        </div>
                        
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {item.title || 'Untitled'}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground uppercase">
                                {item.file_type}
                              </span>
                              <span className="text-sm font-bold text-primary">
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
        </div>
      </div>
    </div>
  );
};

export default CelebrityProfile;