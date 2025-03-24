
import React, { useState } from 'react';
import {
  Home,
  Search,
  MessageSquare,
  UserCircle,
  Users,
  ShoppingBag,
  Film,
  Bookmark,
  LogOut,
  PlusCircle
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from 'react-router-dom';
import CreatePostModal from './CreatePostModal';
import { ScrollArea } from './ui/scroll-area';

const Sidebar = () => {
  const { user, signOut } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  
  const navLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/vibezone', icon: Film, label: 'Vibezone' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/marketplaces', icon: ShoppingBag, label: 'Marketplaces' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/favourites', icon: Bookmark, label: 'Favourites' },
    { href: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 h-[95vh] w-64 bg-white border-r border-gray-100 flex flex-col shadow-md mt-12">
        {user && (
          <div className="p-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-primary shadow-sm">
                <AvatarImage src={user.user_metadata?.avatar_url as string} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">{user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{user.user_metadata?.username || 'User'}</span>
                <span className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</span>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto">
          <nav className="py-2 px-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 mb-1 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <link.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-3 space-y-2 bg-gray-50 border-t border-gray-100 shrink-0">
          <Button 
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="w-full border-gray-200 hover:bg-gray-100 text-gray-700 justify-start gap-2 shadow-sm py-1.5"
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            <span className="text-sm">Create Post</span>
          </Button>
          
          <Button 
            onClick={signOut}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 justify-start gap-2 shadow-sm py-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </Button>
        </div>
      </div>
      
      <CreatePostModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar;
