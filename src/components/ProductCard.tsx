
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from './MarketplaceProducts';
import { MessageSquare, Pencil, Trash2, ImageOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import EditProductModal from './EditProductModal';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  onProductUpdated: () => void;
}

const ProductCard = ({ product, isAdmin, onProductUpdated }: ProductCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { user } = useSupabase();

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Contact for price';
    return `$${price.toFixed(2)}`;
  };

  const handleContactSeller = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You need to sign in to message the seller',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Get the seller info and navigate to messages
    const fetchSellerInfo = async () => {
      try {
        const { data: marketplaceData, error: marketplaceError } = await supabase
          .from('marketplaces')
          .select('created_by')
          .eq('id', product.marketplace_id)
          .single();

        if (marketplaceError) throw marketplaceError;
        
        if (marketplaceData.created_by) {
          // Navigate to messages with this user
          navigate(`/messages?userId=${marketplaceData.created_by}&productId=${product.id}`);
        }
      } catch (error) {
        console.error('Error fetching seller info:', error);
        toast({
          title: 'Error',
          description: 'Unable to contact seller at this time',
          variant: 'destructive',
        });
      }
    };

    fetchSellerInfo();
  };

  const handleDeleteProduct = async () => {
    if (!isAdmin) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('marketplace_products')
        .delete()
        .eq('id', product.id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      
      onProductUpdated();
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative h-48 bg-gray-100">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageOff className="h-10 w-10 text-gray-400" />
            </div>
          )}
          {!product.is_available && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Unavailable
            </div>
          )}
        </div>
        
        <CardContent className="pt-4 flex-grow">
          <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
            {product.description || 'No description provided'}
          </p>
          <p className="font-medium text-primary">
            {formatPrice(product.price)}
          </p>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4 px-6 gap-2 justify-between">
          {isAdmin ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleContactSeller}
              size="sm"
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Contact Seller
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <EditProductModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProductUpdated={onProductUpdated}
        />
      )}
    </>
  );
};

export default ProductCard;
