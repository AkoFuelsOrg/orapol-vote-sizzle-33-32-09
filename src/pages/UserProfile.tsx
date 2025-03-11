import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import Header from '../components/Header';
import PollCard from '../components/PollCard';
import UserList from '../components/UserList';
import { useSupabase } from '../context/SupabaseContext';
import { ArrowLeft, Loader2, UserPlus, UserCheck, MessageSquare } from 'lucide-react';
import { Poll, PollOption } from '../lib/types';
import { Json } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, followUser, unfollowUser, isFollowing } = useSupabase();
  const [profile, setProfile] = useState<any | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);
  const [userIsFollowing, setUserIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("polls");
  
  useEffect(() => {
    if (id) {
      fetchUserProfile(id);
      fetchUserPolls(id);
      fetchFollowCounts();
      
      if (user) {
        checkFollowStatus();
        checkCanMessage();
      }
    }
  }, [id, user]);

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
  
  const fetchUserPolls = async (userId: string) => {
    try {
      setIsLoadingPolls(true);
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
    } finally {
      setIsLoadingPolls(false);
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
  
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-20 px-4 max-w-full w-full mx-auto flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-20 px-4 max-w-full w-full mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 text-center">
            <p className="mb-4">User not found</p>
            <Link 
              to="/"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
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
      
      <main className="pt-20 px-4 w-full mx-auto pb-20">
        <div className="mb-4 animate-fade-in">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Polls</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-2 border-red-500 overflow-hidden">
              <img 
                src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`} 
                alt={profile.username || 'User'} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold">{profile.username || 'Anonymous'}</h2>
            </div>
            
            <div className="mt-6 flex space-x-6 justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{polls.length}</p>
                <p className="text-sm text-muted-foreground">Polls</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{followCounts.followers}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{followCounts.following}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
            
            {user && user.id !== profile.id && (
              <div className="mt-4 flex space-x-3 w-full max-w-xs">
                <Button
                  onClick={handleFollowAction}
                  disabled={actionLoading}
                  variant={userIsFollowing ? "secondary" : "default"}
                  className="flex-1"
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
                    className="flex-1"
                  >
                    <Link to={`/messages/${id}`}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      <span>Message</span>
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Tabs 
          defaultValue="polls" 
          className="w-full animate-fade-in"
          onValueChange={(value) => {
            setActiveTab(value);
          }}
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="polls">Polls</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="polls" className="mt-0">
            {isLoadingPolls ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : polls.length > 0 ? (
              <div className="space-y-4">
                {polls.map(poll => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No polls created yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="followers" className="mt-0">
            <UserList 
              userId={id!} 
              type="followers" 
              onCountChange={(count) => {
                setFollowCounts(prev => ({ ...prev, followers: count }));
              }}
            />
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            <UserList 
              userId={id!} 
              type="following"
              onCountChange={(count) => {
                setFollowCounts(prev => ({ ...prev, following: count }));
              }} 
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserProfile;
