
import { useState } from "react";
import { Product, useProducts } from "../context/ProductContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Package, Pencil, Trash2, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabase } from "../context/SupabaseContext";
import AddProductModal from "./AddProductModal";

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  marketplaceOwnerId: string;
}

const ProductCard = ({ product, isAdmin, marketplaceOwnerId }: ProductCardProps) => {
  const navigate = useNavigate();
  const { deleteProduct } = useProducts();
  const { user } = useSupabase();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(product.id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleMessageSeller = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message the seller",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Navigate to messages with the marketplace owner
    navigate(`/messages/${marketplaceOwnerId}`);
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        {product.image_url && (
          <div className="h-48 overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
            />
          </div>
        )}
        
        <CardContent className={`p-4 ${product.image_url ? '' : 'pt-4'}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
            <Badge variant={product.is_available ? "default" : "outline"} className="ml-2">
              {product.is_available ? "Available" : "Unavailable"}
            </Badge>
          </div>
          
          {product.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{product.description}</p>
          )}
          
          <div className="flex justify-between items-center">
            {product.price ? (
              <span className="text-lg font-medium">${product.price.toFixed(2)}</span>
            ) : (
              <span className="text-gray-500 italic text-sm">Contact for price</span>
            )}
            
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleMessageSeller}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Contact
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <AddProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          marketplaceId={product.marketplace_id}
          product={product}
        />
      )}
    </>
  );
};

export default ProductCard;
