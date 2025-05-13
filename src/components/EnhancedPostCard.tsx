
import React, { useState } from "react";
import PostCard from "./PostCard";
import { Post } from "../lib/types";
import { getAvatarUrl } from "../lib/avatar-utils";
import { supabase } from "@/integrations/supabase/client";
import { useSupabase } from "../context/SupabaseContext";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "./ui/tabs";
import { Check, Users, Store, UserRound, Home, Users2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

interface EnhancedPostCardProps {
  post: Post;
  showComments?: boolean;
  onLike?: (postId: string) => void;
  onFavorite?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

export const EnhancedPostCard: React.FC<EnhancedPostCardProps> = ({
  post,
  onLike,
  onFavorite,
  onComment,
  onShare,
  onPostClick,
  onUserClick,
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [shareDestination, setShareDestination] = useState<'profile' | 'followers' | 'home'>('home');
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [userMarketplaces, setUserMarketplaces] = useState<any[]>([]);
  const { user } = useSupabase();
  
  // Create a modified post with the author's avatar updated using our utility
  const enhancedPost = {
    ...post,
    author: {
      ...post.author,
      avatar: getAvatarUrl(post.author.avatar),
    }
  };
  
  const handlePostUpdate = () => {
    if (onLike && post.id) {
      onLike(post.id);
    }
  };

  const handleShare = async () => {
    if (!user) {
      toast.error("Please sign in to share this post");
      return;
    }
    
    // Fetch user's groups and marketplaces when opening the share dialog
    if (!shareDialogOpen) {
      try {
        // Fetch groups where user is a member
        const { data: groups, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id, groups(id, name, avatar_url)')
          .eq('user_id', user.id);
        
        if (groupsError) throw groupsError;
        
        // Fetch marketplaces where user is a member
        const { data: marketplaces, error: marketplacesError } = await supabase
          .from('marketplace_members')
          .select('marketplace_id, marketplaces(id, name, avatar_url)')
          .eq('user_id', user.id);
        
        if (marketplacesError) throw marketplacesError;
        
        setUserGroups(groups?.map(item => item.groups) || []);
        setUserMarketplaces(marketplaces?.map(item => item.marketplaces) || []);
      } catch (error) {
        console.error("Error fetching user's groups and marketplaces:", error);
        toast.error("Failed to load your groups and marketplaces");
      }
    }
    
    setShareDialogOpen(true);
    
    if (onShare && post.id) {
      onShare(post.id);
    }
  };

  const handleSaveShare = async () => {
    if (!user || !post.id) return;
    
    setIsSharing(true);
    
    try {
      // Create a new post object for sharing
      const sharedPostBase = {
        content: `Shared a post from ${post.author.name}: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`,
        user_id: user.id,
        shared_post_id: post.id,
        image: post.image,
      };
      
      const shareTasks = [];
      
      // Share to selected groups
      if (selectedGroups.length > 0) {
        for (const groupId of selectedGroups) {
          shareTasks.push(
            supabase
              .from('posts')
              .insert({
                ...sharedPostBase,
                group_id: groupId
              })
          );
        }
      }
      
      // Share to selected marketplaces
      if (selectedMarketplaces.length > 0) {
        for (const marketplaceId of selectedMarketplaces) {
          shareTasks.push(
            supabase
              .from('posts')
              .insert({
                ...sharedPostBase,
                marketplace_id: marketplaceId
              })
          );
        }
      }
      
      // Share to profile, followers, or home based on selection
      if (shareDestination) {
        let additionalData = {};
        
        switch (shareDestination) {
          case 'profile':
            // Share to user's profile (no additional data needed)
            break;
          case 'followers':
            // Add a flag to indicate this is shared to followers
            additionalData = { shared_to_followers: true };
            break;
          case 'home':
            // Share to home feed (no additional data needed)
            break;
        }
        
        shareTasks.push(
          supabase
            .from('posts')
            .insert({
              ...sharedPostBase,
              ...additionalData
            })
        );
      }
      
      // Execute all share tasks
      await Promise.all(shareTasks);
      
      // Record the share action
      await supabase
        .from('post_shares')
        .insert({
          post_id: post.id,
          user_id: user.id,
          platform: 'internal'
        });
      
      toast.success("Post shared successfully!");
      setShareDialogOpen(false);
      setSelectedGroups([]);
      setSelectedMarketplaces([]);
      setShareDestination('home');
      
    } catch (error: any) {
      console.error("Error sharing post:", error);
      toast.error(error.message || "Failed to share post");
    } finally {
      setIsSharing(false);
    }
  };

  const handleGroupCheckboxChange = (groupId: string) => {
    setSelectedGroups(current => 
      current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId]
    );
  };
  
  const handleMarketplaceCheckboxChange = (marketplaceId: string) => {
    setSelectedMarketplaces(current => 
      current.includes(marketplaceId)
        ? current.filter(id => id !== marketplaceId)
        : [...current, marketplaceId]
    );
  };

  // Pass only the props that PostCard accepts
  return (
    <>
      <PostCard
        post={enhancedPost}
        onPostUpdate={handlePostUpdate}
        onPostDeleted={() => {}}
        onCustomShare={handleShare}
      />
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Share Post</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="destination" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="destination" className="text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <Home size={16} className="hidden sm:inline" /> Destination
                </span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <Users size={16} className="hidden sm:inline" /> Groups
                </span>
              </TabsTrigger>
              <TabsTrigger value="marketplaces" className="text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <Store size={16} className="hidden sm:inline" /> Marketplaces
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="destination">
              <div className="py-2">
                <RadioGroup 
                  value={shareDestination} 
                  onValueChange={(value: 'profile' | 'followers' | 'home') => setShareDestination(value)}
                >
                  <div className="flex items-center space-x-2 mb-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <RadioGroupItem value="profile" id="profile" />
                    <Label htmlFor="profile" className="flex items-center gap-2 cursor-pointer">
                      <UserRound size={20} className="text-blue-500" />
                      <div>
                        <p className="font-medium">Your Profile</p>
                        <p className="text-xs text-muted-foreground">Share to your profile page</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <RadioGroupItem value="followers" id="followers" />
                    <Label htmlFor="followers" className="flex items-center gap-2 cursor-pointer">
                      <Users2 size={20} className="text-purple-500" />
                      <div>
                        <p className="font-medium">Your Followers</p>
                        <p className="text-xs text-muted-foreground">Share with people who follow you</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home" className="flex items-center gap-2 cursor-pointer">
                      <Home size={20} className="text-green-500" />
                      <div>
                        <p className="font-medium">Home Feed</p>
                        <p className="text-xs text-muted-foreground">Share to the main feed</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="groups">
              <div className="max-h-[300px] overflow-y-auto py-2">
                {userGroups.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">You're not a member of any groups</p>
                  </div>
                ) : (
                  userGroups.map((group: any) => (
                    <div key={group.id} className="flex items-center space-x-2 mb-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox 
                        id={`group-${group.id}`} 
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => handleGroupCheckboxChange(group.id)}
                      />
                      <Label htmlFor={`group-${group.id}`} className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                          <img 
                            src={group.avatar_url || '/lovable-uploads/default-avatar.png'} 
                            alt={group.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{group.name}</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="marketplaces">
              <div className="max-h-[300px] overflow-y-auto py-2">
                {userMarketplaces.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">You're not a member of any marketplaces</p>
                  </div>
                ) : (
                  userMarketplaces.map((marketplace: any) => (
                    <div key={marketplace.id} className="flex items-center space-x-2 mb-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                      <Checkbox 
                        id={`marketplace-${marketplace.id}`} 
                        checked={selectedMarketplaces.includes(marketplace.id)}
                        onCheckedChange={() => handleMarketplaceCheckboxChange(marketplace.id)}
                      />
                      <Label htmlFor={`marketplace-${marketplace.id}`} className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                          <img 
                            src={marketplace.avatar_url || '/lovable-uploads/default-avatar.png'} 
                            alt={marketplace.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span>{marketplace.name}</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveShare} 
              disabled={isSharing || (selectedGroups.length === 0 && selectedMarketplaces.length === 0 && !shareDestination)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSharing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sharing...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-1" />
                  Share Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
