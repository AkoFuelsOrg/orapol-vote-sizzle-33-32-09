import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import PostCard from './PostCard';
import PollCard from './PollCard';
import { Post, Poll, PollOption } from '../lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PostSkeleton from './PostSkeleton';

interface GroupPostsProps {
  groupId: string;
}

const GroupPosts: React.FC<GroupPostsProps> = ({ groupId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  
  const defaultAvatarUrl = "/lovable-uploads/d731e3a9-5c0f-466c-8468-16c2465aca8a.png";
  
  useEffect(() => {
    if (groupId) {
      fetchGroupPosts();
      
      const handleGroupPostCreated = (event: CustomEvent) => {
        if (event.detail?.groupId === groupId) {
          console.log('Group post created event detected, refreshing content...');
          fetchGroupPosts();
        }
      };
      
      window.addEventListener('group-post-created', handleGroupPostCreated as EventListener);
      
      const postsChannel = supabase
        .channel('group_posts_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'posts',
            filter: `group_id=eq.${groupId}`
          }, 
          () => {
            fetchGroupPosts();
          }
        )
        .subscribe();
        
      const pollsChannel = supabase
        .channel('group_polls_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'polls',
            filter: `group_id=eq.${groupId}`
          }, 
          () => {
            fetchGroupPosts();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(postsChannel);
        supabase.removeChannel(pollsChannel);
        window.removeEventListener('group-post-created', handleGroupPostCreated as EventListener);
      };
    }
  }, [groupId]);
  
  const fetchGroupPosts = async () => {
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
        
      if (pollsError) throw pollsError;
      
      const formattedPosts = await Promise.all((postsData || []).map(async (post) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', post.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        const { count: likeCount, error: likeCountError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (likeCountError) throw likeCountError;
        
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
        
        return {
          id: post.id,
          content: post.content,
          createdAt: post.created_at,
          image: post.image,
          commentCount: post.comment_count || 0,
          likeCount: likeCount || 0,
          userLiked,
          author: {
            id: profileData?.id || 'unknown',
            name: profileData?.username || 'Anonymous',
            avatar: profileData?.avatar_url || defaultAvatarUrl,
          },
          groupId: post.group_id,
          marketplace_id: post.marketplace_id,
        };
      }));
      
      const formattedPolls = await Promise.all((pollsData || []).map(async (poll) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', poll.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        let userVoted = null;
        if (user) {
          const { data: voteData, error: voteError } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', poll.id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (voteError) throw voteError;
          
          if (voteData) {
            userVoted = voteData.option_id;
          }
        }
        
        const typedOptions: PollOption[] = Array.isArray(poll.options) 
          ? poll.options.map((option: any) => ({
              id: option.id || '',
              text: option.text || '',
              votes: option.votes || 0,
              imageUrl: option.imageUrl || null,
              poll_id: option.poll_id || poll.id
            }))
          : [];
        
        return {
          id: poll.id,
          question: poll.question,
          options: typedOptions,
          createdAt: poll.created_at,
          image: poll.image,
          commentCount: poll.comment_count || 0,
          totalVotes: poll.total_votes || 0,
          userVoted,
          author: {
            id: profileData?.id || 'unknown',
            name: profileData?.username || 'Anonymous',
            avatar: profileData?.avatar_url || defaultAvatarUrl,
          },
          groupId: poll.group_id,
        };
      }));
      
      setPosts(formattedPosts);
      setPolls(formattedPolls);
    } catch (error: any) {
      console.error('Error fetching group content:', error);
      toast.error('Failed to load group content');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePostDeleted = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  const combinedContent = [...posts, ...polls].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  if (combinedContent.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl p-8 shadow-sm">
        <h3 className="text-lg font-medium mb-2">No content yet</h3>
        <p className="text-muted-foreground">Be the first to post in this group!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {combinedContent.map((item) => (
        'question' in item ? (
          <PollCard key={item.id} poll={item} />
        ) : (
          <PostCard 
            key={item.id} 
            post={item} 
            onPostUpdate={fetchGroupPosts} 
            onPostDeleted={handlePostDeleted}
          />
        )
      ))}
    </div>
  );
};

export default GroupPosts;
