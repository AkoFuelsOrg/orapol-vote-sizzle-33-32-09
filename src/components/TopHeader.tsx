
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
    <div className="w-full bg-red-500 text-white py-2 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl">Orapol</Link>
        <div className="text-sm">
          The World's Opinion Platform
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
