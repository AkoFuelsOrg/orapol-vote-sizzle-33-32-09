
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio?: string | null;
}

const SuggestedUsers: React.FC = () => {
  const { user, followUser, isFollowing } = useSupabase();
  const navigate = useNavigate();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  const { data: suggestedUsers, isLoading, error } = useQuery({
    queryKey: ['suggestedUsers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First, get IDs of users you are already following
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Get a list of users you're not following (excluding yourself)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .not('id', 'in', [user.id, ...followingIds])
        .order('created_at', { ascending: false })
        .limit(15);
        
      if (error) throw error;
      
      return profiles as UserProfile[];
    },
    enabled: !!user,
  });
  
  useEffect(() => {
    // Check follow status for suggested users
    const checkFollowStatus = async () => {
      if (!suggestedUsers || suggestedUsers.length === 0) return;
      
      const statuses: Record<string, boolean> = {};
      for (const suggestedUser of suggestedUsers) {
        statuses[suggestedUser.id] = await isFollowing(suggestedUser.id);
      }
      setFollowStatus(statuses);
    };
    
    checkFollowStatus();
  }, [suggestedUsers, isFollowing]);
  
  const handleFollowUser = async (userId: string) => {
    if (!user) return;
    
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      await followUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: true }));
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleViewProfile = (userId: string) => {
    navigate(`/user/${userId}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Something went wrong loading suggestions.</p>
      </div>
    );
  }
  
  if (!suggestedUsers || suggestedUsers.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="py-8 flex flex-col items-center">
          <div className="h-14 w-14 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-7 w-7 text-primary/70" />
          </div>
          <p className="mb-2 font-medium text-gray-700">No suggestions available</p>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Check back later for new people to follow!
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 py-1">
      {suggestedUsers.map((profile) => (
        <Card 
          key={profile.id} 
          className="p-3 transition-all hover:shadow-md hover:border-primary/10 cursor-pointer"
        >
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3 border border-white shadow-sm" onClick={() => handleViewProfile(profile.id)}>
              <AvatarImage 
                src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`} 
                alt={profile.username || 'User'} 
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0" onClick={() => handleViewProfile(profile.id)}>
              <h3 className="font-medium text-gray-800 truncate">{profile.username || 'User'}</h3>
              {profile.bio && (
                <p className="text-xs text-gray-500 truncate">{profile.bio}</p>
              )}
            </div>
            
            <Button
              size="sm"
              variant={followStatus[profile.id] ? "outline" : "default"}
              className={`ml-2 px-3 ${followStatus[profile.id] ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!followStatus[profile.id]) {
                  handleFollowUser(profile.id);
                }
              }}
              disabled={followLoading[profile.id] || followStatus[profile.id]}
            >
              {followLoading[profile.id] ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : followStatus[profile.id] ? (
                <>
                  <UserCheck className="h-3 w-3 mr-1" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  <span>Follow</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SuggestedUsers;
