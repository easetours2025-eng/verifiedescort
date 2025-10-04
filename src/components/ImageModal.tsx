import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const ImageModal = ({ imageUrl, isOpen, onClose, title }: ImageModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-6 w-6" />
        </Button>
        {title && (
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
            <p className="text-sm font-medium">{title}</p>
          </div>
        )}
        <img
          src={imageUrl}
          alt={title || 'Full size image'}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImageModal;
