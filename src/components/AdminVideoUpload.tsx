import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Video, X } from 'lucide-react';

interface AdminVideoUploadProps {
  onUploadSuccess: () => void;
}

const AdminVideoUpload = ({ onUploadSuccess }: AdminVideoUploadProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a video file and enter a title.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `admin-videos/${fileName}`;

      // Upload video to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('admin-videos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('admin-videos')
        .getPublicUrl(filePath);

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('admin_videos')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          file_path: publicUrl,
          is_active: formData.isActive
        });

      if (dbError) throw dbError;

      toast({
        title: "Video Uploaded",
        description: "Video has been uploaded successfully.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        isActive: true
      });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('video-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      onUploadSuccess();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Admin Video</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-upload">Video File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFile}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Choose a video file</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, AVI up to 100MB</p>
                  </div>
                </div>
              )}
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <Label
                htmlFor="video-upload"
                className="cursor-pointer inline-block mt-2"
              >
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Browse Files</span>
                </Button>
              </Label>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter video title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter video description (optional)"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="is-active">Publish immediately</Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={uploading || !selectedFile || !formData.title.trim()}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminVideoUpload;