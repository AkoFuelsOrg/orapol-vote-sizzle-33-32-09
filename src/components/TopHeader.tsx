
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../hooks/use-mobile';
import { Search } from 'lucide-react';
import { Button } from './ui/button';

const TopHeader: React.FC = () => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const isDesktop = breakpoint === "desktop";
  
  // Don't render on mobile
  if (!isDesktop) {
    return null;
  }

  const handleSearchClick = () => {
    navigate('/search');
  };
  
  return (
    <div className="w-full bg-gradient-to-r from-[#3eb0ff]/90 to-[#3eb0ff] text-white py-3 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 ml-4">
          <img 
            src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
            alt="Tuwaye Logo" 
            className="h-8 w-auto"
          />
          <span className="font-bold text-xl tracking-tight">TUWAYE</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleSearchClick}
            variant="ghost" 
            className="flex items-center gap-2 text-white hover:bg-white/20 transition-colors"
          >
            <Search size={18} />
            <span>Search</span>
          </Button>
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
