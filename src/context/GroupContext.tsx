
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useSupabase } from './SupabaseContext';
import { Group, GroupMember } from '../lib/types';
import { toast } from 'sonner';

interface GroupContextType {
  groups: Group[];
  myGroups: Group[];
  joinedGroups: Group[];
  loadingGroups: boolean;
  createGroup: (name: string, description?: string, avatar?: File, cover?: File) => Promise<string | null>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  isGroupMember: (groupId: string) => Promise<boolean>;
  refreshGroups: () => Promise<void>;
  fetchGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  getGroup: (groupId: string) => Promise<Group | null>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabase();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    if (user) {
      refreshGroups();
    } else {
      setLoadingGroups(false);
      setGroups([]);
      setMyGroups([]);
      setJoinedGroups([]);
    }
  }, [user]);

  const refreshGroups = async () => {
    if (!user) return;
    
    setLoadingGroups(true);
    try {
      // Fetch all groups
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allGroupsError) throw allGroupsError;
      
      // Fetch groups created by the current user
      const { data: createdGroups, error: createdGroupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (createdGroupsError) throw createdGroupsError;
      
      // Fetch groups the user has joined
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (membershipsError) throw membershipsError;
      
      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id);
        
        const { data: joinedGroupsData, error: joinedGroupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .order('created_at', { ascending: false });
        
        if (joinedGroupsError) throw joinedGroupsError;
        
        setJoinedGroups(joinedGroupsData || []);
      } else {
        setJoinedGroups([]);
      }
      
      setGroups(allGroups || []);
      setMyGroups(createdGroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const createGroup = async (name: string, description?: string, avatar?: File, cover?: File) => {
    if (!user) {
      toast.error('You must be logged in to create a group');
      return null;
    }
    
    try {
      let avatarUrl: string | undefined;
      let coverUrl: string | undefined;
      
      // Upload avatar if provided
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const filePath = `groups/${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = urlData.publicUrl;
      }
      
      // Upload cover if provided
      if (cover) {
        const fileExt = cover.name.split('.').pop();
        const filePath = `groups/${user.id}/cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, cover, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        coverUrl = urlData.publicUrl;
      }
      
      // Create the group
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          avatar_url: avatarUrl,
          cover_url: coverUrl,
          created_by: user.id,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Add the creator as a member with 'admin' role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin',
        });
      
      if (memberError) throw memberError;
      
      toast.success('Group created successfully');
      await refreshGroups();
      return data.id;
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
      return null;
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a group');
      return false;
    }
    
    try {
      // Check if already a member
      const isMember = await isGroupMember(groupId);
      if (isMember) {
        toast.info('You are already a member of this group');
        return true;
      }
      
      // Join the group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
        });
      
      if (error) throw error;
      
      toast.success('Joined group successfully');
      await refreshGroups();
      return true;
    } catch (error: any) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
      return false;
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) {
      toast.error('You must be logged in to leave a group');
      return false;
    }
    
    try {
      // Check if creator (creators can't leave their own groups)
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single();
      
      if (groupError) throw groupError;
      
      if (group.created_by === user.id) {
        toast.error('As the creator, you cannot leave the group. You may delete it instead.');
        return false;
      }
      
      // Leave the group
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Left group successfully');
      await refreshGroups();
      return true;
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast.error(error.message || 'Failed to leave group');
      return false;
    }
  };

  const isGroupMember = async (groupId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking group membership:', error);
      return false;
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          joined_at,
          role,
          profiles:user_id (username, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(member => ({
        id: member.id,
        group_id: member.group_id,
        user_id: member.user_id,
        joined_at: member.joined_at,
        role: member.role,
        user: {
          username: member.profiles?.username || 'Anonymous',
          avatar_url: member.profiles?.avatar_url,
        }
      }));
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  const getGroup = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching group:', error);
      return null;
    }
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        myGroups,
        joinedGroups,
        loadingGroups,
        createGroup,
        joinGroup,
        leaveGroup,
        isGroupMember,
        refreshGroups,
        fetchGroupMembers,
        getGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
