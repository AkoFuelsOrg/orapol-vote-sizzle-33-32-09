
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import UserProfileCard from './UserProfileCard';
import { Loader2, User as UserIcon } from 'lucide-react';

interface UserListProps {
  userId: string;
  type: 'followers' | 'following';
  onCountChange?: (count: number) => void;
}

interface UserData {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const UserList: React.FC<UserListProps> = ({ userId, type, onCountChange }) => {
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
        // Get profiles of users who follow the current user
        const { data, error } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const followerIds = data.map(follow => follow.follower_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', followerIds);
            
          if (profilesError) throw profilesError;
          
          if (profilesData) {
            setUsers(profilesData);
            if (onCountChange) onCountChange(profilesData.length);
          }
        } else {
          setUsers([]);
          if (onCountChange) onCountChange(0);
        }
      } else {
        // Get profiles of users that the current user follows
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const followingIds = data.map(follow => follow.following_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', followingIds);
            
          if (profilesError) throw profilesError;
          
          if (profilesData) {
            setUsers(profilesData);
            if (onCountChange) onCountChange(profilesData.length);
          }
        } else {
          setUsers([]);
          if (onCountChange) onCountChange(0);
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
      <div className="flex justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-sm text-muted-foreground">Loading users...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-red-50/50 rounded-lg">
        <p className="text-red-500">Error loading users. Please try again.</p>
        <button 
          onClick={fetchUsers}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground flex flex-col items-center bg-gray-50/70 rounded-lg">
        <UserIcon className="h-12 w-12 mb-3 opacity-20" />
        <p className="font-medium mb-1">{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
        <p className="text-sm px-4">
          {type === 'followers' 
            ? 'When people follow you, they will appear here.' 
            : 'When you follow people, they will appear here.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {users.map(user => (
        <UserProfileCard
          key={user.id}
          userId={user.id}
          username={user.username || 'Anonymous'}
          avatarUrl={user.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`}
          hideFollowButton={!userId}
        />
      ))}
    </div>
  );
};

export default UserList;
