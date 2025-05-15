
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/use-mobile';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    if (!id) {
      setError("Post ID is required");
      setLoading(false);
      return;
    }
    
    const fetchPost = async () => {
      try {
        setLoading(true);
        
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (postError) throw postError;
        if (!postData) throw new Error("Post not found");
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', postData.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        const { count: likeCount, error: likeCountError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postData.id);
        
        if (likeCountError) throw likeCountError;
        
        const { data: user } = await supabase.auth.getUser();
        let userLiked = false;
        
        if (user.user) {
          const { data: userLike, error: userLikeError } = await supabase
            .from('post_likes')
            .select('*', { head: true })
            .eq('post_id', postData.id)
            .eq('user_id', user.user.id);
          
          if (userLikeError) throw userLikeError;
          
          userLiked = !!userLike;
        }
        
        const formattedPost: Post = {
          id: postData.id,
          content: postData.content,
          createdAt: postData.created_at,
          image: postData.image,
          commentCount: postData.comment_count || 0,
          likeCount: likeCount || 0,
          userLiked,
          author: {
            id: profileData?.id || 'unknown',
            name: profileData?.username || 'Anonymous',
            avatar: profileData?.avatar_url || '/lovable-uploads/d731e3a9-5c0f-466c-8468-16c2465aca8a.png',
          },
          groupId: postData.group_id,
          marketplace_id: postData.marketplace_id,
        };
        
        setPost(formattedPost);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message || "Failed to load post");
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  const handlePostUpdate = () => {
    // Refetch post after update
    if (id) {
      setLoading(true);
      toast.loading("Updating post...");
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };
  
  const handlePostDeleted = (postId: string) => {
    toast.success("Post deleted successfully");
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-destructive/10 p-6 rounded-lg mb-6">
          <h1 className="text-xl font-semibold text-destructive mb-2">Post Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The post you're looking for doesn't exist or has been removed."}
          </p>
          <Button 
            onClick={handleBack}
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      {!isDesktop && (
        <Button 
          onClick={handleBack}
          variant="ghost" 
          className="mb-4 flex items-center gap-1.5 -ml-2"
          size="sm"
        >
          <ArrowLeft size={18} /> Back
        </Button>
      )}
      <h1 className="sr-only">Post Detail</h1>
      <PostCard 
        post={post} 
        onPostUpdate={handlePostUpdate} 
        onPostDeleted={handlePostDeleted} 
      />
    </div>
  );
};

export default PostDetail;
