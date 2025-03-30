import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface ProfileUpdateData {
  username?: string;
  profileFile?: File;
  coverFile?: File;
}

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loading: boolean;
  followUser: (targetUserId: string) => Promise<void>;
  unfollowUser: (targetUserId: string) => Promise<void>;
  isFollowing: (targetUserId: string) => Promise<boolean>;
  getFollowCounts: (userId: string) => Promise<{followers: number, following: number}>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      let avatarUrl = profile?.avatar_url;
      let coverUrl = profile?.cover_url;
      let updates: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      if (data.username) {
        updates.username = data.username;
      }
      
      if (data.profileFile) {
        const fileExt = data.profileFile.name.split('.').pop();
        const filePath = `${user.id}/profile-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, data.profileFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = urlData.publicUrl;
        updates.avatar_url = avatarUrl;
      }
      
      if (data.coverFile) {
        const fileExt = data.coverFile.name.split('.').pop();
        const filePath = `${user.id}/cover-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, data.coverFile, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        coverUrl = urlData.publicUrl;
        updates.cover_url = coverUrl;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setProfile(prev => ({
        ...prev,
        ...(data.username && { username: data.username }),
        ...(avatarUrl && { avatar_url: avatarUrl }),
        ...(coverUrl && { cover_url: coverUrl }),
      }));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error updating profile');
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error updating password');
      console.error('Error updating password:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) throw new Error('User not authenticated');
    if (user.id === targetUserId) {
      toast.error("You cannot follow yourself");
      return;
    }
    
    setLoading(true);
    try {
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      
      if (existingFollow) {
        toast.info("You're already following this user");
        return;
      }
      
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });
        
      if (error) throw error;
      
      toast.success("User followed successfully");
    } catch (error: any) {
      toast.error(error.message || 'Error following user');
      console.error('Error following user:', error);
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
        
      if (error) throw error;
      
      toast.success("User unfollowed");
    } catch (error: any) {
      toast.error(error.message || 'Error unfollowing user');
      console.error('Error unfollowing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();
        
      return !!data;
    } catch (error) {
      return false;
    }
  };

  const getFollowCounts = async (userId: string): Promise<{followers: number, following: number}> => {
    try {
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId);
        
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId);
        
      if (followersError) throw followersError;
      if (followingError) throw followingError;
      
      return {
        followers: followersCount || 0,
        following: followingCount || 0
      };
    } catch (error) {
      console.error('Error getting follow counts:', error);
      return { followers: 0, following: 0 };
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      const defaultAvatarUrl = '/lovable-uploads/a031d96a-edf1-46c7-a8b5-2b75b8ff96ec.png';
      
      const profileData = {
        id: userId,
        username: `user_${Math.floor(Math.random() * 10000)}`,
        avatar_url: defaultAvatarUrl,
        created_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);
        
      if (error) throw error;
      
      return profileData;
    } catch (error: any) {
      console.error('Error creating default profile:', error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        await createDefaultProfile(data.user.id);
        
        // After successful signup, explicitly navigate to profile-setup
        navigate('/profile-setup');
        toast.success('Sign up successful! Please complete your profile.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error signing up');
      console.error('Error signing up:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      console.error('Error signing in:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
      console.error('Error signing out:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        profile,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updatePassword,
        loading,
        followUser,
        unfollowUser,
        isFollowing,
        getFollowCounts,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};
