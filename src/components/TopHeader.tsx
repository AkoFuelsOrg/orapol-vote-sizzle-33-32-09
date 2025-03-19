
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
    <div className="w-full bg-gradient-to-r from-[#3eb0ff]/90 to-[#3eb0ff] text-white py-3 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="font-bold text-xl tracking-tight">TUWAYE</Link>
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
            alt="Let's Talk" 
            className="h-8 w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
