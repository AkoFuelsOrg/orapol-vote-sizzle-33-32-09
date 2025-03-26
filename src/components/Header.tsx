import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Plus, 
  User, 
  LogOut, 
  MessageSquare, 
  Search,
  Menu,
  Home,
  Users,
  ShoppingBag,
  Heart,
  Bell,
  PenLine,
  Mic,
  X
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger
} from './ui/drawer';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useSupabase();
  const breakpoint = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  if (breakpoint === "desktop") {
    return null;
  }

  const handleSearchClick = () => {
    if (showSearch) {
      // If search box is already visible, handle search submission
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowSearch(false);
      }
    } else {
      // If search box is not visible, show it
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

  const navItems = [
    { href: '/', icon: <Home size={20} />, label: 'Home' },
    { href: '/vibezone', icon: <MessageCircle size={20} />, label: 'Vibezone' },
    { href: '/groups', icon: <Users size={20} />, label: 'Groups' },
    { href: '/marketplaces', icon: <ShoppingBag size={20} />, label: 'Marketplaces' },
    { href: '/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
    { href: '/favourites', icon: <Heart size={20} />, label: 'Favourites' }
  ];
  
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary via-primary/95 to-primary/90 h-[4.5rem] px-4 animate-fade-in shadow-md backdrop-blur-sm">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between">
        {!showSearch ? (
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-all duration-300">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-7 w-auto"
              />
            </div>
            <span className="font-bold text-xl text-white relative">
              Tuwaye
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/40 group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
        ) : (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="pl-9 pr-8 py-2 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full focus-visible:ring-white/30"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white/70 hover:text-white hover:bg-transparent"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <X size={16} />
              </Button>
            </div>
          </form>
        )}
        
        <nav className="flex items-center space-x-1.5">
          <Button
            onClick={handleSearchClick}
            variant="ghost"
            size="icon"
            className={`p-2.5 rounded-full transition-all duration-300 ${
              location.pathname === '/search' ? 'bg-white/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/20'
            }`}
          >
            <Search size={20} />
          </Button>
          
          {!showSearch && (
            <>
              <Link
                to="/create"
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  location.pathname === '/create' ? 'bg-white/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/20'
                }`}
              >
                <PenLine size={20} />
              </Link>
              
              <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-all duration-300"
                  >
                    <Menu size={20} />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="px-4 py-6 bg-gradient-to-b from-primary/5 to-background border-t border-primary/10">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-full bg-primary/10 mr-2">
                          <img 
                            src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                            alt="Tuwaye Logo" 
                            className="h-10 w-auto"
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-primary">Menu</h3>
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="rounded-full hover:bg-primary/10 text-primary/80"
                      >
                        <X size={20} />
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                            location.pathname === item.href 
                              ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                              : 'hover:bg-primary/5 text-primary/80 hover:text-primary'
                          }`}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      
                      {user && !loading && (
                        <button
                          onClick={() => {
                            signOut();
                            setIsOpen(false);
                          }}
                          className="flex items-center space-x-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-300 mt-2"
                        >
                          <LogOut size={20} />
                          <span className="font-medium">Sign Out</span>
                        </button>
                      )}
                      
                      <div className="mt-6 pt-3 border-t border-primary/10">
                        <Link
                          to="/lets-talk"
                          onClick={() => setIsOpen(false)}
                          className="block text-center"
                        >
                          <span className="font-semibold tracking-wide text-primary/90 text-lg">LETS TALK</span>
                          <div className="text-xs text-primary/60 mt-1">Connect. Share. Grow.</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              
              {user && !loading ? (
                <>
                  <Link 
                    to="/profile" 
                    className={`p-2.5 rounded-full transition-all duration-300 ${
                      location.pathname === '/profile' ? 'bg-white/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {profile?.avatar_url ? (
                      <Avatar className="h-5 w-5 border border-white/30">
                        <AvatarImage
                          src={profile.avatar_url}
                          alt={profile.username || user.email || "Profile"}
                        />
                        <AvatarFallback>
                          <User size={20} />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User size={20} />
                    )}
                  </Link>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className={`p-2.5 rounded-full transition-all duration-300 ${
                    location.pathname === '/auth' ? 'bg-white/30 text-white' : 'text-white/90 hover:text-white hover:bg-white/20'
                  }`}
                >
                  <User size={20} />
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
