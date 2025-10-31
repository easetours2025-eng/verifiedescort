import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Video, ArrowLeft, Play, Eye, Calendar, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VideoCard from '@/components/VideoCard';
import VideoModal from '@/components/VideoModal';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

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
  title?: string;
  description?: string;
  file_path: string;
  view_count: number;
  created_at: string;
  likes: number;
  isLiked: boolean;
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
      
      // Fetch celebrity profiles (limited safe data only)
      const { data: celebrityData, error: celebrityError } = await supabase
        .rpc('get_safe_celebrity_profiles')
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
              .rpc('get_media_like_count', { media_uuid: video.id }),
            supabase
              .rpc('has_user_liked_media', { 
                media_uuid: video.id, 
                user_ip_param: clientIP 
              })
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
              is_verified: celebrity.is_verified,
            },
            isVIP: vipData.data && vipData.data.length > 0,
            views: viewsData.data?.length || 0,
            likes: likesData.data || 0,
            isLiked: userLikeData.data || false,
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
      const { data: adminData, error } = await supabase
        .from('admin_videos')
        .select('id, title, description, file_path, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientIP = await getClientIP();

      // Get views and likes data for each admin video
      const adminVideosWithData = await Promise.all(
        (adminData || []).map(async (video: any) => {
          const [viewsData, likesData, userLikeData] = await Promise.all([
            supabase
              .from('admin_video_views')
              .select('id')
              .eq('video_id', video.id),
            supabase
              .rpc('get_admin_video_like_count', { video_uuid: video.id }),
            supabase
              .rpc('has_user_liked_admin_video', { 
                video_uuid: video.id, 
                user_ip_param: clientIP 
              })
          ]);

          return {
            ...video,
            view_count: viewsData.data?.length || 0,
            likes: likesData.data || 0,
            isLiked: userLikeData.data || false,
          };
        })
      );

      setAdminVideos(adminVideosWithData);
    } catch (error: any) {
      console.error('Error fetching admin videos:', error);
    }
  };

  const handleVideoView = async (videoId: string) => {
    const clientIP = await getClientIP();
    try {
      const { error } = await supabase
        .from('media_views')
        .insert({ media_id: videoId, user_ip: clientIP });
      
      if (error) {
        console.error('Error recording video view:', error);
        return false;
      }
      
      // Update local state
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, views: video.views + 1 }
          : video
      ));
      return true;
    } catch (error) {
      console.error('Error recording view:', error);
      return false;
    }
  };

  const handleAdminVideoView = async (videoId: string) => {
    const clientIP = await getClientIP();
    try {
      const { error } = await supabase
        .from('admin_video_views')
        .insert({ video_id: videoId, user_ip: clientIP });
      
      if (error) {
        console.error('Error recording admin video view:', error);
        return false;
      }

      // Update local state
      setAdminVideos(prev => prev.map(v => 
        v.id === videoId 
          ? { ...v, view_count: v.view_count + 1 }
          : v
      ));
      return true;
    } catch (error) {
      console.error('Error recording admin video view:', error);
      return false;
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
    // Record the view first, then open modal
    handleVideoView(video.id).then(() => {
      setSelectedVideo(video);
      setIsModalOpen(true);
    }).catch(() => {
      // Still open modal even if view recording fails
      setSelectedVideo(video);
      setIsModalOpen(true);
    });
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
    // Record view first
    await handleAdminVideoView(video.id);
    
    // Open modal with video
    setSelectedAdminVideo(video.file_path);
    setIsModalOpen(true);
  };

  const handleAdminVideoLike = async (videoId: string) => {
    const clientIP = await getClientIP();
    const video = adminVideos.find(v => v.id === videoId);
    
    try {
      if (video?.isLiked) {
        // Unlike
        await supabase
          .from('admin_video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_ip', clientIP);
      } else {
        // Like
        await supabase
          .from('admin_video_likes')
          .insert({ video_id: videoId, user_ip: clientIP });
      }
      
      // Refresh admin videos to update counts
      fetchAdminVideos();
    } catch (error) {
      console.error('Error handling admin video like:', error);
    }
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
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <NavigationHeader />
      
      {/* Header - sticky below NavigationHeader */}
      <header className="border-b border-primary/20 backdrop-blur-sm bg-background/80 sticky top-16 z-40 mt-16">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
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
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="relative">
                <Video className="h-16 w-16 sm:h-20 sm:w-20 text-primary animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full opacity-20 animate-pulse"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mt-4 mb-2 text-primary">Loading Videos...</h3>
              <p className="text-muted-foreground text-sm sm:text-base">Please wait while we fetch the latest content</p>
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
                            controlsList="nodownload nofullscreen noremoteplayback"
                            disablePictureInPicture
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{video.view_count} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(video.created_at)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminVideoLike(video.id);
                                }}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
                                  video.isLiked 
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <Heart 
                                  className={`h-3 w-3 ${video.isLiked ? 'fill-current' : ''}`} 
                                />
                                <span className="text-xs">{video.likes}</span>
                              </button>
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

      <Footer />
    </div>
  );
};

export default Videos;
