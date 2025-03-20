
import { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../components/ui/use-toast";
import { useSupabase } from "./SupabaseContext";

export interface Product {
  id: string;
  marketplace_id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  fetchMarketplaceProducts: (marketplaceId: string) => Promise<Product[]>;
  addProduct: (data: Omit<Product, 'id' | 'created_at'>) => Promise<boolean>;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id' | 'marketplace_id' | 'created_at'>>) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
}

const ProductContext = createContext<ProductContextType | null>(null);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSupabase();

  const fetchMarketplaceProducts = async (marketplaceId: string): Promise<Product[]> => {
    if (!marketplaceId) return [];
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("marketplace_id", marketplaceId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setProducts(data as Product[]);
        return data as Product[];
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching marketplace products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (data: Omit<Product, 'id' | 'created_at'>): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a product",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("marketplace_products")
        .insert(data);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Product added successfully",
      });
      
      await fetchMarketplaceProducts(data.marketplace_id);
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateProduct = async (productId: string, data: Partial<Omit<Product, 'id' | 'marketplace_id' | 'created_at'>>): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update a product",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from("marketplace_products")
        .update(data)
        .eq("id", productId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      // Refresh products list after update
      if (products.length > 0) {
        const marketplaceId = products.find(p => p.id === productId)?.marketplace_id;
        if (marketplaceId) {
          await fetchMarketplaceProducts(marketplaceId);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a product",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Store marketplace ID before deletion
      const marketplaceId = products.find(p => p.id === productId)?.marketplace_id;
      
      const { error } = await supabase
        .from("marketplace_products")
        .delete()
        .eq("id", productId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Refresh products list if we have the marketplace ID
      if (marketplaceId) {
        await fetchMarketplaceProducts(marketplaceId);
      } else {
        setProducts(products.filter(p => p.id !== productId));
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      return false;
    }
  };

  const value = {
    products,
    isLoading,
    fetchMarketplaceProducts,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
