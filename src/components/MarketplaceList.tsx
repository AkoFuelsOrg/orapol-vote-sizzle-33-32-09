
import React, { useEffect, useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, UserPlus, Users, ChevronRight } from 'lucide-react';
import { Marketplace } from '../lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import CreateMarketplaceModal from './CreateMarketplaceModal';

interface MarketplaceListProps {
  showCreateButton?: boolean;
}

const MarketplaceCard: React.FC<{ marketplace: Marketplace; isUserMember: boolean; onJoin: () => void }> = ({ 
  marketplace, 
  isUserMember, 
  onJoin
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {marketplace.cover_url && (
        <div className="h-32 w-full overflow-hidden">
          <img 
            src={marketplace.cover_url} 
            alt={`${marketplace.name} cover`} 
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="relative pb-2">
        <Avatar className="h-16 w-16 absolute -top-8 left-4 border-4 border-white">
          <AvatarImage src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}`} />
          <AvatarFallback>{marketplace.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={marketplace.avatar_url ? "ml-20" : ""}>
          <CardTitle className="text-xl">{marketplace.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {marketplace.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>{marketplace.member_count} members</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {isUserMember ? (
          <Button asChild variant="outline" className="w-full">
            <Link to={`/marketplace/${marketplace.id}`}>
              Visit <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={onJoin} className="w-full">
            <UserPlus className="mr-1 h-4 w-4" /> Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const MarketplaceList: React.FC<MarketplaceListProps> = ({ showCreateButton = true }) => {
  const { marketplaces, userMarketplaces, isLoading, fetchMarketplaces, fetchUserMarketplaces, joinMarketplace } = useMarketplace();
  const { user } = useSupabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userMarketplaceIds, setUserMarketplaceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMarketplaces();
    if (user) {
      fetchUserMarketplaces();
    }
  }, [user]);

  useEffect(() => {
    setUserMarketplaceIds(new Set(userMarketplaces.map(m => m.id)));
  }, [userMarketplaces]);

  const handleJoinMarketplace = async (marketplaceId: string) => {
    if (user) {
      const success = await joinMarketplace(marketplaceId);
      if (success) {
        setUserMarketplaceIds(prev => new Set([...prev, marketplaceId]));
      }
    }
  };

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Card key={index} className="overflow-hidden">
        <div className="h-32 w-full">
          <Skeleton className="h-full w-full" />
        </div>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="pb-2">
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
        <CardFooter className="pt-2">
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Marketplaces</h2>
        {showCreateButton && user && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Marketplace
          </Button>
        )}
      </div>

      {user && userMarketplaces.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Marketplaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userMarketplaces.map((marketplace) => (
              <MarketplaceCard
                key={marketplace.id}
                marketplace={marketplace}
                isUserMember={true}
                onJoin={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discover Marketplaces</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderSkeletons()}
          </div>
        ) : marketplaces.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">No marketplaces available yet</p>
            {user && (
              <Button 
                variant="link" 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2"
              >
                Create the first marketplace
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaces.map((marketplace) => (
              <MarketplaceCard
                key={marketplace.id}
                marketplace={marketplace}
                isUserMember={userMarketplaceIds.has(marketplace.id)}
                onJoin={() => handleJoinMarketplace(marketplace.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateMarketplaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default MarketplaceList;
