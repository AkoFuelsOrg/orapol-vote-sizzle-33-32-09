// Profile.tsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Link, useNavigate } from 'react-router-dom';
import PollCard from '../components/PollCard';
import Header from '../components/Header';
import { Loader2, Pencil, Plus, UserPlus, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const Profile: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);
  const { user } = useSupabase();
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchProfile();
    fetchPolls();
    checkIfFollowing();
  }, [user]);
  
  useEffect(() => {
    // Trigger animations after a small delay for a staggered effect
    setAnimateItems(true);
  }, [polls]);
  
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
  
  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      setProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };
  
  const fetchPolls = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch polls with author information
      const { data, error } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Fetch user votes for these polls
      const { data: votesData, error: votesError } = await supabase
        .from('poll_votes')
        .select('poll_id, option_id')
        .eq('user_id', user.id)
        .in('poll_id', data.map(poll => poll.id));
      
      if (votesError) throw votesError;
      
      // Create a map of poll_id to option_id for easy lookup
      const votedOptions: Record<string, string> = votesData.reduce((acc, vote) => {
        acc[vote.poll_id] = vote.option_id;
        return acc;
      }, {} as Record<string, string>);
      
      // Format polls for our application
      const userPolls = data.map((poll) => ({
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
        views: poll.views || 0,
      }));
      
      setPolls(userPolls);
    } catch (error: any) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollow = async () => {
    if (!user || !profile) return;
    
    try {
      if (isFollowing) {
        // Unfollow user
        const { error: deleteError } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.id);
        
        if (deleteError) throw deleteError;
        
        setIsFollowing(false);
        toast.success(`Unfollowed ${profile.username}`);
      } else {
        // Follow user
        const { error: insertError } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: profile.id
          });
        
        if (insertError) throw insertError;
        
        setIsFollowing(true);
        toast.success(`Followed ${profile.username}`);
      }
    } catch (error: any) {
      console.error('Error following/unfollowing user:', error);
      toast.error('Failed to follow/unfollow user');
    }
  };
  
  const checkIfFollowing = async () => {
    if (!user || !profile) return;
    
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', user.id);
      
      if (error) throw error;
      
      setIsFollowing(data.length > 0);
    } catch (error: any) {
      console.error('Error checking if following:', error);
      setIsFollowing(false);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-20 px-4 max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Your Profile</h2>
          <p className="text-muted-foreground">Manage your polls and profile settings</p>
        </div>
        
        {profile && (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 mb-6 animate-fade-in">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={profile.avatar_url || 'https://i.pravatar.cc/150'} 
                alt={profile.username} 
                className="w-16 h-16 rounded-full object-cover border-2 border-primary" 
              />
              <div>
                <h3 className="text-lg font-medium">{profile.username}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Link 
                to="/profile" 
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
              
              {user.id !== profile.id && (
                <button
                  onClick={handleFollow}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                    ${isFollowing === true
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : isFollowing === false
                        ? 'bg-green-500 text-white hover:bg-green-600'
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
                      Checking...
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="mb-6 animate-fade-in">
          <h3 className="text-xl font-semibold">Your Polls</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No polls yet</h3>
            <p className="text-muted-foreground mb-4">Create your first poll!</p>
            <Link 
              to="/create" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll, index) => (
              <div 
                key={poll.id} 
                className={`transition-opacity duration-500 ${
                  animateItems 
                    ? 'opacity-100' 
                    : 'opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <PollCard poll={poll} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
