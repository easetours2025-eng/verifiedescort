import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    isActive: true
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a video file.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 100MB.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one video file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress({});

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileId = `${file.name}-${i}`;
        
        try {
          // Update progress
          setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));

          // Generate unique file name - just the filename, no folder path since bucket handles it
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          // Update progress
          setUploadProgress(prev => ({ ...prev, [fileId]: 30 }));

          // Upload video to storage - use just fileName, not a nested path
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('admin-videos')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(uploadError.message || 'Failed to upload to storage');
          }

          // Update progress
          setUploadProgress(prev => ({ ...prev, [fileId]: 70 }));

          // Get the public URL for the uploaded video
          const { data: urlData } = supabase.storage
            .from('admin-videos')
            .getPublicUrl(fileName);

          // Get admin email from localStorage
          const adminSession = localStorage.getItem('admin_session');
          if (!adminSession) {
            throw new Error('Admin session not found. Please log in again.');
          }
          const adminData = JSON.parse(adminSession);
          const adminEmail = adminData.email;

          // Save video metadata via edge function
          console.log('Calling edge function with:', {
            action: 'upload',
            filePath: urlData.publicUrl,
            isActive: formData.isActive,
            adminEmail: adminEmail
          });

          const response = await supabase.functions.invoke('admin-video-operations', {
            body: {
              action: 'upload',
              filePath: urlData.publicUrl,
              isActive: formData.isActive,
              adminEmail: adminEmail
            }
          });

          console.log('Edge function response:', response);

          if (response.error) {
            console.error('Edge function error:', response.error);
            throw new Error(response.error.message || 'Failed to save video metadata');
          }

          if (!response.data?.success) {
            console.error('Edge function returned failure:', response.data);
            throw new Error(response.data?.message || 'Failed to save video metadata');
          }

          // Update progress to complete
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
          successCount++;

        } catch (error: any) {
          console.error('Upload error for file:', file.name, error);
          failCount++;
          setUploadProgress(prev => ({ ...prev, [fileId]: -1 })); // Mark as failed
        }
      }

      // Show results
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Videos Uploaded",
          description: `Successfully uploaded ${successCount} video${successCount > 1 ? 's' : ''}.`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Uploaded ${successCount} video${successCount > 1 ? 's' : ''}, failed ${failCount}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "Failed to upload any videos. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form if any uploads succeeded
      if (successCount > 0) {
        setFormData({ isActive: true });
        setSelectedFiles([]);
        setUploadProgress({});
        
        // Reset file input
        const fileInput = document.getElementById('video-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        onUploadSuccess();
      }

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadProgress({});
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
            <Label htmlFor="video-upload">Video Files</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              {selectedFiles.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">{selectedFiles.length} video{selectedFiles.length > 1 ? 's' : ''} selected</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeSelectedFiles}
                      className="h-6 px-2"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => {
                      const fileId = `${file.name}-${index}`;
                      const progress = uploadProgress[fileId];
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Video className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {progress !== undefined && (
                              <div className="flex items-center space-x-1">
                                {progress === -1 ? (
                                  <span className="text-xs text-red-500">Failed</span>
                                ) : progress === 100 ? (
                                  <span className="text-xs text-green-500">Done</span>
                                ) : progress > 0 ? (
                                  <span className="text-xs text-blue-500">{progress}%</span>
                                ) : null}
                              </div>
                            )}
                            
                            {!uploading && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Video className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Choose video files</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, AVI up to 100MB each</p>
                  </div>
                </div>
              )}
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                multiple
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
            disabled={uploading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Uploading {selectedFiles.length} video{selectedFiles.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Video${selectedFiles.length > 1 ? 's' : ''}` : 'Videos'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminVideoUpload;