
import React, { useEffect } from 'react';

const AuthLogoOverride: React.FC = () => {
  useEffect(() => {
    // Find all logo images on the auth page and replace them
    const updateLogos = () => {
      const logoElements = document.querySelectorAll('.auth-page img[src*="logo"], .auth-page .logo img');
      
      logoElements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = "/lovable-uploads/143ae866-e284-4f13-82da-318647724a55.png";
        }
      });
    };
    
    // Run once on mount
    updateLogos();
    
    // Set up a mutation observer to catch dynamically added elements
    const observer = new MutationObserver(updateLogos);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default AuthLogoOverride;
