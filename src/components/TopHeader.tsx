
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../hooks/use-mobile';
import { Search, MessageSquare, Bell, User } from 'lucide-react';
import { Button } from './ui/button';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const TopHeader: React.FC = () => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const { user, profile } = useSupabase();
  const isDesktop = breakpoint === "desktop";
  
  // Don't render on mobile
  if (!isDesktop) {
    return null;
  }

  const handleSearchClick = () => {
    navigate('/search');
  };
  
  return (
    <div className="w-full bg-gradient-to-r from-primary/90 to-primary text-white py-3 shadow-lg fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group ml-0">
          <div className="p-1.5 rounded-full bg-white/10 backdrop-blur-sm shadow-inner transition-all duration-300 group-hover:bg-white/20">
            <img 
              src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
              alt="Tuwaye Logo" 
              className="h-8 w-auto"
            />
          </div>
          <span className="font-bold text-xl tracking-tight">TUWAYE</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSearchClick}
            variant="ghost" 
            className="flex items-center gap-2 text-white hover:bg-white/20 transition-all duration-300 rounded-full px-4"
            size="sm"
          >
            <Search size={18} />
            <span>Search</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center text-white hover:bg-white/20 transition-all duration-300 rounded-full"
            size="icon"
          >
            <Bell size={18} />
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center text-white hover:bg-white/20 transition-all duration-300 rounded-full"
            size="icon"
            onClick={() => navigate('/messages')}
          >
            <MessageSquare size={18} />
          </Button>
          
          {user ? (
            <Link to="/profile" className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300">
              {profile?.avatar_url ? (
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src={profile.avatar_url} alt={profile.username || "Profile"} />
                  <AvatarFallback><User size={18} /></AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-8 w-8 flex items-center justify-center">
                  <User size={18} />
                </div>
              )}
            </Link>
          ) : (
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/20 hover:text-white hover:border-white/10 rounded-full"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
          )}
          
          <div className="p-1 rounded-full bg-white/10 backdrop-blur-sm shadow-inner transition-all duration-300 hover:bg-white/20">
            <img 
              src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
              alt="Let's Talk" 
              className="h-8 w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
