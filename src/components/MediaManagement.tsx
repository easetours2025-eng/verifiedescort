import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Heart, 
  ThumbsUp, 
  Trash2, 
  Image as ImageIcon, 
  Video,
  MoreVertical,
  Settings,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface MediaStats {
  views: number;
  likes: number;
  loves: number;
}

interface MediaManagementProps {
  profile: { id: string; stage_name: string };
  media: MediaItem[];
  onMediaUpdate: () => void;
}

const MediaManagement = ({ profile, media, onMediaUpdate }: MediaManagementProps) => {
  const [mediaStats, setMediaStats] = useState<Record<string, MediaStats>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (media.length > 0) {
      fetchMediaStats();
    }
  }, [media]);

  const fetchMediaStats = async () => {
    try {
      const mediaIds = media.map(m => m.id);
      
      // Fetch views
      const { data: viewsData } = await supabase
        .from('media_views')
        .select('media_id, id')
        .in('media_id', mediaIds);

      // Fetch likes
      const { data: likesData } = await supabase
        .from('media_likes')
        .select('media_id, like_type')
        .in('media_id', mediaIds);

      // Process stats
      const stats: Record<string, MediaStats> = {};
      
      mediaIds.forEach(id => {
        stats[id] = { views: 0, likes: 0, loves: 0 };
      });

      viewsData?.forEach(view => {
        stats[view.media_id].views++;
      });

      likesData?.forEach(like => {
        if (like.like_type === 'like') {
          stats[like.media_id].likes++;
        } else if (like.like_type === 'love') {
          stats[like.media_id].loves++;
        }
      });

      setMediaStats(stats);
    } catch (error) {
      console.error('Error fetching media stats:', error);
    }
  };

  const handleTogglePublic = async (mediaId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('celebrity_media')
        .update({ is_public: !currentStatus })
        .eq('id', mediaId);

      if (error) throw error;

      toast({
        title: "Media Updated",
        description: `Media is now ${!currentStatus ? 'public' : 'private'}`,
      });

      onMediaUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update media",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete from database
      const { error } = await supabase
        .from('celebrity_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      toast({
        title: "Media Deleted",
        description: "Media has been successfully deleted",
      });

      onMediaUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (filePath: string, fileType: string) => {
    const bucket = fileType === 'video' ? 'celebrity-videos' : 'celebrity-photos';
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (media.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No media uploaded</h3>
              <p className="text-muted-foreground text-sm">
                Upload your first photo or video to get started!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Media Stats Overview */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Media Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{media.length}</div>
              <div className="text-sm text-muted-foreground">Total Media</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{media.filter(m => m.is_public).length}</div>
              <div className="text-sm text-muted-foreground">Public</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(mediaStats).reduce((total, stats) => total + stats.views, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(mediaStats).reduce((total, stats) => total + stats.likes + stats.loves, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Interactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => {
          const stats = mediaStats[item.id] || { views: 0, likes: 0, loves: 0 };
          
          return (
            <Card key={item.id} className="overflow-hidden">
              {/* Media Preview */}
              <div className="relative aspect-video bg-muted">
                {item.file_type === 'image' ? (
                  <img
                    src={getMediaUrl(item.file_path, item.file_type)}
                    alt={item.title || 'Media'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video
                      src={getMediaUrl(item.file_path, item.file_type)}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </>
                )}
                
                {/* Media Type Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.file_type === 'image' ? (
                      <><ImageIcon className="h-3 w-3 mr-1" />Photo</>
                    ) : (
                      <><Video className="h-3 w-3 mr-1" />Video</>
                    )}
                  </Badge>
                </div>

                {/* Action Menu */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTogglePublic(item.id, item.is_public)}>
                        <Settings className="h-4 w-4 mr-2" />
                        {item.is_public ? 'Make Private' : 'Make Public'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteMedia(item.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Media Details */}
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {item.title && (
                        <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={item.is_public ? "default" : "secondary"} className="text-xs">
                          {item.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.upload_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs font-medium">{stats.views}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1 text-blue-600">
                        <ThumbsUp className="h-3 w-3" />
                        <span className="text-xs font-medium">{stats.likes}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-1 text-red-600">
                        <Heart className="h-3 w-3" />
                        <span className="text-xs font-medium">{stats.loves}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Loves</div>
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Public Visibility</span>
                    <Switch
                      checked={item.is_public}
                      onCheckedChange={() => handleTogglePublic(item.id, item.is_public)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MediaManagement;