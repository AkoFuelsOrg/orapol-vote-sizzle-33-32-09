
import React from 'react';
import MarketplaceList from '../components/MarketplaceList';

const Marketplaces: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplaces</h1>
        <p className="text-muted-foreground">Join communities and explore marketplaces</p>
      </div>
      
      <MarketplaceList />
    </div>
  );
};

export default Marketplaces;
