import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, ImageOff, Calendar, UserMinus, Info, Pencil, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import MarketplacePostInterface from '@/components/MarketplacePostInterface';
import { MarketplaceMember, Post, Poll, PollOption } from '@/lib/types';
import PostCard from '@/components/PostCard';
import PollCard from '@/components/PollCard';
import { supabase } from '@/integrations/supabase/client';
import EditMarketplaceModal from '@/components/EditMarketplaceModal';
import MarketplaceProducts from '@/components/MarketplaceProducts';
import { useBreakpoint } from '@/hooks/use-mobile';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
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
      
      if (user) {
        const memberStatus = await isMarketplaceMember(id);
        setIsMember(memberStatus);
        
        if (memberStatus) {
          const members = await fetchMarketplaceMembers(id);
          setMembersList(members);
          
          const currentUserMember = members.find(member => member.user_id === user.id);
          setIsAdmin(currentUserMember?.role === 'admin');
        }
      }
      
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
          user_id
        `)
        .eq('marketplace_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (postsData) {
        const formattedPosts: Post[] = [];
        
        for (const post of postsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', post.user_id)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            continue;
          }
          
          formattedPosts.push({
            id: post.id,
            content: post.content,
            image: post.image,
            createdAt: post.created_at,
            commentCount: post.comment_count || 0,
            likeCount: 0,
            userLiked: false,
            author: {
              id: post.user_id,
              name: profileData?.username || 'Unknown User',
              avatar: profileData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.username || 'U')}`
            },
            marketplace_id: marketplace.id
          });
        }
        
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
          user_id
        `)
        .eq('marketplace_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (pollsData) {
        const formattedPolls: Poll[] = [];
        
        for (const poll of pollsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', poll.user_id)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            continue;
          }
          
          const options: PollOption[] = [];
          if (Array.isArray(poll.options)) {
            for (const option of poll.options) {
              if (typeof option === 'object' && option !== null) {
                options.push({
                  id: (option as any).id || `option-${Math.random().toString(36).substr(2, 9)}`,
                  text: (option as any).text || '',
                  votes: (option as any).votes || 0,
                  imageUrl: (option as any).imageUrl || null
                });
              }
            }
          }
          
          formattedPolls.push({
            id: poll.id,
            question: poll.question,
            options: options,
            image: poll.image,
            createdAt: poll.created_at,
            totalVotes: poll.total_votes || 0,
            commentCount: poll.comment_count || 0,
            author: {
              id: poll.user_id,
              name: profileData?.username || 'Unknown User',
              avatar: profileData?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.username || 'U')}`
            },
            marketplace_id: marketplace.id
          });
        }
        
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
        loadMarketplaceData();
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
        loadMarketplaceData();
      }
    } finally {
      setIsLeaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 px-4 py-6 max-w-7xl mx-auto">
        <Skeleton className="h-52 sm:h-64 w-full rounded-xl" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 sm:h-24 sm:w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-8 w-32 sm:w-48" />
            <Skeleton className="h-4 w-20 sm:w-24" />
          </div>
        </div>
        <Skeleton className="h-24 sm:h-32 w-full rounded-lg" />
      </div>
    );
  }
  
  if (!marketplace) {
    return (
      <div className="text-center py-16 bg-gray-50/50 rounded-xl max-w-3xl mx-auto mt-8 border border-gray-100">
        <p className="text-xl font-medium text-gray-500">Marketplace not found</p>
        <Button className="mt-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700" onClick={() => navigate('/marketplaces')}>
          Browse Marketplaces
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="h-56 sm:h-80 w-full overflow-hidden relative">
          {marketplace.cover_url ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50 z-10"></div>
              <img 
                src={marketplace.cover_url} 
                alt={`${marketplace.name} cover`}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-r from-primary/50 to-blue-500/50 text-white">
              <ImageOff className="h-12 w-12 sm:h-16 sm:w-16 opacity-30" />
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mt-[-4rem] sm:mt-[-6rem] px-4 sm:px-8 relative z-20">
          <div className="flex items-end">
            <Avatar className="h-20 w-20 sm:h-32 sm:w-32 border-4 border-white shadow-lg ring-2 ring-primary/10">
              <AvatarImage 
                src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}&background=6366f1&color=fff`} 
                alt={marketplace.name} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-2xl">{marketplace.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4 mb-2 bg-white/90 backdrop-blur-sm rounded-lg px-4 sm:px-5 py-1.5 sm:py-2 shadow-sm">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent line-clamp-2">{marketplace.name}</h1>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 ml-24 sm:ml-36 md:ml-0 mb-2 flex gap-2">
            {user ? (
              isMember ? (
                <Button 
                  variant="outline" 
                  onClick={handleLeaveMarketplace}
                  disabled={isLeaving}
                  className="shadow-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                  size={isMobile ? "sm" : "default"}
                >
                  {isLeaving ? (
                    "Leaving..."
                  ) : (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      <span className={isMobile ? "hidden" : "inline"}>Leave Marketplace</span>
                      <span className={isMobile ? "inline" : "hidden"}>Leave</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinMarketplace}
                  disabled={isJoining}
                  className="shadow-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all"
                  size={isMobile ? "sm" : "default"}
                >
                  {isJoining ? (
                    "Joining..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span className={isMobile ? "hidden" : "inline"}>Join Marketplace</span>
                      <span className={isMobile ? "inline" : "hidden"}>Join</span>
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button 
                onClick={() => navigate('/auth')} 
                className="shadow-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all"
                size={isMobile ? "sm" : "default"}
              >
                Sign in to join
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-2 flex-wrap">
        <Badge variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full">
          <Users className="h-3.5 w-3.5" />
          <span>{membersList.length || 0} {membersList.length === 1 ? 'member' : 'members'}</span>
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5 text-sm flex items-center gap-1.5 rounded-full">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {marketplace.created_at ? formatDistanceToNow(new Date(marketplace.created_at), { addSuffix: false }) + ' ago' : ''}</span>
        </Badge>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="ml-1 h-8 shadow-sm border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>
      
      {marketplace.description && (
        <Card className="p-4 sm:p-6 bg-white/95 backdrop-blur-sm shadow-sm border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex items-start">
            <Info className="h-5 w-5 mr-3 text-primary/70 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{marketplace.description}</p>
          </div>
        </Card>
      )}
      
      <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 bg-gray-100/70 p-1 rounded-xl">
          <TabsTrigger value="feed" className="text-xs sm:text-sm md:text-base py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Feed</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm md:text-base py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            Products
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs sm:text-sm md:text-base py-2 sm:py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feed" className="pt-2 sm:pt-4 focus-visible:outline-none focus-visible:ring-0">
          {isMember && <MarketplacePostInterface marketplaceId={marketplace.id} />}
          
          {polls.length === 0 && posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gradient-to-r from-gray-50 to-gray-100/70 rounded-xl mt-4 border border-gray-200/70">
              <p className="text-muted-foreground text-base sm:text-lg">No content in this marketplace yet</p>
              {isMember && (
                <p className="text-sm mt-2 text-gray-500">Be the first to share something!</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {polls.map(poll => (
                <PollCard key={`poll-${poll.id}`} poll={poll} />
              ))}
              
              {posts.map(post => (
                <PostCard key={`post-${post.id}`} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="products" className="pt-2 sm:pt-4 focus-visible:outline-none focus-visible:ring-0">
          {id && <MarketplaceProducts marketplaceId={marketplace.id} isAdmin={isAdmin} />}
        </TabsContent>
        
        <TabsContent value="members" className="pt-2 sm:pt-4 focus-visible:outline-none focus-visible:ring-0">
          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-medium flex items-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Members ({membersList.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {membersList.map(member => (
                <Card key={member.id} className="p-3 sm:p-4 flex items-center hover:shadow-md transition-all duration-300 border-gray-100 bg-white">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4 border border-gray-200">
                    <AvatarImage 
                      src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'U')}&background=6366f1&color=fff`} 
                      alt={member.user?.username || 'User'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                      {member.user?.username ? member.user.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{member.user?.username || 'Unknown user'}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-0.5 sm:mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${member.role === 'admin' ? 'bg-primary' : 'bg-green-500'} mr-1.5`}></span>
                      <span className="capitalize">{member.role}</span>
                    </div>
                  </div>
                </Card>
              ))}
              
              {membersList.length === 0 && (
                <div className="col-span-full text-center py-10 sm:py-12 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-muted-foreground">No members found</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {isEditModalOpen && marketplace && (
        <EditMarketplaceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          marketplace={marketplace}
        />
      )}
    </div>
  );
};

export default MarketplaceProfile;
