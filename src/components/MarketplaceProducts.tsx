
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
import { useBreakpoint } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";

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
    
    // Set up a real-time subscription for product changes
    const productsChannel = supabase
      .channel('marketplace_products_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'marketplace_products',
          filter: `marketplace_id=eq.${marketplaceId}`
        }, 
        () => {
          fetchMarketplaceProducts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [marketplaceId]);

  const handleProductAdded = () => {
    fetchMarketplaceProducts();
    setIsAddModalOpen(false);
    setIsSheetOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-medium flex items-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-primary" />
          Products & Services
        </h3>
        
        {isAdmin && (
          <>
            {/* Desktop button */}
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              size="sm"
              className="gap-1.5 hidden sm:flex bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
            
            {/* Mobile button */}
            <Button
              onClick={() => setIsSheetOpen(true)}
              size="sm"
              className="gap-1.5 sm:hidden bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden h-[300px] sm:h-[360px]">
              <Skeleton className="h-40 sm:h-52 w-full" />
              <CardContent className="p-3 sm:p-4">
                <Skeleton className="h-5 sm:h-6 w-3/4 mb-2 sm:mb-3" />
                <Skeleton className="h-3 sm:h-4 w-full mb-1.5 sm:mb-2" />
                <Skeleton className="h-3 sm:h-4 w-full mb-1.5 sm:mb-2" />
                <Skeleton className="h-3 sm:h-4 w-1/2 mb-4 sm:mb-5" />
                <Skeleton className="h-8 sm:h-10 w-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        <Card className="p-6 sm:p-8 text-center bg-gradient-to-r from-gray-50 to-gray-100/70 border-gray-200/70">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm">
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60" />
            </div>
            <p className="text-muted-foreground text-base sm:text-lg mt-2">No products or services available yet</p>
            {isAdmin && (
              <Button 
                onClick={isMobile ? () => setIsSheetOpen(true) : () => setIsAddModalOpen(true)} 
                variant="outline" 
                size="sm"
                className="mt-3 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Your First Product
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Desktop modal */}
      {isAddModalOpen && (
        <AddProductModal
          marketplaceId={marketplaceId}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onProductAdded={handleProductAdded}
        />
      )}
      
      {/* Mobile sheet */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Product</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <AddProductModal
                marketplaceId={marketplaceId}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onProductAdded={handleProductAdded}
                asSheet={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default MarketplaceProducts;
