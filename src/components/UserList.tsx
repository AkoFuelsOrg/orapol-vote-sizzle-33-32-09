
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

const UserList: React.FC<UserListProps> = ({ userId, type }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, [userId, type]);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query;
      
      if (type === 'followers') {
        // Get users who follow the specified user
        query = supabase
          .from('follows')
          .select(`
            follower:follower_id(
              id,
              username,
              avatar_url
            )
          `)
          .eq('following_id', userId);
      } else {
        // Get users whom the specified user follows
        query = supabase
          .from('follows')
          .select(`
            following:following_id(
              id,
              username,
              avatar_url
            )
          `)
          .eq('follower_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const userData = data.map(item => {
        const user = type === 'followers' ? item.follower : item.following;
        return {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        };
      });
      
      setUsers(userData);
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
