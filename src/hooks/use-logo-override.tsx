
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
          element.src = "/lovable-uploads/143ae866-e284-4f13-82da-318647724a55.png";
        }
      });
    }
  }, [location]);
};

export default useLogoOverride;
