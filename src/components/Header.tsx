
import React, { useState, useRef, useEffect } from 'react';
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
  Video,
  PenLine,
  Mic,
  X,
  Bot
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
import CreatePostModal from './CreatePostModal';
import SearchSuggestions from './SearchSuggestions';
import { AIChatModal } from './AIChatModal';
import { addToSearchHistory } from '@/lib/search-history';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useSupabase();
  const { breakpoint } = useBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  if (breakpoint === "desktop") {
    return null;
  }

  const handleSearchClick = async () => {
    if (showSearch) {
      if (searchQuery.trim()) {
        try {
          // Add to search history before navigating
          await addToSearchHistory(searchQuery.trim());
          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
          setShowSearch(false);
          setShowSuggestions(false);
        } catch (error) {
          console.error('Error adding to search history:', error);
          // Navigate anyway even if saving history fails
          navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          setSearchQuery('');
          setShowSearch(false);
          setShowSuggestions(false);
        }
      }
    } else {
      setShowSearch(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        // Add to search history before navigating
        await addToSearchHistory(searchQuery.trim());
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowSearch(false);
        setShowSuggestions(false);
      } catch (error) {
        console.error('Error adding to search history:', error);
        // Navigate anyway even if saving history fails
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowSearch(false);
        setShowSuggestions(false);
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true); // Always show suggestions when typing
  };

  const handleSuggestionSelect = (query: string) => {
    setSearchQuery(query);
    // Don't hide suggestions after selecting from history
  };

  const navItems = [
    { href: '/', icon: <Home size={20} strokeWidth={3.5} />, label: 'Home' },
    { href: '/vibezone', icon: <Video size={20} strokeWidth={3.5} />, label: 'Vibezone' },
    { href: '/groups', icon: <Users size={20} strokeWidth={3.5} />, label: 'Groups' },
    { href: '/marketplaces', icon: <ShoppingBag size={20} strokeWidth={3.5} />, label: 'Marketplaces' },
    { href: '/messages', icon: <MessageSquare size={20} strokeWidth={3.5} />, label: 'Messages' },
    { href: '/favourites', icon: <Heart size={20} strokeWidth={3.5} />, label: 'Favourites' }
  ];
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary via-primary/95 to-primary/90 h-[4.5rem] px-4 animate-fade-in shadow-md backdrop-blur-sm">
        <div className="max-w-lg mx-auto h-full flex items-center justify-between">
          {!showSearch ? (
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-all duration-300">
                  <img 
                    src="/lovable-uploads/95591de9-b621-4bd0-b1a8-c28c6d4e09c9.png" 
                    alt="Tuwaye Logo" 
                    className="h-7 w-auto"
                  />
                </div>
                <span className="font-bold text-xl text-white relative">
                  Tuwaye
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white/40 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs relative">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => setShowSuggestions(true)} // Always show suggestions on focus
                  autoFocus
                  className="pl-9 pr-8 py-2 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full focus-visible:ring-white/30"
                />
                <Search size={16} strokeWidth={3.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white/70 hover:text-white hover:bg-transparent"
                  onClick={() => {
                    setShowSearch(false);
                    setShowSuggestions(false);
                    setSearchQuery('');
                  }}
                >
                  <X size={16} strokeWidth={3.5} />
                </Button>
                
                {showSuggestions && (
                  <SearchSuggestions
                    query={searchQuery}
                    onSelect={handleSuggestionSelect}
                    onClose={() => setShowSuggestions(false)}
                  />
                )}
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
              <Search size={20} strokeWidth={3.5} />
            </Button>
            
            {!showSearch && (
              <>
                <Button
                  onClick={() => setPostModalOpen(true)}
                  variant="ghost"
                  size="icon"
                  className={`p-2.5 rounded-full transition-all duration-300 text-white/90 hover:text-white hover:bg-white/20`}
                >
                  <PenLine size={20} strokeWidth={3.5} />
                </Button>
                
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-all duration-300"
                    >
                      <Menu size={20} strokeWidth={3.5} />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="px-4 py-6 bg-gradient-to-b from-primary/5 to-background border-t border-primary/10">
                    <div className="max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="p-1.5 rounded-full bg-primary/10 mr-2">
                            <img 
                              src="/lovable-uploads/95591de9-b621-4bd0-b1a8-c28c6d4e09c9.png" 
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
                          <X size={20} strokeWidth={3.5} />
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
                        
                        <Button
                          onClick={() => {
                            setAiChatOpen(true); 
                            setIsOpen(false);
                          }}
                          className="flex items-center space-x-3 p-3 rounded-lg w-full justify-start font-normal text-primary/80 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                        >
                          <Bot className="flex-shrink-0" size={20} strokeWidth={3.5} />
                          <span>Tuwaye AI Gen 0</span>
                        </Button>
                        
                        {user && !loading && (
                          <button
                            onClick={() => {
                              signOut();
                              setIsOpen(false);
                            }}
                            className="flex items-center space-x-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-all duration-300 mt-2"
                          >
                            <LogOut size={20} strokeWidth={3.5} />
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
                            key={profile.avatar_url}
                          />
                          <AvatarFallback>
                            <User size={20} strokeWidth={3.5} />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User size={20} strokeWidth={3.5} />
                      )}
                    </Link>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
        
        <CreatePostModal 
          isOpen={postModalOpen} 
          onClose={() => setPostModalOpen(false)} 
        />
      </header>

      <AIChatModal 
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </>
  );
};

export default Header;
