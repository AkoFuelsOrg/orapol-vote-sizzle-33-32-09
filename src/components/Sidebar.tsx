
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
  Bookmark,
  Settings,
  LogOut
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
    <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 py-6 px-3 flex flex-col shadow-sm">
      <div className="mb-4">
        {/* Removed the Vibezone text that was here */}
      </div>

      <nav className="flex-1 space-y-1.5">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              <link.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
              <span>{link.label}</span>
              {link.label === 'Notifications' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">3</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-200 pt-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-3 py-3 rounded-lg hover:bg-gray-100 transition-all">
                <Avatar className="mr-2 h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={user.user_metadata?.avatar_url as string} />
                  <AvatarFallback className="bg-primary/10 text-primary">{user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-900">{user.user_metadata?.username}</span>
                  <span className="text-xs text-gray-500">View profile</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-red-500">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate('/auth')} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
