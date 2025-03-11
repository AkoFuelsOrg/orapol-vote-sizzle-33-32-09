
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useParams, Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import { Loader2, UserPlus, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const UserProfile: React.FC = () => {
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const { user } = useSupabase();
  const { id } = useParams();

  useEffect(() => {
    fetchUserProfile();
    fetchUserPolls();
    if (user) {
      checkIfFollowing();
    }
  }, [id, user]);

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

  const fetchUserProfile = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      setProfileData(data);
      
      // Fetch follow counts
      const counts = await getFollowCounts(id);
      setFollowCounts(counts);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };
  
  const fetchUserPolls = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch polls with author information
      const { data: pollsData, error } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          views,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user votes for these polls if the user is logged in
      let votedOptions: Record<string, string> = {};
      
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('poll_id, option_id')
          .eq('user_id', user.id)
          .in('poll_id', pollsData.map(poll => poll.id));
        
        if (!votesError && votesData) {
          votedOptions = votesData.reduce((acc, vote) => {
            acc[vote.poll_id] = vote.option_id;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Format polls for our application
      const userPollsData = pollsData.map((poll) => ({
        id: poll.id,
        question: poll.question,
        options: convertJsonToPollOptions(poll.options),
        author: {
          id: poll.profiles.id,
          name: poll.profiles.username || 'Anonymous',
          avatar: poll.profiles.avatar_url || 'https://i.pravatar.cc/150',
        },
        createdAt: poll.created_at,
        totalVotes: poll.total_votes || 0,
        commentCount: poll.comment_count || 0,
        userVoted: votedOptions[poll.id] || null,
        image: poll.image,
        views: poll.views || 0, // Include views property
      }));
      
      setUserPolls(userPollsData);
    } catch (error: any) {
      console.error('Error fetching user polls:', error);
      toast.error('Failed to load user polls');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFollowing = async () => {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error('Error checking follow status:', error);
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !id) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowCounts(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        toast.success(`Unfollowed ${profileData?.username || 'user'}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: id
          });
        
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
        toast.success(`Followed ${profileData?.username || 'user'}`);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user');
    }
  };

  const getFollowCounts = async (userId: string) => {
    try {
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      if (followersError) throw followersError;
      if (followingError) throw followingError;
      
      return {
        followers: followersCount || 0,
        following: followingCount || 0
      };
    } catch (error: any) {
      console.error('Error getting follow counts:', error);
      return { followers: 0, following: 0 };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground mb-6">This user profile doesn't exist or has been deleted.</p>
        <Link 
          to="/"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="pt-8 px-4 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src={profileData.avatar_url || 'https://i.pravatar.cc/150'} 
              alt={profileData.username} 
              className="w-16 h-16 rounded-full object-cover border-2 border-primary" 
            />
            <div>
              <h3 className="text-lg font-medium">{profileData.username || 'Anonymous User'}</h3>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{followCounts.followers} Followers</span>
                <span>{followCounts.following} Following</span>
              </div>
            </div>
            
            {user && user.id !== id && (
              <button
                onClick={handleFollow}
                className={`ml-auto inline-flex items-center px-4 py-2 rounded-lg transition-colors
                  ${isFollowing === true
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : isFollowing === false
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                disabled={isFollowing === null}
              >
                {isFollowing === true ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                ) : isFollowing === false ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold">User Polls</h3>
        </div>
        
        {userPolls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No polls yet</h3>
            <p className="text-muted-foreground mb-4">This user hasn't created any polls.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
