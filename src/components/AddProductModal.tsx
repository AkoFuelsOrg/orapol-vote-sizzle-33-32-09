
import { useState } from "react";
import { useProducts, Product } from "../context/ProductContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, ImagePlus } from "lucide-react";

// Create a schema for product validation
const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  description: z.string().optional(),
  price: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: "Price must be a valid number",
  }).optional(),
  is_available: z.boolean().default(true),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketplaceId: string;
  product?: Product; // For editing mode
}

const AddProductModal = ({ isOpen, onClose, marketplaceId, product }: AddProductModalProps) => {
  const { addProduct, updateProduct } = useProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!product;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price?.toString() || "",
      is_available: product?.is_available ?? true,
      image_url: product?.image_url || "",
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      const productData = {
        name: values.name,
        description: values.description || undefined,
        price: values.price ? parseFloat(values.price) : undefined,
        is_available: values.is_available,
        image_url: values.image_url || undefined,
        marketplace_id: marketplaceId,
      };

      let success;
      if (isEditMode && product) {
        success = await updateProduct(product.id, productData);
      } else {
        success = await addProduct(productData);
      }

      if (success) {
        onClose();
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditMode ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your product information"
              : "Add a new product or service to your marketplace"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input type="text" className="pl-7" placeholder="0.00" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Image URL" {...field} />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => {
                          // This would typically open an image picker
                          // For now, just adding a placeholder
                          field.onChange("https://placehold.co/600x400");
                        }}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
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

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Update Product"
                  : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
