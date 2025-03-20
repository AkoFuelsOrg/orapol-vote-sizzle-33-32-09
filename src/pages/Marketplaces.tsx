
import React, { useState } from 'react';
import MarketplaceList from '../components/MarketplaceList';
import { PlusCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSupabase } from '../context/SupabaseContext';
import CreateMarketplaceModal from '../components/CreateMarketplaceModal';

const Marketplaces: React.FC = () => {
  const { user } = useSupabase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Marketplaces</h1>
          <p className="text-muted-foreground">Join communities and explore marketplaces</p>
        </div>
        
        {user && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Marketplace
          </Button>
        )}
      </div>
      
      <MarketplaceList showCreateButton={false} />
      
      <CreateMarketplaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default Marketplaces;
