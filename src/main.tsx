
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { SupabaseProvider } from './context/SupabaseContext.tsx';
import { Toaster } from '@/components/ui/toaster';
import { PollProvider } from './context/PollContext.tsx';
import { GroupProvider } from './context/GroupContext.tsx';
import { MarketplaceProvider } from './context/MarketplaceContext.tsx';
import { ProductProvider } from './context/ProductContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <PollProvider>
          <GroupProvider>
            <MarketplaceProvider>
              <ProductProvider>
                <App />
                <Toaster />
              </ProductProvider>
            </MarketplaceProvider>
          </GroupProvider>
        </PollProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
