import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Video, X, CheckCircle, AlertCircle } from 'lucide-react';

interface BulkMediaUploadProps {
  celebrityId: string;
  onUpload: () => void;
}

interface FileWithStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const BulkMediaUpload: React.FC<BulkMediaUploadProps> = ({ celebrityId, onUpload }) => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles: FileWithStatus[] = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    selectedFiles.forEach(file => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name}: Please select images (JPG, PNG, GIF) or videos (MP4, WebM, OGG)`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name}: Please select files smaller than 50MB`,
          variant: "destructive",
        });
        return;
      }

      validFiles.push({
        file,
        status: 'pending',
        progress: 0
      });
    });

    // Limit to 10 files total
    const currentCount = files.length;
    const newFilesCount = validFiles.length;
    
    if (currentCount + newFilesCount > 10) {
      toast({
        title: "Too many files",
        description: `You can only upload up to 10 files at once. Current: ${currentCount}, Trying to add: ${newFilesCount}`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleFile = async (fileWithStatus: FileWithStatus, index: number): Promise<void> => {
    const { file } = fileWithStatus;
  
    try {
      // Update status to uploading
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      // Determine bucket based on file type
      const isVideo = file.type.startsWith('video/');
      const bucket = isVideo ? 'celebrity-videos' : 'celebrity-photos';
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${celebrityId}/${Date.now()}-${index}.${fileExt}`;

      // Update progress
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 30 } : f
      ));

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update progress
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 70 } : f
      ));

      // Save media record to database
      const { error: dbError } = await supabase
        .from('celebrity_media')
        .insert({
          celebrity_id: celebrityId,
          title: file.name.split('.')[0], // Use filename without extension as title
          file_path: fileName, // Store relative path instead of full URL
          file_type: isVideo ? 'video' : 'image',
          price: 0,
          is_premium: false,
          is_public: true,
        });

      if (dbError) throw dbError;

      // Update status to success
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'success', progress: 100 } : f
      ));

    } catch (error: any) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          error: error.message || 'Upload failed' 
        } : f
      ));
    }
  };

  const handleBulkUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload files in parallel with a limit of 3 concurrent uploads
      const uploadPromises: Promise<void>[] = [];
      const concurrencyLimit = 3;
      
      for (let i = 0; i < files.length; i += concurrencyLimit) {
        const batch = files.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map((fileWithStatus, batchIndex) => 
          uploadSingleFile(fileWithStatus, i + batchIndex)
        );
        
        await Promise.all(batchPromises);
      }

      // Check results
      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast({
          title: "Upload completed",
          description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
        onUpload(); // Refresh media list
      }

      if (errorCount === files.length) {
        toast({
          title: "Upload failed",
          description: "All files failed to upload. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Upload error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
  };

  const retryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
    ));
  };

  const getStatusIcon = (status: FileWithStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Bulk Media Upload</span>
          <Badge variant="outline">{files.length}/10</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        <div className="space-y-2">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="bulk-file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Images (JPG, PNG, GIF) or Videos (MP4, WebM, OGG) • Up to 10 files • 50MB max each
                </p>
              </div>
              <input
                id="bulk-file-upload"
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Files ({files.length})</h4>
              <div className="flex items-center space-x-2">
                {files.some(f => f.status === 'error') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryFailed}
                    disabled={uploading}
                  >
                    Retry Failed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAll}
                  disabled={uploading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {files.map((fileWithStatus, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {fileWithStatus.file.type.startsWith('video/') ? (
                      <Video className="h-8 w-8 text-blue-600" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-green-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileWithStatus.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileWithStatus.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    
                    {fileWithStatus.status === 'uploading' && (
                      <div className="mt-1">
                        <Progress value={fileWithStatus.progress} className="h-1" />
                      </div>
                    )}
                    
                    {fileWithStatus.error && (
                      <p className="text-xs text-red-600 mt-1">{fileWithStatus.error}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileWithStatus.status)}
                    
                    {fileWithStatus.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {files.filter(f => f.status === 'success').length} uploaded, {' '}
              {files.filter(f => f.status === 'error').length} failed, {' '}
              {files.filter(f => f.status === 'pending').length} pending
            </div>
            
            <Button
              onClick={handleBulkUpload}
              disabled={uploading || files.every(f => f.status === 'success')}
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkMediaUpload;