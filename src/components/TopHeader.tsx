import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../hooks/use-mobile';
import { Search, MessageSquare, Bell, User, Heart, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const TopHeader: React.FC = () => {
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const { user, profile } = useSupabase();
  const isDesktop = breakpoint === "desktop";
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!isDesktop) {
    return null;
  }

  const handleSearchClick = () => {
    if (showSearch) {
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowSearch(false);
      }
    } else {
      setShowSearch(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchQuery('');
    }
  };
  
  return (
    <div className="w-full bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-white py-3 shadow-lg fixed top-0 left-0 right-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group ml-0">
          <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner transition-all duration-300 group-hover:bg-white/30">
            <img 
              src="/lovable-uploads/420f4044-9fc3-4ea9-855e-859f2581c74b.png" 
              alt="Tuwaye Logo" 
              className="h-8 w-auto"
            />
          </div>
          <div className="font-bold text-xl tracking-tight relative overflow-hidden">
            <span className="relative z-10">Tuwaye</span>
            <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} className="relative w-64">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="pl-9 pr-8 py-2 h-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full focus-visible:ring-white/30"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-white/70 hover:text-white hover:bg-transparent p-0"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <X size={14} />
              </Button>
            </form>
          ) : (
            <Button 
              onClick={handleSearchClick}
              variant="ghost" 
              className="flex items-center gap-2 text-white hover:bg-white/20 transition-all duration-300 rounded-full px-4"
              size="sm"
            >
              <Search size={18} />
              <span>Search</span>
            </Button>
          )}
          
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
          
          <Button 
            variant="ghost" 
            className="flex items-center text-white hover:bg-white/20 transition-all duration-300 rounded-full"
            size="icon"
            onClick={() => navigate('/favourites')}
          >
            <Heart size={18} />
          </Button>
          
          {user ? (
            <Link to="/profile" className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {profile?.avatar_url ? (
                  <Avatar className="h-8 w-8 border border-white/30">
                    <AvatarImage 
                      src={profile.avatar_url} 
                      alt={profile.username || "Profile"} 
                      key={profile.avatar_url}
                    />
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 flex items-center justify-center">
                    <User size={18} />
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Button 
              variant="default" 
              className="rounded-full"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopHeader;
