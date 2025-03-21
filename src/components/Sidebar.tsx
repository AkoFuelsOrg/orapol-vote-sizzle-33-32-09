
import React from 'react';
import {
  Home,
  Search,
  Bell,
  MessageSquare,
  UserCircle,
  Users,
  ShoppingBag,
  Film,
  Bookmark
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

const Sidebar = () => {
  const { user, signOut } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Update the navLinks array in the Sidebar component to include Favourites
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
    <div className="fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 py-4 px-3 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">Vibezone</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-gray-100 font-medium' : 'text-gray-600'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 border-t border-gray-200 pt-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url as string} />
                  <AvatarFallback>{user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">{user.user_metadata?.username}</span>
                  <span className="text-xs text-gray-500">View profile</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate('/auth')} className="w-full">
            Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
