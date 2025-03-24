
import React, { useState, useEffect } from 'react';
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
  const { user, profile, signOut } = useSupabase();
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

  // Get the user's profile data directly from the profile object
  // This is coming from useSupabase hook which already fetches the profile
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const coverUrl = profile?.cover_url || user?.user_metadata?.cover_url;
  const username = profile?.username || user?.user_metadata?.username || 'User';
  const email = user?.email || '';

  return (
    <>
      <div className="fixed top-0 left-0 h-[95vh] w-64 bg-white border-r border-gray-100 flex flex-col shadow-md mt-12">
        {user && (
          <div className="border-b border-gray-100 shrink-0">
            {/* Profile Cover Image */}
            <div className="relative h-24 bg-gradient-to-r from-purple-100 to-purple-300 overflow-hidden">
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-200 to-purple-200" />
              )}
            </div>
            
            {/* Profile Avatar - Positioned to overlap the cover image */}
            <div className="flex flex-col items-center -mt-10 pb-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarImage src={avatarUrl} alt={username} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-2 text-center">
                <h3 className="font-semibold text-base text-gray-900">
                  {username}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 max-w-[90%] mx-auto truncate">
                  {email}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-primary text-xs hover:bg-primary/5"
                  onClick={() => navigate('/profile')}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto">
          <nav className="flex flex-col py-6 px-2 space-y-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3 mx-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`
                  }
                >
                  <link.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
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
            className="w-full border-gray-200 hover:bg-gray-100 text-gray-700 justify-start gap-2 shadow-sm py-2.5"
          >
            <PlusCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Create Post</span>
          </Button>
          
          <Button 
            onClick={signOut}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 justify-start gap-2 shadow-sm py-2.5"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sign Out</span>
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
