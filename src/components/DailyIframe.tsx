
import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';
import { toast } from 'sonner';

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

const DailyIframe: React.FC<DailyIframeProps> = ({ url, onCallObjectReady, isHost }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  // Helper function to check and request media permissions
  const checkMediaPermissions = async () => {
    try {
      console.log("Checking media permissions...");
      // Try to get user media to trigger permission prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Media permissions granted!", stream.getTracks());
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.error("Media permission error:", error);
      toast.error("Camera or microphone access denied. Please allow access in your browser settings.");
      return false;
    }
  };

  useEffect(() => {
    console.log("DailyIframe component mounted, URL:", url);
    
    const initializeDaily = async () => {
      // Check if Daily.co script is already loaded
      if (!window.DailyIframe) {
        console.error('Daily.co SDK not loaded');
        toast.error('Video call service failed to load');
        return;
      }

      // Pre-check permissions for hosts
      if (isHost && !permissionsChecked) {
        const hasPermissions = await checkMediaPermissions();
        setPermissionsChecked(true);
        if (!hasPermissions) {
          setLoading(false);
          return;
        }
      }
      
      try {
        console.log("Creating Daily call object");
        // Create a call object with specific configuration
        const callObject = window.DailyIframe.createCallObject({
          url: url,
          dailyConfig: {
            experimentalChromeVideoMuteLightOff: true,
            preferredVideoCodecs: { allow: ['h264', 'vp8', 'vp9'] }
          }
        });
        
        callObjectRef.current = callObject;
        
        // Configure join options
        const joinOptions: any = {
          url: url,
          showLeaveButton: false,
        };
        
        if (isHost) {
          joinOptions.startVideoOff = false;
          joinOptions.startAudioOff = false;
        } else {
          joinOptions.startVideoOff = true;
          joinOptions.startAudioOff = true;
        }
        
        // Set username from authenticated user if available
        if (user) {
          joinOptions.userName = user.user_metadata?.username || 'Anonymous';
        }
        
        console.log("Joining call with options:", joinOptions);
        
        // Set up event listeners before joining
        callObject.on('joining-meeting', () => {
          console.log('Joining meeting...');
        });
        
        callObject.on('joined-meeting', () => {
          console.log('Successfully joined meeting!');
          setLoading(false);
        });
        
        callObject.on('error', (error: any) => {
          console.error('Daily.co error:', error);
          toast.error(`Video call error: ${error?.errorMsg || 'Unknown error'}`);
        });
        
        // Join the call
        try {
          console.log("Attempting to join call");
          await callObject.join(joinOptions);
          console.log("Join call completed");
          
          // Attach the call to our container element
          if (containerRef.current) {
            const iframe = callObject.iframe();
            if (iframe) {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              console.log("Attaching Daily iframe to container");
              containerRef.current.innerHTML = ''; // Clear container first
              containerRef.current.appendChild(iframe);
              console.log("Daily iframe attached successfully");
            } else {
              console.error("Daily iframe element is null");
              toast.error("Failed to create video call interface");
            }
          } else {
            console.error("Container ref is null, cannot attach iframe");
            toast.error("Failed to load video call interface");
          }
          
          onCallObjectReady(callObject);
        } catch (error) {
          console.error('Error joining Daily.co call:', error);
          toast.error('Failed to join video call');
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in Daily.co initialization:", error);
        toast.error('Failed to initialize video call');
        setLoading(false);
      }
    };
    
    initializeDaily();
    
    return () => {
      console.log("DailyIframe component unmounting");
      if (callObjectRef.current) {
        callObjectRef.current.destroy();
        console.log("Daily call object destroyed");
      }
    };
  }, [url, isHost, onCallObjectReady, user, permissionsChecked]);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-white text-sm">{isHost ? 'Setting up your camera...' : 'Joining stream...'}</p>
          </div>
        </div>
      )}
      <div 
        id="daily-container"
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default DailyIframe;
