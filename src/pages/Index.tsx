import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CelebrityCard from '@/components/CelebrityCard';
import { Crown, Sparkles, Search, Filter, Star, Users, Trophy, Heart, Video, ChevronDown, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  filterCelebrityDataArray, 
  PublicCelebrityProfile, 
  PrivateCelebrityProfile,
  CelebrityProfile as FullCelebrityProfile
} from '@/lib/celebrity-utils';

const Index = () => {
  const [celebrities, setCelebrities] = useState<PrivateCelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [userPaymentStatus, setUserPaymentStatus] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
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
      // Fetch celebrities with active subscriptions
      const { data, error } = await supabase
        .from('celebrity_profiles')
        .select(`
          *,
          celebrity_subscriptions!inner(
            is_active,
            subscription_end,
            subscription_tier,
            subscription_start
          )
        `)
        .eq('celebrity_subscriptions.is_active', true)
        .gte('celebrity_subscriptions.subscription_end', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter sensitive data based on user permissions
      const rawProfiles = data || [];
      const filteredProfiles = await filterCelebrityDataArray(rawProfiles as FullCelebrityProfile[]);
      setCelebrities(filteredProfiles);
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
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

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
                Kenya Connect
              </h1>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/videos')}
                className="border-primary/20 hover:bg-primary/10 hidden sm:flex"
              >
                <Video className="h-4 w-4 mr-2" />
                Videos
              </Button>
              {user ? (
                <div className="flex items-center space-x-1 sm:space-x-3">
                  {userPaymentStatus && (
                    <Badge variant="default" className="bg-green-500 text-white text-xs hidden sm:inline-flex">
                      Verified: {userPaymentStatus.phone_number}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                    className="border-primary/20 hover:bg-primary/10 text-xs sm:text-sm"
                  >
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity text-xs sm:text-sm"
                >
                  Join as Celebrity
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>


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

              {/* Advanced Filters - Collapsible on mobile */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:hidden flex items-center justify-center space-x-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Advanced Filters</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="sm:block">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-0">
                    {/* Location Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        placeholder="City or area..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="h-9 sm:h-10"
                      />
                    </div>

                    {/* Age Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Age Range</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={minAge}
                          onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
                          className="h-9 sm:h-10"
                          min="18"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={maxAge}
                          onChange={(e) => setMaxAge(parseInt(e.target.value) || 65)}
                          className="h-9 sm:h-10"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Gender Filter */}
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="text-sm font-medium">Gender</label>
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          variant={genderFilter === 'all' ? 'default' : 'outline'}
                          onClick={() => setGenderFilter('all')}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          All
                        </Button>
                        <Button
                          variant={genderFilter === 'male' ? 'default' : 'outline'}
                          onClick={() => setGenderFilter('male')}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Male
                        </Button>
                        <Button
                          variant={genderFilter === 'female' ? 'default' : 'outline'}
                          onClick={() => setGenderFilter('female')}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Female
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex justify-end mt-3 sm:mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setLocationFilter('');
                        setMinAge(18);
                        setMaxAge(65);
                        setGenderFilter('all');
                      }}
                      className="text-xs sm:text-sm"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Celebrity Grid */}
      <section className="pb-8 sm:pb-20">
        <div className="container mx-auto px-3 sm:px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-muted rounded-full mx-auto" />
                    <div className="h-4 sm:h-6 bg-muted rounded mx-auto w-24 sm:w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-muted rounded" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
