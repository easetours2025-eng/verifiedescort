import React, { useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI-Powered Smart Search</h2>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Describe what you're looking for in natural language, and our AI will find the perfect match!
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your pretty model"
              className="flex-1 min-w-0"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching} className="w-full sm:w-auto shrink-0">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {results?.searchSummary && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Understanding:</strong> {results.searchSummary}
            </p>
          </div>
        )}
      </Card>

      {celebrities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recommended Celebrities</h3>
          
          {celebrities.map((celeb) => {
            const recommendation = results?.recommendations.find(r => r.celebrityId === celeb.id);
            if (!recommendation) return null;

            return (
              <Card 
                key={celeb.id} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/celebrity/${celeb.id}`)}
              >
                <div className="flex gap-4">
                  <div className="relative">
                    {celeb.profile_picture_path ? (
                      <img
                        src={celeb.profile_picture_path.startsWith('http') 
                          ? celeb.profile_picture_path 
                          : `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${celeb.profile_picture_path}`}
                        alt={celeb.stage_name}
                        className="w-24 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-24 h-24 rounded-lg bg-muted items-center justify-center"
                      style={{ display: celeb.profile_picture_path ? 'none' : 'flex' }}
                    >
                      <span className="text-2xl">{celeb.stage_name[0]}</span>
                    </div>
                    {celeb.is_verified && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{celeb.stage_name}</h4>
                        <p className="text-sm text-muted-foreground">{celeb.location}</p>
                      </div>
                      <Badge className={`${getMatchColor(recommendation.matchScore)} text-white`}>
                        {recommendation.matchScore}% Match
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {celeb.bio}
                    </p>

                    <p className="text-xs text-muted-foreground italic">
                      {recommendation.reason}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {results && celebrities.length === 0 && !isSearching && (
        <Card className="p-6 text-center space-y-2">
          <p className="text-muted-foreground font-medium">
            No verified models with active subscriptions match your search at the moment.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check back later or try a different search term. Only verified models with active subscriptions are shown in search results.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AISmartSearch;
