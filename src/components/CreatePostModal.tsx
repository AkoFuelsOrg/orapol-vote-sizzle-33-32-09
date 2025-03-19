
import React, { useState } from 'react';
import { X, Image, PlusCircle, List, Loader2, Upload } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { user } = useSupabase();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'post' | 'poll'>('post');

  const handleUploadImage = async (file: File) => {
    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);
        
      setImageUrl(urlData.publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || "Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      setIsSubmitting(true);

      // Insert the post into Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
          image: imageUrl || null
        })
        .select();

      if (error) {
        throw error;
      }

      toast.success("Post created successfully");
      setContent('');
      setImageUrl('');
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToPoll = () => {
    onClose();
    window.location.href = '/create';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-xl shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create Post</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <Tabs defaultValue="post" className="w-full" onValueChange={(val) => setActiveTab(val as 'post' | 'poll')}>
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="post" className="flex-1">Post</TabsTrigger>
              <TabsTrigger value="poll" className="flex-1">Poll</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="post" className="p-4 focus:outline-none">
            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-2.5 min-h-[120px] border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  maxLength={500}
                />
              </div>
              
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={imageUrl} 
                    alt="Post image preview" 
                    className="w-full max-h-[200px] object-cover"
                    onError={() => {
                      toast.error("Invalid image");
                      setImageUrl('');
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-[100px] rounded-lg border border-dashed border-primary/30 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadImage(e.target.files[0]);
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  <div className="text-center text-muted-foreground">
                    {uploadingImage ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 mb-1" />
                        <p className="text-sm">Click to upload an image</p>
                      </>
                    )}
                  </div>
                </label>
              )}
              
              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 btn-animate"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </div>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="poll" className="p-4 focus:outline-none">
            <div className="text-center p-4">
              <List className="h-12 w-12 mx-auto mb-2 text-primary/70" />
              <h3 className="text-lg font-medium mb-1">Create a Poll</h3>
              <p className="text-muted-foreground mb-4">Ask a question and set up voting options</p>
              <button
                onClick={handleGoToPoll}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors btn-animate"
              >
                Create Poll
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatePostModal;
