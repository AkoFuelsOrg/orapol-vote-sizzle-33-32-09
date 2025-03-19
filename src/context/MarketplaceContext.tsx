
import { createContext, useContext, useState, ReactNode } from "react";
import { useSupabase } from "./SupabaseContext";
import { supabase } from "../integrations/supabase/client";
import { Marketplace, MarketplaceMember } from "../lib/types";
import { toast } from "../components/ui/use-toast";

interface MarketplaceContextType {
  marketplaces: Marketplace[];
  userMarketplaces: Marketplace[];
  isLoading: boolean;
  createMarketplace: (data: { name: string; description?: string; avatar_url?: string, cover_url?: string }) => Promise<string | null>;
  fetchMarketplaces: () => Promise<void>;
  fetchUserMarketplaces: () => Promise<void>;
  joinMarketplace: (marketplaceId: string) => Promise<boolean>;
  leaveMarketplace: (marketplaceId: string) => Promise<boolean>;
  isMarketplaceMember: (marketplaceId: string) => Promise<boolean>;
  fetchMarketplaceMembers: (marketplaceId: string) => Promise<MarketplaceMember[]>;
  getMarketplace: (marketplaceId: string) => Promise<Marketplace | null>;
}

const MarketplaceContext = createContext<MarketplaceContextType | null>(null);

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error("useMarketplace must be used within a MarketplaceProvider");
  }
  return context;
};

export const MarketplaceProvider = ({ children }: { children: ReactNode }) => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [userMarketplaces, setUserMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSupabase();

  const fetchMarketplaces = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketplaces")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setMarketplaces(data as Marketplace[]);
      }
    } catch (error) {
      console.error("Error fetching marketplaces:", error);
      toast({
        title: "Error",
        description: "Failed to load marketplaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserMarketplaces = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketplace_members")
        .select("marketplace_id")
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const marketplaceIds = data.map((member) => member.marketplace_id);
        const { data: marketplaceData, error: marketplaceError } = await supabase
          .from("marketplaces")
          .select("*")
          .in("id", marketplaceIds)
          .order("created_at", { ascending: false });

        if (marketplaceError) {
          throw marketplaceError;
        }

        if (marketplaceData) {
          setUserMarketplaces(marketplaceData as Marketplace[]);
        }
      } else {
        setUserMarketplaces([]);
      }
    } catch (error) {
      console.error("Error fetching user marketplaces:", error);
      toast({
        title: "Error",
        description: "Failed to load your marketplaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMarketplace = async (data: { 
    name: string; 
    description?: string; 
    avatar_url?: string; 
    cover_url?: string 
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a marketplace",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newMarketplace, error } = await supabase
        .from("marketplaces")
        .insert({
          name: data.name,
          description: data.description || "",
          avatar_url: data.avatar_url || null,
          cover_url: data.cover_url || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Join the creator to the marketplace automatically
      if (newMarketplace) {
        const { error: memberError } = await supabase
          .from("marketplace_members")
          .insert({
            marketplace_id: newMarketplace.id,
            user_id: user.id,
            role: "admin",
          });

        if (memberError) {
          throw memberError;
        }

        toast({
          title: "Success",
          description: "Marketplace created successfully",
        });

        await fetchMarketplaces();
        await fetchUserMarketplaces();
        return newMarketplace.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating marketplace:", error);
      toast({
        title: "Error",
        description: "Failed to create marketplace",
        variant: "destructive",
      });
      return null;
    }
  };

  const joinMarketplace = async (marketplaceId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to join a marketplace",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if already a member
      const isMember = await isMarketplaceMember(marketplaceId);
      if (isMember) {
        toast({
          title: "Info",
          description: "You are already a member of this marketplace",
        });
        return true;
      }

      const { error } = await supabase.from("marketplace_members").insert({
        marketplace_id: marketplaceId,
        user_id: user.id,
        role: "member",
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "You have joined the marketplace",
      });

      await fetchUserMarketplaces();
      return true;
    } catch (error) {
      console.error("Error joining marketplace:", error);
      toast({
        title: "Error",
        description: "Failed to join marketplace",
        variant: "destructive",
      });
      return false;
    }
  };

  const leaveMarketplace = async (marketplaceId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to leave a marketplace",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("marketplace_members")
        .delete()
        .eq("marketplace_id", marketplaceId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "You have left the marketplace",
      });

      await fetchUserMarketplaces();
      return true;
    } catch (error) {
      console.error("Error leaving marketplace:", error);
      toast({
        title: "Error",
        description: "Failed to leave marketplace",
        variant: "destructive",
      });
      return false;
    }
  };

  const isMarketplaceMember = async (marketplaceId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("marketplace_members")
        .select("id")
        .eq("marketplace_id", marketplaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking marketplace membership:", error);
      return false;
    }
  };

  const fetchMarketplaceMembers = async (marketplaceId: string) => {
    try {
      // First get all member ids
      const { data: memberData, error: memberError } = await supabase
        .from("marketplace_members")
        .select("id, marketplace_id, user_id, joined_at, role")
        .eq("marketplace_id", marketplaceId);

      if (memberError) throw memberError;
      
      if (!memberData || memberData.length === 0) return [];
      
      // Then get profile info for each user
      const members: MarketplaceMember[] = [];
      
      for (const member of memberData) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", member.user_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          // Continue with next member even if there's an error
          members.push({
            ...member,
            role: member.role as 'admin' | 'moderator' | 'member', // Cast role to union type
            user: {
              username: "Unknown User",
              avatar_url: "",
            },
          });
          continue;
        }
        
        members.push({
          ...member,
          role: member.role as 'admin' | 'moderator' | 'member', // Cast role to union type
          user: {
            username: profileData?.username || "Unknown User",
            avatar_url: profileData?.avatar_url || "",
          },
        });
      }
      
      return members;
      
    } catch (error) {
      console.error("Error fetching marketplace members:", error);
      return [];
    }
  };

  const getMarketplace = async (marketplaceId: string) => {
    try {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("*")
        .eq("id", marketplaceId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as Marketplace;
    } catch (error) {
      console.error("Error getting marketplace:", error);
      return null;
    }
  };

  const value = {
    marketplaces,
    userMarketplaces,
    isLoading,
    createMarketplace,
    fetchMarketplaces,
    fetchUserMarketplaces,
    joinMarketplace,
    leaveMarketplace,
    isMarketplaceMember,
    fetchMarketplaceMembers,
    getMarketplace,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
};
