
import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Users, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBreakpoint } from '@/hooks/use-mobile';
import { isBreakpoint } from '@/utils/breakpoint-utils';

const LiveButton: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const {
    user
  } = useSupabase();
  const navigate = useNavigate();
  const breakpointState = useBreakpoint();
  const isMobile = isBreakpoint(breakpointState, "mobile");
  
  const createLiveStream = async () => {
    if (!user) {
      toast.error('You need to be logged in to start a live stream');
      navigate('/auth');
      return;
    }
    setIsCreating(true);
    try {
      // Generate a random room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      toast.success('Creating your Jitsi Meet live stream...');
      setIsOpen(false);

      // Navigate to the live page with the generated room code
      navigate(`/live/${roomCode}?host=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create live stream');
    } finally {
      setIsCreating(false);
    }
  };
  
  const joinLiveStream = () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a valid room code');
      return;
    }
    setIsOpen(false);
    // Navigate to the live page with the provided room code
    navigate(`/live/${joinCode.trim().toUpperCase()}`);
  };
  
  const browseLiveStreams = () => {
    setIsOpen(false);
    navigate('/live-streams');
  };
  
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 text-white rounded-lg p-2 w-full transition-all bg-emerald-400 hover:bg-emerald-300">
            <Video className="w-5 h-5" />
            <span className="font-medium">LIVE</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center text-white">Go LIVE with Jitsi Meet</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-4">
              {user && <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg">
                  <Avatar className="h-10 w-10 border border-gray-700">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || 'User'} />
                    <AvatarFallback>{(user.user_metadata?.username || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-white font-medium">{user.user_metadata?.username || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">Streaming as you</p>
                  </div>
                </div>}
              
              <Button onClick={createLiveStream} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white" disabled={isCreating}>
                {isCreating ? <>Preparing stream...</> : <>
                    <Video className="w-5 h-5" /> 
                    Start Live Stream
                  </>}
              </Button>
              
              <Button onClick={browseLiveStreams} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary">
                <Eye className="w-5 h-5" />
                Browse Live Streams
              </Button>
              
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 text-center">- OR -</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter room code" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white" />
                  <Button onClick={joinLiveStream} className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> 
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default LiveButton;
