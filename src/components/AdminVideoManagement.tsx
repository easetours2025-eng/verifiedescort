import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, 
  Eye, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  Calendar,
  Clock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminVideo {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  thumbnail_path?: string;
  duration_seconds?: number;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface AdminVideoManagementProps {
  refreshTrigger: number;
}

const AdminVideoManagement = ({ refreshTrigger }: AdminVideoManagementProps) => {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVideo, setEditingVideo] = useState<AdminVideo | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, [refreshTrigger]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoStatus = async (videoId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_videos')
        .update({ is_active: isActive })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: isActive ? "Video Published" : "Video Unpublished",
        description: `Video has been ${isActive ? 'published' : 'unpublished'} successfully.`,
      });

      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update video status.",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string, filePath: string) => {
    try {
      // Delete from database first
      const { error: dbError } = await supabase
        .from('admin_videos')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      // Extract file path from URL for storage deletion
      const urlParts = filePath.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const storagePath = `admin-videos/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('admin-videos')
        .remove([storagePath]);

      if (storageError) {
        // Don't throw - database deletion was successful
      }

      toast({
        title: "Video Deleted",
        description: "Video has been permanently deleted.",
      });

      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const startEdit = (video: AdminVideo) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      description: video.description || '',
      is_active: video.is_active
    });
  };

  const saveEdit = async () => {
    if (!editingVideo || !editForm.title.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_videos')
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          is_active: editForm.is_active
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      toast({
        title: "Video Updated",
        description: "Video details have been updated successfully.",
      });

      setEditingVideo(null);
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update video.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Admin Videos ({videos.length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredVideos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No videos found matching your search.' : 'No videos uploaded yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <video
                    src={video.file_path}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={video.is_active ? "default" : "secondary"}>
                      {video.is_active ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{video.view_count} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(video.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={(checked) => toggleVideoStatus(video.id, checked)}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(video)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Video</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Title</label>
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="Enter video title"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <Textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Enter video description"
                                rows={3}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editForm.is_active}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                              />
                              <label className="text-sm font-medium">Published</label>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setEditingVideo(null)}>
                                Cancel
                              </Button>
                              <Button onClick={saveEdit} disabled={saving || !editForm.title.trim()}>
                                {saving ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Video</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{video.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteVideo(video.id, video.file_path)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminVideoManagement;