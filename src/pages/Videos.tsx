import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Video, Play, User, Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      const { data: mediaData, error } = await supabase
        .from('celebrity_media')
        .select(`
          id,
          file_path,
          title,
          description,
          upload_date,
          celebrity_id,
          celebrity_profiles!inner(
            id,
            stage_name,
            phone_number,
            is_verified
          )
        `)
        .eq('file_type', 'video')
        .eq('is_public', true)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      // Check VIP status for each celebrity
      const videosWithVIPStatus = await Promise.all(
        (mediaData || []).map(async (video: any) => {
          const { data: vipData } = await supabase
            .from('payment_verification')
            .select('*')
            .eq('celebrity_id', video.celebrity_id)
            .eq('is_verified', true)
            .limit(1);

          return {
            id: video.id,
            file_path: video.file_path,
            title: video.title,
            description: video.description,
            upload_date: video.upload_date,
            celebrity: {
              id: video.celebrity_profiles.id,
              stage_name: video.celebrity_profiles.stage_name,
              phone_number: video.celebrity_profiles.phone_number,
              is_verified: video.celebrity_profiles.is_verified,
            },
            isVIP: vipData && vipData.length > 0,
          };
        })
      );

      setVideos(videosWithVIPStatus);
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Video className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Celebrity Videos
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Search */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Search Videos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by celebrity name, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No videos found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search" : "No videos have been uploaded yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="group hover:shadow-celebrity transition-all duration-300 hover:-translate-y-1 border-primary/20 overflow-hidden">
                  {/* Video Thumbnail */}
                  <div className="relative h-48 cursor-pointer" onClick={() => setSelectedVideo(video)}>
                    <video
                      src={getVideoUrl(video.file_path)}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    
                    {/* VIP Badge */}
                    {video.isVIP && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-2 py-1 rounded-full text-xs font-bold">
                        VIP
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Celebrity Info */}
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">{video.celebrity.stage_name}</span>
                      {video.celebrity.is_verified && (
                        <Badge variant="secondary" className="text-xs">Verified</Badge>
                      )}
                    </div>

                    {/* Video Details */}
                    {video.title && (
                      <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
                    )}
                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(video.upload_date).toLocaleDateString()}
                    </p>

                    {/* VIP Contact Info */}
                    {video.isVIP && video.celebrity.phone_number && (
                      <div className="flex items-center justify-center space-x-3 pt-2 border-t border-yellow-200">
                        <a 
                          href={`tel:${video.celebrity.phone_number}`}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-xs"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Call</span>
                        </a>
                        <a 
                          href={`https://wa.me/${video.celebrity.phone_number.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-green-500 hover:text-green-600 text-xs"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Videos;