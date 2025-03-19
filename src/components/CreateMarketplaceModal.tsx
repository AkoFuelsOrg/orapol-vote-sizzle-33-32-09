
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useMarketplace } from '../context/MarketplaceContext';
import { PlusCircle, X, Upload } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../components/ui/use-toast';

interface CreateMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMarketplaceModal: React.FC<CreateMarketplaceModalProps> = ({ isOpen, onClose }) => {
  const { createMarketplace } = useMarketplace();
  const { user } = useSupabase();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      console.log(`Uploading file to: ${filePath} in bucket: marketplaces`);
      
      const { error: uploadError, data } = await supabase.storage
        .from('marketplaces')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from('marketplaces').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!name.trim()) {
      setNameError('Marketplace name is required');
      return;
    }
    
    setNameError('');
    setIsSubmitting(true);

    try {
      let avatarUrl = null;
      let coverUrl = null;

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatars');
      }

      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'covers');
      }

      const marketplaceId = await createMarketplace({
        name,
        description,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });

      if (marketplaceId) {
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error creating marketplace:', error);
      toast({
        title: "Error",
        description: "Failed to create marketplace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
    setNameError('');
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create a Marketplace</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="cover" className="block text-sm font-medium">
              Cover Image (Optional)
            </label>
            <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
              {coverPreview ? (
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <input 
                type="file" 
                id="cover" 
                accept="image/*" 
                onChange={handleCoverChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="avatar" className="block text-sm font-medium">
              Marketplace Avatar (Optional)
            </label>
            <div className="relative h-24 w-24 bg-gray-100 rounded-full overflow-hidden mx-auto">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <input 
                type="file" 
                id="avatar" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Marketplace Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter marketplace name"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this marketplace is about"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Marketplace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMarketplaceModal;
