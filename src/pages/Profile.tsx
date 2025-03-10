
import React, { useState, useRef, useEffect } from 'react';
import { usePollContext } from '../context/PollContext';
import PollCard from '../components/PollCard';
import Header from '../components/Header';
import { useSupabase } from '../context/SupabaseContext';
import { Pencil, Upload, Loader2, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import UserList from '../components/UserList';

const Profile: React.FC = () => {
  const { polls, currentUser } = usePollContext();
  const { user, profile, updateProfile, loading: profileLoading, getFollowCounts } = useSupabase();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [uploading, setUploading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter polls created by the current user
  const userPolls = polls.filter(poll => poll.author.id === currentUser.id);
  
  // Find polls the user has voted on
  const votedPolls = polls.filter(poll => poll.userVoted);
  
  useEffect(() => {
    if (user) {
      fetchFollowCounts();
    }
  }, [user]);
  
  const fetchFollowCounts = async () => {
    if (user) {
      const counts = await getFollowCounts(user.id);
      setFollowCounts(counts);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    try {
      await updateProfile({ username });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      
      // Make sure the file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      // File size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Upload the image and update profile
      await updateProfile({ file });
      toast.success('Profile image updated successfully');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const avatarUrl = profile?.avatar_url || (user?.id ? `https://i.pravatar.cc/150?u=${user.id}` : '');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div 
                onClick={handleImageClick}
                className="w-24 h-24 rounded-full border-2 border-border overflow-hidden cursor-pointer group-hover:opacity-80 transition-opacity relative"
              >
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <img 
                      src={avatarUrl} 
                      alt={profile?.username || 'User'} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </>
                )}
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="mt-4 text-center w-full">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-3 py-2 border border-input rounded text-center w-full focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Enter username"
                  />
                  <div className="flex space-x-2 justify-center">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                      className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
                    >
                      {profileLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setUsername(profile?.username || '');
                      }}
                      className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <h2 className="text-xl font-bold">{profile?.username || 'Anonymous'}</h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
              <p className="text-muted-foreground mt-1">{user?.email}</p>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-6 justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{userPolls.length}</p>
              <p className="text-sm text-muted-foreground">Polls</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followCounts.followers}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followCounts.following}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="polls" className="w-full animate-fade-in">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="polls">My Polls</TabsTrigger>
            <TabsTrigger value="voted">Voted</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
          
          <TabsContent value="polls" className="mt-0">
            {userPolls.length > 0 ? (
              <div className="space-y-4">
                {userPolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">You haven't created any polls yet.</p>
                <div className="inline-block">
                  <a 
                    href="/create" 
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Your First Poll
                  </a>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="voted" className="mt-0">
            {votedPolls.length > 0 ? (
              <div className="space-y-4">
                {votedPolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't voted on any polls yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="followers" className="mt-0">
            {user ? (
              <UserList userId={user.id} type="followers" />
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            {user ? (
              <UserList userId={user.id} type="following" />
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
