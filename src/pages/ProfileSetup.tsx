
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle, Camera, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ImageCropper from '@/components/ImageCropper';

const ProfileSetup = () => {
  const { session, profile, loading } = useSupabase();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    avatar?: string;
  }>({});
  // Cropping State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [selectedFileExt, setSelectedFileExt] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrors(prev => ({ ...prev, avatar: undefined }));
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WEBP images are allowed');
      return;
    }

    setSelectedFileExt(file.name.split('.').pop() || null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImageUrl(e.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);
    try {
      const fileExt = selectedFileExt || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      // Upload the cropped image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully!');
      setCropperOpen(false);
      setOriginalImageUrl(null);
      setSelectedFileExt(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    setOriginalImageUrl(null);
    setSelectedFileExt(null);
  };

  const validateForm = () => {
    const newErrors: { username?: string; avatar?: string } = {};
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!avatarUrl) {
      newErrors.avatar = 'Profile image is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const fetchUserProfile = async () => {
    if (!session?.user.id) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(`Error fetching profile: ${getErrorMessage(error)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user.id);

      if (error) throw error;

      await fetchUserProfile();
      toast.success('Profile updated successfully!');
      // Navigate to find-friends page instead of home
      navigate('/find-friends');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Error updating profile: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex flex-col space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Set up your TUWAYE profile to get started.
          </p>
        </div>
        <Separator />
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32">
              {avatarUrl ? (
                <Avatar className="w-32 h-32">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback>
                    <User className="h-16 w-16" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-gray-300">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 right-0">
                <Label 
                  htmlFor="avatar" 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white cursor-pointer hover:bg-primary/90"
                >
                  {uploading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </Label>
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleProfileImageChange}
                  disabled={uploading}
                />
              </div>
            </div>
            {errors.avatar && (
              <p className="text-destructive text-sm font-medium">{errors.avatar}</p>
            )}
            <p className="text-sm text-center text-muted-foreground">
              Profile image is required
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (e.target.value.trim()) {
                    setErrors(prev => ({ ...prev, username: undefined }));
                  }
                }}
                placeholder="Choose a unique username"
              />
              {errors.username && (
                <p className="text-destructive text-sm">{errors.username}</p>
              )}
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={saving || uploading}
          >
            {saving ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Profile Setup'
            )}
          </Button>
        </form>
      </div>
      {/* Image Cropper Dialog */}
      {originalImageUrl && (
        <ImageCropper 
          imageUrl={originalImageUrl}
          onCrop={handleCropComplete}
          isOpen={cropperOpen}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default ProfileSetup;

