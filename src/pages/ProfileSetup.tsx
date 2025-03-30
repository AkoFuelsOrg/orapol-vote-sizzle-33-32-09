
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Camera, Upload, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { getAvatarUrl } from '../lib/avatar-utils';
import UserAvatar from '../components/UserAvatar';

const ProfileSetup: React.FC = () => {
  const { user, profile, updateProfile, loading } = useSupabase();
  const [username, setUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setLocalAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // If user is not logged in, redirect to auth page
  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleProfileImageClick = () => {
    profileFileInputRef.current?.click();
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const tempUrl = URL.createObjectURL(file);
      setLocalAvatarUrl(tempUrl);
      
      await updateProfile({ profileFile: file });
      toast.success('Profile image updated');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
      setLocalAvatarUrl(profile?.avatar_url || null);
    } finally {
      setUploading(false);
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    try {
      await updateProfile({ username });
      setSetupComplete(true);
      toast.success('Profile setup complete!');
      
      // Redirect to home page after a delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  if (!user) {
    return null; // Don't render anything while checking authentication
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4"
    >
      <Card className="w-full max-w-md shadow-lg border-none animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center">
            <div className="mb-3">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Set up your profile to get started with Tuwaye
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          {setupComplete ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">All Set!</h2>
              <p className="text-center text-muted-foreground mt-2">
                Your profile has been updated successfully. Redirecting you to the home page...
              </p>
            </div>
          ) : (
            <>
              {/* Profile image section */}
              <div className="flex flex-col items-center">
                <div 
                  onClick={handleProfileImageClick}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative bg-white"
                >
                  {uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {profile && (
                        <div className="w-full h-full">
                          <img 
                            src={localAvatarUrl || getAvatarUrl(profile.avatar_url)}
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </>
                  )}
                </div>
                <input 
                  type="file"
                  ref={profileFileInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Click to upload your profile picture
                </p>
              </div>
              
              {/* Username section */}
              <div className="space-y-1.5 pt-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Choose a username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  This is how other users will see you
                </p>
              </div>
            </>
          )}
        </CardContent>
        
        {!setupComplete && (
          <CardFooter>
            <Button 
              onClick={handleSaveProfile}
              disabled={loading || uploading || !username.trim()} 
              className="w-full bg-[#3eb0ff] hover:bg-[#2ea0ee]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue to Tuwaye <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProfileSetup;
