
import React, { useEffect, useState, memo } from 'react';
import { Loader2, Video, Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, Phone } from 'lucide-react';
import { useDaily, DailyCallState } from '@/hooks/useDaily';
import { Button } from '@/components/ui/button';

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

const DailyIframe: React.FC<DailyIframeProps> = memo(({ url, onCallObjectReady, isHost }) => {
  const [hasJoined, setHasJoined] = useState(false);
  const {
    callObject,
    callState,
    participants,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    isAudioEnabled,
    isVideoEnabled,
    isSharingScreen,
    error
  } = useDaily({
    roomUrl: url,
    isHost,
  });
  
  // Join the call when component is mounted and URL is available
  useEffect(() => {
    if (callObject && url && !hasJoined) {
      joinCall();
      setHasJoined(true);
      
      if (onCallObjectReady) {
        onCallObjectReady(callObject);
      }
    }
  }, [callObject, url, joinCall, onCallObjectReady, hasJoined]);
  
  // Handle component unmounting
  useEffect(() => {
    return () => {
      if (callState === 'joined') {
        leaveCall();
      }
    };
  }, [callState, leaveCall]);
  
  // Show loading state
  if (callState === 'idle' || callState === 'creating' || callState === 'joining') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-white text-sm">{isHost ? 'Setting up your call...' : 'Joining call...'}</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (callState === 'error' || error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
        <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-white mb-2">Video Call Error</h3>
          <p className="text-white/80 mb-4">{error?.message || 'Failed to connect to video call'}</p>
          <p className="text-white/80 text-sm">Please ensure your browser has permission to access your camera and microphone.</p>
        </div>
      </div>
    );
  }
  
  // Render the video call interface
  return (
    <div className="w-full h-full relative bg-gray-900 flex flex-col">
      {/* Video container */}
      <div className="flex-1 relative" id="daily-container">
        {participants.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <VideoIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Waiting for participants to join...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls bar */}
      <div className="h-16 bg-gray-800 flex items-center justify-center px-4 gap-2">
        <Button 
          variant="outline" 
          size="icon"
          className={`rounded-full ${isAudioEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          className={`rounded-full ${isVideoEnabled ? 'bg-gray-700' : 'bg-red-500'}`}
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        
        {isHost && (
          <Button 
            variant="outline" 
            size="icon"
            className={`rounded-full ${isSharingScreen ? 'bg-blue-600' : 'bg-gray-700'}`}
            onClick={startScreenShare}
          >
            <ScreenShare className="h-5 w-5" />
          </Button>
        )}
        
        <Button 
          variant="destructive" 
          size="icon"
          className="rounded-full bg-red-500 hover:bg-red-600 ml-2"
          onClick={leaveCall}
        >
          <Phone className="h-5 w-5 rotate-135" />
        </Button>
      </div>
    </div>
  );
});

export default DailyIframe;
