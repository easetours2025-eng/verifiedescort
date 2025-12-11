import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Wand2, Loader2, Upload, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image_path: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CelebrityStory {
  id?: string;
  celebrity_name: string;
  celebrity_page_url: string;
  celebrity_image_path: string | null;
  image_source: string | null;
  image_credit: string | null;
  caption: string | null;
  story_text: string;
  display_order: number;
}

interface TopicSuggestion {
  title: string;
  tags: string[];
  metaDescription: string;
}

const AdminBlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredImagePath, setFeaturedImagePath] = useState("");
  
  // Celebrity stories state
  const [celebrity1, setCelebrity1] = useState<CelebrityStory>({
    celebrity_name: "",
    celebrity_page_url: "",
    celebrity_image_path: null,
    image_source: null,
    image_credit: null,
    caption: "",
    story_text: "",
    display_order: 1
  });
  const [celebrity2, setCelebrity2] = useState<CelebrityStory>({
    celebrity_name: "",
    celebrity_page_url: "",
    celebrity_image_path: null,
    image_source: null,
    image_credit: null,
    caption: "",
    story_text: "",
    display_order: 2
  });
  const [celebrity1Image, setCelebrity1Image] = useState<File | null>(null);
  const [celebrity2Image, setCelebrity2Image] = useState<File | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingPost) {
      setSlug(generateSlug(value));
    }
  };

  const generateTopics = async () => {
    setGenerating('topics');
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: { type: 'topics' }
      });

      if (error) throw error;
      
      if (data.success && Array.isArray(data.data)) {
        setTopicSuggestions(data.data);
        toast.success('Generated topic suggestions!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating topics:', error);
      toast.error('Failed to generate topics');
    } finally {
      setGenerating(null);
    }
  };

  const selectTopic = (topic: TopicSuggestion) => {
    setTitle(topic.title);
    setSlug(generateSlug(topic.title));
    setTags(topic.tags.join(', '));
    setMetaDescription(topic.metaDescription);
    setTopicSuggestions([]);
    toast.success('Topic selected!');
  };

  const generateContent = async () => {
    if (!celebrity1.celebrity_name && !celebrity2.celebrity_name) {
      toast.error('Please enter at least one celebrity name');
      return;
    }

    setGenerating('content');
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          type: 'content',
          existingTitle: title,
          celebrity1: { name: celebrity1.celebrity_name },
          celebrity2: { name: celebrity2.celebrity_name }
        }
      });

      if (error) throw error;
      
      if (data.success && data.data) {
        const generated = data.data;
        if (generated.title) setTitle(generated.title);
        if (generated.excerpt) setExcerpt(generated.excerpt);
        if (generated.content) setContent(generated.content);
        if (generated.metaTitle) setMetaTitle(generated.metaTitle);
        if (generated.metaDescription) setMetaDescription(generated.metaDescription);
        if (generated.tags) setTags(generated.tags.join(', '));
        
        if (generated.celebrity1) {
          setCelebrity1(prev => ({
            ...prev,
            caption: generated.celebrity1.caption || prev.caption,
            story_text: generated.celebrity1.storyText || prev.story_text
          }));
        }
        if (generated.celebrity2) {
          setCelebrity2(prev => ({
            ...prev,
            caption: generated.celebrity2.caption || prev.caption,
            story_text: generated.celebrity2.storyText || prev.story_text
          }));
        }
        
        toast.success('Content generated!');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(null);
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (error) throw error;
    return fileName;
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setMetaTitle("");
    setMetaDescription("");
    setTags("");
    setIsPublished(false);
    setFeaturedImage(null);
    setFeaturedImagePath("");
    setCelebrity1({
      celebrity_name: "",
      celebrity_page_url: "",
      celebrity_image_path: null,
      image_source: null,
      image_credit: null,
      caption: "",
      story_text: "",
      display_order: 1
    });
    setCelebrity2({
      celebrity_name: "",
      celebrity_page_url: "",
      celebrity_image_path: null,
      image_source: null,
      image_credit: null,
      caption: "",
      story_text: "",
      display_order: 2
    });
    setCelebrity1Image(null);
    setCelebrity2Image(null);
    setEditingPost(null);
  };

  const openEditor = async (post?: BlogPost) => {
    resetForm();
    
    if (post) {
      setEditingPost(post);
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setMetaTitle(post.meta_title || "");
      setMetaDescription(post.meta_description || "");
      setTags(post.tags?.join(', ') || "");
      setIsPublished(post.is_published);
      setFeaturedImagePath(post.featured_image_path || "");

      // Fetch celebrity stories
      const { data: stories } = await supabase
        .from('blog_celebrity_stories')
        .select('*')
        .eq('blog_post_id', post.id)
        .order('display_order');

      if (stories && stories.length > 0) {
        setCelebrity1(stories[0]);
        if (stories.length > 1) {
          setCelebrity2(stories[1]);
        }
      }
    }
    
    setIsEditorOpen(true);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!slug.trim()) {
      toast.error('Slug is required');
      return false;
    }
    if (!celebrity1.celebrity_name.trim() || !celebrity1.story_text.trim()) {
      toast.error('At least one celebrity story is required');
      return false;
    }
    if (!celebrity1.celebrity_page_url.trim()) {
      toast.error('Celebrity 1 page URL is required');
      return false;
    }
    // Validate URL format
    const urlPattern = /^(https?:\/\/|\/)/;
    if (!urlPattern.test(celebrity1.celebrity_page_url)) {
      toast.error('Celebrity 1 URL must start with http://, https://, or /');
      return false;
    }
    if (celebrity2.celebrity_name.trim() && !urlPattern.test(celebrity2.celebrity_page_url)) {
      toast.error('Celebrity 2 URL must start with http://, https://, or /');
      return false;
    }
    return true;
  };

  const savePost = async () => {
    if (!validateForm()) return;

    setGenerating('saving');
    try {
      // Upload images if new ones selected
      let finalFeaturedPath = featuredImagePath;
      if (featuredImage) {
        finalFeaturedPath = await uploadImage(featuredImage, 'featured');
      }

      let celebrity1ImagePath = celebrity1.celebrity_image_path;
      if (celebrity1Image) {
        celebrity1ImagePath = await uploadImage(celebrity1Image, 'celebrities');
      }

      let celebrity2ImagePath = celebrity2.celebrity_image_path;
      if (celebrity2Image) {
        celebrity2ImagePath = await uploadImage(celebrity2Image, 'celebrities');
      }

      const postData = {
        title,
        slug,
        excerpt,
        content,
        meta_title: metaTitle,
        meta_description: metaDescription,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        featured_image_path: finalFeaturedPath || null
      };

      let postId: string;

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        postId = editingPost.id;

        // Delete existing stories
        await supabase
          .from('blog_celebrity_stories')
          .delete()
          .eq('blog_post_id', postId);
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select()
          .single();

        if (error) throw error;
        postId = data.id;
      }

      // Insert celebrity stories
      const stories = [];
      if (celebrity1.celebrity_name.trim()) {
        stories.push({
          blog_post_id: postId,
          celebrity_name: celebrity1.celebrity_name,
          celebrity_page_url: celebrity1.celebrity_page_url,
          celebrity_image_path: celebrity1ImagePath,
          image_source: celebrity1.image_source,
          image_credit: celebrity1.image_credit,
          caption: celebrity1.caption,
          story_text: celebrity1.story_text,
          display_order: 1
        });
      }
      if (celebrity2.celebrity_name.trim()) {
        stories.push({
          blog_post_id: postId,
          celebrity_name: celebrity2.celebrity_name,
          celebrity_page_url: celebrity2.celebrity_page_url,
          celebrity_image_path: celebrity2ImagePath,
          image_source: celebrity2.image_source,
          image_credit: celebrity2.image_credit,
          caption: celebrity2.caption,
          story_text: celebrity2.story_text,
          display_order: 2
        });
      }

      if (stories.length > 0) {
        const { error: storiesError } = await supabase
          .from('blog_celebrity_stories')
          .insert(stories);

        if (storiesError) throw storiesError;
      }

      toast.success(editingPost ? 'Post updated!' : 'Post created!');
      setIsEditorOpen(false);
      resetForm();
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error.message || 'Failed to save post');
    } finally {
      setGenerating(null);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          is_published: !post.is_published,
          published_at: !post.is_published ? new Date().toISOString() : null
        })
        .eq('id', post.id);

      if (error) throw error;
      toast.success(post.is_published ? 'Post unpublished' : 'Post published');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast.error('Failed to update post');
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/blog-images/${path}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blog Management</h2>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      {/* Posts list */}
      <div className="grid gap-4">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No blog posts yet. Create your first post!
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {post.featured_image_path && (
                  <img 
                    src={getImageUrl(post.featured_image_path)!} 
                    alt={post.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(post.created_at), 'MMM d, yyyy')}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={post.is_published ? "default" : "secondary"}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {post.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(post)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditor(post)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Blog Post' : 'New Blog Post'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="celebrity1">Celebrity 1</TabsTrigger>
              <TabsTrigger value="celebrity2">Celebrity 2</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* AI Topic Generation */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateTopics} disabled={generating === 'topics'}>
                  {generating === 'topics' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate Topic Ideas
                </Button>
              </div>

              {topicSuggestions.length > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Suggested Topics:</p>
                  {topicSuggestions.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => selectTopic(topic)}
                      className="block w-full text-left p-2 rounded hover:bg-background"
                    >
                      <span className="font-medium">{topic.title}</span>
                      <span className="text-xs text-muted-foreground block">{topic.tags.join(', ')}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Blog post title" />
              </div>

              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-friendly-slug" />
              </div>

              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief description for listings" rows={2} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Content</Label>
                  <Button variant="outline" size="sm" onClick={generateContent} disabled={generating === 'content'}>
                    {generating === 'content' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    AI Generate Content
                  </Button>
                </div>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Full blog content (HTML supported)" rows={10} />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)} />
                {featuredImagePath && (
                  <img src={getImageUrl(featuredImagePath)!} alt="Featured" className="w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dating, kenya, love" />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                <Label>Publish immediately</Label>
              </div>
            </TabsContent>

            <TabsContent value="celebrity1" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Celebrity Name *</Label>
                <Input 
                  value={celebrity1.celebrity_name} 
                  onChange={(e) => setCelebrity1({ ...celebrity1, celebrity_name: e.target.value })} 
                  placeholder="Celebrity name" 
                />
              </div>

              <div className="space-y-2">
                <Label>Celebrity Page URL * (backlink)</Label>
                <Input 
                  value={celebrity1.celebrity_page_url} 
                  onChange={(e) => setCelebrity1({ ...celebrity1, celebrity_page_url: e.target.value })} 
                  placeholder="https://... or /celebrity/..." 
                />
              </div>

              <div className="space-y-2">
                <Label>Celebrity Image *</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCelebrity1Image(e.target.files?.[0] || null)} />
                {celebrity1.celebrity_image_path && (
                  <img src={getImageUrl(celebrity1.celebrity_image_path)!} alt="Celebrity 1" className="w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Image Credit/Source</Label>
                <Input 
                  value={celebrity1.image_credit || ''} 
                  onChange={(e) => setCelebrity1({ ...celebrity1, image_credit: e.target.value })} 
                  placeholder="Photo credit" 
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Input 
                  value={celebrity1.caption || ''} 
                  onChange={(e) => setCelebrity1({ ...celebrity1, caption: e.target.value })} 
                  placeholder="Image caption" 
                />
              </div>

              <div className="space-y-2">
                <Label>Story Text *</Label>
                <Textarea 
                  value={celebrity1.story_text} 
                  onChange={(e) => setCelebrity1({ ...celebrity1, story_text: e.target.value })} 
                  placeholder="Story about this celebrity (HTML supported)"
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="celebrity2" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Celebrity Name</Label>
                <Input 
                  value={celebrity2.celebrity_name} 
                  onChange={(e) => setCelebrity2({ ...celebrity2, celebrity_name: e.target.value })} 
                  placeholder="Celebrity name" 
                />
              </div>

              <div className="space-y-2">
                <Label>Celebrity Page URL (backlink)</Label>
                <Input 
                  value={celebrity2.celebrity_page_url} 
                  onChange={(e) => setCelebrity2({ ...celebrity2, celebrity_page_url: e.target.value })} 
                  placeholder="https://... or /celebrity/..." 
                />
              </div>

              <div className="space-y-2">
                <Label>Celebrity Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCelebrity2Image(e.target.files?.[0] || null)} />
                {celebrity2.celebrity_image_path && (
                  <img src={getImageUrl(celebrity2.celebrity_image_path)!} alt="Celebrity 2" className="w-32 h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Image Credit/Source</Label>
                <Input 
                  value={celebrity2.image_credit || ''} 
                  onChange={(e) => setCelebrity2({ ...celebrity2, image_credit: e.target.value })} 
                  placeholder="Photo credit" 
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Input 
                  value={celebrity2.caption || ''} 
                  onChange={(e) => setCelebrity2({ ...celebrity2, caption: e.target.value })} 
                  placeholder="Image caption" 
                />
              </div>

              <div className="space-y-2">
                <Label>Story Text</Label>
                <Textarea 
                  value={celebrity2.story_text} 
                  onChange={(e) => setCelebrity2({ ...celebrity2, story_text: e.target.value })} 
                  placeholder="Story about this celebrity (HTML supported)"
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Meta Title (max 60 chars)</Label>
                <Input 
                  value={metaTitle} 
                  onChange={(e) => setMetaTitle(e.target.value)} 
                  placeholder="SEO title"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{metaTitle.length}/60</p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description (max 160 chars)</Label>
                <Textarea 
                  value={metaDescription} 
                  onChange={(e) => setMetaDescription(e.target.value)} 
                  placeholder="SEO description"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{metaDescription.length}/160</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
            <Button onClick={savePost} disabled={generating === 'saving'}>
              {generating === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingPost ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManagement;
