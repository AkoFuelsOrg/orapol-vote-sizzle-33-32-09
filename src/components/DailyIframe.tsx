
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
  const [loading, setLoading] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const { user } = useSupabase();
  const callFrameRef = useRef<any>(null);
  
  useEffect(() => {
    console.log("DailyIframe component mounted, URL:", url);
    let destroyed = false;
    
    // Check if Daily.co script is already loaded
    const loadDailyScript = () => {
      if (window.DailyIframe) {
        console.log("Daily.co script already loaded");
        initializeDaily();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log("Daily.co script loaded successfully");
        if (!destroyed) {
          initializeDaily();
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load Daily.co script");
        toast.error("Failed to load video call service");
        setLoading(false);
      };
      
      document.body.appendChild(script);
    };
    
    // Helper function to check and request media permissions
    const checkMediaPermissions = async () => {
      try {
        console.log("Checking media permissions...");
        // Try to get user media to trigger permission prompt if needed
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Media permissions granted!", stream.getTracks().map(t => `${t.kind} (${t.label})`));
        
        return { success: true, stream };
      } catch (error: any) {
        console.error("Media permission error:", error);
        setDeviceError(error.message || "Camera or microphone access denied");
        toast.error(`Camera/microphone error: ${error.message || "Access denied"}`);
        return { success: false, error };
      }
    };
    
    const initializeDaily = async () => {
      if (destroyed || !window.DailyIframe) return;
      
      // Check permissions first
      const { success } = await checkMediaPermissions();
      if (!success) {
        setLoading(false);
        return;
      }
      
      try {
        // Ensure we have a container element
        if (!containerRef.current) {
          console.error("Container ref is not available");
          return;
        }
        
        // Destroy any existing call frame to prevent duplicates
        if (callFrameRef.current) {
          try {
            callFrameRef.current.destroy();
          } catch (e) {
            console.error("Error destroying previous call frame:", e);
          }
          callFrameRef.current = null;
        }
        
        // Create a new call frame
        const callFrame = window.DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false,
          showFullscreenButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '0',
          }
        });
        
        callFrameRef.current = callFrame;
        
        // Configure and join
        const joinOptions: any = {
          url: url,
          showLeaveButton: false,
          showFullscreenButton: true
        };
        
        // Set different defaults for host vs viewer
        if (isHost) {
          joinOptions.startVideoOff = false;
          joinOptions.startAudioOff = false;
        } else {
          joinOptions.startVideoOff = false;
          joinOptions.startAudioOff = true; // Only host has audio enabled by default
        }
        
        // Set username from authenticated user if available
        if (user) {
          joinOptions.userName = user.user_metadata?.username || 'Anonymous';
        }
        
        console.log("Joining call with options:", joinOptions);
        
        // Add event listeners
        callFrame
          .on('joining-meeting', () => {
            console.log('Joining meeting event fired...');
          })
          .on('joined-meeting', () => {
            console.log('Successfully joined meeting!');
            setLoading(false);
            
            // Notify parent component that call is ready
            if (onCallObjectReady) {
              onCallObjectReady(callFrame);
            }
          })
          .on('camera-error', (event: any) => {
            console.error('Camera error:', event);
            toast.error(`Camera error: ${event?.errorMsg || 'Unknown error'}`);
          })
          .on('error', (error: any) => {
            console.error('Daily.co error:', error);
            toast.error(`Video call error: ${error?.errorMsg || 'Unknown error'}`);
          })
          .on('participant-joined', (event: any) => {
            console.log('Participant joined:', event);
          })
          .on('participant-left', (event: any) => {
            console.log('Participant left:', event);
          });
        
        // Join the call
        await callFrame.join(joinOptions);
        console.log("Join call completed");
        
      } catch (error) {
        console.error("Error in Daily.co initialization:", error);
        toast.error("Failed to initialize video call");
        setLoading(false);
      }
    };
    
    // Start loading Daily
    loadDailyScript();
    
    return () => {
      console.log("DailyIframe component unmounting");
      destroyed = true;
      
      // Clean up call frame on unmount
      if (callFrameRef.current) {
        try {
          callFrameRef.current.destroy();
        } catch (e) {
          console.error("Error destroying callFrame:", e);
        }
        callFrameRef.current = null;
      }
    };
  }, [url, isHost, user, onCallObjectReady]);

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
        className="w-full h-full absolute inset-0"
      />
    </div>
  );
};

export default DailyIframe;
