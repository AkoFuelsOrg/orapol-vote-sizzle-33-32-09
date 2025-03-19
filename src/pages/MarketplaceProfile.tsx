
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, ImageOff, Calendar, UserMinus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import MarketplacePostInterface from '@/components/MarketplacePostInterface';
import { MarketplaceMember, Post, Poll } from '@/lib/types';
import PostCard from '@/components/PostCard';
import PollCard from '@/components/PollCard';
import { supabase } from '@/integrations/supabase/client';

const MarketplaceProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const { getMarketplace, isMarketplaceMember, joinMarketplace, leaveMarketplace, fetchMarketplaceMembers } = useMarketplace();
  
  const [marketplace, setMarketplace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membersList, setMembersList] = useState<MarketplaceMember[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadMarketplaceData();
    }
  }, [id, user]);
  
  const loadMarketplaceData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const marketplaceData = await getMarketplace(id);
      if (!marketplaceData) {
        toast({
          title: "Error",
          description: "Marketplace not found",
          variant: "destructive"
        });
        navigate('/marketplaces');
        return;
      }
      
      setMarketplace(marketplaceData);
      
      // Check if user is a member
      if (user) {
        const memberStatus = await isMarketplaceMember(id);
        setIsMember(memberStatus);
      }
      
      // Load members
      const members = await fetchMarketplaceMembers(id);
      setMembersList(members);
      
      // Load posts and polls
      await loadPosts();
      await loadPolls();
      
    } catch (error) {
      console.error("Error loading marketplace data:", error);
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadPosts = async () => {
    if (!id) return;
    
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image,
          created_at,
          comment_count,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .eq('marketplace_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (postsData) {
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          content: post.content,
          image: post.image,
          createdAt: post.created_at,
          commentCount: post.comment_count || 0,
          likeCount: 0, // We'll need to get this separately if needed
          author: {
            id: post.user_id,
            name: post.profiles?.username || 'Unknown User',
            avatar: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.username || 'U')}`
          },
          marketplaceId: id
        }));
        
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };
  
  const loadPolls = async () => {
    if (!id) return;
    
    try {
      const { data: pollsData, error } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          image,
          created_at,
          total_votes,
          comment_count,
          user_id,
          profiles:user_id (username, avatar_url)
        `)
        .eq('marketplace_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (pollsData) {
        const formattedPolls = pollsData.map(poll => ({
          id: poll.id,
          question: poll.question,
          options: Array.isArray(poll.options) ? poll.options : [],
          image: poll.image,
          createdAt: poll.created_at,
          totalVotes: poll.total_votes || 0,
          commentCount: poll.comment_count || 0,
          author: {
            id: poll.user_id,
            name: poll.profiles?.username || 'Unknown User',
            avatar: poll.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(poll.profiles?.username || 'U')}`
          },
          marketplaceId: id
        }));
        
        setPolls(formattedPolls);
      }
    } catch (error) {
      console.error("Error loading polls:", error);
    }
  };
  
  const handleJoinMarketplace = async () => {
    if (!id || !user) return;
    
    setIsJoining(true);
    try {
      const success = await joinMarketplace(id);
      if (success) {
        setIsMember(true);
        loadMarketplaceData(); // Refresh marketplace data
      }
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeaveMarketplace = async () => {
    if (!id || !user) return;
    
    setIsLeaving(true);
    try {
      const success = await leaveMarketplace(id);
      if (success) {
        setIsMember(false);
        loadMarketplaceData(); // Refresh marketplace data
      }
    } finally {
      setIsLeaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  if (!marketplace) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-medium text-gray-500">Marketplace not found</p>
        <Button className="mt-4" onClick={() => navigate('/marketplaces')}>
          Browse Marketplaces
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cover and profile section */}
      <div className="relative">
        <div className="h-48 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 overflow-hidden">
          {marketplace.cover_url ? (
            <img 
              src={marketplace.cover_url} 
              alt={`${marketplace.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <ImageOff className="h-12 w-12 opacity-20" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 px-4">
          <div className="flex items-end">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage 
                src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}`} 
                alt={marketplace.name} 
              />
              <AvatarFallback>{marketplace.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 mb-2">
              <h1 className="text-2xl font-bold">{marketplace.name}</h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>{marketplace.member_count} members</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created {formatDistanceToNow(new Date(marketplace.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            {user ? (
              isMember ? (
                <Button 
                  variant="outline" 
                  onClick={handleLeaveMarketplace}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
                    "Leaving..."
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Leave
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinMarketplace}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    "Joining..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign in to join
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Marketplace description */}
      {marketplace.description && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">{marketplace.description}</p>
        </Card>
      )}
      
      {/* Tabs for content */}
      <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="pt-4">
          {isMember && <MarketplacePostInterface marketplaceId={id as string} />}
          
          {polls.length === 0 && posts.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-muted-foreground">No content in this marketplace yet</p>
              {isMember && (
                <p className="text-sm mt-2">Be the first to share something!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Polls */}
              {polls.map(poll => (
                <PollCard key={`poll-${poll.id}`} poll={poll} />
              ))}
              
              {/* Posts */}
              {posts.map(post => (
                <PostCard key={`post-${post.id}`} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="pt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Members ({membersList.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membersList.map(member => (
                <Card key={member.id} className="p-4 flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage 
                      src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'U')}`} 
                      alt={member.user?.username || 'User'} 
                    />
                    <AvatarFallback>
                      {member.user?.username ? member.user.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.user?.username || 'Unknown user'}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {member.role}
                    </div>
                  </div>
                </Card>
              ))}
              
              {membersList.length === 0 && (
                <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceProfile;
