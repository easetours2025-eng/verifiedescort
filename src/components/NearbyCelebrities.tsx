import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Sparkles, Navigation, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { requestGeolocation, GeoLocation } from '@/lib/device-utils';

interface Celebrity {
  id: string;
  stage_name: string;
  bio: string;
  location: string;
  base_price: number;
  is_verified: boolean;
  profile_picture_path: string | null;
  gender: string[];
  age: number;
  hourly_rate: number;
}

interface Recommendation {
  celebrityId: string;
  matchScore: number;
  reason: string;
}

const NearbyCelebrities: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hasCheckedLocation, setHasCheckedLocation] = useState(false);

  // Check for cached location on mount
  useEffect(() => {
    const cachedLocation = localStorage.getItem('user_geolocation');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        setGeoLocation(parsed);
        if (parsed.city || parsed.region) {
          fetchNearbyCelebrities(parsed);
        }
      } catch {
        // Invalid cache
      }
    }
    setHasCheckedLocation(true);
  }, []);

  const requestLocation = async () => {
    setIsRequesting(true);
    try {
      const location = await requestGeolocation();
      setGeoLocation(location);
      
      if (location.permissionGranted) {
        localStorage.setItem('user_geolocation', JSON.stringify(location));
        if (location.city || location.region) {
          await fetchNearbyCelebrities(location);
        }
      } else {
        toast({
          title: "Location access denied",
          description: "Enable location to see nearby celebrities",
        });
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const fetchNearbyCelebrities = async (location: GeoLocation) => {
    if (!location.city && !location.region) return;
    
    setIsLoading(true);
    try {
      const locationQuery = [location.city, location.region, location.countryName]
        .filter(Boolean)
        .join(', ');

      const { data, error } = await supabase.functions.invoke('ai-smart-search', {
        body: { query: `Find escorts near ${locationQuery}` }
      });

      if (error) throw error;

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        const celebrityIds = data.recommendations.map((r: Recommendation) => r.celebrityId);
        
        const { data: celebData, error: celebError } = await supabase
          .from('celebrity_profiles')
          .select('id, stage_name, bio, location, base_price, is_verified, profile_picture_path, gender, age, hourly_rate')
          .in('id', celebrityIds);

        if (celebError) throw celebError;

        // Sort by match score
        const sortedCelebs = celebData?.sort((a, b) => {
          const scoreA = data.recommendations.find((r: Recommendation) => r.celebrityId === a.id)?.matchScore || 0;
          const scoreB = data.recommendations.find((r: Recommendation) => r.celebrityId === b.id)?.matchScore || 0;
          return scoreB - scoreA;
        }) || [];

        setCelebrities(sortedCelebs.slice(0, 6)); // Show top 6
      }
    } catch (error) {
      console.error('Error fetching nearby celebrities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-muted';
  };

  const locationDisplay = [geoLocation?.city, geoLocation?.region].filter(Boolean).join(', ');

  // Don't render until we've checked for cached location
  if (!hasCheckedLocation) return null;

  // Show request button if no location
  if (!geoLocation?.permissionGranted) {
    return (
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="p-3 rounded-full bg-primary/10">
            <Navigation className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Find Escorts Near You</h3>
            <p className="text-sm text-muted-foreground">
              Enable location to get AI-powered recommendations for nearby escorts
            </p>
          </div>
          <Button onClick={requestLocation} disabled={isRequesting} className="shrink-0">
            {isRequesting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Enable Location
          </Button>
        </div>
      </Card>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Finding escorts near {locationDisplay}...</span>
        </div>
      </Card>
    );
  }

  // Show results or empty state
  if (celebrities.length === 0) {
    return (
      <Card className="p-4 sm:p-6 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-medium">{locationDisplay}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={requestLocation} disabled={isRequesting}>
            <RefreshCw className={`h-4 w-4 ${isRequesting ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-center text-muted-foreground py-4">
          No escorts found near your location. Try browsing all profiles below.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Escorts Near You</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationDisplay}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={requestLocation} disabled={isRequesting}>
          <RefreshCw className={`h-4 w-4 ${isRequesting ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {celebrities.map((celeb) => {
          const recommendation = recommendations.find(r => r.celebrityId === celeb.id);
          
          return (
            <div
              key={celeb.id}
              className="relative group cursor-pointer"
              onClick={() => navigate(`/celebrity/${celeb.id}`)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {celeb.profile_picture_path ? (
                  <img
                    src={celeb.profile_picture_path.startsWith('http') 
                      ? celeb.profile_picture_path 
                      : `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${celeb.profile_picture_path}`}
                    alt={celeb.stage_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-2xl font-bold text-muted-foreground">{celeb.stage_name[0]}</span>
                  </div>
                )}
                
                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Match badge */}
                {recommendation && (
                  <Badge className={`absolute top-2 right-2 ${getMatchColor(recommendation.matchScore)} text-white text-xs`}>
                    {recommendation.matchScore}%
                  </Badge>
                )}
                
                {/* Verified badge */}
                {celeb.is_verified && (
                  <div className="absolute top-2 left-2 bg-primary rounded-full p-1">
                    <Sparkles className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="mt-2">
                <p className="font-medium text-sm truncate">{celeb.stage_name}</p>
                <p className="text-xs text-muted-foreground truncate">{celeb.location}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default NearbyCelebrities;
