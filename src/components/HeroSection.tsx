import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, ChevronLeft, ChevronRight, Star, Verified, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VIPCelebrity {
  id: string;
  stage_name: string;
  profile_picture_path: string | null;
  is_verified: boolean;
  phone_number: string | null;
  location: string | null;
}

const HeroSection = () => {
  const [celebrities, setCelebrities] = useState<VIPCelebrity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileImages, setProfileImages] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
        profile_picture_path: celeb.profile_picture_path,
        is_verified: celeb.is_verified,
        phone_number: celeb.phone_number,
        location: celeb.location,
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      // Update current index for mobile dots
      const newIndex = direction === 'left' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(celebrities.length - 1, currentIndex + 1);
      setCurrentIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 280; // approximate card width with gap
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handleCall = async (e: React.MouseEvent, celebrity: VIPCelebrity) => {
    e.stopPropagation();
    if (!celebrity.phone_number) return;
    
    try {
      await supabase.from('call_clicks').insert({
        celebrity_id: celebrity.id,
        user_ip: null,
        clicked_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to record call click:', error);
    }
    window.open(`tel:${celebrity.phone_number}`, '_self');
  };

  const handleWhatsApp = async (e: React.MouseEvent, celebrity: VIPCelebrity) => {
    e.stopPropagation();
    if (!celebrity.phone_number) return;
    
    try {
      await supabase.from('whatsapp_clicks').insert({
        celebrity_id: celebrity.id,
        user_ip: null,
        clicked_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to record WhatsApp click:', error);
    }
    
    const cleanNumber = celebrity.phone_number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  // Handle scroll event to update current index
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = 280;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(Math.min(newIndex, celebrities.length - 1));
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [celebrities.length]);

  if (loading) {
    return (
      <section className="relative pt-6 pb-8 sm:pt-8 sm:pb-12 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </div>
      </section>
    );
  }

  if (celebrities.length === 0) {
    return null;
  }

  return (
    <section className="relative pt-6 pb-8 sm:pt-8 sm:pb-12 overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* VIP Elite Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
            <Star className="h-4 w-4 fill-white" />
            <span>VIP Elite</span>
            <Star className="h-4 w-4 fill-white" />
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="relative">
          {/* Left Arrow - visible on all devices */}
          {celebrities.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background shadow-lg h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}

          {/* Celebrity Cards */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-12 sm:px-14 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {celebrities.map((celebrity) => {
              const profileImage = profileImages[celebrity.id] || 
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${celebrity.stage_name}`;
              
              return (
                <div
                  key={celebrity.id}
                  className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start cursor-pointer group"
                  onClick={() => navigate(`/celebrity/${celebrity.id}`)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative h-[320px] sm:h-[360px] overflow-hidden">
                      <img
                        src={profileImage}
                        alt={celebrity.stage_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      
                      {/* VIP Badge */}
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        <span>VIP</span>
                      </div>

                      {/* Verified Badge */}
                      {celebrity.is_verified && (
                        <div className="absolute top-3 right-3 bg-accent rounded-full p-1.5 shadow-lg">
                          <Verified className="h-4 w-4 text-accent-foreground" />
                        </div>
                      )}

                      {/* Name, Location & Buttons Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                          {celebrity.stage_name}
                        </h3>
                        
                        {/* Location */}
                        {celebrity.location && (
                          <div className="flex items-center gap-1 text-white/90 text-sm mb-3">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{celebrity.location}</span>
                          </div>
                        )}
                        
                        {celebrity.phone_number && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                              onClick={(e) => handleCall(e, celebrity)}
                            >
                              <Phone className="h-4 w-4 mr-1.5" />
                              Call
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg"
                              onClick={(e) => handleWhatsApp(e, celebrity)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1.5" />
                              WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow - visible on all devices */}
          {celebrities.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background shadow-lg h-10 w-10 sm:h-12 sm:w-12"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          )}
        </div>

        {/* Mobile Slide Indicators/Dots */}
        {celebrities.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {celebrities.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-6 bg-primary' 
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
