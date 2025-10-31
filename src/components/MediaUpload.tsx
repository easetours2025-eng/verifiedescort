import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image as ImageIcon, Video, DollarSign, Lock, Globe, AlertCircle } from 'lucide-react';
import { canUploadMedia, getRemainingUploads, getTierFeatures } from '@/lib/subscription-features';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MediaUploadProps {
  celebrityId: string;
  onUpload: () => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ celebrityId, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionDuration, setSubscriptionDuration] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    price: 0,
    is_premium: false,
    is_public: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaCountAndSubscription();
  }, [celebrityId]);

  const fetchMediaCountAndSubscription = async () => {
    try {
      // Get media count
      const { count, error: countError } = await supabase
        .from('celebrity_media')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrityId);

      if (countError) throw countError;
      setMediaCount(count || 0);

      // Get subscription tier and duration
      const { data: subData, error: subError } = await supabase
        .from('celebrity_subscriptions')
        .select('subscription_tier, duration_type')
        .eq('celebrity_id', celebrityId)
        .eq('is_active', true)
        .maybeSingle();

      if (subError) throw subError;
      setSubscriptionTier(subData?.subscription_tier || null);
      setSubscriptionDuration(subData?.duration_type || null);
    } catch (error) {
      console.error('Error fetching media data:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image (JPG, PNG, GIF) or video (MP4, WebM, OGG) file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // Check upload limit based on subscription
    if (!canUploadMedia(mediaCount, subscriptionTier, subscriptionDuration)) {
      const features = getTierFeatures(subscriptionTier, subscriptionDuration);
      toast({
        title: "Upload limit reached",
        description: `Your current plan allows ${features.media_upload_limit} uploads. Please upgrade your subscription to upload more media.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Determine bucket based on file type
      const isVideo = selectedFile.type.startsWith('video/');
      const bucket = isVideo ? 'celebrity-videos' : 'celebrity-photos';
      
      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${celebrityId}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Save media record to database
      const { error: dbError } = await supabase
        .from('celebrity_media')
        .insert({
          celebrity_id: celebrityId,
          title: selectedFile.name,
          description: formData.description,
          file_path: publicUrl,
          file_type: isVideo ? 'video' : 'image',
          price: formData.price,
          is_premium: formData.is_premium,
          is_public: formData.is_public,
        });

      if (dbError) throw dbError;

      // Reset form
      setFormData({
        description: '',
        price: 0,
        is_premium: false,
        is_public: true,
      });
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: "Success",
        description: "Media uploaded successfully!",
      });

      fetchMediaCountAndSubscription(); // Refresh media count
      onUpload(); // Refresh media list
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Upload className="h-4 w-4" />
          <span>Upload New Media</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Limit Warning */}
        {(() => {
          const remaining = getRemainingUploads(mediaCount, subscriptionTier, subscriptionDuration);
          const features = getTierFeatures(subscriptionTier, subscriptionDuration);
          const canUpload = canUploadMedia(mediaCount, subscriptionTier, subscriptionDuration);

          return (
            <Alert className={`${!canUpload ? "border-destructive" : "border-primary"} py-2`}>
              <AlertCircle className="h-3 w-3" />
              <AlertTitle className="text-sm">
                {features.media_upload_limit === -1 
                  ? 'Unlimited Uploads' 
                  : `${mediaCount} / ${features.media_upload_limit} Uploads`}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {!canUpload ? (
                  'Upload limit reached. Upgrade to upload more.'
                ) : remaining === -1 ? (
                  `${mediaCount} files uploaded.`
                ) : (
                  `${remaining} upload${remaining !== 1 ? 's' : ''} remaining.`
                )}
              </AlertDescription>
            </Alert>
          );
        })()}

        <form onSubmit={handleUpload} className="space-y-3 mt-3">
          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-primary/20 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  {selectedFile ? (
                    <div className="flex items-center space-x-2">
                      {selectedFile.type.startsWith('video/') ? (
                        <Video className="h-6 w-6 text-primary" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-primary" />
                      )}
                      <span className="text-xs font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">
                        Click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images or Videos
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* Media Details - Hidden as requested */}
          <div className="hidden space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Price (KSH)</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="hidden space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your media..."
              rows={3}
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Privacy & Access</h4>
            
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="public"
                  name="visibility"
                  checked={formData.is_public}
                  onChange={() => setFormData({ ...formData, is_public: true })}
                  className="h-3 w-3"
                />
                <label htmlFor="public" className="flex items-center space-x-1.5">
                  <Globe className="h-3 w-3" />
                  <span>Public</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="private"
                  name="visibility"
                  checked={!formData.is_public}
                  onChange={() => setFormData({ ...formData, is_public: false })}
                  className="h-3 w-3"
                />
                <label htmlFor="private" className="flex items-center space-x-1.5">
                  <Lock className="h-3 w-3" />
                  <span>Private</span>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                className="h-3 w-3"
              />
              <label htmlFor="premium" className="text-xs">
                Premium content (requires payment)
              </label>
              {formData.is_premium && (
                <Badge variant="secondary" className="ml-1 text-xs py-0">
                  Premium
                </Badge>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full h-9"
            size="sm"
          >
            <Upload className="h-3 w-3 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Media'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MediaUpload;