
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useMarketplace } from '../context/MarketplaceContext';
import { Pencil, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { toast } from './ui/use-toast';
import { Marketplace } from '../lib/types';

interface EditMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketplace: Marketplace;
}

const EditMarketplaceModal: React.FC<EditMarketplaceModalProps> = ({ 
  isOpen, 
  onClose, 
  marketplace 
}) => {
  const { updateMarketplace } = useMarketplace();
  const { user } = useSupabase();
  const [name, setName] = useState(marketplace.name);
  const [description, setDescription] = useState(marketplace.description || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(marketplace.avatar_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(marketplace.cover_url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form with marketplace data when modal opens
      setName(marketplace.name);
      setDescription(marketplace.description || '');
      setAvatarPreview(marketplace.avatar_url);
      setCoverPreview(marketplace.cover_url);
      setAvatarFile(null);
      setCoverFile(null);
      setNameError('');
    }
  }, [isOpen, marketplace]);

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
      let avatarUrl = marketplace.avatar_url;
      let coverUrl = marketplace.cover_url;

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatars');
      }

      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'covers');
      }

      const success = await updateMarketplace(marketplace.id, {
        name,
        description,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });

      if (success) {
        toast({
          title: "Success",
          description: "Marketplace updated successfully",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating marketplace:', error);
      toast({
        title: "Error",
        description: "Failed to update marketplace. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Marketplace</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="cover" className="block text-sm font-medium">
              Cover Image
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
              Marketplace Avatar
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
              Description
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
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Update Marketplace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMarketplaceModal;
