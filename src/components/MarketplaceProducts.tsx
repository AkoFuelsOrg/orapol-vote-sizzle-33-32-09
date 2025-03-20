
import { useEffect, useState } from "react";
import { useProducts, Product } from "../context/ProductContext";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import ProductCard from "./ProductCard";
import AddProductModal from "./AddProductModal";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketplaceProductsProps {
  marketplaceId: string;
  isAdmin: boolean;
  marketplaceOwnerId: string;
}

const MarketplaceProducts = ({ marketplaceId, isAdmin, marketplaceOwnerId }: MarketplaceProductsProps) => {
  const { products, isLoading, fetchMarketplaceProducts } = useProducts();
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  useEffect(() => {
    if (marketplaceId) {
      fetchMarketplaceProducts(marketplaceId);
    }
  }, [marketplaceId, fetchMarketplaceProducts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center">
          <Package className="h-4 w-4 mr-2 text-primary/70" />
          Products & Services
        </h3>
        {isAdmin && (
          <Button 
            onClick={() => setIsAddProductModalOpen(true)}
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-muted-foreground">No products in this marketplace yet</p>
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAddProductModalOpen(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAdmin={isAdmin}
              marketplaceOwnerId={marketplaceOwnerId}
            />
          ))}
        </div>
      )}

      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          marketplaceId={marketplaceId}
        />
      )}
    </div>
  );
};

export default MarketplaceProducts;
