
import React, { useState } from 'react';
import {
  Home,
  Search,
  Bell,
  MessageSquare,
  UserCircle,
  Users,
  ShoppingBag,
  Film,
  Bookmark,
  Settings,
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
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/favourites', icon: Bookmark, label: 'Favourites' },
    { href: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm mt-12">
        {user && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={user.user_metadata?.avatar_url as string} />
                <AvatarFallback className="bg-gray-100 text-gray-500">{user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{user.user_metadata?.username || 'User'}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 pt-2 pb-6 overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-500' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <link.icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-500'}`} />
                <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{link.label}</span>
                {link.label === 'Notifications' && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-medium text-white">3</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 space-y-3">
          <Button 
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="w-full border-gray-200 hover:bg-gray-50 text-gray-700 justify-start gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Post</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={signOut}
            className="w-full border-gray-200 hover:bg-gray-50 text-red-500 justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
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
