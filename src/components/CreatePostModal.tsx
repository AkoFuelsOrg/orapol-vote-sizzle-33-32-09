
import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePostModalProps {
  isOpen?: boolean;
  onClose: () => void;
  groupId?: string; // Optional group ID for creating posts in a group
  marketplaceId?: string; // Added marketplaceId prop
}

const CreatePostModal = ({ isOpen = false, onClose, groupId, marketplaceId }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile } = useSupabase();
  
  useEffect(() => {
    // Reset form when modal is opened
    if (isOpen) {
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF and WEBP images are allowed');
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!content.trim() && !imageFile) {
      toast.error('Please add some content or an image to your post');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // If there's an image, upload it first
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post_images')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }
      
      // Create the post with groupId or marketplaceId if provided
      const postData = {
        content: content.trim(),
        user_id: user.id,
        image: imageUrl,
        ...(groupId ? { group_id: groupId } : {}),
        ...(marketplaceId ? { marketplace_id: marketplaceId } : {})
      };
      
      const { error: postError } = await supabase
        .from('posts')
        .insert(postData);
      
      if (postError) throw postError;
      
      toast.success('Post created successfully!');
      
      // Reset form and close modal
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-center font-bold text-lg">
          {marketplaceId ? 'Create Marketplace Post' : groupId ? 'Create Group Post' : 'Create Post'}
        </DialogTitle>
        
        <div className="flex items-start gap-3 mt-4">
          {user && (
            <img 
              src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://i.pravatar.cc/150"} 
              alt="Your avatar" 
              className="w-10 h-10 rounded-full border-2 border-red-500 shrink-0"
            />
          )}
          
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={marketplaceId ? "Share something with the marketplace..." : groupId ? "Share something with the group..." : "What's on your mind?"}
              className="resize-none border-0 p-0 focus-visible:ring-0 text-base h-32"
            />
            
            {imagePreview && (
              <div className="relative mt-3 rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Post preview" 
                  className="w-full h-auto max-h-[300px] object-contain bg-gray-100"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-b py-2 mt-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Add to your post</p>
            
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="post-image-upload"
              />
              <label 
                htmlFor="post-image-upload" 
                className="cursor-pointer p-2 rounded-full hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
              >
                <Image size={18} className="text-blue-500" />
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && !imageFile)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Posting...
              </>
            ) : 'Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
