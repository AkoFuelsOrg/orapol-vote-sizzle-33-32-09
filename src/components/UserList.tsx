
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import UserProfileCard from './UserProfileCard';
import { Loader2, User as UserIcon } from 'lucide-react';

interface UserListProps {
  userId: string;
  type: 'followers' | 'following';
}

interface UserData {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface FollowerData {
  follower: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

interface FollowingData {
  following: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

const UserList: React.FC<UserListProps> = ({ userId, type }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, [userId, type]);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (type === 'followers') {
        const { data, error } = await supabase
          .from('follows')
          .select('follower:profiles!follows_follower_id_fkey(id, username, avatar_url)')
          .eq('following_id', userId);
          
        if (error) throw error;
        
        if (data) {
          // Explicitly type the data array and assert it's not null
          const followerData = data as FollowerData[];
          const userData: UserData[] = followerData.map(item => ({
            id: item.follower.id,
            username: item.follower.username,
            avatar_url: item.follower.avatar_url
          }));
          setUsers(userData);
        }
      } else {
        const { data, error } = await supabase
          .from('follows')
          .select('following:profiles!follows_following_id_fkey(id, username, avatar_url)')
          .eq('follower_id', userId);
          
        if (error) throw error;
        
        if (data) {
          // Explicitly type the data array and assert it's not null
          const followingData = data as FollowingData[];
          const userData: UserData[] = followingData.map(item => ({
            id: item.following.id,
            username: item.following.username,
            avatar_url: item.following.avatar_url
          }));
          setUsers(userData);
        }
      }
    } catch (error: any) {
      console.error(`Error fetching ${type}:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Error loading users. Please try again.</p>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
        <UserIcon className="h-12 w-12 mb-2 opacity-20" />
        <p>{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {users.map(user => (
        <UserProfileCard
          key={user.id}
          userId={user.id}
          username={user.username || 'Anonymous'}
          avatarUrl={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`}
        />
      ))}
    </div>
  );
};

export default UserList;
