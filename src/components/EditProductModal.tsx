
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { ImagePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Product } from './MarketplaceProducts';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface EditProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().nullable(),
  price: z.preprocess(
    // First preprocess to handle empty strings
    (val) => (val === '' ? null : val),
    // Then validate and transform
    z.union([
      z.null(),
      z.number(),
      z.string().transform((val) => {
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      })
    ])
  ),
  is_available: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof formSchema>;

const EditProductModal = ({ product, isOpen, onClose, onProductUpdated }: EditProductModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.image_url);
  const [keepExistingImage, setKeepExistingImage] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      price: product.price,
      is_available: product.is_available,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description,
        price: product.price,
        is_available: product.is_available,
      });
      setImagePreview(product.image_url);
      setKeepExistingImage(true);
    }
  }, [product, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    setKeepExistingImage(false);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      setUploadError(null);
      console.log("Form values before submission:", values);
      
      let imageUrl = keepExistingImage ? product.image_url : null;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `marketplace_products/${fileName}`;
        
        console.log("Uploading image to bucket 'public':", fileName);
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('public')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error("Image upload error:", uploadError);
          setUploadError(`Image upload failed: ${uploadError.message}`);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        console.log("Image upload successful:", uploadData);
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
        console.log("Image public URL:", imageUrl);
      }
      
      // Ensure price is properly handled as a number or null
      const productData = {
        name: values.name,
        description: values.description,
        price: typeof values.price === 'string' ? parseFloat(values.price) || null : values.price,
        is_available: values.is_available,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Sending to Supabase:", productData);
      
      const { error, data } = await supabase
        .from('marketplace_products')
        .update(productData)
        .eq('id', product.id)
        .select();
        
      if (error) {
        console.error("Database update error:", error);
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      console.log("Product updated successfully:", data);
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      onProductUpdated();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: `Failed to update product: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product or service" 
                      className="resize-none min-h-[100px]"
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field: { onChange, value, ...rest }}) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Leave empty for 'Contact for price'" 
                        className="pl-7"
                        value={value === null ? '' : value}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChange(val === '' ? null : val);
                        }}
                        {...rest}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Available</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark this product as available for purchase
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {uploadError && (
              <Alert variant="destructive">
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="border rounded-md p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="mx-auto max-h-[200px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setKeepExistingImage(false);
                        setUploadError(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                    <ImagePlus className="h-10 w-10 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Upload a product image (optional)
                    </p>
                    <label htmlFor="image-upload-edit" className="cursor-pointer">
                      <span className="relative inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
                        Select Image
                      </span>
                      <input
                        id="image-upload-edit"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
