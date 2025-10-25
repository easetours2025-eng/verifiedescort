import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Heart, Eye, Phone } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    file_path: string;
    title?: string;
    celebrity: {
      stage_name: string;
      phone_number?: string;
      is_verified: boolean;
    };
    isVIP: boolean;
    views: number;
    likes: number;
    isLiked: boolean;
  };
  videoUrl: string;
  onPlay: () => void;
  onLike: () => void;
}

const VideoCard = ({ video, videoUrl, onPlay, onLike }: VideoCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/20 overflow-hidden">
      {/* Video Thumbnail */}
      <div className="relative aspect-video cursor-pointer" onClick={onPlay}>
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
        
        {/* VIP Badge */}
        {video.isVIP && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold">
            ⭐ VIP
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <CardContent className="p-4">
        {/* Celebrity Name */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-lg text-primary">{video.celebrity.stage_name}</h3>
            {video.celebrity.is_verified && (
              <Badge variant="secondary" className="text-xs">✓</Badge>
            )}
          </div>
        </div>
        
        {/* Phone Number */}
        {video.celebrity.phone_number && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
            <Phone className="h-4 w-4" />
            <a 
              href={`tel:${video.celebrity.phone_number}`}
              className="hover:text-primary transition-colors"
            >
              {video.celebrity.phone_number}
            </a>
          </div>
        )}
        
        {/* Video Title */}
        {video.title && (
          <p className="text-sm font-medium mb-3 line-clamp-2">{video.title}</p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className={`flex items-center space-x-2 text-sm transition-colors ${
              video.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${video.isLiked ? 'fill-current' : ''}`} />
            <span>{video.likes}</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{video.views}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;