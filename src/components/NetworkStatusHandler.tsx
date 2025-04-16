
import React, { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RefreshCw, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

const NetworkStatusHandler = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [showAlternativeError, setShowAlternativeError] = useState(false);
  const [displayMode, setDisplayMode] = useState<"popup" | "alternative">("popup");
  const { toast: shadcnToast } = useToast();
  
  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineDialog(false);
      setShowAlternativeError(false);
      
      // Show reconnection toast using both systems
      toast.success("Connection restored", {
        description: "You're back online!",
      });
      
      shadcnToast({
        title: "Connection restored",
        description: "You're back online!",
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      // Randomly choose between two display modes to show both options
      const shouldUseAlternativeDisplay = Math.random() > 0.5;
      setDisplayMode(shouldUseAlternativeDisplay ? "alternative" : "popup");
      
      if (shouldUseAlternativeDisplay) {
        // Show alternative error with reload icon
        setShowAlternativeError(true);
      } else {
        // First show a general error dialog
        setShowOfflineDialog(true);
        
        // Then show a more specific notification after a brief delay
        setTimeout(() => {
          // Use both toast systems to ensure at least one works
          toast.error("No internet connection!", {
            description: "Please try again later.",
            duration: 5000,
          });
          
          shadcnToast({
            variant: "destructive",
            title: "No internet connection!",
            description: "Please try again later.",
          });
        }, 1000);
      }
    };
    
    // Handle failed network requests
    const handleNetworkError = () => {
      if (!window.navigator.onLine) {
        // Network is already known to be offline, no need to repeat
        return;
      }
      
      // Randomly choose between two display modes to show both options
      const shouldUseAlternativeDisplay = Math.random() > 0.5;
      if (shouldUseAlternativeDisplay) {
        // Show alternative error with reload icon
        setShowAlternativeError(true);
      } else {
        // First show a general error dialog
        setShowOfflineDialog(true);
      }
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("error", (event) => {
      // Check if error is related to network requests
      if (event.message && (
        event.message.includes("network") || 
        event.message.includes("failed") || 
        event.message.includes("connection")
      )) {
        handleNetworkError();
      }
    });
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <>
      {/* First scenario: Popup with "We're sorry, something went wrong" followed by a notification */}
      <AlertDialog open={showOfflineDialog && displayMode === "popup"} onOpenChange={setShowOfflineDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle className="text-center">
            We're sorry, something went wrong
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center mt-2">
            There seems to be a connection issue.
          </AlertDialogDescription>
          <AlertDialogFooter className="flex flex-col items-center mt-4">
            <AlertDialogAction onClick={handleReload} className="flex items-center gap-2 w-full justify-center">
              <RefreshCw className="h-4 w-4" />
              Reload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Second scenario: "We're sorry but something went wrong. Please try again later" with reload icon */}
      {showAlternativeError && displayMode === "alternative" && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg flex flex-col items-center gap-4 z-50 animate-in fade-in slide-in-from-top-5 duration-300 max-w-sm">
          <WifiOff className="h-12 w-12 text-red-500 mb-2" />
          <h3 className="text-lg font-semibold text-center">We're sorry but something went wrong.</h3>
          <p className="text-center text-gray-600 dark:text-gray-300">Please try again later.</p>
          <button 
            onClick={handleReload}
            className="mt-2 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload page
          </button>
        </div>
      )}
    </>
  );
};

export default NetworkStatusHandler;
