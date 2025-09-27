import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Video, ArrowLeft, Play, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VideoCard from '@/components/VideoCard';
import VideoModal from '@/components/VideoModal';

console.log("Videos.tsx file is being processed");

interface VideoData {
  id: string;
  file_path: string;
  title?: string;
  description?: string;
  upload_date: string;
  celebrity: {
    id: string;
    stage_name: string;
    phone_number?: string;
    is_verified: boolean;
  };
  isVIP: boolean;
  views: number;
  likes: number;
  isLiked: boolean;
}

interface AdminVideo {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  view_count: number;
  created_at: string;
}

const Videos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [adminVideos, setAdminVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [selectedAdminVideo, setSelectedAdminVideo] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
    fetchAdminVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // First get the media data
      const { data: mediaData, error: mediaError } = await supabase
        .from('celebrity_media')
        .select(`
          id,
          file_path,
          title,
          description,
          upload_date,
          celebrity_id
        `)
        .eq('file_type', 'video')
        .eq('is_public', true)
        .order('upload_date', { ascending: false });

      if (mediaError) throw mediaError;

      if (!mediaData || mediaData.length === 0) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // Remove duplicates based on celebrity_id - keep only the latest video per celebrity
      const uniqueVideos = mediaData.reduce((acc: any[], current: any) => {
        const existingIndex = acc.findIndex(video => video.celebrity_id === current.celebrity_id);
        if (existingIndex === -1) {
          acc.push(current);
        } else if (new Date(current.upload_date) > new Date(acc[existingIndex].upload_date)) {
          acc[existingIndex] = current;
        }
        return acc;
      }, []);

      // Get unique celebrity IDs
      const celebrityIds = [...new Set(uniqueVideos.map(video => video.celebrity_id))];
      
      // Fetch celebrity profiles
      const { data: celebrityData, error: celebrityError } = await supabase
        .from('celebrity_profiles')
        .select(`
          id,
          stage_name,
          phone_number,
          is_verified
        `)
        .in('id', celebrityIds);

      if (celebrityError) throw celebrityError;

      // Create a map for quick lookup
      const celebrityMap = new Map(
        celebrityData?.map(celebrity => [celebrity.id, celebrity]) || []
      );

      const clientIP = await getClientIP();

      // Check VIP status, views, and likes for each video
      const videosWithData = await Promise.all(
        uniqueVideos.map(async (video: any) => {
          const celebrity = celebrityMap.get(video.celebrity_id);
          
          if (!celebrity) return null; // Skip if celebrity not found

          const [vipData, viewsData, likesData, userLikeData] = await Promise.all([
            supabase
              .from('payment_verification')
              .select('*')
              .eq('celebrity_id', video.celebrity_id)
              .eq('is_verified', true)
              .limit(1),
            supabase
              .from('media_views')
              .select('id')
              .eq('media_id', video.id),
            supabase
              .from('media_likes')
              .select('id')
              .eq('media_id', video.id),
            supabase
              .from('media_likes')
              .select('id')
              .eq('media_id', video.id)
              .eq('user_ip', clientIP)
              .limit(1)
          ]);

          return {
            id: video.id,
            file_path: video.file_path,
            title: video.title,
            description: video.description,
            upload_date: video.upload_date,
            celebrity: {
              id: celebrity.id,
              stage_name: celebrity.stage_name,
              phone_number: celebrity.phone_number,
              is_verified: celebrity.is_verified,
            },
            isVIP: vipData.data && vipData.data.length > 0,
            views: viewsData.data?.length || 0,
            likes: likesData.data?.length || 0,
            isLiked: userLikeData.data && userLikeData.data.length > 0,
          };
        })
      );

      // Filter out null values (videos without valid celebrities)
      const validVideos = videosWithData.filter(video => video !== null);
      setVideos(validVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const fetchAdminVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_videos')
        .select('id, title, description, file_path, view_count, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching admin videos:', error);
    }
  };

  const handleVideoView = async (videoId: string) => {
    const clientIP = await getClientIP();
    try {
      await supabase
        .from('media_views')
        .insert({ media_id: videoId, user_ip: clientIP });
      
      // Update local state
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, views: video.views + 1 }
          : video
      ));
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleLike = async (videoId: string) => {
    const clientIP = await getClientIP();
    const video = videos.find(v => v.id === videoId);
    
    try {
      if (video?.isLiked) {
        // Unlike
        await supabase
          .from('media_likes')
          .delete()
          .eq('media_id', videoId)
          .eq('user_ip', clientIP);
      } else {
        // Like
        await supabase
          .from('media_likes')
          .insert({ media_id: videoId, user_ip: clientIP, like_type: 'like' });
      }
      
      // Refresh videos to update counts
      fetchVideos();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleVideoPlay = (video: VideoData) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
    handleVideoView(video.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
    setSelectedAdminVideo('');
  };

  const getVideoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('celebrity-videos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAdminVideoClick = async (video: AdminVideo) => {
    // Track video view
    try {
      const userIp = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => null);

      await supabase
        .from('admin_video_views')
        .insert({
          video_id: video.id,
          user_ip: userIp
        });

      // Update view count in videos table
      await supabase
        .from('admin_videos')
        .update({ view_count: video.view_count + 1 })
        .eq('id', video.id);

      // Update local state
      setAdminVideos(prev => prev.map(v => 
        v.id === video.id 
          ? { ...v, view_count: v.view_count + 1 }
          : v
      ));

    } catch (error) {
      console.warn('Error tracking video view:', error);
    }

    setSelectedAdminVideo(video.file_path);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredVideos = videos.filter(video =>
    video.celebrity.stage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdminVideos = adminVideos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button variant="ghost" onClick={() => navigate('/')} className="p-2 sm:px-4">
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="relative">
                <Video className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Celebrity Videos
              </h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {adminVideos.length + videos.length} Total Videos
            </Badge>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4">
          <Card className="shadow-lg border-primary/20 bg-gradient-to-r from-background to-primary/5">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Discover Amazing Videos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by celebrity name, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 sm:h-12"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="pb-8 sm:pb-20">
        <div className="container mx-auto px-3 sm:px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse overflow-hidden">
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-muted to-muted-foreground/20" />
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="h-3 sm:h-4 bg-muted rounded" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 sm:h-4 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVideos.length === 0 && filteredAdminVideos.length === 0 ? (
            <div className="text-center py-12 sm:py-20 px-4">
              <div className="max-w-md mx-auto">
                <Video className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">No videos found</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {searchTerm ? "Try adjusting your search" : "No videos have been uploaded yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Admin Videos Section */}
              {filteredAdminVideos.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                    🎬 Featured Videos ({filteredAdminVideos.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredAdminVideos.map((video) => (
                      <Card 
                        key={video.id} 
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                        onClick={() => handleAdminVideoClick(video)}
                      >
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          <video
                            src={video.file_path}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            preload="metadata"
                            onError={(e) => {
                              const target = e.target as HTMLVideoElement;
                              target.style.display = 'none';
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            controlsList="nodownload"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {video.title}
                          </h3>
                          
                          {video.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{video.view_count} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(video.created_at)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Celebrity Videos Section */}
              {filteredVideos.length > 0 && (
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">📺 Celebrity Videos ({filteredVideos.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        videoUrl={getVideoUrl(video.file_path)}
                        onPlay={() => handleVideoPlay(video)}
                        onLike={() => handleLike(video.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {(selectedVideo || selectedAdminVideo) && (
        <VideoModal
          videoUrl={selectedVideo ? getVideoUrl(selectedVideo.file_path) : selectedAdminVideo}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Videos;
