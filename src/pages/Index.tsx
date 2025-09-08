import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CelebrityCard from '@/components/CelebrityCard';
import { Crown, Sparkles, Search, Filter, Star, Users, Trophy, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CelebrityProfile {
  id: string;
  stage_name: string;
  real_name?: string;
  bio?: string;
  phone_number?: string;
  location?: string;
  gender?: string;
  age?: number;
  base_price: number;
  hourly_rate?: number;
  social_instagram?: string;
  social_twitter?: string;
  is_verified: boolean;
  is_available: boolean;
}

const Index = () => {
  const [celebrities, setCelebrities] = useState<CelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [userPaymentStatus, setUserPaymentStatus] = useState<any>(null);
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
      setCelebrities(data || []);
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
                         celebrity.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         celebrity.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
                           celebrity.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesPrice = celebrity.base_price >= minPrice && celebrity.base_price <= maxPrice;
    
    const matchesAge = !celebrity.age || (celebrity.age >= minAge && celebrity.age <= maxAge);
    
    const matchesGender = genderFilter === 'all' || celebrity.gender === genderFilter;
    
    return matchesSearch && matchesLocation && matchesPrice && matchesAge && matchesGender;
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Crown className="h-8 w-8 text-primary" />
                <Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Celebrity Connect
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  {userPaymentStatus && (
                    <Badge variant="default" className="bg-green-500 text-white">
                      Verified: {userPaymentStatus.phone_number}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Dashboard
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity"
                >
                  Join as Celebrity
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <Star className="h-12 w-12 text-accent animate-pulse" />
              <Trophy className="h-16 w-16 text-primary" />
              <Star className="h-12 w-12 text-accent animate-pulse" />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Meet Your Favorite Celebrities
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with verified celebrities for exclusive meetups, photo sessions, and personal interactions. 
              Your dream celebrity encounter is just one click away.
            </p>

            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>{celebrities.length}+ Celebrities</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-accent" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span>Premium Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Your Celebrity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Main Search */}
                <div className="flex-1">
                  <Input
                    placeholder="Search by name, bio, or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Location Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      placeholder="City or area..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="h-10"
                    />
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range (KSh)</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
                        className="h-10"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(parseInt(e.target.value) || 10000)}
                        className="h-10"
                      />
                    </div>
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
                        className="h-10"
                        min="18"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxAge}
                        onChange={(e) => setMaxAge(parseInt(e.target.value) || 65)}
                        className="h-10"
                        max="100"
                      />
                    </div>
                  </div>

                  {/* Gender Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <div className="flex space-x-1">
                      <Button
                        variant={genderFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setGenderFilter('all')}
                        size="sm"
                        className="flex-1"
                      >
                        All
                      </Button>
                      <Button
                        variant={genderFilter === 'male' ? 'default' : 'outline'}
                        onClick={() => setGenderFilter('male')}
                        size="sm"
                        className="flex-1"
                      >
                        Male
                      </Button>
                      <Button
                        variant={genderFilter === 'female' ? 'default' : 'outline'}
                        onClick={() => setGenderFilter('female')}
                        size="sm"
                        className="flex-1"
                      >
                        Female
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setMinPrice(0);
                      setMaxPrice(10000);
                      setMinAge(18);
                      setMaxAge(65);
                      setGenderFilter('all');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Celebrity Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-20 w-20 bg-muted rounded-full mx-auto" />
                    <div className="h-6 bg-muted rounded mx-auto w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCelebrities.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No celebrities found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || genderFilter !== 'all' 
                    ? "Try adjusting your search or filters" 
                    : "Be the first celebrity to join our platform!"
                  }
                </p>
                {!user && (
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="mt-4 bg-gradient-to-r from-primary to-accent"
                  >
                    Join Now
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
