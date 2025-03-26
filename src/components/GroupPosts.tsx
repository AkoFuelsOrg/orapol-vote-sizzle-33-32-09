import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import PostCard from './PostCard';
import PollCard from './PollCard';
import { Post, Poll, PollOption } from '../lib/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupPostsProps {
  groupId: string;
}

const GroupPosts: React.FC<GroupPostsProps> = ({ groupId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
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
      // Fetch posts for the group
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch polls for the group
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
        
      if (pollsError) throw pollsError;
      
      // Get like counts and user's like status for posts
      const formattedPosts = await Promise.all((postsData || []).map(async (post) => {
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', post.user_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
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
          video: post.video,
          commentCount: post.comment_count || 0,
          likeCount: likeCount || 0,
          userLiked,
          author: {
            id: profileData?.id || 'unknown',
            name: profileData?.username || 'Anonymous',
            avatar: profileData?.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`,
          },
          groupId: post.group_id,
        };
      }));
      
      // Process polls with Promise.all to resolve all promises before setting state
      const pollPromises = (pollsData || []).map(formatPoll);
      const formattedPolls = await Promise.all(pollPromises);
      
      setPosts(formattedPosts);
      setPolls(formattedPolls);
    } catch (error: any) {
      console.error('Error fetching group content:', error);
      toast.error('Failed to load group content');
    } finally {
      setLoading(false);
    }
  };

  const formatPoll = async (poll: any): Promise<Poll> => {
    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', poll.user_id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    // Check if current user has voted on this poll
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
    
    // Convert the raw options from the database to the PollOption type
    const typedOptions: PollOption[] = Array.isArray(poll.options) 
      ? poll.options.map((option: any) => ({
          id: option.id || '',
          text: option.text || '',
          votes: option.votes || 0,
          imageUrl: option.imageUrl || null,
          poll_id: option.poll_id || poll.id
        }))
      : [];
    
    // Format the poll object to match the PollCard expectations
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
        avatar: profileData?.avatar_url || `https://i.pravatar.cc/150?u=${poll.user_id}`,
      },
      groupId: poll.group_id,
    };
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Combine and sort posts and polls by creation date
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
          <PostCard key={item.id} post={item} onPostUpdate={fetchGroupPosts} />
        )
      ))}
    </div>
  );
};

export default GroupPosts;
