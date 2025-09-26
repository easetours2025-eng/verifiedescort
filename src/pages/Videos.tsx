import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Video, Play, User, Phone, MessageCircle, ArrowLeft, Heart, Share2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

      // Get unique celebrity IDs
      const celebrityIds = [...new Set(mediaData.map(video => video.celebrity_id))];
      
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
        mediaData.map(async (video: any) => {
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

  const handleShare = (videoId: string) => {
    const shareUrl = `${window.location.origin}/videos?video=${videoId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Video link copied to clipboard",
    });
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
            <>
              {/* Featured Video (First Video) */}
              {filteredVideos[0] && (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">🌟 Featured Video</h2>
                  <Card className="group hover:shadow-celebrity transition-all duration-300 hover:-translate-y-1 border-primary/30 overflow-hidden bg-gradient-to-br from-background to-primary/5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="relative h-48 sm:h-64 lg:h-80 cursor-pointer order-2 lg:order-1" onClick={() => {
                        setSelectedVideo(filteredVideos[0]);
                        handleVideoView(filteredVideos[0].id);
                      }}>
                        <video
                          src={getVideoUrl(filteredVideos[0].file_path)}
                          className="w-full h-full object-cover rounded-lg"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all rounded-lg">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                            <Play className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                          </div>
                        </div>
                        
                        {/* Stats Overlay */}
                        <div className="absolute top-3 right-3 flex items-center space-x-2">
                          <div className="bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{filteredVideos[0].views}</span>
                          </div>
                        </div>
                        
                        {/* VIP Badge */}
                        {filteredVideos[0].isVIP && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold">
                            ⭐ VIP
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 sm:p-6 flex flex-col justify-center order-1 lg:order-2">
                        {/* Celebrity Info */}
                        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="font-bold text-lg sm:text-xl text-primary">{filteredVideos[0].celebrity.stage_name}</span>
                            {filteredVideos[0].celebrity.is_verified && (
                              <Badge variant="secondary" className="ml-2 text-xs">✓ Verified</Badge>
                            )}
                          </div>
                        </div>

                        {/* Video Details */}
                        {filteredVideos[0].title && (
                          <h3 className="font-semibold text-base sm:text-lg mb-2">{filteredVideos[0].title}</h3>
                        )}
                        {filteredVideos[0].description && (
                          <p className="text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-3">{filteredVideos[0].description}</p>
                        )}

                        <p className="text-xs text-muted-foreground mb-4">
                          📅 Uploaded {new Date(filteredVideos[0].upload_date).toLocaleDateString()}
                        </p>

                        {/* Video Actions */}
                        <div className="flex items-center space-x-4 mb-4">
                          <button
                            onClick={() => handleLike(filteredVideos[0].id)}
                            className={`flex items-center space-x-2 text-sm transition-colors ${
                              filteredVideos[0].isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${filteredVideos[0].isLiked ? 'fill-current' : ''}`} />
                            <span>{filteredVideos[0].likes} Likes</span>
                          </button>
                          <button
                            onClick={() => handleShare(filteredVideos[0].id)}
                            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                        </div>

                        {/* VIP Contact Info */}
                        {filteredVideos[0].isVIP && filteredVideos[0].celebrity.phone_number && (
                          <div className="flex items-center space-x-3 pt-3 border-t border-yellow-200">
                            <a 
                              href={`tel:${filteredVideos[0].celebrity.phone_number}`}
                              className="flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              <Phone className="h-4 w-4" />
                              <span>Call Now</span>
                            </a>
                            <a 
                              href={`https://wa.me/${filteredVideos[0].celebrity.phone_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 text-green-500 hover:text-green-600 text-sm font-medium"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              
              {/* All Videos Grid */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">📺 All Videos ({filteredVideos.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {filteredVideos.map((video) => (
                    <Card key={video.id} className="group hover:shadow-celebrity transition-all duration-300 hover:-translate-y-1 border-primary/20 overflow-hidden bg-gradient-to-br from-background to-primary/5">
                      {/* Video Thumbnail */}
                      <div className="relative h-32 sm:h-40 cursor-pointer" onClick={() => {
                        setSelectedVideo(video);
                        handleVideoView(video.id);
                      }}>
                        <video
                          src={getVideoUrl(video.file_path)}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
                            <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          </div>
                        </div>
                        
                        {/* Stats Overlay */}
                        <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{video.views}</span>
                        </div>
                        
                        {/* VIP Badge */}
                        {video.isVIP && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-bold">
                            VIP
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {/* Celebrity Info */}
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className="font-semibold text-primary text-sm truncate">{video.celebrity.stage_name}</span>
                          {video.celebrity.is_verified && (
                            <Badge variant="secondary" className="text-xs">✓</Badge>
                          )}
                        </div>

                        {/* Video Details */}
                        {video.title && (
                          <h3 className="font-medium text-xs sm:text-sm line-clamp-2">{video.title}</h3>
                        )}
                        {video.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                        )}

                        <p className="text-xs text-muted-foreground">
                          📅 {new Date(video.upload_date).toLocaleDateString()}
                        </p>

                        {/* Video Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(video.id);
                              }}
                              className={`flex items-center space-x-1 text-xs transition-colors ${
                                video.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${video.isLiked ? 'fill-current' : ''}`} />
                              <span>{video.likes}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(video.id);
                              }}
                              className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Share2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* VIP Contact Info */}
                        {video.isVIP && video.celebrity.phone_number && (
                          <div className="flex items-center justify-center space-x-2 pt-2 border-t border-yellow-200">
                            <a 
                              href={`tel:${video.celebrity.phone_number}`}
                              className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              <span>Call</span>
                            </a>
                            <a 
                              href={`https://wa.me/${video.celebrity.phone_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-green-500 hover:text-green-600 text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
              onClick={() => setSelectedVideo(null)}
            >
              ✕ Close
            </Button>
            <video
              src={getVideoUrl(selectedVideo.file_path)}
              className="w-full h-auto max-h-[80vh] rounded-lg"
              controls
              autoPlay
            />
            <div className="mt-4 text-center text-white">
              <h3 className="text-lg font-semibold">{selectedVideo.celebrity.stage_name}</h3>
              {selectedVideo.title && <p className="text-sm">{selectedVideo.title}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;