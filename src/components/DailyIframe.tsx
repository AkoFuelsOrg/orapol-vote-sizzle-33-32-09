
import React, { useEffect, useState, memo, useRef } from 'react';
import { Loader2, Video, Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JitsiMeetProps {
  roomName: string;
  onApiReady?: (api: any) => void;
  isHost: boolean;
}

const JitsiMeet: React.FC<JitsiMeetProps> = memo(({ roomName, onApiReady, isHost }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(isHost);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const apiRef = useRef<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load Jitsi Meet API script
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
        document.body.appendChild(script);
      });
    };

    const initJitsi = async () => {
      try {
        setIsLoading(true);
        
        // Wait for the script to load if it's not already loaded
        if (!(window as any).JitsiMeetExternalAPI) {
          await loadJitsiScript();
        }

        // Make sure the container is available
        if (!jitsiContainerRef.current) return;
        
        const domain = 'meet.jit.si';
        const options = {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: isHost ? 'Host' : 'Participant'
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: !isHost,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          }
        };
        
        // Create the Jitsi Meet API instance
        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        
        // Store the API reference
        apiRef.current = api;
        
        // Set up event listeners
        api.addEventListeners({
          readyToClose: () => {
            console.log('Jitsi meeting closed');
          },
          participantJoined: (participant: any) => {
            console.log('Participant joined:', participant);
          },
          participantLeft: (participant: any) => {
            console.log('Participant left:', participant);
          },
          videoConferenceJoined: () => {
            console.log('Local user joined');
            setIsLoading(false);
            
            // Notify parent that API is ready
            if (onApiReady) {
              onApiReady(api);
            }
          },
          videoConferenceLeft: () => {
            console.log('Local user left');
          },
          audioMuteStatusChanged: (muted: { muted: boolean }) => {
            setIsAudioEnabled(!muted.muted);
          },
          videoMuteStatusChanged: (muted: { muted: boolean }) => {
            setIsVideoEnabled(!muted.muted);
          },
          screenSharingStatusChanged: (sharing: { on: boolean }) => {
            setIsSharingScreen(sharing.on);
          },
          error: (error: Error) => {
            console.error('Jitsi error:', error);
            setError(error);
          }
        });
        
        // Return a cleanup function
        return () => {
          if (apiRef.current) {
            apiRef.current.dispose();
          }
        };
      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize video call'));
        setIsLoading(false);
      }
    };

    initJitsi();
    
    // Clean up on unmount
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, isHost, onApiReady]);
  
  const toggleAudio = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
      // Note: The status will be updated via event listener
    }
  };
  
  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
      // Note: The status will be updated via event listener
    }
  };
  
  const toggleScreenShare = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleShareScreen');
      // Note: The status will be updated via event listener
    }
  };
  
  const hangUp = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
  };
  
  // Show loading state
  if (isLoading) {
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
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
        <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg max-w-md">
          <h3 className="text-lg font-semibold text-white mb-2">Video Call Error</h3>
          <p className="text-white/80 mb-4">{error.message || 'Failed to connect to video call'}</p>
          <p className="text-white/80 text-sm">Please ensure your browser has permission to access your camera and microphone.</p>
        </div>
      </div>
    );
  }
  
  // Render the video call interface
  return (
    <div className="w-full h-full relative bg-gray-900 flex flex-col">
      {/* Jitsi container */}
      <div ref={jitsiContainerRef} className="flex-1 relative"></div>
      
      {/* Custom controls bar that overlays Jitsi's controls */}
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
            onClick={toggleScreenShare}
          >
            <ScreenShare className="h-5 w-5" />
          </Button>
        )}
        
        <Button 
          variant="destructive" 
          size="icon"
          className="rounded-full bg-red-500 hover:bg-red-600 ml-2"
          onClick={hangUp}
        >
          <Phone className="h-5 w-5 rotate-135" />
        </Button>
      </div>
    </div>
  );
});

JitsiMeet.displayName = 'JitsiMeet';

export default JitsiMeet;
