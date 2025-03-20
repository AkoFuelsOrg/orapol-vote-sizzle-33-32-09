
import React, { useEffect, useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { Post } from '../lib/types';
import PostCard from '../components/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const Favourites = () => {
  const { user } = useSupabase();
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [commentedPosts, setCommentedPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('liked');

  useEffect(() => {
    const fetchFavouritePosts = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch posts the user has liked
        const { data: likedData, error: likedError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);

        if (likedError) throw likedError;

        if (likedData && likedData.length > 0) {
          const likedPostIds = likedData.map(item => item.post_id);
          await fetchPostDetails(likedPostIds, 'liked');
        } else {
          setLikedPosts([]);
        }

        // Fetch posts the user has commented on
        const { data: commentedData, error: commentedError } = await supabase
          .from('post_comments')
          .select('post_id')
          .eq('user_id', user.id);

        if (commentedError) throw commentedError;

        if (commentedData && commentedData.length > 0) {
          const commentedPostIds = [...new Set(commentedData.map(item => item.post_id))];
          await fetchPostDetails(commentedPostIds, 'commented');
        } else {
          setCommentedPosts([]);
        }

        // Fetch posts the user has shared
        const { data: sharedData, error: sharedError } = await supabase
          .from('post_shares')
          .select('post_id')
          .eq('user_id', user.id);

        if (sharedError) throw sharedError;

        if (sharedData && sharedData.length > 0) {
          const sharedPostIds = sharedData.map(item => item.post_id);
          await fetchPostDetails(sharedPostIds, 'shared');
        } else {
          setSharedPosts([]);
        }

      } catch (error) {
        console.error('Error fetching favourite posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavouritePosts();
  }, [user]);

  const handlePostUpdate = () => {
    // Refetch the posts when a post is updated (liked, commented, shared, etc.)
    if (user) {
      if (activeTab === 'liked') {
        // Refetch liked posts
        const fetchLikedPosts = async () => {
          const { data: likedData } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', user.id);

          if (likedData && likedData.length > 0) {
            const likedPostIds = likedData.map(item => item.post_id);
            await fetchPostDetails(likedPostIds, 'liked');
          } else {
            setLikedPosts([]);
          }
        };
        fetchLikedPosts();
      } else if (activeTab === 'shared') {
        // Refetch shared posts
        const fetchSharedPosts = async () => {
          const { data: sharedData } = await supabase
            .from('post_shares')
            .select('post_id')
            .eq('user_id', user.id);

          if (sharedData && sharedData.length > 0) {
            const sharedPostIds = sharedData.map(item => item.post_id);
            await fetchPostDetails(sharedPostIds, 'shared');
          } else {
            setSharedPosts([]);
          }
        };
        fetchSharedPosts();
      }
    }
  };

  const fetchPostDetails = async (postIds: string[], type: 'liked' | 'commented' | 'shared') => {
    try {
      // Modified query to use direct fetch pattern instead of relying on foreign key relationships
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          likeCount: post_likes(count),
          commentCount: post_comments(count)
        `)
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch profile information separately to avoid relationship errors
        const postsWithLikedStatus = await Promise.all(
          data.map(async (post) => {
            // Check if the current user has liked this post
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            // Fetch the author's profile separately
            const { data: profileData } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', post.user_id)
              .maybeSingle();
            
            // Format the post object
            return {
              id: post.id,
              content: post.content,
              image: post.image,
              createdAt: post.created_at,
              author: {
                id: profileData?.id || post.user_id,
                name: profileData?.username || 'Unknown User',
                avatar: profileData?.avatar_url || `https://i.pravatar.cc/150?u=${post.user_id}`,
              },
              likeCount: post.likeCount[0]?.count || 0,
              commentCount: post.commentCount[0]?.count || 0,
              userLiked: !!likeData,
            };
          })
        );

        if (type === 'liked') {
          setLikedPosts(postsWithLikedStatus);
        } else if (type === 'commented') {
          setCommentedPosts(postsWithLikedStatus);
        } else if (type === 'shared') {
          setSharedPosts(postsWithLikedStatus);
        }
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please sign in to view your favourites</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-24 px-4 md:px-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Favourites</h1>
      
      <Tabs defaultValue="liked" onValueChange={(value) => setActiveTab(value as 'liked' | 'commented' | 'shared')}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="liked">Liked Posts</TabsTrigger>
          <TabsTrigger value="commented">Commented Posts</TabsTrigger>
          <TabsTrigger value="shared">Shared Posts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="liked">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : likedPosts.length > 0 ? (
            <div className="grid gap-6">
              {likedPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-20">
              <p className="text-muted-foreground">You haven't liked any posts yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="commented">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : commentedPosts.length > 0 ? (
            <div className="grid gap-6">
              {commentedPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-20">
              <p className="text-muted-foreground">You haven't commented on any posts yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shared">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedPosts.length > 0 ? (
            <div className="grid gap-6">
              {sharedPosts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-20">
              <p className="text-muted-foreground">You haven't shared any posts yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Favourites;
