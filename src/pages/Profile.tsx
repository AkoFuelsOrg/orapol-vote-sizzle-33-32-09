import React, { useState, useRef, useEffect } from 'react';
import { usePollContext } from '../context/PollContext';
import PollCard from '../components/PollCard';
import Header from '../components/Header';
import { useSupabase } from '../context/SupabaseContext';
import { Pencil, Upload, Loader2, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import UserList from '../components/UserList';
import { supabase } from '../integrations/supabase/client';
import { Poll, PollOption } from '../lib/types';

const Profile: React.FC = () => {
  const { polls, currentUser } = usePollContext();
  const { user, profile, updateProfile, loading: profileLoading, getFollowCounts } = useSupabase();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [uploading, setUploading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      fetchFollowCounts();
      fetchUserPolls();
    }
  }, [user]);
  
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
  
  const convertJsonToPollOptions = (jsonOptions: any): PollOption[] => {
    if (typeof jsonOptions === 'string') {
      try {
        return JSON.parse(jsonOptions);
      } catch (error) {
        console.error('Error parsing JSON options:', error);
        return [];
      }
    }
    
    if (Array.isArray(jsonOptions)) {
      return jsonOptions.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          return {
            id: String(opt.id || ''),
            text: String(opt.text || ''),
            votes: Number(opt.votes || 0),
            imageUrl: opt.imageUrl
          };
        }
        return { id: '', text: '', votes: 0 };
      });
    }
    
    return [];
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
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      await updateProfile({ file });
      toast.success('Profile image updated successfully');
    } catch (error: any) {
      toast.error('Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const avatarUrl = profile?.avatar_url || (user?.id ? `https://i.pravatar.cc/150?u=${user.id}` : '');
  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Header />
      
      <main className="pt-20 px-4 max-w-4xl mx-auto pb-20 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 animate-fade-in w-full">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div 
                onClick={handleImageClick}
                className="w-24 h-24 rounded-full border-2 border-red-500 overflow-hidden cursor-pointer group-hover:opacity-80 transition-opacity relative"
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
            {isLoadingPolls ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : userPolls.length > 0 ? (
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
            {isLoadingPolls ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : votedPolls.length > 0 ? (
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
