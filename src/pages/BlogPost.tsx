import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CelebrityStory {
  id: string;
  celebrity_name: string;
  celebrity_page_url: string;
  celebrity_image_path: string | null;
  caption: string | null;
  story_text: string;
  display_order: number;
}

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_path: string | null;
  meta_title: string | null;
  meta_description: string | null;
  author_name: string;
  published_at: string;
  read_time_minutes: number;
  tags: string[];
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [stories, setStories] = useState<CelebrityStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (postError) throw postError;
      setPost(postData);

      // Update meta tags
      document.title = postData.meta_title || postData.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && postData.meta_description) {
        metaDesc.setAttribute('content', postData.meta_description);
      }

      // Fetch celebrity stories
      const { data: storiesData, error: storiesError } = await supabase
        .from('blog_celebrity_stories')
        .select('*')
        .eq('blog_post_id', postData.id)
        .order('display_order');

      if (storiesError) throw storiesError;
      setStories(storiesData || []);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '/placeholder.svg';
    if (path.startsWith('http')) return path;
    return `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/blog-images/${path}`;
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader showNavigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-24 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader showNavigation />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Button onClick={() => navigate('/blog')}>Back to Blog</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader showNavigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/blog')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Button>

        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </span>
            </div>

            {post.featured_image_path && (
              <img 
                src={getImageUrl(post.featured_image_path)}
                alt={post.title}
                className="w-full h-auto rounded-lg mb-6"
              />
            )}
          </header>

          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Celebrity Stories */}
          {stories.map((story, index) => (
            <section key={story.id} className="mb-8 p-6 bg-muted/50 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">
                Meet {story.celebrity_name}
              </h2>
              
              {story.celebrity_image_path && (
                <a 
                  href={story.celebrity_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-4"
                >
                  <img 
                    src={getImageUrl(story.celebrity_image_path)}
                    alt={story.celebrity_name}
                    className="w-full max-w-md h-auto rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                  />
                  {story.caption && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {story.caption}
                    </p>
                  )}
                </a>
              )}
              
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: story.story_text }}
              />
              
              <a 
                href={story.celebrity_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-primary hover:underline"
              >
                View {story.celebrity_name}'s Profile →
              </a>
            </section>
          ))}

          {/* Share buttons */}
          <div className="flex items-center gap-4 pt-8 border-t">
            <span className="text-sm text-muted-foreground">Share this article:</span>
            <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
              <Facebook className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
