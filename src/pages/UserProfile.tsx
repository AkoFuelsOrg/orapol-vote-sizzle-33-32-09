import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import Header from '../components/Header';
import PollCard from '../components/PollCard';
import PostCard from '../components/PostCard';
import UserList from '../components/UserList';
import { useSupabase } from '../context/SupabaseContext';
import { ArrowLeft, Loader2, UserPlus, UserCheck, MessageSquare, Users, LayoutGrid } from 'lucide-react';
import { Poll, PollOption, Post } from '../lib/types';
import { Json } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import UserAvatar from '../components/UserAvatar';
import { useBreakpoint } from '../hooks/use-mobile';
import { toast } from "sonner";

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile, followUser, unfollowUser, isFollowing } = useSupabase();
  const [profile, setProfile] = useState<any | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [userIsFollowing, setUserIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
  useEffect(() => {
    if (id) {
      fetchUserProfile(id);
      fetchUserContent(id);
      fetchFollowCounts();
      
      if (user) {
        checkFollowStatus();
        checkCanMessage();
      }
    }
    
    const handleProfileUpdated = () => {
      if (id) {
        fetchUserProfile(id);
      }
    };
    
    window.addEventListener('profile-updated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdated);
    };
  }, [id, user]);

  useEffect(() => {
    if (currentUserProfile && id === currentUserProfile.id) {
      setProfile(currentUserProfile);
    }
  }, [currentUserProfile, id]);

  useEffect(() => {
    if (activeTab === "followers" || activeTab === "following") {
      fetchFollowCounts();
    }
  }, [activeTab]);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  const fetchUserContent = async (userId: string) => {
    try {
      setIsLoadingContent(true);
      
      await fetchUserPolls(userId);
      
      await fetchUserPosts(userId);
    } catch (error: any) {
      console.error('Error fetching user content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };
  
  const fetchUserPolls = async (userId: string) => {
    try {
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (pollsError) throw pollsError;
      
      let formattedPolls: Poll[] = [];
      
      if (pollsData && pollsData.length > 0) {
        const userVotes = user ? await fetchUserVotes(user.id) : {};
        
        formattedPolls = pollsData.map(poll => {
          const options = convertJsonToPollOptions(poll.options);
          return {
            id: poll.id,
            question: poll.question,
            options,
            author: {
              id: poll.profiles.id,
              name: poll.profiles.username || 'Anonymous',
              avatar: poll.profiles.avatar_url || `https://i.pravatar.cc/150?u=${poll.profiles.id}`
            },
            createdAt: poll.created_at,
            totalVotes: poll.total_votes || 0,
            commentCount: poll.comment_count || 0,
            userVoted: userVotes[poll.id],
            image: poll.image
          };
        });
      }
      
      setPolls(formattedPolls);
    } catch (error: any) {
      console.error('Error fetching user polls:', error);
    }
  };
  
  const fetchUserPosts = async (userId: string) => {
    try {
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      const { data: likeCounts, error: likeCountsError } = await supabase
        .from('post_likes')
        .select('post_id');
        
      if (likeCountsError) {
        console.error('Error fetching like counts:', likeCountsError);
      }
      
      const likeCountMap: Record<string, number> = {};
      if (likeCounts) {
        likeCounts.forEach(like => {
          likeCountMap[like.post_id] = (likeCountMap[like.post_id] || 0) + 1;
        });
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
      
      const formattedPosts: Post[] = postsData ? postsData.map(post => {
        return {
          id: post.id,
          content: post.content,
          author: {
            id: profileData?.id || userId,
            name: profileData?.username || 'Anonymous',
            avatar: profileData?.avatar_url || `https://i.pravatar.cc/150?u=${userId}`
          },
          createdAt: post.created_at,
          image: post.image,
          commentCount: post.comment_count || 0,
          likeCount: likeCountMap[post.id] || 0,
          userLiked: userLikes[post.id] || false
        };
      }) : [];
      
      setPosts(formattedPosts);
    } catch (error: any) {
      console.error('Error fetching user posts:', error);
    }
  };
  
  const fetchUserVotes = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('poll_votes')
        .select('poll_id, option_id')
        .eq('user_id', userId);
        
      const votes: Record<string, string> = {};
      
      if (data) {
        data.forEach(vote => {
          votes[vote.poll_id] = vote.option_id;
        });
      }
      
      return votes;
    } catch (error) {
      console.error('Error fetching user votes:', error);
      return {};
    }
  };
  
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
  
  const checkFollowStatus = async () => {
    if (user && id) {
      const following = await isFollowing(id);
      setUserIsFollowing(following);
    }
  };
  
  const fetchFollowCounts = async () => {
    if (id) {
      try {
        console.log("Fetching follow counts for user ID:", id);
        
        const { count: followersCount, error: followersError } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', id);
        
        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', id);
        
        if (followersError) throw followersError;
        if (followingError) throw followingError;
        
        console.log("Follow counts:", { followers: followersCount || 0, following: followingCount || 0 });
        
        setFollowCounts({
          followers: followersCount || 0,
          following: followingCount || 0
        });
      } catch (error) {
        console.error('Error fetching follow counts:', error);
        setFollowCounts({ followers: 0, following: 0 });
      }
    }
  };
  
  const checkCanMessage = async () => {
    if (user && id) {
      try {
        const { data, error } = await supabase
          .rpc('can_message', { user_id_1: user.id, user_id_2: id });
          
        if (error) throw error;
        setCanSendMessage(!!data);
      } catch (error) {
        console.error('Error checking messaging permission:', error);
        setCanSendMessage(false);
      }
    }
  };
  
  const handleFollowAction = async () => {
    if (!user || !id) return;
    
    setActionLoading(true);
    try {
      if (userIsFollowing) {
        await unfollowUser(id);
        toast.success("Unfollowed successfully");
      } else {
        await followUser(id);
        toast.success("Followed successfully");
      }
      await checkFollowStatus();
      await fetchFollowCounts();
      await checkCanMessage();
    } catch (error) {
      console.error("Follow action error:", error);
      toast.error("Failed to update follow status");
    } finally {
      setActionLoading(false);
    }
  };
  
  const allContent = [...polls, ...posts].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16 px-2 max-w-full w-full mx-auto flex justify-center">
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-muted-foreground">Loading profile...</span>
          </div>
        </main>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16 px-3 sm:px-4 max-w-full w-full mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 text-center mt-4">
            <h2 className="text-xl font-semibold mb-3">User Not Found</h2>
            <p className="mb-4 text-muted-foreground">We couldn't find the user you're looking for.</p>
            <Link 
              to="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-10 w-full mx-auto pb-20">
        <div className="mb-1 animate-fade-in px-4">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors py-2">
            <ArrowLeft size={18} className="mr-1.5" />
            <span>Back</span>
          </Link>
        </div>
        
        <div className="w-full h-32 sm:h-48 md:h-64 bg-gray-200 relative animate-fade-in overflow-hidden">
          {profile.cover_url ? (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100"></div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-4 sm:p-5 mb-4 animate-fade-in relative mt-[-3rem] mx-3 sm:mx-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden bg-white mt-[-4rem] shadow-sm">
              <UserAvatar 
                user={profile}
                size="xl"
                className="w-full h-full"
              />
            </div>
            
            <div className="mt-3 sm:mt-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold">{profile.username || 'Anonymous'}</h2>
              {user && user.id === profile.id && (
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mt-1">
                  Active User
                </div>
              )}
            </div>
            
            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 w-full max-w-md">
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1 shadow-sm border border-border/10">
                <p className="text-lg sm:text-2xl font-bold">{posts.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1 shadow-sm border border-border/10">
                <p className="text-lg sm:text-2xl font-bold">{followCounts.followers}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1 shadow-sm border border-border/10">
                <p className="text-lg sm:text-2xl font-bold">{followCounts.following}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
              </div>
            </div>
            
            {user && user.id !== profile.id && (
              <div className="mt-4 flex space-x-3 w-full max-w-xs">
                <Button
                  onClick={handleFollowAction}
                  disabled={actionLoading}
                  variant={userIsFollowing ? "secondary" : "default"}
                  className="flex-1 h-9"
                  size={isMobile ? "sm" : "default"}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : userIsFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      <span>Follow</span>
                    </>
                  )}
                </Button>
                
                {canSendMessage && (
                  <Button
                    asChild
                    variant="secondary"
                    className="flex-1 h-9"
                    size={isMobile ? "sm" : "default"}
                  >
                    <Link to={`/messages/${id}`}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>{isMobile ? "Message" : "Send Message"}</span>
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-3 sm:px-4">
          <Tabs 
            defaultValue="content" 
            className="w-full animate-fade-in"
            onValueChange={(value) => {
              setActiveTab(value);
            }}
          >
            <div className="overflow-x-auto scrollbar-hide pb-1">
              <TabsList className="w-full flex mb-3 rounded-lg border border-border/30 bg-white p-1">
                <TabsTrigger 
                  value="content" 
                  className="flex-1 text-xs sm:text-sm py-2 font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center"
                >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="followers" 
                  className="flex-1 text-xs sm:text-sm py-2 font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center"
                >
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>Followers</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="flex-1 text-xs sm:text-sm py-2 font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  <span>Following</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="content" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {isLoadingContent ? (
                <div className="flex justify-center p-8">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Loading content...</span>
                  </div>
                </div>
              ) : allContent.length > 0 ? (
                <div className="space-y-3 animate-fade-in">
                  {allContent.map(item => (
                    <div key={item.id}>
                      {'question' in item ? (
                        <PollCard poll={item as Poll} />
                      ) : (
                        <PostCard post={item as Post} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-white rounded-lg shadow-sm border border-border/30 mt-2 animate-fade-in">
                  <div className="flex flex-col items-center">
                    <LayoutGrid className="h-12 w-12 mb-3 opacity-20" />
                    <p className="font-medium mb-1">No Content Yet</p>
                    <p className="text-sm px-4">This user hasn't created any polls or posts yet.</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="followers" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <UserList 
                userId={id!} 
                type="followers" 
                onCountChange={(count) => {
                  setFollowCounts(prev => ({ ...prev, followers: count }));
                }}
              />
            </TabsContent>
            
            <TabsContent value="following" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <UserList 
                userId={id!} 
                type="following"
                onCountChange={(count) => {
                  setFollowCounts(prev => ({ ...prev, following: count }));
                }} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
