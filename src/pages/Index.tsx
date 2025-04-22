import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChatModal } from '@/components/AIChatModal';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import PostCard from '../components/PostCard';
import CreatePostInterface from '../components/CreatePostInterface';
import Header from '../components/Header';
import TopHeader from '../components/TopHeader';
import { Loader2, ChevronDown, Sparkles, MessageCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption, Post } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { useBreakpoint } from '../hooks/use-mobile';
import { Card } from '@/components/ui/card';

const Index: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);
  const [isAIChatOpen, setAIChatOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  
  useEffect(() => {
    fetchContent();
    
    const handlePostCreated = () => {
      console.log('Post created event detected, refreshing content...');
      fetchContent();
    };
    
    window.addEventListener('post-created', handlePostCreated);
    
    const pollsChannel = supabase
      .channel('public:polls')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'polls' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchPollWithDetails(payload.new.id);
          } else if (payload.eventType === 'DELETE') {
            setPolls(prevPolls => prevPolls.filter(poll => poll.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            fetchPollWithDetails(payload.new.id);
          }
        }
      )
      .subscribe();
    
    const postsChannel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            fetchPostWithDetails(payload.new.id);
          } else if (payload.eventType === 'DELETE') {
            setPosts(prevPosts => prevPosts.filter(post => post.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            fetchPostWithDetails(payload.new.id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(postsChannel);
      window.removeEventListener('post-created', handlePostCreated);
    };
  }, []);
  
  useEffect(() => {
    setAnimateItems(true);
  }, [polls, posts]);
  
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
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          user_id
        `)
        .eq('id', postId)
        .single();
      
      if (postError) throw postError;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', postData.user_id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
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
      
      const { data: likeCountData, error: likeCountError } = await supabase
        .from('post_likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId);
      
      if (likeCountError) throw likeCountError;
      
      const formattedPost: Post = {
        id: postData.id,
        content: postData.content,
        author: {
          id: profileData?.id || postData.user_id,
          name: profileData?.username || 'Anonymous',
          avatar: profileData?.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: postData.created_at,
        image: postData.image,
        commentCount: postData.comment_count || 0,
        likeCount: likeCountData.length,
        userLiked
      };
      
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
          profiles:user_id(id, username, avatar_url)
        `)
        .eq('id', pollId)
        .single();
      
      if (pollError) throw pollError;
      
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
          profiles:user_id(id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (pollsError) throw pollsError;
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (postsError) throw postsError;
      
      const profileIds = postsData ? postsData.map(post => post.user_id) : [];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', profileIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      const profilesMap = new Map();
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
      
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
      
      const formattedPosts: Post[] = postsData ? postsData.map(post => {
        const profile = profilesMap.get(post.user_id);
        
        return {
          id: post.id,
          content: post.content,
          author: {
            id: profile?.id || post.user_id,
            name: profile?.username || 'Anonymous',
            avatar: profile?.avatar_url || 'https://i.pravatar.cc/150'
          },
          createdAt: post.created_at,
          image: post.image,
          commentCount: post.comment_count || 0,
          likeCount: likeCountMap[post.id] || 0,
          userLiked: userLikes[post.id] || false
        };
      }) : [];
      
      setPolls(formattedPolls);
      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };
  
  const allContent = [...polls, ...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const loadMore = () => {
    setVisibleCount(prev => prev + 5);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 pb-20">
      <Header />
      <TopHeader />
      
      <main className={`${isDesktop ? 'pt-5' : 'pt-20'} px-4 max-w-3xl mx-auto`}>
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">Discover</h2>
                <Sparkles className="h-5 w-5 text-primary/70 animate-pulse-slow" />
              </div>
              <p className="text-muted-foreground text-base">Join the conversation and share your thoughts</p>
            </div>
            
            <Button 
              variant="outline" 
              className="hidden sm:flex bg-white hover:bg-primary/5 border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 group"
              onClick={() => setAIChatOpen(true)}
            >
              <Bot className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-medium">
                Tuwaye AI Gen 0
              </span>
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            className="sm:hidden w-full mt-4 bg-white hover:bg-primary/5 border border-primary/20"
            onClick={() => setAIChatOpen(true)}
          >
            <Bot className="w-5 h-5 mr-2 text-primary" />
            Tuwaye AI Gen 0
          </Button>
        </div>
        
        {!user && (
          <Card className="overflow-hidden border-none shadow-lg mb-8 animate-fade-in hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <div className="p-6 text-center relative">
              <div className="absolute inset-0 bg-primary/5 backdrop-blur-sm rounded-xl -z-10"></div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Join TUWAYE Today</h3>
              <p className="text-muted-foreground mb-5 max-w-md mx-auto">Connect with others, share your thoughts, and join the growing community</p>
              <div className="flex gap-4 justify-center">
                <Link 
                  to="/auth" 
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                >
                  <Users size={18} />
                  Sign Up
                </Link>
                <Link 
                  to="/vibezone" 
                  className="px-6 py-3 bg-white text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  Explore Vibezone
                </Link>
              </div>
            </div>
          </Card>
        )}
        
        <CreatePostInterface />
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        ) : allContent.length === 0 ? (
          <Card className="overflow-hidden border-none shadow-lg p-8 text-center bg-gradient-to-br from-white to-gray-50">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">No content yet</h3>
            <p className="text-muted-foreground mb-5">Be the first to share something with the community!</p>
            {user && (
              <Link 
                to="/create" 
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md font-medium"
              >
                Create Poll
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-5">
            {allContent.slice(0, visibleCount).map((item, index) => (
              <div 
                key={item.id} 
                className={`transition-all duration-500 transform ${
                  animateItems 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                } hover:shadow-md`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                {'question' in item ? (
                  <PollCard poll={item as Poll} />
                ) : (
                  <PostCard post={item as Post} />
                )}
              </div>
            ))}
            
            {visibleCount < allContent.length && (
              <div className="flex justify-center pt-4 pb-2">
                <button 
                  onClick={loadMore}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full transition-colors font-medium border border-gray-200 shadow-sm hover:shadow"
                >
                  Load More <ChevronDown size={18} className="text-primary" />
                </button>
              </div>
            )}
          </div>
        )}
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setAIChatOpen(false)} />
      </main>
      
      <footer className="py-8 mt-16 border-t bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-1.5 rounded-full bg-primary/10 shadow-inner">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-7 w-auto"
              />
            </div>
            <span className="font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">TUWAYE</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect, share and discover with Tuwaye
          </p>
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <span>•</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span>•</span>
            <a href="#" className="hover:text-primary transition-colors">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
