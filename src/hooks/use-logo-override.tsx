
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useLogoOverride = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on the auth page
    const isAuthPage = location.pathname === '/login' || 
                      location.pathname === '/signup' || 
                      location.pathname === '/auth' ||
                      location.pathname.startsWith('/auth');
    
    if (isAuthPage) {
      // Find and replace all logo images on the auth page
      const logoElements = document.querySelectorAll('img[alt*="logo" i], .logo img, img.logo');
      
      logoElements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          // IMPORTANT: Using the new logo here
          element.src = "/lovable-uploads/95591de9-b621-4bd0-b1a8-c28c6d4e09c9.png";
        }
      });
    }
  }, [location]);
};

export default useLogoOverride;
