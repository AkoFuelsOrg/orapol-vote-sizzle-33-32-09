import React, { useEffect, useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle, UserPlus, Users, ChevronRight, Store } from 'lucide-react';
import { Marketplace } from '../lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import CreateMarketplaceModal from './CreateMarketplaceModal';
import { useBreakpoint } from '../hooks/use-mobile';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from './ui/pagination';
import { isBreakpoint } from '@/utils/breakpoint-utils';

interface MarketplaceListProps {
  showCreateButton?: boolean;
}

const MarketplaceCard: React.FC<{ marketplace: Marketplace; isUserMember: boolean; onJoin: () => void }> = ({ 
  marketplace, 
  isUserMember, 
  onJoin
}) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-primary/10">
      <div className="relative">
        {marketplace.cover_url && (
          <div className="h-40 w-full overflow-hidden">
            <img 
              src={marketplace.cover_url} 
              alt={`${marketplace.name} cover`} 
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
        {!marketplace.cover_url && (
          <div className="h-40 w-full bg-gradient-to-r from-primary/20 to-blue-100 flex items-center justify-center">
            <Store className="h-12 w-12 text-primary opacity-70" />
          </div>
        )}
      </div>
      <CardHeader className="relative pb-2">
        <Avatar className="h-16 w-16 absolute -top-8 left-4 border-4 border-white shadow-md">
          <AvatarImage 
            src={marketplace.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(marketplace.name)}&background=3498db&color=fff`} 
            alt={marketplace.name}
          />
          <AvatarFallback className="bg-gradient-to-r from-primary to-blue-500 text-white">{marketplace.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={marketplace.avatar_url ? "ml-20" : ""}>
          <CardTitle className="text-xl font-bold">{marketplace.name}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1 text-sm">
            {marketplace.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          <span>{marketplace.member_count || 0} members</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {isUserMember ? (
          <Button asChild variant="outline" className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
            <Link to={`/marketplace/${marketplace.id}`}>
              Visit <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={onJoin} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all">
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
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpoint(breakpoint, "mobile");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(marketplaces.length / itemsPerPage);
  
  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMarketplaces = marketplaces.slice(indexOfFirstItem, indexOfLastItem);

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
        <div className="h-40 w-full">
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Discover Marketplaces</h2>
        {showCreateButton && user && !isMobile && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Marketplace
          </Button>
        )}
      </div>

      {user && userMarketplaces.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-primary">Your Marketplaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <h3 className="text-xl font-semibold text-primary">Browse All Marketplaces</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderSkeletons()}
          </div>
        ) : marketplaces.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-r from-primary/5 to-blue-50 rounded-xl">
            <Store className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground text-lg mb-3">No marketplaces available yet</p>
            {user && (
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
              >
                Create the first marketplace
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentMarketplaces.map((marketplace) => (
                <MarketplaceCard
                  key={marketplace.id}
                  marketplace={marketplace}
                  isUserMember={userMarketplaceIds.has(marketplace.id)}
                  onJoin={() => handleJoinMarketplace(marketplace.id)}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
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
