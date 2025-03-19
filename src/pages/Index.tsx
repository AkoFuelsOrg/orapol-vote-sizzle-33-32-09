
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import PostCard from '../components/PostCard';
import CreatePostInterface from '../components/CreatePostInterface';
import Header from '../components/Header';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption, Post } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const Index: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);
  const { user } = useSupabase();
  
  useEffect(() => {
    fetchContent();
    
    // Set up realtime subscription for polls
    const pollsChannel = supabase
      .channel('public:polls')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls' },
        (payload) => {
          fetchPollWithDetails(payload.new.id);
        }
      )
      .subscribe();
    
    // Set up realtime subscription for posts
    const postsChannel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload: any) => {
          fetchPostWithDetails(payload.new.id);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(postsChannel);
    };
  }, []);
  
  useEffect(() => {
    // Trigger animations after a small delay for a staggered effect
    setAnimateItems(true);
  }, [polls, posts]);
  
  // Function to convert JSON options from Supabase to PollOption type
  const convertJsonToPollOptions = (jsonOptions: Json): PollOption[] => {
    if (typeof jsonOptions === 'string') {
      try {
        return JSON.parse(jsonOptions);
      } catch (error) {
        console.error('Error parsing JSON options:', error);
        return [];
      }
    }
    
    if (Array.isArray(jsonOptions)) {
      return jsonOptions.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          // Use type assertion with optional chaining to safely access properties
          const option = opt as Record<string, unknown>;
          return {
            id: String(option?.id || ''),
            text: String(option?.text || ''),
            votes: Number(option?.votes || 0),
            imageUrl: option?.imageUrl as string | undefined
          };
        }
        return { id: '', text: '', votes: 0 };
      });
    }
    
    return [];
  };

  const fetchPostWithDetails = async (postId: string) => {
    try {
      // Fetch the post with author information
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', postId)
        .single();
      
      if (postError) throw postError;
      
      // Check if the user has liked this post
      let userLiked = false;
      
      if (user) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        userLiked = !!likeData;
      }
      
      // Get like count
      const { data: likeCountData, error: likeCountError } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);
      
      if (likeCountError) throw likeCountError;
      
      // Format the post for our application
      const formattedPost: Post = {
        id: postData.id,
        content: postData.content,
        author: {
          id: postData.profiles.id,
          name: postData.profiles.username || 'Anonymous',
          avatar: postData.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: postData.created_at,
        image: postData.image,
        commentCount: postData.comment_count || 0,
        likeCount: likeCountData.length,
        userLiked
      };
      
      // Add to posts without duplicates
      setPosts(prevPosts => {
        const postExists = prevPosts.some(p => p.id === formattedPost.id);
        if (postExists) {
          return prevPosts.map(p => p.id === formattedPost.id ? formattedPost : p);
        } else {
          return [formattedPost, ...prevPosts];
        }
      });
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const fetchPollWithDetails = async (pollId: string) => {
    try {
      // Fetch the poll with author information
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', pollId)
        .single();
      
      if (pollError) throw pollError;
      
      // Check if the user has voted on this poll
      let userVoted = undefined;
      
      if (user) {
        const { data: voteData } = await supabase
          .from('poll_votes')
          .select('option_id')
          .eq('poll_id', pollId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (voteData) {
          userVoted = voteData.option_id;
        }
      }
      
      // Format the poll for our application
      const formattedPoll: Poll = {
        id: pollData.id,
        question: pollData.question,
        options: convertJsonToPollOptions(pollData.options),
        author: {
          id: pollData.profiles.id,
          name: pollData.profiles.username || 'Anonymous',
          avatar: pollData.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: pollData.created_at,
        totalVotes: pollData.total_votes || 0,
        commentCount: pollData.comment_count || 0,
        userVoted,
        image: pollData.image
      };
      
      // Add to polls without duplicates
      setPolls(prevPolls => {
        const pollExists = prevPolls.some(p => p.id === formattedPoll.id);
        if (pollExists) {
          return prevPolls.map(p => p.id === formattedPoll.id ? formattedPoll : p);
        } else {
          return [formattedPoll, ...prevPolls];
        }
      });
    } catch (error) {
      console.error('Error fetching poll details:', error);
    }
  };
  
  const fetchContent = async () => {
    try {
      setLoading(true);
      
      // Fetch polls with author information
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (pollsError) throw pollsError;
      
      // Fetch posts with author information
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          profiles:user_id (id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (postsError) throw postsError;
      
      // Fetch user votes if the user is logged in
      let userVotes: Record<string, string> = {};
      
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('poll_id, option_id')
          .eq('user_id', user.id);
        
        if (!votesError && votesData) {
          userVotes = votesData.reduce((acc, vote) => {
            acc[vote.poll_id] = vote.option_id;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Fetch user likes if the user is logged in
      let userLikes: Record<string, boolean> = {};
      
      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        if (!likesError && likesData) {
          userLikes = likesData.reduce((acc, like) => {
            acc[like.post_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }
      
      // Get like counts for all posts
      const { data: likeCounts, error: likeCountsError } = await supabase
        .from('post_likes')
        .select('post_id');
      
      if (likeCountsError) throw likeCountsError;
      
      const likeCountMap: Record<string, number> = {};
      if (likeCounts) {
        likeCounts.forEach(like => {
          likeCountMap[like.post_id] = (likeCountMap[like.post_id] || 0) + 1;
        });
      }
      
      // Format polls for our application
      const formattedPolls: Poll[] = pollsData ? pollsData.map(poll => ({
        id: poll.id,
        question: poll.question,
        options: convertJsonToPollOptions(poll.options),
        author: {
          id: poll.profiles.id,
          name: poll.profiles.username || 'Anonymous',
          avatar: poll.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: poll.created_at,
        totalVotes: poll.total_votes || 0,
        commentCount: poll.comment_count || 0,
        userVoted: userVotes[poll.id],
        image: poll.image
      })) : [];
      
      // Format posts for our application
      const formattedPosts: Post[] = postsData ? postsData.map(post => ({
        id: post.id,
        content: post.content,
        author: {
          id: post.profiles.id,
          name: post.profiles.username || 'Anonymous',
          avatar: post.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: post.created_at,
        image: post.image,
        commentCount: post.comment_count || 0,
        likeCount: likeCountMap[post.id] || 0,
        userLiked: userLikes[post.id] || false
      })) : [];
      
      // Combine and sort by creation date
      setPolls(formattedPolls);
      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };
  
  // Combine and sort all content items by creation date
  const allContent = [...polls, ...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-20 px-4 max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Discover</h2>
          <p className="text-muted-foreground">See what people are sharing</p>
        </div>
        
        {!user && (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 text-center animate-fade-in">
            <h3 className="text-lg font-medium mb-2">Join TUWAYE Today</h3>
            <p className="text-muted-foreground mb-4">Sign up to create your own posts and polls</p>
            <Link 
              to="/auth" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up / Login
            </Link>
          </div>
        )}
        
        <CreatePostInterface />
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : allContent.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to share something!</p>
            {user && (
              <Link 
                to="/create" 
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Poll
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allContent.map((item, index) => (
              <div 
                key={'id' in item ? item.id : index} 
                className={`transition-opacity duration-500 ${
                  animateItems 
                    ? 'opacity-100' 
                    : 'opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {'question' in item ? (
                  <PollCard poll={item as Poll} />
                ) : (
                  <PostCard post={item as Post} />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
