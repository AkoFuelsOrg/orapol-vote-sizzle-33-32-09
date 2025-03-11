
import React from 'react';
import { Link } from 'react-router-dom';
import { useBreakpoint } from '../hooks/use-mobile';
import ThemeToggle from './ThemeToggle';

const TopHeader: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  
  // Don't render on mobile
  if (!isDesktop) {
    return null;
  }
  
  return (
    <div className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 shadow-md fixed top-0 left-0 right-0 z-50 dark:from-red-700 dark:to-red-800">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl tracking-tight">Orapol</Link>
        
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">
            The World's Opinion Platform
          </div>
          <ThemeToggle className="bg-white/10 hover:bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
