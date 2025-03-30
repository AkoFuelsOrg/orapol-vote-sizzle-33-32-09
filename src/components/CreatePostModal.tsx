import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Loader2, BarChart2, Smile } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import CreatePollModal from './CreatePollModal';
import EmojiPicker from './EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export interface CreatePostModalProps {
  isOpen?: boolean;
  onClose: () => void;
  groupId?: string;
  marketplaceId?: string;
  initialContent?: string; // For editing mode
  isEditing?: boolean; // Flag to indicate editing mode
  postId?: string; // Post ID for editing
  initialImage?: string; // Initial image URL for editing
  onPostUpdate?: () => void; // Callback after post update
}

const CreatePostModal = ({ 
  isOpen = false, 
  onClose, 
  groupId, 
  marketplaceId, 
  initialContent = '', 
  isEditing = false,
  postId = '',
  initialImage = '',
  onPostUpdate
}: CreatePostModalProps) => {
  const [content, setContent] = useState(initialContent);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [keepExistingImage, setKeepExistingImage] = useState(!!initialImage);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, profile } = useSupabase();
  
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setImagePreview(initialImage || null);
      setKeepExistingImage(!!initialImage);
    }
  }, [isOpen, initialContent, initialImage]);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF and WEBP images are allowed');
      return;
    }
    
    setImageFile(file);
    setKeepExistingImage(false);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setKeepExistingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInsertEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!content.trim() && !imageFile && !keepExistingImage) {
      toast.error('Please add some content or an image to your post');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = keepExistingImage ? initialImage : null;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('post_images')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      if (isEditing && postId) {
        // Update existing post
        const postData = {
          content: content.trim(),
          image: imageUrl,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId)
          .eq('user_id', user.id); // Ensure the user owns the post
        
        if (updateError) throw updateError;
        
        toast.success('Post updated successfully!');
      } else {
        // Create new post
        const postData = {
          content: content.trim(),
          user_id: user.id,
          image: imageUrl,
          ...(groupId ? { group_id: groupId } : {}),
          ...(marketplaceId ? { marketplace_id: marketplaceId } : {})
        };
        
        const { data: newPost, error: postError } = await supabase
          .from('posts')
          .insert(postData)
          .select();
        
        if (postError) throw postError;
        
        // If we have the new post data and need immediate display
        if (newPost && newPost.length > 0) {
          const postId = newPost[0].id;
          
          // Fetch the complete post with profile details for immediate display
          const { data: completePost, error: fetchError } = await supabase
            .from('posts')
            .select(`
              id,
              content,
              created_at,
              image,
              comment_count,
              user_id
            `)
            .eq('id', postId)
            .single();
          
          if (!fetchError && completePost) {
            console.log('Post created successfully, ready for immediate display:', completePost);
          }
        }
        
        toast.success('Post created successfully!');
      }
      
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
      
      // Call the onPostUpdate callback if provided
      if (onPostUpdate) {
        onPostUpdate();
      }
      
    } catch (error: any) {
      console.error(isEditing ? 'Error updating post:' : 'Error creating post:', error);
      toast.error(error.message || (isEditing ? 'Failed to update post' : 'Failed to create post'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePollModalOpen = () => {
    onClose();
    setTimeout(() => {
      setPollModalOpen(true);
    }, 100);
  };

  const handlePollModalClose = () => {
    setPollModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="text-center font-bold text-lg">
            {isEditing 
              ? 'Edit Post' 
              : marketplaceId 
                ? 'Create Marketplace Post' 
                : groupId 
                  ? 'Create Group Post' 
                  : 'Create Post'
            }
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
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={marketplaceId ? "Share something with the marketplace..." : groupId ? "Share something with the group..." : "What's on your mind?"}
                  className="resize-none border-0 p-0 focus-visible:ring-0 text-base h-32"
                />
                <div className="absolute bottom-2 right-2">
                  <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                    <PopoverTrigger asChild>
                      <button 
                        type="button" 
                        className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-100"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-lg" align="end">
                      <EmojiPicker 
                        onSelectEmoji={handleInsertEmoji} 
                        onClose={() => setIsEmojiPickerOpen(false)} 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
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
              
              <div className="flex items-center">
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

                {!isEditing && (
                  <button
                    type="button"
                    onClick={handlePollModalOpen}
                    className="cursor-pointer p-2 rounded-full hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
                  >
                    <BarChart2 size={18} className="text-green-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile && !keepExistingImage)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Posting...'}
                </>
              ) : isEditing ? 'Update' : 'Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isEditing && (
        <CreatePollModal 
          isOpen={pollModalOpen} 
          onClose={handlePollModalClose}
          groupId={groupId}
          marketplaceId={marketplaceId}
        />
      )}
    </>
  );
};

export default CreatePostModal;
