
import React from 'react';
import { Link } from 'react-router-dom';
import { useBreakpoint } from '../hooks/use-mobile';

const TopHeader: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  
  // Don't render on mobile
  if (!isDesktop) {
    return null;
  }
  
  return (
    <div className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl tracking-tight">Orapol</Link>
        <div className="text-sm font-medium">
          The World's Opinion Platform
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
