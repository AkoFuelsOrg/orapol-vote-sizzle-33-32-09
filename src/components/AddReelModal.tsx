
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Film, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReel: (reel: { username: string; imageUrl: string }) => void;
}

const AddReelModal: React.FC<AddReelModalProps> = ({ isOpen, onClose, onAddReel }) => {
  const [username, setUsername] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    
    if (!imagePreview) {
      toast.error('Please upload an image');
      return;
    }
    
    // In a real app, you would upload the file to a server
    // For demo purposes, we'll just use the preview URL
    onAddReel({
      username: username.trim(),
      imageUrl: imagePreview,
    });
    
    // Reset form
    setUsername('');
    setImageFile(null);
    setImagePreview(null);
    
    // Close modal
    onClose();
    
    toast.success('Reel added successfully!');
  };
  
  const handleCancel = () => {
    setUsername('');
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Add New Reel
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Profile Image</Label>
            
            {!imagePreview ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => document.getElementById('image-input')?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm font-medium text-gray-900">Click to upload image</p>
                <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF (Max. 2MB)</p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview}
                  alt="Profile preview" 
                  className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-primary"
                />
                <button 
                  type="button" 
                  className="absolute top-0 right-1/3 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            <Input
              id="image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Add Reel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReelModal;
