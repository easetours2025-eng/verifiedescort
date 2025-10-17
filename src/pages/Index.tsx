import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CelebrityCard from '@/components/CelebrityCard';
import { Crown, Sparkles, Search, Filter, Star, Users, Trophy, Heart, Video, ChevronDown, Menu, X, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  filterCelebrityDataArray, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile,
  CelebrityProfile as FullCelebrityProfile
} from '@/lib/celebrity-utils';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';

const Index = () => {
  const [celebrities, setCelebrities] = useState<PublicCelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [userPaymentStatus, setUserPaymentStatus] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const { user, signOut } = useAuth();
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
    if (user) {
      checkUserPaymentStatus();
    }
  }, [user]);

  const checkUserPaymentStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_verification')
        .select('*')
        .eq('phone_number', user.email) // Assuming email is used as phone number for now
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      setUserPaymentStatus(data?.[0] || null);
    } catch (error) {
      console.error('Error checking payment status:', error);
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
      // Use the database function to get celebrities with subscription info
      const { data: celebrityData, error: celebrityError } = await supabase
        .rpc('get_celebrities_with_subscription');
      
      if (celebrityError) throw celebrityError;

      // Map to the expected format with subscription info
      let celebrities = celebrityData?.map(celebrity => ({
        id: celebrity.id,
        stage_name: celebrity.stage_name,
        bio: celebrity.bio,
        profile_picture_path: celebrity.profile_picture_path,
        base_price: celebrity.base_price,
        hourly_rate: celebrity.hourly_rate,
        is_verified: celebrity.is_verified,
        is_available: celebrity.is_available,
        location: celebrity.location,
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
      
      // Extract unique locations
      const locations = celebrities
        .map(c => c.location)
        .filter((loc): loc is string => !!loc && loc.trim() !== '')
        .reduce((acc: string[], loc) => {
          if (!acc.includes(loc)) {
            acc.push(loc);
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
    
    const matchesLocation = !locationFilter || 
                           celebrity.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesAge = !celebrity.age || (celebrity.age >= minAge && celebrity.age <= maxAge);
    
    const matchesGender = genderFilter === 'all' || 
                         (celebrity.gender && Array.isArray(celebrity.gender) && celebrity.gender.some(g => g.toLowerCase() === genderFilter.toLowerCase()));
    
    return matchesSearch && matchesLocation && matchesAge && matchesGender;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCelebrities.length / itemsPerPage);
  const paginatedCelebrities = filteredCelebrities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, genderFilter, minAge, maxAge]);

  const handleViewProfile = (id: string) => {
    navigate(`/celebrity/${id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-accent absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                RoyalEscorts
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/faq')}
                className="border-primary/20 hover:bg-primary/10"
              >
                FAQ
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/videos')}
                className="border-primary/20 hover:bg-primary/10 flex items-center"
              >
                <Video className="h-4 w-4 mr-2" />
                Videos
              </Button>
              {user ? (
                <>
                  {userPaymentStatus && (
                    <Badge variant="default" className="bg-green-500 text-white">
                      Verified: {userPaymentStatus.phone_number}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity"
                >
                     Join as a Model
                </Button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-fit bg-background border-l border-primary/20 shadow-xl z-50 animate-in slide-in-from-right duration-300 w-64">
            <div className="flex flex-col p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-primary/20"
                  onClick={() => {
                    navigate('/faq');
                    setMobileMenuOpen(false);
                  }}
                >
                  FAQ
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-primary/20"
                  onClick={() => {
                    navigate('/videos');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Videos
                </Button>
                
                {user ? (
                  <>
                    {userPaymentStatus && (
                      <Badge variant="default" className="bg-green-500 text-white w-full justify-center py-2">
                        Verified: {userPaymentStatus.phone_number}
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start border-primary/20"
                      onClick={() => {
                        navigate('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary-glow"
                    onClick={() => {
                      navigate('/auth');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Join as a Model
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}


      {/* Search and Filter */}
      <section className="py-4 sm:pb-8">
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

              {/* Location Filter - Cards Display - Hide when search is active */}
              {!searchTerm && availableLocations.length > 0 && (
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
    </div>
  );
};

export default Index;
