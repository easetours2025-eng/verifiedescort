import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ChevronLeft, ChevronRight, Verified, Phone, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VIPCelebrity {
  id: string;
  stage_name: string;
  bio: string | null;
  location: string | null;
  profile_picture_path: string | null;
  is_verified: boolean;
  is_available: boolean;
  phone_number: string | null;
  age: number | null;
  hourly_rate: number | null;
  is_available_24h: boolean | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
}

const VIPEliteSlideshow = () => {
  const [celebrities, setCelebrities] = useState<VIPCelebrity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchVIPEliteCelebrities();
  }, []);

  const fetchVIPEliteCelebrities = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_celebrities_with_subscription')
        .eq('subscription_tier', 'vip_elite');

      if (error) throw error;

      const vipCelebs = (data || []).filter(
        (celeb: any) => celeb.subscription_tier === 'vip_elite' && celeb.is_verified
      ).map((celeb: any) => ({
        id: celeb.id,
        stage_name: celeb.stage_name,
        bio: celeb.bio,
        location: celeb.location,
        profile_picture_path: celeb.profile_picture_path,
        is_verified: celeb.is_verified,
        is_available: celeb.is_available,
        phone_number: celeb.phone_number,
        age: celeb.age,
        hourly_rate: celeb.hourly_rate,
        is_available_24h: celeb.is_available_24h,
        availability_start_time: celeb.availability_start_time,
        availability_end_time: celeb.availability_end_time,
      }));

      setCelebrities(vipCelebs);
      
      // Fetch profile images
      const images: Record<string, string> = {};
      for (const celeb of vipCelebs) {
        if (celeb.profile_picture_path) {
          if (celeb.profile_picture_path.startsWith('http')) {
            images[celeb.id] = celeb.profile_picture_path;
          } else {
            const { data: urlData } = supabase.storage
              .from('celebrity-photos')
              .getPublicUrl(celeb.profile_picture_path);
            images[celeb.id] = urlData.publicUrl;
          }
        }
      }
      setProfileImages(images);
    } catch (error) {
      console.error('Error fetching VIP Elite celebrities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (celebrities.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % celebrities.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [celebrities.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + celebrities.length) % celebrities.length);
  }, [celebrities.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % celebrities.length);
  }, [celebrities.length]);

  const formatTo12Hour = (time: string | null | undefined) => {
    if (!time) return '12:00 AM';
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading VIP celebrities...</div>
      </div>
    );
  }

  if (celebrities.length === 0) {
    return null;
  }

  const currentCelebrity = celebrities[currentIndex];
  const profileImage = profileImages[currentCelebrity.id] || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentCelebrity.stage_name}`;

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8">
      {/* VIP Elite Badge Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
          <Star className="h-4 w-4 fill-white" />
          <span>VIP Elite Featured</span>
          <Star className="h-4 w-4 fill-white" />
        </div>
      </div>

      {/* Slideshow Card */}
      <Card 
        className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 border-2 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.2)] cursor-pointer group"
        onClick={() => navigate(`/celebrity/${currentCelebrity.id}`)}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative w-full sm:w-1/2 h-64 sm:h-80">
            <img
              src={profileImage}
              alt={currentCelebrity.stage_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30 sm:bg-gradient-to-l" />
            
            {/* VIP Badge on Image */}
            <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <Star className="h-3 w-3 fill-white" />
              <span>VIP Elite</span>
            </div>

            {/* Verified Badge */}
            {currentCelebrity.is_verified && (
              <div className="absolute top-3 right-3 bg-accent rounded-full p-1.5 shadow-lg">
                <Verified className="h-4 w-4 text-accent-foreground" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-full sm:w-1/2 p-5 sm:p-6 flex flex-col justify-center space-y-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
                {currentCelebrity.stage_name}
              </h3>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={currentCelebrity.is_available ? "default" : "secondary"} className="text-xs">
                  {currentCelebrity.is_available ? "Available Now" : "Busy"}
                </Badge>
                {currentCelebrity.age && (
                  <Badge variant="outline" className="text-xs">
                    {currentCelebrity.age} years
                  </Badge>
                )}
              </div>
            </div>

            {currentCelebrity.bio && (
              <p className="text-muted-foreground text-sm line-clamp-3">
                {currentCelebrity.bio}
              </p>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              {currentCelebrity.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{currentCelebrity.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {currentCelebrity.is_available_24h !== false
                    ? "Available 24/7"
                    : `${formatTo12Hour(currentCelebrity.availability_start_time)} - ${formatTo12Hour(currentCelebrity.availability_end_time)}`
                  }
                </span>
              </div>

              {currentCelebrity.hourly_rate && (
                <div className="text-primary font-semibold">
                  KES {currentCelebrity.hourly_rate.toLocaleString()}/hr
                </div>
              )}
            </div>

            {currentCelebrity.phone_number && (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-500 dark:hover:bg-green-950"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await supabase.from('call_clicks').insert({
                      celebrity_id: currentCelebrity.id,
                      user_ip: null,
                      clicked_at: new Date().toISOString()
                    });
                  } catch (error) {
                    console.error('Failed to record call click:', error);
                  }
                  window.open(`tel:${currentCelebrity.phone_number}`, '_self');
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Navigation Arrows */}
      {celebrities.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg z-10"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg z-10"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {celebrities.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {celebrities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-6 bg-gradient-to-r from-yellow-500 to-amber-500"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VIPEliteSlideshow;
