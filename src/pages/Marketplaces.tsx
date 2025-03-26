
import React, { useState } from 'react';
import MarketplaceList from '../components/MarketplaceList';
import { PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSupabase } from '../context/SupabaseContext';
import CreateMarketplaceModal from '../components/CreateMarketplaceModal';
import { useBreakpoint } from '../hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';

const Marketplaces: React.FC = () => {
  const { user } = useSupabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  return (
    <div className="container mx-auto py-8 w-full px-4 sm:px-6">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-100 rounded-2xl opacity-60"></div>
        <div className="relative px-6 py-8 sm:px-10 sm:py-12 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Marketplaces</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-2">Discover communities and explore products from various sellers</p>
            </div>
            
            {user && (
              <>
                {/* Desktop button */}
                <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-300">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Marketplace
                </Button>
                
                {/* Mobile button */}
                <Button onClick={() => setIsSheetOpen(true)} className="sm:hidden w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all duration-300">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Marketplace
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <MarketplaceList showCreateButton={false} />
      
      {/* Desktop modal */}
      <CreateMarketplaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      {/* Mobile sheet */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Marketplace</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <CreateMarketplaceModal
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                asSheet={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default Marketplaces;
