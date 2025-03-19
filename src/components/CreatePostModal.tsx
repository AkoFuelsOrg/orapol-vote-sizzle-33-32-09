
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '@/context/SupabaseContext';
import { Loader2, Image, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import GifSelector from './GifSelector';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  open, 
  onOpenChange,
  onPostCreated
}) => {
  const { user } = useSupabase();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setSelectedImageUrl(URL.createObjectURL(file));
      setSelectedGif(null); // Clear GIF if an image is selected
    }
  };
  
  const handleGifSelected = (url: string) => {
    setSelectedGif(url);
    setSelectedImage(null); // Clear image if a GIF is selected
    setSelectedImageUrl('');
  };
  
  const removeSelectedMedia = () => {
    setSelectedImage(null);
    setSelectedImageUrl('');
    setSelectedGif(null);
  };
  
  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
  };
  
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to create a post");
      return;
    }
    
    if (!content.trim() && !selectedImage && !selectedGif) {
      toast.error("Post cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = selectedGif;
      
      // Upload image if one is selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(filePath, selectedImage);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }
      
      // Create post
      const { error } = await (supabase
        .from('posts') as any)
        .insert({
          content,
          user_id: user.id,
          image: imageUrl
        });
        
      if (error) throw error;
      
      // Reset form
      setContent('');
      setSelectedImage(null);
      setSelectedImageUrl('');
      setSelectedGif(null);
      onOpenChange(false);
      onPostCreated();
      
      toast.success("Post created successfully");
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          
          {(selectedImageUrl || selectedGif) && (
            <div className="relative mt-4 rounded-lg overflow-hidden">
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
                onClick={removeSelectedMedia}
              >
                <X size={16} />
              </Button>
              <img 
                src={selectedImageUrl || selectedGif || ''} 
                alt="Selected media" 
                className="w-full h-auto max-h-[300px] object-contain rounded-lg"
              />
            </div>
          )}
          
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
              <label>
                <Image size={18} />
                <span>Image</span>
                <input 
                  type="file" 
                  hidden 
                  accept="image/*"
                  onChange={handleImageSelection}
                />
              </label>
            </Button>
            
            <GifSelector onSelect={handleGifSelected} />
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (!content.trim() && !selectedImage && !selectedGif)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
