import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Video, Play, Eye, Calendar } from 'lucide-react';
import VideoModal from './VideoModal';

interface AdminVideo {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  view_count: number;
  created_at: string;
}

const HomeVideoSection = () => {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_videos')
        .select('id, title, description, file_path, view_count, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (video: AdminVideo) => {
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

    } catch (error) {
      console.warn('Error tracking video view:', error);
    }

    setSelectedVideo(video.file_path);
    setModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <>
      <section className="py-8 bg-gradient-to-r from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Featured Videos
            </h2>
            <p className="text-muted-foreground">
              Discover exclusive content from our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={() => handleVideoClick(video)}
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
                    onContextMenu={(e) => e.preventDefault()} // Prevent right-click
                    controlsList="nodownload" // Prevent download controls
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
      </section>

      <VideoModal
        videoUrl={selectedVideo}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedVideo('');
        }}
      />
    </>
  );
};

export default HomeVideoSection;