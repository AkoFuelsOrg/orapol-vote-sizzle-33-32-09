
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, UserPlus, UserCheck, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationNext, 
  PaginationPrevious 
} from "./ui/pagination";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

const SuggestedUsers: React.FC = () => {
  const { user, followUser, isFollowing } = useSupabase();
  const navigate = useNavigate();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const usersPerPage = 3;

  const { data: suggestedUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['suggestedUsers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data: followingData, error: followingError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (followingError) {
          console.error('Error fetching following data:', followingError);
          throw followingError;
        }
        
        const followingIds = followingData?.map(f => f.following_id) || [];
        console.log('Following IDs:', followingIds); // Debug log
        
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .not('id', 'eq', user.id)
          .order('created_at', { ascending: false })
          .limit(15);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        console.log('All profiles fetched:', allProfiles?.length); // Debug log
        
        const filteredProfiles = allProfiles?.filter(profile => 
          !followingIds.includes(profile.id)
        );
        
        console.log('Filtered profiles:', filteredProfiles?.length); // Debug log
        
        return filteredProfiles as UserProfile[];
      } catch (error) {
        console.error('Error fetching suggested users:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!suggestedUsers || suggestedUsers.length === 0) return;
      
      try {
        const statuses: Record<string, boolean> = {};
        for (const suggestedUser of suggestedUsers) {
          statuses[suggestedUser.id] = await isFollowing(suggestedUser.id);
        }
        setFollowStatus(statuses);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };
    
    checkFollowStatus();
  }, [suggestedUsers, isFollowing]);
  
  const handleFollowUser = async (userId: string) => {
    if (!user) return;
    
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      await followUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: true }));
      toast.success("Successfully followed user");
      
      refetch();
    } catch (error) {
      console.error('Error following user:', error);
      toast.error("Failed to follow user");
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
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Retry
        </Button>
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
  
  const totalPages = Math.ceil(suggestedUsers.length / usersPerPage);
  const displayUsers = suggestedUsers.slice(
    currentPage * usersPerPage, 
    (currentPage + 1) * usersPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };
  
  return (
    <div className="w-full space-y-2.5">
      <div className="space-y-2.5">
        {displayUsers.map((profile) => (
          <Card 
            key={profile.id} 
            className="p-3 transition-all hover:shadow-md hover:border-primary/10 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1 overflow-hidden mr-2">
                <Avatar 
                  className="h-10 w-10 mr-3 border border-gray-100 shadow-sm group-hover:border-primary/10 transition-all cursor-pointer flex-shrink-0"
                  onClick={() => handleViewProfile(profile.id)}
                >
                  <AvatarImage 
                    src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`} 
                    alt={profile.username || 'User'} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div 
                  className="min-w-0 cursor-pointer overflow-hidden" 
                  onClick={() => handleViewProfile(profile.id)}
                >
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-800 truncate">
                      {profile.username || 'User'}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="ml-2 text-[10px] px-1.5 py-0 border-primary/20 text-primary/80 hidden"
                      style={{ display: 'none' }}
                    >
                      Suggested
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ExternalLink size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">View profile</span>
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant={followStatus[profile.id] ? "outline" : "default"}
                className={`flex-shrink-0 min-w-[80px] px-2 whitespace-nowrap ${
                  followStatus[profile.id] 
                    ? 'bg-gray-50 hover:bg-gray-100 text-gray-700' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
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

      {suggestedUsers.length > usersPerPage && (
        <Pagination className="mt-2">
          <PaginationContent>
            <PaginationItem>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
            </PaginationItem>
            <span className="px-2 flex items-center text-sm text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <PaginationItem>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default SuggestedUsers;
