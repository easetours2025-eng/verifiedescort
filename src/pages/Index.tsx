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
import AISmartSearch from '@/components/AISmartSearch';
import AgeVerificationDialog from '@/components/AgeVerificationDialog';

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
  const [showAgeVerification, setShowAgeVerification] = useState(false);
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

  // Check age verification on mount
  useEffect(() => {
    const hasVerified = localStorage.getItem('age_verified');
    if (!hasVerified) {
      setShowAgeVerification(true);
    }
  }, []);

  // Add JSON-LD structured data for homepage SEO
  useEffect(() => {
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Royal Escorts",
      "url": "https://royalescortsworld.com",
      "logo": "https://royalescortsworld.com/favicon.png",
      "description": "Connect with verified celebrities in Kenya for exclusive meetings, photo sessions, and personal interactions",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "KE"
      },
      "sameAs": [
        "https://royalescortsworld.com"
      ]
    };

    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Royal Escorts",
      "url": "https://royalescortsworld.com",
      "description": "Premium celebrity companionship services in Kenya",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://royalescortsworld.com/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    };

    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://royalescortsworld.com/"
        }
      ]
    };

    // Add organization structured data
    const existingOrgScript = document.getElementById('organization-structured-data');
    if (existingOrgScript) {
      existingOrgScript.remove();
    }

    const orgScript = document.createElement('script');
    orgScript.id = 'organization-structured-data';
    orgScript.type = 'application/ld+json';
    orgScript.text = JSON.stringify(organizationData);
    document.head.appendChild(orgScript);

    // Add website structured data
    const existingWebsiteScript = document.getElementById('website-structured-data');
    if (existingWebsiteScript) {
      existingWebsiteScript.remove();
    }

    const websiteScript = document.createElement('script');
    websiteScript.id = 'website-structured-data';
    websiteScript.type = 'application/ld+json';
    websiteScript.text = JSON.stringify(websiteData);
    document.head.appendChild(websiteScript);

    // Add breadcrumb structured data
    const existingBreadcrumbScript = document.getElementById('breadcrumb-structured-data');
    if (existingBreadcrumbScript) {
      existingBreadcrumbScript.remove();
    }

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.id = 'breadcrumb-structured-data';
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.text = JSON.stringify(breadcrumbData);
    document.head.appendChild(breadcrumbScript);

    // Cleanup
    return () => {
      const orgScript = document.getElementById('organization-structured-data');
      const webScript = document.getElementById('website-structured-data');
      const breadcrumbScript = document.getElementById('breadcrumb-structured-data');
      if (orgScript) orgScript.remove();
      if (webScript) webScript.remove();
      if (breadcrumbScript) breadcrumbScript.remove();
    };
  }, []);

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

  const handleAgeVerificationAgree = () => {
    localStorage.setItem('age_verified', 'true');
    setShowAgeVerification(false);
  };

  const handleAgeVerificationDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <>
      <div className="min-h-screen bg-background">
      <NavigationHeader showBackButton={false} showNavigation={true} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_52%/0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(45_93%_58%/0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in">
            {/* Crown Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-primary to-accent p-4 sm:p-6 rounded-2xl shadow-[var(--shadow-celebrity)]">
                  <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
                Royal Escorts Kenya
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Connect with verified celebrities for exclusive meetings, photo sessions, and personal interactions
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
              <Button 
                onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-[var(--shadow-celebrity)] transition-all duration-300 hover-scale text-base sm:text-lg px-6 sm:px-8"
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Celebrities
              </Button>
              {!user && (
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-primary hover:bg-primary/5 text-base sm:text-lg px-6 sm:px-8 hover-scale"
                >
                  Join as Celebrity
                </Button>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 max-w-2xl mx-auto">
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {celebrities.length}+
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Verified Celebrities</div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  100%
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale hover:shadow-lg">
              <CardContent className="p-4 sm:p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Star className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg">Verified Profiles</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  All celebrities are verified for your safety and peace of mind
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale hover:shadow-lg">
              <CardContent className="p-4 sm:p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg">Premium Experience</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Exclusive meetings and personalized interactions
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale hover:shadow-lg">
              <CardContent className="p-4 sm:p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg">Top Celebrities</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Connect with Kenya's most exclusive personalities
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale hover:shadow-lg">
              <CardContent className="p-4 sm:p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg">AI Smart Search</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Find your perfect match with intelligent search
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Smart Search Section */}
      <section className="py-6 sm:py-8" id="search-section">
        <div className="container mx-auto px-3 sm:px-4">
          <AISmartSearch />
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-4 sm:pb-4">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, bio, location, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 sm:h-14 pl-11 text-base border-2 focus:border-primary transition-colors"
                />
              </div>

              {/* Country Filter - PRIMARY FILTER - Always visible */}
              {!searchTerm && availableCountries.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <label className="text-sm sm:text-base font-semibold">Select Country</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button
                      variant={countryFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCountryFilter('all')}
                      className={`rounded-full px-4 sm:px-6 transition-all hover-scale ${
                        countryFilter === 'all' 
                          ? 'bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-celebrity)]' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      All Countries
                    </Button>
                    {availableCountries.map((country) => (
                      <Button
                        key={country.name}
                        variant={countryFilter === country.name ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCountryFilter(country.name)}
                        className={`rounded-full px-4 sm:px-6 transition-all hover-scale ${
                          countryFilter === country.name 
                            ? 'bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-celebrity)]' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {country.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Filter - Hide when search is active */}
              {!searchTerm && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <label className="text-sm sm:text-base font-semibold">Select Gender</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button
                      variant={genderFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGenderFilter('all')}
                      className={`rounded-full px-4 sm:px-6 transition-all hover-scale ${
                        genderFilter === 'all' 
                          ? 'bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-celebrity)]' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      All
                    </Button>
                    {availableGenders.map((gender) => (
                      <Button
                        key={gender}
                        variant={genderFilter.toLowerCase() === gender.toLowerCase() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGenderFilter(gender.toLowerCase())}
                        className={`rounded-full px-4 sm:px-6 transition-all hover-scale ${
                          genderFilter.toLowerCase() === gender.toLowerCase() 
                            ? 'bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-celebrity)]' 
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {gender}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Filter - Cards Display - Hide when search is active or "All Countries" selected */}
              {!searchTerm && countryFilter !== 'all' && availableLocations.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <label className="text-sm sm:text-base font-semibold">Select Location</label>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {/* All Locations Button */}
                    <Card
                      onClick={() => setLocationFilter('')}
                      className={`cursor-pointer transition-all hover:shadow-lg hover-scale ${
                        locationFilter === '' 
                          ? 'border-primary bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-celebrity)]' 
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
                        className={`cursor-pointer transition-all hover:shadow-lg hover-scale ${
                          locationFilter === location 
                            ? 'border-primary bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-celebrity)]' 
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
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 text-primary hover:text-primary-glow hover:bg-primary/5 transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Advanced Filters</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      {/* Age Range */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Age Range</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={minAge}
                            onChange={(e) => setMinAge(Number(e.target.value))}
                            min="18"
                            max="65"
                            className="w-24 border-2 focus:border-primary"
                          />
                          <span className="text-muted-foreground font-medium">to</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={maxAge}
                            onChange={(e) => setMaxAge(Number(e.target.value))}
                            min="18"
                            max="65"
                            className="w-24 border-2 focus:border-primary"
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
                        className="w-full border-2 hover:border-primary hover:bg-primary/5 transition-all"
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
      <section className="pb-12 sm:pb-20">
        <div className="container mx-auto px-3 sm:px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full opacity-20 blur-2xl animate-pulse"></div>
                <Crown className="h-20 w-20 sm:h-24 sm:w-24 text-primary animate-spin relative z-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mt-6 mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Loading Celebrities...
              </h3>
              <p className="text-muted-foreground text-base sm:text-lg">Discovering amazing profiles for you</p>
            </div>
          ) : filteredCelebrities.length === 0 ? (
            <div className="text-center py-16 sm:py-24 px-4">
              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold">No celebrities found</h3>
                <p className="text-muted-foreground text-base sm:text-lg">
                  {searchTerm || genderFilter !== 'all' 
                    ? "Try adjusting your search or filters" 
                    : "Be the first celebrity to join our platform!"
                  }
                </p>
                {!user && (
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="mt-4 bg-gradient-to-r from-primary to-primary-glow hover:shadow-[var(--shadow-celebrity)] transition-all hover-scale"
                    size="lg"
                  >
                    Join Now
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Showing <span className="font-semibold text-primary">{filteredCelebrities.length}</span> {filteredCelebrities.length === 1 ? 'celebrity' : 'celebrities'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
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
                <div className="mt-8 sm:mt-10">
                  <Pagination>
                    <PaginationContent className="flex justify-center gap-2 sm:gap-3">
                      <PaginationItem>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          className="gap-2 border-2 hover:border-primary hover:bg-primary/5 disabled:opacity-50 hover-scale"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <div className="flex items-center justify-center min-w-[100px] px-4 py-2 text-sm sm:text-base font-medium bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                          Page <span className="mx-1 font-bold text-primary">{currentPage}</span> of <span className="ml-1 font-bold text-primary">{totalPages}</span>
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
                          className="gap-2 border-2 hover:border-primary hover:bg-primary/5 disabled:opacity-50 hover-scale"
                        >
                          <span className="hidden sm:inline">Next</span>
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

      <AgeVerificationDialog 
        isOpen={showAgeVerification}
        onAgree={handleAgeVerificationAgree}
        onDecline={handleAgeVerificationDecline}
      />
    </>
  );
  };

  export default Index;
