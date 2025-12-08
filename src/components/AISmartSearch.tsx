import React, { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  celebrityId: string;
  matchScore: number;
  reason: string;
}

interface SearchResult {
  recommendations: Recommendation[];
  searchSummary: string;
}

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

const AISmartSearch: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Fetch popular locations on mount
  useEffect(() => {
    const fetchPopularLocations = async () => {
      const { data } = await supabase
        .from('celebrity_profiles')
        .select('location')
        .eq('is_verified', true)
        .not('location', 'is', null);

      if (data) {
        // Count occurrences of each location
        const locationCounts: Record<string, number> = {};
        data.forEach(({ location }) => {
          if (location?.trim()) {
            const loc = location.trim();
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          }
        });

        // Sort by count and take top 6
        const topLocations = Object.entries(locationCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([loc]) => loc);

        setSuggestions(topLocations);
      }
    };

    fetchPopularLocations();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please describe what you're looking for",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('Calling AI smart search with query:', query);
      
      const { data, error } = await supabase.functions.invoke('ai-smart-search', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      console.log('Search results:', data);
      setResults(data);

      // Fetch celebrity details for the recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        const celebrityIds = data.recommendations.map((r: Recommendation) => r.celebrityId);
        
        const { data: celebData, error: celebError } = await supabase
          .from('celebrity_profiles')
          .select('id, stage_name, bio, location, base_price, is_verified, profile_picture_path, gender, age, hourly_rate')
          .in('id', celebrityIds);

        if (celebError) throw celebError;

        // Sort celebrities by match score
        const sortedCelebs = celebData?.sort((a, b) => {
          const scoreA = data.recommendations.find((r: Recommendation) => r.celebrityId === a.id)?.matchScore || 0;
          const scoreB = data.recommendations.find((r: Recommendation) => r.celebrityId === b.id)?.matchScore || 0;
          return scoreB - scoreA;
        }) || [];

        setCelebrities(sortedCelebs);
      }

      toast({
        title: "Search complete",
        description: `Found ${data.recommendations?.length || 0} recommendations`,
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };


  const handleSuggestionClick = (suggestion: string) => {
    setQuery(prev => prev ? `${prev}, ${suggestion}` : suggestion);
  };

  return (
    <div className="space-y-3">
      {/* Simple Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your ideal match (e.g., a girl from Nakuru, 25 years old)"
            className="pl-10 h-12"
            disabled={isSearching}
          />
        </div>
        <Button type="submit" disabled={isSearching} size="lg" className="h-12 px-6">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Search
            </>
          )}
        </Button>
      </form>

      {/* Quick Suggestion Chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 text-sm rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Search Summary */}
      {results?.searchSummary && (
        <p className="text-sm text-muted-foreground">
          <strong>AI:</strong> {results.searchSummary}
        </p>
      )}

      {/* Results */}
      {celebrities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {celebrities.map((celeb) => {
            const recommendation = results?.recommendations.find(r => r.celebrityId === celeb.id);
            if (!recommendation) return null;

            return (
              <div 
                key={celeb.id} 
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/celebrity/${celeb.id}`)}
              >
                <div className="relative shrink-0">
                  {celeb.profile_picture_path ? (
                    <img
                      src={celeb.profile_picture_path.startsWith('http') 
                        ? celeb.profile_picture_path 
                        : `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${celeb.profile_picture_path}`}
                      alt={celeb.stage_name}
                      className="w-14 h-14 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-14 h-14 rounded-full bg-muted items-center justify-center"
                    style={{ display: celeb.profile_picture_path ? 'none' : 'flex' }}
                  >
                    <span className="text-lg font-medium">{celeb.stage_name[0]}</span>
                  </div>
                  {celeb.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium truncate">{celeb.stage_name}</h4>
                    <Badge className={`${getMatchColor(recommendation.matchScore)} text-white text-xs shrink-0`}>
                      {recommendation.matchScore}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{celeb.location}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results && celebrities.length === 0 && !isSearching && (
        <p className="text-center text-muted-foreground py-4">
          No matches found. Try a different search term.
        </p>
      )}
    </div>
  );
};

export default AISmartSearch;
