
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Plus, 
  User, 
  LogOut, 
  MessageSquare,
  ThumbsUp,
  Users,
  UserCheck, 
  Bell,
  ChevronRight,
  Search
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { supabase } from '@/integrations/supabase/client';
import Fuse from 'fuse.js';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useSupabase();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // When search is submitted in command dialog
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length > 1) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setOpen(false);
      setSearchTerm('');
    }
  };

  // Handle keyboard events for Command dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Enter' && searchTerm.trim().length > 1) {
        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setOpen(false);
        setSearchTerm('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, searchTerm, navigate]);

  const menuItems = [
    { path: '/', label: 'Polls', icon: MessageCircle },
    ...(user && !loading ? [
      { path: '#', label: 'Search', icon: Search, action: () => setOpen(true) },
      { path: '/voted-polls', label: 'Voted Polls', icon: ThumbsUp },
      { path: '/followers', label: 'Followers', icon: Users },
      { path: '/following', label: 'Following', icon: UserCheck },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/notifications', label: 'Notifications', icon: Bell },
      { path: '/create', label: 'Create Poll', icon: Plus },
      { path: '/profile', label: 'Profile', icon: User },
    ] : []),
    ...(user && !loading ? [{ path: '#', label: 'Logout', icon: LogOut, action: signOut }] : [
      { path: '/auth', label: 'Login', icon: User }
    ])
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.path && item.path !== '#') {
      navigate(item.path);
    }
  };
  
  return (
    <>
      <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 pt-16 shadow-sm">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-primary">TUWAYE</h1>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === location.pathname && item.path !== '#';
              
              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-700 hover:text-primary hover:bg-primary/10"
                    )}
                  >
                    <Icon size={18} className="mr-3" />
                    <span>{item.label}</span>
                    <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {user && !loading && (
          <div className="p-4 mt-auto border-t border-gray-200">
            <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary/10 transition-colors">
              {profile?.avatar_url ? (
                <Avatar>
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.username || user.email || "Profile"}
                  />
                  <AvatarFallback>
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarFallback>
                    <User size={18} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <p className="font-medium">{profile?.username || user.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</p>
              </div>
            </Link>
          </div>
        )}
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <form onSubmit={handleSearchSubmit}>
          <CommandInput
            placeholder="Search for users or polls..."
            onValueChange={setSearchTerm}
            value={searchTerm}
            className="border-none outline-none focus:outline-none focus:ring-0"
            autoFocus
          />
        </form>
        <CommandList>
          <CommandEmpty>Type at least 2 characters and press Enter to search</CommandEmpty>
          <CommandGroup>
            <div className="px-4 py-3 text-sm text-gray-600">
              Press Enter to search for "{searchTerm}"
            </div>
            {searchTerm.trim().length > 1 && (
              <CommandItem 
                onSelect={() => {
                  navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Search className="mr-2 h-4 w-4" />
                <span>Search for "{searchTerm}"</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default Sidebar;
