import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoModalProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const VideoModal = ({ videoUrl, isOpen, onClose }: VideoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm border border-white/20"
        >
          <X className="h-5 w-5 mr-2" />
          Close
        </Button>
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg"
        />
      </div>
    </div>
  );
};

export default VideoModal;