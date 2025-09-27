import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X } from 'lucide-react';

interface ProfilePictureUploadProps {
  profileId: string;
  currentImagePath?: string;
  onUpload: (imagePath: string) => void;
  initials?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({ 
  profileId, 
  currentImagePath, 
  onUpload,
  initials = "U"
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, or GIF).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max for profile pictures)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profileId}/profile-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('celebrity-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('celebrity-photos')
        .getPublicUrl(fileName);

      // Update profile with new picture path
      const { error: updateError } = await supabase
        .from('celebrity_profiles')
        .update({ profile_picture_path: publicUrl })
        .eq('id', profileId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });

      onUpload(publicUrl);
      clearSelection();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Reset file input
    const fileInput = document.getElementById('profile-picture-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const displayImage = previewUrl || currentImagePath;

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={displayImage} 
                alt="Profile picture" 
                className="object-cover"
              />
              <AvatarFallback className="text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-picture-upload"
              className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-2 cursor-pointer transition-colors"
            >
              <Camera className="h-4 w-4" />
            </label>
          </div>

          {/* File Input */}
          <input
            id="profile-picture-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />

          {/* Selected File Info */}
          {selectedFile && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg p-3">
                <span className="truncate">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Upload Instructions */}
          {!selectedFile && (
            <p className="text-xs text-muted-foreground text-center">
              Click the camera icon to upload a new profile picture
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePictureUpload;