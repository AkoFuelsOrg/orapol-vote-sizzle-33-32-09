import React, { useState, useRef, useEffect } from 'react';
import { usePollContext } from '../context/PollContext';
import PollCard from '../components/PollCard';
import PostCard from '../components/PostCard';
import Header from '../components/Header';
import { useSupabase } from '../context/SupabaseContext';
import { Pencil, Upload, Loader2, UserCircle, Users, Lock, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import UserList from '../components/UserList';
import { supabase } from '../integrations/supabase/client';
import { Poll, PollOption, Post } from '../lib/types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import UserAvatar from '../components/UserAvatar';
import { useBreakpoint } from '../hooks/use-mobile';
import ImageCropper from '../components/ImageCropper';
import { getAvatarUrl } from '../lib/avatar-utils';

const Profile: React.FC = () => {
  const { polls, currentUser } = usePollContext();
  const { user, profile, updateProfile, loading: profileLoading, getFollowCounts, updatePassword } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [selectedFileExt, setSelectedFileExt] = useState<string | null>(null);
  
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      fetchFollowCounts();
      fetchUserPolls();
      fetchUserPosts();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setLocalAvatarUrl(profile.avatar_url);
      setLocalCoverUrl(profile.cover_url);
    }
  }, [profile]);
  
  const fetchFollowCounts = async () => {
    if (user) {
      const counts = await getFollowCounts(user.id);
      setFollowCounts(counts);
    }
  };
  
  const fetchUserPolls = async () => {
    if (!user) return;
    
    setIsLoadingPolls(true);
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (pollsError) throw pollsError;
      
      const { data: votesData, error: votesError } = await supabase
        .from('poll_votes')
        .select('poll_id, option_id')
        .eq('user_id', user.id);
        
      if (votesError) throw votesError;
      
      const votedPollIds = votesData?.map(vote => vote.poll_id) || [];
      
      const { data: votedPollsData, error: votedPollsError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .in('id', votedPollIds.length > 0 ? votedPollIds : ['no-polls'])
        .order('created_at', { ascending: false });
        
      if (votedPollsError && votedPollIds.length > 0) throw votedPollsError;
      
      setUserPolls(formatPollsData(pollsData || [], votesData || []));
      setVotedPolls(formatPollsData(votedPollsData || [], votesData || []));
    } catch (error) {
      console.error('Error fetching user polls:', error);
      toast.error('Failed to load your polls');
    } finally {
      setIsLoadingPolls(false);
    }
  };
  
  const fetchUserPosts = async () => {
    if (!user) return;
    
    setIsLoadingPosts(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          image,
          comment_count,
          user_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (postsError) throw postsError;
      
      const { data: likeCounts, error: likeCountsError } = await supabase
        .from('post_likes')
        .select('post_id');
        
      if (likeCountsError) {
        console.error('Error fetching like counts:', likeCountsError);
      }
      
      const likeCountMap: Record<string, number> = {};
      if (likeCounts) {
        likeCounts.forEach(like => {
          likeCountMap[like.post_id] = (likeCountMap[like.post_id] || 0) + 1;
        });
      }
      
      let userLikes: Record<string, boolean> = {};
      
      if (user) {
        const { data: likesData, error: likesError } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
          
        if (!likesError && likesData) {
          userLikes = likesData.reduce((acc, like) => {
            acc[like.post_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      }
      
      const formattedPosts: Post[] = postsData ? postsData.map(post => {
        return {
          id: post.id,
          content: post.content,
          author: {
            id: user.id,
            name: profile?.username || 'Anonymous',
            avatar: profile?.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`
          },
          createdAt: post.created_at,
          image: post.image,
          commentCount: post.comment_count || 0,
          likeCount: likeCountMap[post.id] || 0,
          userLiked: userLikes[post.id] || false
        };
      }) : [];
      
      setUserPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      toast.error('Failed to load your posts');
    } finally {
      setIsLoadingPosts(false);
    }
  };
  
  const convertJsonToPollOptions = (optionsJson: any): PollOption[] => {
    if (!optionsJson) return [];
    
    try {
      const options = Array.isArray(optionsJson) 
        ? optionsJson 
        : (typeof optionsJson === 'string' ? JSON.parse(optionsJson) : Object.values(optionsJson));
      
      return options.map((option: any) => ({
        id: option.id || String(Math.random()),
        text: option.text || '',
        votes: option.votes || 0,
        imageUrl: option.imageUrl || null
      }));
    } catch (e) {
      console.error('Error parsing poll options:', e);
      return [];
    }
  };
  
  const formatPollsData = (pollsData: any[], votesData: any[]): Poll[] => {
    if (!pollsData || pollsData.length === 0) return [];
    
    const userVotes: Record<string, string> = {};
    votesData.forEach(vote => {
      userVotes[vote.poll_id] = vote.option_id;
    });
    
    return pollsData.map(poll => {
      const options = convertJsonToPollOptions(poll.options);
      return {
        id: poll.id,
        question: poll.question,
        options,
        author: {
          id: poll.profiles?.id || '',
          name: poll.profiles?.username || 'Anonymous',
          avatar: poll.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${poll.profiles?.id || ''}`
        },
        createdAt: poll.created_at,
        totalVotes: poll.total_votes || 0,
        commentCount: poll.comment_count || 0,
        userVoted: userVotes[poll.id],
        image: poll.image
      };
    });
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
  
  const handleProfileImageClick = () => {
    profileFileInputRef.current?.click();
  };
  
  const handleCoverImageClick = () => {
    coverFileInputRef.current?.click();
  };
  
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      setSelectedFileExt(file.name.split('.').pop() || null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImageUrl(e.target?.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      toast.error('Failed to process image');
      console.error('Error processing image:', error);
    } finally {
      if (profileFileInputRef.current) profileFileInputRef.current.value = '';
    }
  };
  
  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);
    try {
      const fileExt = selectedFileExt || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      
      setLocalAvatarUrl(publicUrl);
      
      await updateProfile({ avatar_url: publicUrl });
      
      toast.success('Profile image updated successfully!');
      setCropperOpen(false);
      setOriginalImageUrl(null);
      setSelectedFileExt(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
      setLocalAvatarUrl(profile?.avatar_url || null);
    } finally {
      setUploading(false);
    }
  };
  
  const handleCropCancel = () => {
    setCropperOpen(false);
    setOriginalImageUrl(null);
    setSelectedFileExt(null);
  };
  
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploadingCover(true);
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
      setLocalCoverUrl(tempUrl);
      
      await updateProfile({ coverFile: file });
      toast.success('Cover image updated successfully');
    } catch (error: any) {
      toast.error('Failed to upload cover image');
      console.error('Error uploading cover image:', error);
      setLocalCoverUrl(profile?.cover_url || null);
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await updatePassword(currentPassword, newPassword);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    }
  };
  
  const allContent = [...userPolls, ...userPosts].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Sort by newest first
  });
  
  const avatarUrl = localAvatarUrl ? getAvatarUrl(localAvatarUrl) : null;
  const coverUrl = localCoverUrl || '';
  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Header />
      
      <main className="pt-16 pb-20 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-border/50 mb-4 animate-fade-in w-full overflow-hidden mx-auto px-0">
          <div className="relative w-full h-36 sm:h-48 bg-gray-200 group">
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-100 to-red-100"></div>
            )}
            
            <button 
              onClick={handleCoverImageClick}
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploadingCover ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </button>
            
            <input 
              type="file"
              ref={coverFileInputRef}
              onChange={handleCoverImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          <div className="px-4 py-4 sm:p-5">
            <div className="flex flex-col items-center -mt-12 sm:-mt-14">
              <div className="relative group z-10">
                <div 
                  onClick={handleProfileImageClick}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white overflow-hidden cursor-pointer group-hover:opacity-90 transition-opacity relative bg-white"
                >
                  {uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={profile?.username || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserAvatar 
                          user={profile}
                          size="xl"
                          className="w-full h-full"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
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
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-3 py-2 border border-input rounded text-center w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <h2 className="text-lg sm:text-xl font-bold">{profile?.username || 'Anonymous'}</h2>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="ml-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              )}
              <p className="text-muted-foreground mt-1 text-sm">{user?.email}</p>
              
              {!isChangingPassword ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsChangingPassword(true)} 
                  className="mt-2"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <div className="mt-4 space-y-3 max-w-sm mx-auto px-2">
                  <h3 className="font-medium text-left">Change Password</h3>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current Password"
                    />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                    />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                    />
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleChangePassword}
                        disabled={profileLoading}
                      >
                        {profileLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-1 sm:gap-4 justify-center max-w-xs sm:max-w-md mx-auto text-center">
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1">
                <p className="text-lg sm:text-2xl font-bold">{userPosts.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1">
                <p className="text-lg sm:text-2xl font-bold">{followCounts.followers}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg py-2 px-1">
                <p className="text-lg sm:text-2xl font-bold">{followCounts.following}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-2 sm:px-4">
          <Tabs defaultValue="all" className="w-full animate-fade-in">
            <div className="overflow-x-auto no-scrollbar pb-1">
              <TabsList className="w-full flex mb-3 rounded-lg border border-border/30">
                <TabsTrigger 
                  value="all" 
                  className="flex-1 text-xs sm:text-sm py-2.5 font-medium whitespace-nowrap"
                >
                  All Content
                </TabsTrigger>
                <TabsTrigger 
                  value="posts" 
                  className="flex-1 text-xs sm:text-sm py-2.5 font-medium whitespace-nowrap"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="followers" 
                  className="flex-1 text-xs sm:text-sm py-2.5 font-medium whitespace-nowrap"
                >
                  Followers
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="flex-1 text-xs sm:text-sm py-2.5 font-medium whitespace-nowrap"
                >
                  Following
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              {isLoadingPolls || isLoadingPosts ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : allContent.length > 0 ? (
                <div className="space-y-3">
                  {allContent.map(item => (
                    <div key={item.id}>
                      {'question' in item ? (
                        <PollCard poll={item as Poll} />
                      ) : (
                        <PostCard post={item as Post} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-white rounded-lg shadow-sm border border-border/30 mt-2">
                  <p className="mb-4">You haven't created any content yet.</p>
                  <div className="inline-block">
                    <a 
                      href="/create" 
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create Your First Poll
                    </a>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="posts" className="mt-0">
              {isLoadingPolls || isLoadingPosts ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (userPosts.length > 0 || userPolls.length > 0) ? (
                <div className="space-y-3">
                  {[...userPolls, ...userPosts]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(item => (
                      <div key={item.id}>
                        {'question' in item ? (
                          <PollCard poll={item as Poll} />
                        ) : (
                          <PostCard post={item as Post} />
                        )}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-white rounded-lg shadow-sm border border-border/30 mt-2">
                  <p className="mb-4">You haven't created any posts yet.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="followers" className="mt-0">
              {user ? (
                <UserList userId={user.id} type="followers" />
              ) : (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="following" className="mt-0">
              {user ? (
                <UserList userId={user.id} type="following" />
              ) : (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
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

export default Profile;
