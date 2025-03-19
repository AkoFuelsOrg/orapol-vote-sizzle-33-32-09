
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import PostCard from './PostCard';
import { Post } from '../lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupPostsProps {
  groupId: string;
}

const GroupPosts: React.FC<GroupPostsProps> = ({ groupId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  
  useEffect(() => {
    if (groupId) {
      fetchGroupPosts();
    }
  }, [groupId]);
  
  const fetchGroupPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get like counts and user's like status
      const formattedPosts = await Promise.all((postsData || []).map(async (post) => {
        // Get like count
        const { count: likeCount, error: likeCountError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (likeCountError) throw likeCountError;
        
        // Check if current user has liked the post
        let userLiked = false;
        if (user) {
          const { data: userLike, error: userLikeError } = await supabase
            .from('post_likes')
            .select('*', { head: true })
            .eq('post_id', post.id)
            .eq('user_id', user.id);
          
          if (userLikeError) throw userLikeError;
          
          userLiked = !!userLike;
        }
        
        // Format the post object to match the PostCard expectations
        return {
          id: post.id,
          content: post.content,
          createdAt: post.created_at,
          image: post.image,
          commentCount: post.comment_count || 0,
          likeCount: likeCount || 0,
          userLiked,
          author: {
            id: post.profiles.id,
            name: post.profiles.username || 'Anonymous',
            avatar: post.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`,
          },
          groupId: post.group_id,
        };
      }));
      
      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error fetching group posts:', error);
      toast.error('Failed to load group posts');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground">Be the first to post in this group!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post}
          onPostUpdate={fetchGroupPosts}
        />
      ))}
    </div>
  );
};

export default GroupPosts;
