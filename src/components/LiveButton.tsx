
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/context/SupabaseContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

const LiveButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();

  const createLiveStream = async () => {
    if (!user) {
      toast.error('You need to be logged in to start a live stream');
      navigate('/auth');
      return;
    }
    
    // Generate a random room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    toast.success('Creating your live stream...');
    setIsOpen(false);
    
    // Navigate to the live page with the generated room code
    navigate(`/live/${roomCode}?host=true`);
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

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg p-2 w-full transition-all"
          >
            <Video className="w-5 h-5" />
            <span className="font-medium">LIVE</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Go LIVE or Join a Stream</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-4">
              <Button 
                onClick={createLiveStream}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
              >
                <Video className="w-5 h-5" /> 
                Start Live Stream
              </Button>
              
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 text-center">- OR -</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={joinLiveStream}
                    className="flex items-center gap-2"
                  >
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
};

export default LiveButton;
