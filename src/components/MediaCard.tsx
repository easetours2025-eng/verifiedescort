import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Eye, ThumbsUp, Heart, Video, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: string;
  title?: string;
  description?: string;
  file_path: string;
  file_type: string;
  price: number;
  is_premium: boolean;
  is_public: boolean;
  upload_date: string;
}

interface MediaCardProps {
  media: MediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ media }) => {
  const [viewCount, setViewCount] = useState(0);
  const [likeCounts, setLikeCounts] = useState({ likes: 0, loves: 0 });
  const [userLikes, setUserLikes] = useState<string[]>([]);

  useEffect(() => {
    fetchViewCount();
    fetchLikeCounts();
    fetchUserLikes();
  }, [media.id]);

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };

  const fetchViewCount = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_media_statistics');
      
      if (error) throw error;
      // Filter and sum up view counts for this specific media
      const mediaStats = data?.filter(row => row.media_id === media.id) || [];
      const totalViews = mediaStats.reduce((sum, row) => sum + (row.view_count || 0), 0);
      setViewCount(totalViews);
    } catch (error) {
      // Error silently handled - view count will remain 0
    }
  };

  const fetchLikeCounts = async () => {
    try {
      const { data: likeCount, error } = await supabase
        .rpc('get_media_like_count', { media_uuid: media.id });
      
      if (error) throw error;
      
      // Show total likes as "likes" and set loves to 0
      setLikeCounts({ likes: likeCount || 0, loves: 0 });
    } catch (error) {
      // Error silently handled - like counts will remain 0
    }
  };

  const fetchUserLikes = async () => {
    try {
      const userIP = await getUserIP();
      const { data: hasLiked, error } = await supabase
        .rpc('has_user_liked_media', { 
          media_uuid: media.id, 
          user_ip_param: userIP 
        });
      
      if (error) throw error;
      
      setUserLikes(hasLiked ? ['like'] : []);
    } catch (error) {
      // Error silently handled - user likes will not be displayed
    }
  };

  const handleMediaClick = async () => {
    try {
      const userIP = await getUserIP();
      
      // Record view
      await supabase
        .from('media_views')
        .insert({ 
          media_id: media.id, 
          user_ip: userIP 
        });
      
      // Update local view count
      setViewCount(prev => prev + 1);
    } catch (error) {
      // Error silently handled - view count will not be updated
    }
  };

  const handleLike = async (type: 'like' | 'love', e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const userIP = await getUserIP();
      
      if (userLikes.includes(type)) {
        // Remove like/love
        await supabase
          .from('media_likes')
          .delete()
          .eq('media_id', media.id)
          .eq('user_ip', userIP)
          .eq('like_type', type);
        
        setUserLikes(prev => prev.filter(t => t !== type));
        setLikeCounts(prev => ({
          ...prev,
          [type === 'like' ? 'likes' : 'loves']: Math.max(0, prev[type === 'like' ? 'likes' : 'loves'] - 1)
        }));
      } else {
        // Add like/love
        await supabase
          .from('media_likes')
          .insert({ 
            media_id: media.id, 
            user_ip: userIP,
            like_type: type
          });
        
        setUserLikes(prev => [...prev, type]);
        setLikeCounts(prev => ({
          ...prev,
          [type === 'like' ? 'likes' : 'loves']: prev[type === 'like' ? 'likes' : 'loves'] + 1
        }));
      }
    } catch (error) {
      // Error silently handled - like action will not be processed
    }
  };

  const getMediaUrl = (filePath: string, type: 'image' | 'video') => {
    // Check if it's already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    
    const bucket = type === 'video' ? 'celebrity-videos' : 'celebrity-photos';
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      <div 
        className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden"
        onClick={handleMediaClick}
      >
        {media.file_type === 'video' ? (
          <>
            <video
              src={getMediaUrl(media.file_path, 'video')}
              className="w-full h-full object-cover"
              muted
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2 sm:p-3">
                <Video className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </>
        ) : (
          <>
            <img 
              src={getMediaUrl(media.file_path, 'image')}
              alt="Celebrity media"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-primary hidden" />
          </>
        )}
        
        {/* View Counter */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
          <Eye className="h-3 w-3" />
          <span>{viewCount}</span>
        </div>
      </div>
      
      {/* Like/Love Actions */}
      <div className="p-2 bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleLike('like', e)}
            className={`p-1 h-auto ${userLikes.includes('like') ? 'text-blue-600' : 'text-muted-foreground'}`}
          >
            <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="ml-1 text-xs">{likeCounts.likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleLike('love', e)}
            className={`p-1 h-auto ${userLikes.includes('love') ? 'text-red-600' : 'text-muted-foreground'}`}
          >
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="ml-1 text-xs">{likeCounts.loves}</span>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {media.file_type === 'video' ? 'Video' : 'Photo'}
        </div>
      </div>
    </Card>
  );
};

export default MediaCard;