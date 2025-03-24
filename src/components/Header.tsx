
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Plus, 
  User, 
  LogOut, 
  MessageSquare, 
  Search,
  Menu
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from './ui/button';
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
  
  // Don't render header on desktop
  if (breakpoint === "desktop") {
    return null;
  }

  const handleSearchClick = () => {
    navigate('/search');
  };

  const navItems = [
    { href: '/', icon: <MessageCircle size={20} />, label: 'Home' },
    { href: '/vibezone', icon: <MessageCircle size={20} />, label: 'Vibezone' },
    { href: '/groups', icon: <User size={20} />, label: 'Groups' },
    { href: '/marketplaces', icon: <MessageSquare size={20} />, label: 'Marketplaces' },
    { href: '/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
    { href: '/favourites', icon: <MessageSquare size={20} />, label: 'Favourites' }
  ];
  
  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-card h-[4.3rem] px-4 animate-fade-in">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
            alt="Tuwaye Logo" 
            className="h-7 w-auto"
          />
          <span className="font-bold text-xl text-primary">TUWAYE</span>
        </Link>
        
        <nav className="flex items-center space-x-1">
          <Button
            onClick={handleSearchClick}
            variant="ghost"
            size="icon"
            className={`p-2.5 rounded-full transition-colors duration-200 ${
              location.pathname === '/search' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <Search size={20} />
          </Button>
          
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="p-2.5 rounded-full text-primary/70 hover:text-primary hover:bg-secondary/70 transition-colors duration-200"
              >
                <Menu size={20} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 py-6">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <img 
                    src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                    alt="Tuwaye Logo" 
                    className="h-10 w-auto mr-2"
                  />
                  <h3 className="text-lg font-semibold">Menu</h3>
                </div>
                <div className="flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        location.pathname === item.href 
                          ? 'bg-secondary text-primary' 
                          : 'hover:bg-secondary/50 text-primary/80 hover:text-primary'
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                  
                  {user && !loading && (
                    <button
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors mt-2"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          
          {user && !loading ? (
            <>
              <Link 
                to="/profile" 
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  location.pathname === '/profile' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
                }`}
              >
                {profile?.avatar_url ? (
                  <Avatar className="h-5 w-5">
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
              className={`p-2.5 rounded-full transition-colors duration-200 ${
                location.pathname === '/auth' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
              }`}
            >
              <User size={20} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
