
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Plus, User, LogOut, MessageSquare } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useBreakpoint } from '../hooks/use-mobile';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut, loading } = useSupabase();
  const breakpoint = useBreakpoint();
  
  // Don't render header on desktop
  if (breakpoint === "desktop") {
    return null;
  }
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card h-16 px-4 animate-fade-in">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold text-red-500">
            Orapol
          </h1>
        </Link>
        
        <nav className="flex items-center space-x-1">
          <Link 
            to="/" 
            className={`p-2.5 rounded-full transition-colors duration-200 ${
              location.pathname === '/' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <MessageCircle size={20} />
          </Link>
          
          {user && !loading ? (
            <>
              <Link 
                to="/messages" 
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  location.pathname.startsWith('/messages') ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
                }`}
              >
                <MessageSquare size={20} />
              </Link>
              <Link 
                to="/create" 
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  location.pathname === '/create' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
                }`}
              >
                <Plus size={20} />
              </Link>
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
              <button
                onClick={() => signOut()}
                className="p-2.5 rounded-full text-primary/70 hover:text-primary hover:bg-secondary/70 transition-colors duration-200"
              >
                <LogOut size={20} />
              </button>
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
