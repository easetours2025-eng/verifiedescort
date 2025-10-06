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
import { Crown, Sparkles, Search, Filter, Star, Users, Trophy, Heart, Video, ChevronDown, Menu, X, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  filterCelebrityDataArray, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile,
  CelebrityProfile as FullCelebrityProfile
} from '@/lib/celebrity-utils';

const Index = () => {
  const [celebrities, setCelebrities] = useState<PublicCelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [userPaymentStatus, setUserPaymentStatus] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const fetchCelebrities = async () => {
    try {
      // Use the database function to get celebrities with subscription info
      const { data: celebrityData, error: celebrityError } = await supabase
        .rpc('get_celebrities_with_subscription');
      
      if (celebrityError) throw celebrityError;

      // Map to the expected format with subscription info
      const celebrities = celebrityData?.map(celebrity => ({
        id: celebrity.id,
        stage_name: celebrity.stage_name,
        bio: celebrity.bio,
        profile_picture_path: celebrity.profile_picture_path,
        base_price: celebrity.base_price,
        hourly_rate: celebrity.hourly_rate,
        is_verified: celebrity.is_verified,
        is_available: celebrity.is_available,
        location: celebrity.location,
        gender: celebrity.gender,
        phone_number: celebrity.phone_number,
        social_instagram: celebrity.social_instagram,
        social_twitter: celebrity.social_twitter,
        social_tiktok: celebrity.social_tiktok,
        age: celebrity.age,
        created_at: celebrity.created_at,
        subscription_tier: celebrity.subscription_tier,
        duration_type: celebrity.duration_type,
        subscription_end: celebrity.subscription_end,
      })) || [];
      
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
                         celebrity.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
                           celebrity.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesAge = !celebrity.age || (celebrity.age >= minAge && celebrity.age <= maxAge);
    
    const matchesGender = genderFilter === 'all' || celebrity.gender === genderFilter;
    
    return matchesSearch && matchesLocation && matchesAge && matchesGender;
  });

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
                  Join as Celebrity
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
                    Join as Celebrity
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
                  placeholder="Search by name, bio, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 sm:h-12"
                />
              </div>

              {/* Location Filter - Compact Design */}
              {availableLocations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Filter by Location</label>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* All Locations Button */}
                    <Button
                      variant={locationFilter === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocationFilter('')}
                      className="flex-shrink-0"
                    >
                      All Locations
                    </Button>

                    {/* Quick Access - Show first 3-4 popular locations */}
                    <div className="flex flex-wrap gap-2">
                      {availableLocations.slice(0, 3).map((location) => (
                        <Button
                          key={location}
                          variant={locationFilter === location ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLocationFilter(location)}
                          className="text-xs sm:text-sm"
                        >
                          {location}
                        </Button>
                      ))}
                    </div>

                    {/* Dropdown for all locations */}
                    {availableLocations.length > 3 && (
                      <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="More locations..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-[100]">
                          <SelectItem value="">All Locations</SelectItem>
                          {availableLocations.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                      {/* Gender Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Gender</label>
                        <Select value={genderFilter} onValueChange={setGenderFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-[100]">
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredCelebrities.map((celebrity) => (
                <CelebrityCard
                  key={celebrity.id}
                  celebrity={celebrity}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
