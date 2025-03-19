
import React from 'react';
import MarketplaceList from '../components/MarketplaceList';
import { Helmet } from 'react-helmet';

const Marketplaces: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Marketplaces - PollSphere</title>
      </Helmet>
      
      <MarketplaceList />
    </div>
  );
};

export default Marketplaces;
