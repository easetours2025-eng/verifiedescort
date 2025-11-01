import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CelebrityCard from '@/components/CelebrityCard';
import { Crown, Sparkles, Search, Filter, Star, Users, Trophy, Heart, ChevronDown, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  filterCelebrityDataArray, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile,
  CelebrityProfile as FullCelebrityProfile
} from '@/lib/celebrity-utils';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';

import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

const Index = () => {
  const [celebrities, setCelebrities] = useState<PublicCelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [availableCountries, setAvailableCountries] = useState<Array<{name: string, isEastAfrica: boolean}>>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detect device type
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  const getItemsPerPage = () => {
    switch (deviceType) {
      case 'mobile': return 10;
      case 'tablet': return 20;
      case 'desktop': return 30;
    }
  };

  const itemsPerPage = getItemsPerPage();

  useEffect(() => {
    fetchCelebrities();
    fetchCountries();
  }, [user]);

  const fetchCountries = async () => {
    try {
      const { data: countriesData, error } = await supabase
        .from('available_countries')
        .select('country_name, is_east_africa');

      if (error) throw error;
      
      // Get celebrity counts per country
      const { data: celebrityData } = await supabase
        .from('celebrity_profiles')
        .select('country');
      
      // Count celebrities per country
      const countryCounts = (celebrityData || []).reduce((acc: Record<string, number>, celeb) => {
        if (celeb.country) {
          acc[celeb.country] = (acc[celeb.country] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Sort countries by celebrity count (descending)
      const sortedCountries = (countriesData || [])
        .map(c => ({ 
          name: c.country_name, 
          isEastAfrica: c.is_east_africa,
          count: countryCounts[c.country_name] || 0
        }))
        .sort((a, b) => b.count - a.count);
      
      setAvailableCountries(sortedCountries);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const randomizeWithinTiers = (celebrities: any[]) => {
    // Group celebrities by subscription tier
    const tierGroups: { [key: string]: any[] } = {
      vip_elite: [],
      prime_plus: [],
      basic_pro: [],
      starter: [],
      no_subscription: []
    };

    celebrities.forEach(celeb => {
      const tier = celeb.subscription_tier || 'no_subscription';
      if (tierGroups[tier]) {
        tierGroups[tier].push(celeb);
      } else {
        tierGroups.no_subscription.push(celeb);
      }
    });

    // Randomize within each tier group
    Object.keys(tierGroups).forEach(tier => {
      tierGroups[tier] = tierGroups[tier].sort(() => Math.random() - 0.5);
    });

    // Flatten back maintaining tier priority order
    return [
      ...tierGroups.vip_elite,
      ...tierGroups.prime_plus,
      ...tierGroups.basic_pro,
      ...tierGroups.starter,
      ...tierGroups.no_subscription
    ];
  };

  const fetchCelebrities = async () => {
    try {
      // Auto-unverify expired celebrities before fetching
      await supabase.rpc('auto_unverify_expired_celebrities');
      
      // Use the database function to get celebrities with subscription info
      const { data: celebrityData, error: celebrityError } = await supabase
        .rpc('get_celebrities_with_subscription');
      
      if (celebrityError) throw celebrityError;

      // Map to the expected format with subscription info
      let celebrities = celebrityData?.map((celebrity: any) => ({
        id: celebrity.id,
        stage_name: celebrity.stage_name,
        bio: celebrity.bio,
        profile_picture_path: celebrity.profile_picture_path,
        base_price: celebrity.base_price,
        hourly_rate: celebrity.hourly_rate,
        is_verified: celebrity.is_verified,
        is_available: celebrity.is_available,
        location: celebrity.location,
        country: celebrity.country || null,
        gender: Array.isArray(celebrity.gender) ? celebrity.gender : (celebrity.gender ? [celebrity.gender] : null),
        phone_number: celebrity.phone_number,
        social_instagram: celebrity.social_instagram,
        social_twitter: celebrity.social_twitter,
        social_tiktok: celebrity.social_tiktok,
        age: celebrity.age,
        created_at: celebrity.created_at,
        subscription_tier: celebrity.subscription_tier,
        duration_type: celebrity.duration_type,
        subscription_end: celebrity.subscription_end,
      })) as PublicCelebrityProfile[] || [];

      // Filter to only show verified celebrities
      celebrities = celebrities.filter(celebrity => celebrity.is_verified === true);

      // Check if this is the first visit
      const hasVisited = localStorage.getItem('homepage_visited');
      
      if (hasVisited) {
        // Randomize celebrities within their subscription tiers
        celebrities = randomizeWithinTiers(celebrities);
      } else {
        // Mark as visited for next time
        localStorage.setItem('homepage_visited', 'true');
      }
      
      setCelebrities(celebrities);
      
      // Extract unique locations (case-insensitive deduplication)
      const locations = celebrities
        .map(c => c.location)
        .filter((loc): loc is string => !!loc && loc.trim() !== '')
        .reduce((acc: string[], loc) => {
          const normalizedLoc = loc.trim().toLowerCase();
          const exists = acc.some(existing => existing.toLowerCase() === normalizedLoc);
          if (!exists) {
            acc.push(loc.trim());
          }
          return acc;
        }, [])
        .sort();
      
      setAvailableLocations(locations);

      // Extract unique genders from all celebrities
      const genders = celebrities
        .flatMap(c => c.gender || [])
        .filter((gender): gender is string => !!gender && gender.trim() !== '')
        .reduce((acc: string[], gender) => {
          const lowerGender = gender.toLowerCase();
          if (!acc.some(g => g.toLowerCase() === lowerGender)) {
            acc.push(gender);
          }
          return acc;
        }, [])
        .sort();
      
      setAvailableGenders(genders);
    } catch (error) {
      console.error('Error fetching celebrities:', error);
      toast({
        title: "Error",
        description: "Failed to load celebrity profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCelebrities = celebrities.filter(celebrity => {
    const matchesSearch = celebrity.stage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         celebrity.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         celebrity.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Country filter - primary filter
    const matchesCountry = countryFilter === 'all' || 
                          (celebrity as any).country?.toLowerCase() === countryFilter.toLowerCase();
    
    // Location filter - only applies when specific country is selected
    // Normalize both locations by trimming whitespace for exact comparison
    const matchesLocation = countryFilter === 'all' || !locationFilter || 
                           celebrity.location?.trim().toLowerCase() === locationFilter.trim().toLowerCase();
    
    const matchesAge = !celebrity.age || (celebrity.age >= minAge && celebrity.age <= maxAge);
    
    const matchesGender = genderFilter === 'all' || 
                         (celebrity.gender && Array.isArray(celebrity.gender) && celebrity.gender.some(g => g.toLowerCase() === genderFilter.toLowerCase()));
    
    return matchesSearch && matchesCountry && matchesLocation && matchesAge && matchesGender;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCelebrities.length / itemsPerPage);
  const paginatedCelebrities = filteredCelebrities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update locations when country filter changes
  useEffect(() => {
    if (countryFilter !== 'all') {
      // Filter locations for the selected country only
      const countrySpecificCelebs = celebrities.filter(c => 
        (c as any).country?.toLowerCase() === countryFilter.toLowerCase()
      );
      
      const locations = countrySpecificCelebs
        .map(c => c.location)
        .filter((loc): loc is string => !!loc && loc.trim() !== '')
        .reduce((acc: string[], loc) => {
          const normalizedLoc = loc.trim().toLowerCase();
          const exists = acc.some(existing => existing.toLowerCase() === normalizedLoc);
          if (!exists) {
            acc.push(loc.trim());
          }
          return acc;
        }, [])
        .sort();
      
      setAvailableLocations(locations);
      setLocationFilter(''); // Reset location filter when country changes
    } else {
      setAvailableLocations([]);
      setLocationFilter('');
    }
  }, [countryFilter, celebrities]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, genderFilter, minAge, maxAge, countryFilter]);

  const handleViewProfile = (id: string) => {
    navigate(`/celebrity/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <NavigationHeader showBackButton={false} showNavigation={true} />

      {/* Search and Filter */}
      <section className="py-4 sm:pb-8 pt-20">
        <div className="container mx-auto px-3 sm:px-4">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Find your Escort</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Search - Always visible */}
              <div className="flex-1">
                <Input
                  placeholder="Search by name, bio, location, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 sm:h-12"
                />
              </div>

              {/* Country Filter - PRIMARY FILTER - Always visible */}
              {!searchTerm && availableCountries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Filter by Country</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={countryFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCountryFilter('all')}
                      className="rounded-full px-4"
                    >
                      All Countries
                    </Button>
                    {availableCountries.map((country) => (
                      <Button
                        key={country.name}
                        variant={countryFilter === country.name ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCountryFilter(country.name)}
                        className="rounded-full px-4"
                      >
                        {country.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Filter - Hide when search is active */}
              {!searchTerm && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Filter by Gender</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={genderFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGenderFilter('all')}
                      className="rounded-full px-4"
                    >
                      All
                    </Button>
                    {availableGenders.map((gender) => (
                      <Button
                        key={gender}
                        variant={genderFilter.toLowerCase() === gender.toLowerCase() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGenderFilter(gender.toLowerCase())}
                        className="rounded-full px-4"
                      >
                        {gender}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Filter - Cards Display - Hide when search is active or "All Countries" selected */}
              {!searchTerm && countryFilter !== 'all' && availableLocations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Filter by Location</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* All Locations Button */}
                    <Card
                      onClick={() => setLocationFilter('')}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        locationFilter === '' 
                          ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <CardContent className="p-3 text-center">
                        <p className="text-sm font-medium">All Locations</p>
                      </CardContent>
                    </Card>

                    {/* Individual Location Cards */}
                    {availableLocations.map((location) => (
                      <Card
                        key={location}
                        onClick={() => setLocationFilter(location)}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          locationFilter === location 
                            ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <CardContent className="p-3 text-center">
                          <p className="text-sm font-medium">{location}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Advanced Filters Toggle */}
                  <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 text-muted-foreground hover:text-foreground"
                      >
                        <Filter className="h-4 w-4" />
                        <span>Advanced Filters</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      {/* Age Range */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Age Range</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={minAge}
                            onChange={(e) => setMinAge(Number(e.target.value))}
                            min="18"
                            max="65"
                            className="w-20"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={maxAge}
                            onChange={(e) => setMaxAge(Number(e.target.value))}
                            min="18"
                            max="65"
                            className="w-20"
                          />
                        </div>
                      </div>

                      {/* Reset Filters */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGenderFilter('all');
                          setMinAge(18);
                          setMaxAge(65);
                          setLocationFilter('');
                        }}
                        className="w-full"
                      >
                        Reset All Filters
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Celebrity Grid */}
      <section className="pb-8 sm:pb-20">
        <div className="container mx-auto px-3 sm:px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="relative">
                <Crown className="h-16 w-16 sm:h-20 sm:w-20 text-primary animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2 text-primary">Loading Celebrities...</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Discovering amazing profiles for you</p>
            </div>
          ) : filteredCelebrities.length === 0 ? (
            <div className="text-center py-12 sm:py-20 px-4">
              <div className="max-w-md mx-auto">
                <Search className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">No celebrities found</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {searchTerm || genderFilter !== 'all' 
                    ? "Try adjusting your search or filters" 
                    : "Be the first celebrity to join our platform!"
                  }
                </p>
                {!user && (
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="mt-3 sm:mt-4 bg-gradient-to-r from-primary to-accent"
                    size="sm"
                  >
                    Join Now
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {paginatedCelebrities.map((celebrity) => (
                  <CelebrityCard
                    key={celebrity.id}
                    celebrity={celebrity}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent className="flex justify-center gap-2">
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <div className="flex items-center justify-center min-w-[80px] px-3 py-2 text-sm">
                          Page {currentPage} of {totalPages}
                        </div>
                      </PaginationItem>

                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === totalPages}
                          className="gap-1"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
          </div>
        </section>

        <Footer />
      </div>
    );
  };

  export default Index;
