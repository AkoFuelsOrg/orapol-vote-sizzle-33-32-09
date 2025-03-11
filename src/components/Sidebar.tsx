
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useSupabase();
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{users: any[], polls: any[]}>({users: [], polls: []});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle search input change
  const handleSearch = async (search: string) => {
    setSearchTerm(search);
    
    if (!search || search.length < 2) {
      setSearchResults({users: [], polls: []});
      return;
    }

    setSearchLoading(true);
    
    try {
      // Fetch data for fuzzy search
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .limit(20);
      
      if (usersError) throw usersError;
      
      // Fetch polls for fuzzy search
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select('id, question')
        .limit(20);
      
      if (pollsError) throw pollsError;
      
      // Configure Fuse options for fuzzy search with min matching threshold of 0.4 (60% match)
      const userFuseOptions = {
        keys: ['username'],
        threshold: 0.4, // Lower threshold means higher match requirement (0 is exact, 1 is match anything)
        includeScore: true
      };
      
      const pollFuseOptions = {
        keys: ['question'],
        threshold: 0.4,
        includeScore: true
      };
      
      const userFuse = new Fuse(users || [], userFuseOptions);
      const pollFuse = new Fuse(polls || [], pollFuseOptions);
      
      const userResults = userFuse.search(search).map(result => result.item);
      const pollResults = pollFuse.search(search).map(result => result.item);
      
      setSearchResults({
        users: userResults,
        polls: pollResults
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const menuItems = [
    { path: '/', label: 'Polls', icon: MessageCircle },
    ...(user && !loading ? [
      { path: '/search', label: 'Search', icon: Search, action: () => setOpen(true) },
      { path: '/voted-polls', label: 'Voted Polls', icon: ThumbsUp },
      { path: '/followers', label: 'Followers', icon: Users },
      { path: '/following', label: 'Following', icon: UserCheck },
      { path: '/messages', label: 'Messages', icon: MessageSquare },
      { path: '/notifications', label: 'Notifications', icon: Bell },
      { path: '/create', label: 'Create Poll', icon: Plus },
      { path: '/profile', label: 'Profile', icon: User },
    ] : []),
    ...(user && !loading ? [{ path: '/logout', label: 'Logout', icon: LogOut, action: signOut }] : [
      { path: '/auth', label: 'Login', icon: User }
    ])
  ];

  const handleItemClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    }
  };

  const navigateToUser = (userId: string) => {
    navigate(`/user/${userId}`);
    setOpen(false);
  };

  const navigateToPoll = (pollId: string) => {
    navigate(`/poll/${pollId}`);
    setOpen(false);
  };
  
  return (
    <>
      <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 pt-16 shadow-sm">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-red-500">Orapol</h1>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex items-center w-full px-4 py-3 rounded-lg transition-colors group",
                      location.pathname === item.path 
                        ? "bg-red-50 text-red-500 font-medium" 
                        : "text-gray-700 hover:text-red-500 hover:bg-red-50"
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
            <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 transition-colors">
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
        <CommandInput
          placeholder="Search for users or polls..."
          onValueChange={handleSearch}
          className="border-none outline-none focus:outline-none focus:ring-0"
          value={searchTerm}
        />
        <CommandList>
          {searchLoading && (
            <div className="py-6 text-center text-sm">
              Searching...
            </div>
          )}
          
          {!searchLoading && searchResults.users.length === 0 && searchResults.polls.length === 0 && searchTerm.length >= 2 && (
            <CommandEmpty>No results found matching "{searchTerm}"</CommandEmpty>
          )}
          
          {searchResults.users.length > 0 && (
            <CommandGroup heading={`Users matching "${searchTerm}" (${searchResults.users.length})`}>
              {searchResults.users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => navigateToUser(user.id)}
                  className="flex items-center gap-2 py-3 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.username || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-red-100 text-red-500">
                      {user.username ? user.username[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{user.username}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {searchResults.polls.length > 0 && (
            <CommandGroup heading={`Polls matching "${searchTerm}" (${searchResults.polls.length})`}>
              {searchResults.polls.map((poll) => (
                <CommandItem
                  key={poll.id}
                  onSelect={() => navigateToPoll(poll.id)}
                  className="py-3 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-red-500" />
                  <span className="truncate">{poll.question}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default Sidebar;
