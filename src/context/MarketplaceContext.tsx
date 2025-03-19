
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useSupabase } from './SupabaseContext';
import { Marketplace, MarketplaceMember } from '../lib/types';
import { toast } from 'sonner';

interface MarketplaceContextType {
  marketplaces: Marketplace[];
  myMarketplaces: Marketplace[];
  joinedMarketplaces: Marketplace[];
  loadingMarketplaces: boolean;
  createMarketplace: (name: string, description?: string, avatar?: File, cover?: File) => Promise<string | null>;
  joinMarketplace: (marketplaceId: string) => Promise<boolean>;
  leaveMarketplace: (marketplaceId: string) => Promise<boolean>;
  isMarketplaceMember: (marketplaceId: string) => Promise<boolean>;
  isMarketplaceAdmin: (marketplaceId: string) => Promise<boolean>;
  refreshMarketplaces: () => Promise<void>;
  fetchMarketplaceMembers: (marketplaceId: string) => Promise<MarketplaceMember[]>;
  getMarketplace: (marketplaceId: string) => Promise<Marketplace | null>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSupabase();
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [myMarketplaces, setMyMarketplaces] = useState<Marketplace[]>([]);
  const [joinedMarketplaces, setJoinedMarketplaces] = useState<Marketplace[]>([]);
  const [loadingMarketplaces, setLoadingMarketplaces] = useState(true);

  useEffect(() => {
    if (user) {
      refreshMarketplaces();
    } else {
      setLoadingMarketplaces(false);
      setMarketplaces([]);
      setMyMarketplaces([]);
      setJoinedMarketplaces([]);
    }
  }, [user]);

  const refreshMarketplaces = async () => {
    if (!user) return;
    
    setLoadingMarketplaces(true);
    try {
      const { data: allMarketplaces, error: allMarketplacesError } = await supabase
        .from('marketplaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (allMarketplacesError) throw allMarketplacesError;
      
      const { data: createdMarketplaces, error: createdMarketplacesError } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (createdMarketplacesError) throw createdMarketplacesError;
      
      const { data: memberships, error: membershipsError } = await supabase
        .from('marketplace_members')
        .select('marketplace_id')
        .eq('user_id', user.id);
      
      if (membershipsError) throw membershipsError;
      
      if (memberships && memberships.length > 0) {
        const marketplaceIds = memberships.map(m => m.marketplace_id);
        
        const { data: joinedMarketplacesData, error: joinedMarketplacesError } = await supabase
          .from('marketplaces')
          .select('*')
          .in('id', marketplaceIds)
          .order('created_at', { ascending: false });
        
        if (joinedMarketplacesError) throw joinedMarketplacesError;
        
        setJoinedMarketplaces(joinedMarketplacesData || []);
      } else {
        setJoinedMarketplaces([]);
      }
      
      setMarketplaces(allMarketplaces || []);
      setMyMarketplaces(createdMarketplaces || []);
    } catch (error) {
      console.error('Error fetching marketplaces:', error);
      toast.error('Failed to load marketplaces');
    } finally {
      setLoadingMarketplaces(false);
    }
  };

  const createMarketplace = async (name: string, description?: string, avatar?: File, cover?: File) => {
    if (!user) {
      toast.error('You must be logged in to create a marketplace');
      return null;
    }
    
    try {
      let avatarUrl: string | undefined;
      let coverUrl: string | undefined;
      
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const filePath = `marketplaces/${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = urlData.publicUrl;
      }
      
      if (cover) {
        const fileExt = cover.name.split('.').pop();
        const filePath = `marketplaces/${user.id}/cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, cover, { upsert: true });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
        coverUrl = urlData.publicUrl;
      }
      
      const { data, error } = await supabase
        .from('marketplaces')
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
      
      // Add creator as admin
      const { error: memberError } = await supabase
        .from('marketplace_members')
        .insert({
          marketplace_id: data.id,
          user_id: user.id,
          role: 'admin',
        });
      
      if (memberError) throw memberError;
      
      toast.success('Marketplace created successfully');
      await refreshMarketplaces();
      return data.id;
    } catch (error: any) {
      console.error('Error creating marketplace:', error);
      toast.error(error.message || 'Failed to create marketplace');
      return null;
    }
  };

  const joinMarketplace = async (marketplaceId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a marketplace');
      return false;
    }
    
    try {
      const isMember = await isMarketplaceMember(marketplaceId);
      if (isMember) {
        toast.info('You are already a member of this marketplace');
        return true;
      }
      
      const { error } = await supabase
        .from('marketplace_members')
        .insert({
          marketplace_id: marketplaceId,
          user_id: user.id,
          role: 'member',
        });
      
      if (error) throw error;
      
      toast.success('Joined marketplace successfully');
      await refreshMarketplaces();
      return true;
    } catch (error: any) {
      console.error('Error joining marketplace:', error);
      toast.error(error.message || 'Failed to join marketplace');
      return false;
    }
  };

  const leaveMarketplace = async (marketplaceId: string) => {
    if (!user) {
      toast.error('You must be logged in to leave a marketplace');
      return false;
    }
    
    try {
      const { data: marketplace, error: marketplaceError } = await supabase
        .from('marketplaces')
        .select('created_by')
        .eq('id', marketplaceId)
        .single();
      
      if (marketplaceError) throw marketplaceError;
      
      if (marketplace.created_by === user.id) {
        toast.error('As the creator, you cannot leave the marketplace. You may delete it instead.');
        return false;
      }
      
      const { error } = await supabase
        .from('marketplace_members')
        .delete()
        .eq('marketplace_id', marketplaceId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Left marketplace successfully');
      await refreshMarketplaces();
      return true;
    } catch (error: any) {
      console.error('Error leaving marketplace:', error);
      toast.error(error.message || 'Failed to leave marketplace');
      return false;
    }
  };

  const isMarketplaceMember = async (marketplaceId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('marketplace_members')
        .select('id')
        .eq('marketplace_id', marketplaceId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking marketplace membership:', error);
      return false;
    }
  };
  
  const isMarketplaceAdmin = async (marketplaceId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('marketplace_members')
        .select('role')
        .eq('marketplace_id', marketplaceId)
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking marketplace admin status:', error);
      return false;
    }
  };

  const fetchMarketplaceMembers = async (marketplaceId: string): Promise<MarketplaceMember[]> => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('marketplace_members')
        .select('id, marketplace_id, user_id, joined_at, role')
        .eq('marketplace_id', marketplaceId)
        .order('joined_at', { ascending: false });
      
      if (membersError) throw membersError;
      
      const members = await Promise.all((membersData || []).map(async (member) => {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', member.user_id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching member profile:', profileError);
        }
        
        return {
          id: member.id,
          marketplace_id: member.marketplace_id,
          user_id: member.user_id,
          joined_at: member.joined_at,
          role: member.role as 'admin' | 'moderator' | 'member',
          user: {
            username: profileData?.username || 'Anonymous',
            avatar_url: profileData?.avatar_url || '',
          }
        };
      }));
      
      return members;
    } catch (error) {
      console.error('Error fetching marketplace members:', error);
      return [];
    }
  };

  const getMarketplace = async (marketplaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('id', marketplaceId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      return null;
    }
  };

  return (
    <MarketplaceContext.Provider
      value={{
        marketplaces,
        myMarketplaces,
        joinedMarketplaces,
        loadingMarketplaces,
        createMarketplace,
        joinMarketplace,
        leaveMarketplace,
        isMarketplaceMember,
        isMarketplaceAdmin,
        refreshMarketplaces,
        fetchMarketplaceMembers,
        getMarketplace,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};
