
import { useEffect, useState } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Plus, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AddProductModal from './AddProductModal';
import ProductCard from './ProductCard';

interface MarketplaceProductsProps {
  marketplaceId: string;
  isAdmin: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  is_available: boolean;
  marketplace_id: string;
}

const MarketplaceProducts = ({ marketplaceId, isAdmin }: MarketplaceProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useSupabase();

  const fetchMarketplaceProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('marketplace_products')
        .select('*')
        .eq('marketplace_id', marketplaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching marketplace products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (marketplaceId) {
      fetchMarketplaceProducts();
    }
  }, [marketplaceId]);

  const handleProductAdded = () => {
    fetchMarketplaceProducts();
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-primary/70" />
          Products & Services
        </h3>
        
        {isAdmin && (
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            size="sm"
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              isAdmin={isAdmin}
              onProductUpdated={fetchMarketplaceProducts}
            />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
            <p className="text-muted-foreground">No products or services available yet</p>
            {isAdmin && (
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Your First Product
              </Button>
            )}
          </div>
        </Card>
      )}

      {isAddModalOpen && (
        <AddProductModal
          marketplaceId={marketplaceId}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={handleProductAdded}
        />
      )}
    </div>
  );
};

export default MarketplaceProducts;
