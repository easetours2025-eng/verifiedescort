import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, DollarSign, Users, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  type: 'user' | 'celebrity' | 'payment' | 'video';
  id: string;
  title: string;
  subtitle?: string;
  extra?: string;
  avatar?: string;
}

interface AdminGlobalSearchProps {
  onNavigate?: (tab: string, itemId?: string) => void;
}

const AdminGlobalSearch = ({ onNavigate }: AdminGlobalSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search function
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      const allResults: SearchResult[] = [];

      try {
        // Search celebrity profiles
        const { data: celebrities } = await supabase
          .from('celebrity_profiles')
          .select('id, stage_name, email, profile_picture_path')
          .or(`stage_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5);

        if (celebrities) {
          celebrities.forEach(celeb => {
            allResults.push({
              type: 'celebrity',
              id: celeb.id,
              title: celeb.stage_name,
              subtitle: celeb.email,
              avatar: celeb.profile_picture_path 
                ? `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${celeb.profile_picture_path}`
                : undefined
            });
          });
        }

        // Search payments
        const { data: payments } = await supabase
          .from('payment_verification')
          .select('id, mpesa_code, phone_number, amount, celebrity:celebrity_id(stage_name)')
          .or(`mpesa_code.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
          .limit(5);

        if (payments) {
          payments.forEach(payment => {
            const celebrity = Array.isArray(payment.celebrity) 
              ? payment.celebrity[0] 
              : payment.celebrity;
            
            allResults.push({
              type: 'payment',
              id: payment.id,
              title: `Payment: ${payment.mpesa_code}`,
              subtitle: celebrity?.stage_name || 'Unknown Celebrity',
              extra: `KSh ${payment.amount}`
            });
          });
        }

        // Search admin videos
        const { data: videos } = await supabase
          .from('admin_videos')
          .select('id, title, description')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        if (videos) {
          videos.forEach(video => {
            allResults.push({
              type: 'video',
              id: video.id,
              title: video.title || 'Untitled Video',
              subtitle: video.description?.substring(0, 50) || 'No description'
            });
          });
        }

        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'celebrity':
        onNavigate?.('celebrities', result.id);
        break;
      case 'payment':
        onNavigate?.('payments', result.id);
        break;
      case 'video':
        onNavigate?.('videos', result.id);
        break;
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'celebrity':
        return <Users className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search everything... (Ctrl+K)"
          className="pl-10"
          onFocus={() => setIsOpen(true)}
          readOnly
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Admin Panel</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search celebrities, payments, videos..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <ScrollArea className="max-h-96">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Searching...</p>
              </div>
            )}

            {!loading && searchQuery.length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2 py-4">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-3 hover:bg-accent rounded-lg transition-colors text-left flex items-center gap-3"
                  >
                    {result.avatar ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback>{result.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                        {getIcon(result.type)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{result.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    
                    {result.extra && (
                      <p className="text-sm font-medium text-muted-foreground">{result.extra}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminGlobalSearch;
