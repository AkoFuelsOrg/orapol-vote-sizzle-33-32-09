
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
          element.src = "/lovable-uploads/142738e7-3764-4db2-8b2f-b9a9614f97e9.png";
        }
      });
    }
  }, [location]);
};

export default useLogoOverride;
