
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { LoaderCircle, Camera, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UserAvatar from '@/components/UserAvatar';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';

const ProfileSetup = () => {
  const { supabase, session, profile, loading, fetchUserProfile } = useSupabase();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    avatar?: string;
  }>({});

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setErrors(prev => ({ ...prev, avatar: undefined }));
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session?.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setUploading(false);
    }
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
          bio,
          location,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user.id);

      if (error) throw error;

      await fetchUserProfile();
      toast.success('Profile updated successfully!');
      navigate('/');
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
                  onChange={uploadAvatar}
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
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="resize-none h-24"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where are you based?"
              />
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
    </div>
  );
};

export default ProfileSetup;
