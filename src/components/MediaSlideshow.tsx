import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

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

interface MediaSlideshowProps {
  media: MediaItem[];
  autoPlay?: boolean;
  interval?: number;
}

const MediaSlideshow: React.FC<MediaSlideshowProps> = ({ 
  media, 
  autoPlay = true, 
  interval = 5000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Filter to only show public media
  const publicMedia = media.filter(item => item.is_public);

  useEffect(() => {
    if (!isPlaying || publicMedia.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === publicMedia.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, publicMedia.length, interval]);

  if (publicMedia.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No public media available</p>
        </CardContent>
      </Card>
    );
  }

  const currentMedia = publicMedia[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? publicMedia.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === publicMedia.length - 1 ? 0 : currentIndex + 1);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          {/* Media Display */}
          {currentMedia.file_type === 'image' ? (
            <img
              src={currentMedia.file_path}
              alt={currentMedia.title || 'Media'}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={currentMedia.file_path}
              className="w-full h-full object-cover"
              controls
              muted
            />
          )}

          {/* Navigation Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 flex items-center justify-between p-4">
              {publicMedia.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToPrevious}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToNext}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Media Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <h3 className="font-semibold">
                  {currentMedia.title || `Media ${currentIndex + 1}`}
                </h3>
                {currentMedia.description && (
                  <p className="text-sm text-white/80 mt-1">
                    {currentMedia.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {currentMedia.is_premium && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                    Premium
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                  KSh {currentMedia.price}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          {publicMedia.length > 1 && (
            <div className="absolute top-4 right-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={togglePlayPause}
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {publicMedia.length > 1 && (
          <div className="p-4 border-t">
            <div className="flex space-x-2 overflow-x-auto">
              {publicMedia.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex 
                      ? 'border-primary' 
                      : 'border-transparent hover:border-primary/50'
                  }`}
                >
                  {item.file_type === 'image' ? (
                    <img
                      src={item.file_path}
                      alt={item.title || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Media Counter */}
        {publicMedia.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {currentIndex + 1} / {publicMedia.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaSlideshow;