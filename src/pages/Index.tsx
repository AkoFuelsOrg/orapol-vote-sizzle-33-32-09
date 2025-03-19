import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import { useSupabase } from '../context/SupabaseContext';
import { Post } from '../lib/types';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import PollCard from '../components/PollCard';
import CreatePollModal from '../components/CreatePollModal';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [hasMorePolls, setHasMorePolls] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
  const { user } = useSupabase();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [ref, inView] = useInView();
  const [pollRef, pollInView] = useInView();
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const { data: postsData, error: postsError } = await (supabase
        .from('posts') as any)
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
        
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return;
      }
      
      let userLikedMap: Record<string, boolean> = {};
      
      if (user) {
        // Check which posts the user has liked
        const { data: likedData } = await (supabase
          .from('post_likes') as any)
          .select('post_id')
          .eq('user_id', user.id);
        
        if (likedData) {
          userLikedMap = likedData.reduce((acc: Record<string, boolean>, item: any) => {
            acc[item.post_id] = true;
            return acc;
          }, {});
        }
      }
      
      // Count likes for each post
      const { data: likeCounts } = await (supabase
        .from('post_likes') as any)
        .select('post_id, count')
        .eq('user_id', user?.id || '')
        .gt('count', 0)
        .group('post_id');
      
      const likeCountMap: Record<string, number> = {};
      if (likeCounts) {
        likeCounts.forEach((item: any) => {
          likeCountMap[item.post_id] = parseInt(item.count);
        });
      }
      
      // Format posts data
      const formattedPosts = (postsData || []).map((post: any) => ({
        id: post.id,
        content: post.content,
        author: {
          id: post.profiles.id,
          name: post.profiles.username || 'Anonymous',
          avatar: post.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.profiles.id}`
        },
        createdAt: post.created_at,
        image: post.image,
        commentCount: post.comment_count || 0,
        likeCount: likeCountMap[post.id] || 0,
        userLiked: !!userLikedMap[post.id]
      }));
      
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching polls:', error);
        return;
      }
      
      setPolls(
        data.map((poll) => ({
          id: poll.id,
          question: poll.question,
          options: poll.options,
          totalVotes: poll.total_votes,
          commentCount: poll.comment_count,
          createdAt: poll.created_at,
          author: {
            id: poll.profiles.id,
            name: poll.profiles.username || 'Anonymous',
            avatar: poll.profiles.avatar_url || `https://i.pravatar.cc/150?u=${poll.profiles.id}`
          },
          image: poll.image
        }))
      );
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  };
  
  useEffect(() => {
    fetchPosts();
    fetchPolls();
  }, [user]);
  
  const filteredItems = React.useMemo(() => {
    let items = [];
    
    if (filter === 'posts' || filter === 'all') {
      items.push(...posts);
    }
    
    if (filter === 'polls' || filter === 'all') {
      items.push(...polls);
    }
    
    // Sort by createdAt in descending order
    items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return items;
  }, [posts, polls, filter]);
  
  const renderItem = (item: any) => {
    if (item.question) {
      return <PollCard key={item.id} poll={item} />;
    } else if (item.content) {
      return <PostCard key={item.id} post={item} />;
    }
    return null;
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const fetchMorePosts = async () => {
    try {
      if (posts.length === 0) return;
      
      const lastPost = posts[posts.length - 1];
      
      // Fetch more posts
      const { data: morePosts, error: postsError } = await (supabase
        .from('posts') as any)
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          profiles:user_id (id, username, avatar_url)
        `)
        .lt('created_at', lastPost.createdAt)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (postsError) throw postsError;
      
      if (!morePosts || morePosts.length === 0) {
        setHasMore(false);
        return;
      }
      
      let userLikedMap: Record<string, boolean> = {};
      
      if (user) {
        // Check which posts the user has liked
        const { data: likedData } = await (supabase
          .from('post_likes') as any)
          .select('post_id')
          .eq('user_id', user.id);
        
        if (likedData) {
          userLikedMap = likedData.reduce((acc: Record<string, boolean>, item: any) => {
            acc[item.post_id] = true;
            return acc;
          }, {});
        }
      }
      
      // Format more posts
      const formattedMorePosts = morePosts.map((post: any) => ({
        id: post.id,
        content: post.content,
        author: {
          id: post.profiles.id,
          name: post.profiles.username || 'Anonymous',
          avatar: post.profiles.avatar_url || `https://i.pravatar.cc/150?u=${post.profiles.id}`
        },
        createdAt: post.created_at,
        image: post.image,
        commentCount: post.comment_count || 0,
        likeCount: 0, // We'll need a separate query to get this right
        userLiked: !!userLikedMap[post.id]
      }));
      
      setPosts(prev => [...prev, ...formattedMorePosts]);
    } catch (error) {
      console.error('Error fetching more posts:', error);
    }
  };
  
  const fetchMorePolls = async () => {
    try {
      if (polls.length === 0) return;
      
      const lastPoll = polls[polls.length - 1];
      
      const { data: morePolls, error } = await supabase
        .from('polls')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .lt('created_at', lastPoll.createdAt)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (!morePolls || morePolls.length === 0) {
        setHasMorePolls(false);
        return;
      }
      
      setPolls(prev => [
        ...prev,
        ...morePolls.map((poll) => ({
          id: poll.id,
          question: poll.question,
          options: poll.options,
          totalVotes: poll.total_votes,
          commentCount: poll.comment_count,
          createdAt: poll.created_at,
          author: {
            id: poll.profiles.id,
            name: poll.profiles.username || 'Anonymous',
            avatar: poll.profiles.avatar_url || `https://i.pravatar.cc/150?u=${poll.profiles.id}`
          },
          image: poll.image
        }))
      ]);
    } catch (error) {
      console.error('Error fetching more polls:', error);
    }
  };
  
  useEffect(() => {
    if (inView) {
      fetchMorePosts();
    }
  }, [inView]);
  
  useEffect(() => {
    if (pollInView) {
      fetchMorePolls();
    }
  }, [pollInView]);
  
  const handlePostCreated = useCallback(() => {
    setPosts([]);
    fetchPosts();
  }, []);
  
  const handlePollCreated = useCallback(() => {
    setPolls([]);
    fetchPolls();
  }, []);
  
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="container py-12">
        <div className="flex justify-between items-center mb-6">
          <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-md">
            <Input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="mr-2"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          <div className="space-x-2">
            <Button onClick={() => setIsCreatePostModalOpen(true)}>Create Post</Button>
            <Button onClick={() => setIsCreatePollModalOpen(true)}>Create Poll</Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="posts">Posts</SelectItem>
              <SelectItem value="polls">Polls</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No items found.</p>
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {filteredItems.map(item => (
                renderItem(item)
              ))}
            </Masonry>
            
            {hasMore && filter !== 'polls' && (
              <div ref={ref} className="py-6 text-center">
                {loading ? (
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                ) : inView ? (
                  <p className="text-sm text-gray-500">Loading more posts...</p>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            )}
            
            {hasMorePolls && filter !== 'posts' && (
              <div ref={pollRef} className="py-6 text-center">
                {loading ? (
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                ) : pollInView ? (
                  <p className="text-sm text-gray-500">Loading more polls...</p>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
      
      <CreatePostModal
        open={isCreatePostModalOpen}
        onOpenChange={setIsCreatePostModalOpen}
        onPostCreated={handlePostCreated}
      />
      
      <CreatePollModal
        open={isCreatePollModalOpen}
        onOpenChange={setIsCreatePollModalOpen}
        onPollCreated={handlePollCreated}
      />
    </div>
  );
};

export default Index;
