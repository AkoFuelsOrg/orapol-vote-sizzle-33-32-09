
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
    <div className="container mx-auto py-6 w-full px-4 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Marketplaces</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Join communities and explore marketplaces</p>
        </div>
        
        {user && (
          <>
            {/* Desktop button */}
            <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Marketplace
            </Button>
            
            {/* Mobile button */}
            <Button onClick={() => setIsSheetOpen(true)} className="sm:hidden w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Marketplace
            </Button>
          </>
        )}
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
