import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Video, ArrowLeft } from 'lucide-react';
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

const Videos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
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
  };

  const getVideoUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('celebrity-videos')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const filteredVideos = videos.filter(video =>
    video.celebrity.stage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              {videos.length} Videos
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
          ) : filteredVideos.length === 0 ? (
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
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          videoUrl={getVideoUrl(selectedVideo.file_path)}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Videos;
