
import { useState, useEffect } from 'react';

export type BreakpointType = "mobile" | "tablet" | "desktop";

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: BreakpointType;
}

export const useBreakpoint = (): BreakpointState => {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    breakpoint: window.innerWidth < 768 ? "mobile" : 
               window.innerWidth < 1024 ? "tablet" : "desktop"
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const breakpoint: BreakpointType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
      
      setBreakpointState({
        isMobile,
        isTablet,
        isDesktop,
        breakpoint
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return breakpointState;
};

// For backward compatibility with components using the old format
export const useIsMobile = (): boolean => {
  const { isMobile } = useBreakpoint();
  return isMobile;
};
