
import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/context/SupabaseContext';
import { toast } from 'sonner';

interface DailyIframeProps {
  url: string;
  onCallObjectReady: (callObject: any) => void;
  isHost: boolean;
}

// Global variable to track if a Daily instance exists
let globalDailyInstance: any = null;

const DailyIframe: React.FC<DailyIframeProps> = ({ url, onCallObjectReady, isHost }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callObjectRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Helper function to check and request media permissions
  const checkMediaPermissions = async () => {
    try {
      console.log("Checking media permissions...");
      // Try to get user media to trigger permission prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("Media permissions granted!", stream.getTracks().map(t => `${t.kind} (${t.label})`));
      
      // Don't stop tracks if we're the host - let Daily.co use these
      if (!isHost) {
        stream.getTracks().forEach(track => track.stop()); // Clean up
      }
      
      return { success: true, stream };
    } catch (error: any) {
      console.error("Media permission error:", error);
      setDeviceError(error.message || "Camera or microphone access denied");
      toast.error(`Camera/microphone error: ${error.message || "Access denied"}`);
      return { success: false, error };
    }
  };

  useEffect(() => {
    console.log("DailyIframe component mounted, URL:", url);
    let userStream: MediaStream | null = null;
    
    // First, check if a global Daily instance already exists
    if (globalDailyInstance) {
      console.log("Destroying existing Daily instance before creating a new one");
      try {
        globalDailyInstance.destroy();
      } catch (err) {
        console.error("Error destroying existing Daily instance:", err);
      }
      globalDailyInstance = null;
    }
    
    const initializeDaily = async () => {
      // Check if Daily.co script is already loaded
      if (!window.DailyIframe) {
        console.error('Daily.co SDK not loaded');
        toast.error('Video call service failed to load');
        return;
      }

      // Pre-check permissions for hosts
      if (isHost && !permissionsChecked) {
        console.log("Host needs to check permissions");
        const { success, stream } = await checkMediaPermissions();
        setPermissionsChecked(true);
        
        if (success && stream) {
          userStream = stream;
          console.log("Successfully acquired camera stream for host");
        } else {
          setLoading(false);
          return;
        }
      }
      
      try {
        console.log("Creating Daily call object with URL:", url);
        
        // Create a call object with specific configuration
        const callObject = window.DailyIframe.createCallObject({
          url: url,
          dailyConfig: {
            experimentalChromeVideoMuteLightOff: true,
            preferredVideoCodecs: { allow: ['h264', 'vp8', 'vp9'] }
          }
        });
        
        // Store in both component ref and global variable
        callObjectRef.current = callObject;
        globalDailyInstance = callObject;
        
        // Configure join options
        const joinOptions: any = {
          url: url,
          showLeaveButton: false,
        };
        
        if (isHost) {
          joinOptions.startVideoOff = false;
          joinOptions.startAudioOff = false;
          
          // If we have a stream already, try to use it
          if (userStream) {
            joinOptions.videoSource = userStream.getVideoTracks()[0];
            joinOptions.audioSource = userStream.getAudioTracks()[0];
            console.log("Using pre-acquired media tracks:", {
              video: userStream.getVideoTracks().length > 0,
              audio: userStream.getAudioTracks().length > 0
            });
          }
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
          console.log('Joining meeting event fired...');
        });
        
        callObject.on('joined-meeting', () => {
          console.log('Successfully joined meeting!');
          setLoading(false);
        });
        
        callObject.on('camera-error', (event: any) => {
          console.error('Camera error:', event);
          toast.error(`Camera error: ${event?.errorMsg || 'Unknown error'}`);
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
          
          // Ensure we get access to video after joining (especially important for host)
          if (isHost) {
            console.log("Host ensuring video is turned on");
            setTimeout(async () => {
              await callObject.setLocalVideo(true);
              await callObject.setLocalAudio(true);
              console.log("Local video and audio should now be enabled for host (with delay)");
            }, 1000); // Add a delay to ensure camera initialization
          }
          
          // Attach the call to our container element
          if (containerRef.current) {
            console.log("Container ref is ready for iframe");
            containerRef.current.innerHTML = ''; // Clear container first
            
            // Use appendChild method to add the iframe
            const iframe = callObject.iframe();
            if (iframe) {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              console.log("Attaching Daily iframe to container");
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
    
    // Delay initialization slightly to ensure any previous instances are fully cleaned up
    const timer = setTimeout(() => {
      initializeDaily();
    }, 300);
    
    return () => {
      console.log("DailyIframe component unmounting");
      clearTimeout(timer);
      
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        console.log("Cleaned up user media stream");
      }
      
      // Clean up the call object
      if (callObjectRef.current) {
        console.log("Destroying Daily call object on unmount");
        
        try {
          callObjectRef.current.destroy();
        } catch (err) {
          console.error("Error during Daily cleanup:", err);
        }
        
        // Also clear the global reference
        if (globalDailyInstance === callObjectRef.current) {
          globalDailyInstance = null;
        }
        
        callObjectRef.current = null;
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
      
      {deviceError && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Camera/Microphone Error</h3>
            <p className="text-white/80 mb-4">{deviceError}</p>
            <p className="text-white/80 text-sm">Please ensure your browser has permission to access your camera and microphone. Check your browser settings and try again.</p>
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
