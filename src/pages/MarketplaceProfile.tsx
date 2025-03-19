
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext';
import { useSupabase } from '../context/SupabaseContext';
import MarketplacePostInterface from '../components/MarketplacePostInterface';
import MarketplacePosts from '../components/MarketplacePosts';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { UserCircle, Users, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MarketplaceMember } from '../lib/types';

const MarketplaceProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const { 
    getMarketplace, 
    isMarketplaceMember, 
    isMarketplaceAdmin, 
    joinMarketplace, 
    leaveMarketplace,
    fetchMarketplaceMembers 
  } = useMarketplace();
  
  const [marketplace, setMarketplace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<MarketplaceMember[]>([]);
  const [joiningOrLeaving, setJoiningOrLeaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMarketplaceData(id);
    }
  }, [id, user]);

  const fetchMarketplaceData = async (marketplaceId: string) => {
    setLoading(true);
    try {
      const marketplaceData = await getMarketplace(marketplaceId);
      
      if (!marketplaceData) {
        toast.error('Marketplace not found');
        navigate('/');
        return;
      }
      
      setMarketplace(marketplaceData);
      
      if (user) {
        const memberStatus = await isMarketplaceMember(marketplaceId);
        setIsMember(memberStatus);
        
        const adminStatus = await isMarketplaceAdmin(marketplaceId);
        setIsAdmin(adminStatus);
        
        const membersList = await fetchMarketplaceMembers(marketplaceId);
        setMembers(membersList);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMarketplace = async () => {
    if (!user) {
      toast.error('You must be logged in to join this marketplace');
      return;
    }
    
    setJoiningOrLeaving(true);
    const success = await joinMarketplace(id!);
    if (success) {
      setIsMember(true);
      // Refresh member data
      const membersList = await fetchMarketplaceMembers(id!);
      setMembers(membersList);
    }
    setJoiningOrLeaving(false);
  };

  const handleLeaveMarketplace = async () => {
    if (!user) return;
    
    setJoiningOrLeaving(true);
    const success = await leaveMarketplace(id!);
    if (success) {
      setIsMember(false);
      // Refresh member data
      const membersList = await fetchMarketplaceMembers(id!);
      setMembers(membersList);
    }
    setJoiningOrLeaving(false);
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-screen-xl mx-auto">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
          <div className="h-8 bg-gray-200 w-1/3 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 w-1/2 rounded mb-8"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!marketplace) return null;
  
  // Get creator profile from members list
  const creator = members.find(member => member.user_id === marketplace.created_by);

  return (
    <div className="container py-6 max-w-screen-xl mx-auto">
      {/* Cover image */}
      <div 
        className="h-64 rounded-xl mb-6 bg-gray-100 relative bg-center bg-cover"
        style={{ 
          backgroundImage: marketplace.cover_url ? 
            `url(${marketplace.cover_url})` :
            'url(https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?q=80&w=2070)' 
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl"></div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Marketplace info */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Marketplace card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-50">
                <img 
                  src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}&background=random`}
                  alt={marketplace.name}
                  className="h-full w-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{marketplace.name}</h1>
                <div className="flex items-center mt-2 text-sm text-muted-foreground gap-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{marketplace.member_count} {marketplace.member_count === 1 ? 'member' : 'members'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Created {format(new Date(marketplace.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                
                {/* Join/leave buttons */}
                {user && (
                  <div className="mt-4">
                    {isMember ? (
                      <Button 
                        variant="outline" 
                        onClick={handleLeaveMarketplace}
                        disabled={joiningOrLeaving || isAdmin}
                        className="w-full"
                      >
                        {isAdmin ? "Admin can't leave" : "Leave Marketplace"}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleJoinMarketplace}
                        disabled={joiningOrLeaving}
                        className="w-full"
                      >
                        Join Marketplace
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {marketplace.description && (
              <div className="mt-6">
                <h3 className="font-medium text-sm mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{marketplace.description}</p>
              </div>
            )}
          </div>
          
          {/* Members card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members
            </h3>
            
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {members.slice(0, 10).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <img 
                    src={member.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.username || 'User')}`}
                    alt={member.user?.username || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-sm">{member.user?.username || 'Anonymous'}</span>
                      {member.role === 'admin' && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(member.joined_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
              
              {members.length > 10 && (
                <Button variant="ghost" className="w-full text-sm mt-2">
                  See all members
                </Button>
              )}
              
              {members.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-2">No members yet</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Feed */}
        <div className="flex-1">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-6">
              {/* Post interface (only for marketplace admins) */}
              {user && isAdmin && (
                <MarketplacePostInterface marketplaceId={id!} />
              )}
              
              {!isMember && !isAdmin && (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center mb-6">
                  <h3 className="font-medium mb-2">Join to see posts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to be a member to see content in this marketplace.
                  </p>
                  <Button 
                    onClick={handleJoinMarketplace}
                    disabled={joiningOrLeaving}
                  >
                    Join Marketplace
                  </Button>
                </div>
              )}
              
              {/* Display posts and polls if user is a member */}
              {(isMember || isAdmin) && (
                <MarketplacePosts marketplaceId={id!} />
              )}
            </TabsContent>
            
            <TabsContent value="about">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-medium mb-4">About {marketplace.name}</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm">{marketplace.description || 'No description provided.'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Created by</h3>
                    <div className="flex items-center gap-3">
                      <img 
                        src={creator?.user?.avatar_url || `https://ui-avatars.com/api/?name=Admin`}
                        alt="Creator"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">{creator?.user?.username || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          on {format(new Date(marketplace.created_at), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Rules</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Only admin can post in this marketplace</li>
                      <li>Be respectful of other members</li>
                      <li>No spam or self-promotion</li>
                      <li>Content must be relevant to the marketplace theme</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProfile;
