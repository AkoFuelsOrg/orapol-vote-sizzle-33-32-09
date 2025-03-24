
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
    <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-white via-gray-50 to-blue-50 border-r border-gray-200 flex flex-col shadow-md">
      <div className="pt-6 px-4 pb-6">
        {/* Logo or branding could go here */}
      </div>

      <nav className="flex-1 px-3 space-y-2 overflow-y-auto no-scrollbar">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/10 text-primary font-medium shadow-sm border-l-4 border-primary' 
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 hover:border-l-4 hover:border-gray-200'
                }`
              }
            >
              <link.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
              <span className="font-medium">{link.label}</span>
              {link.label === 'Notifications' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white shadow-sm">3</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-200 pt-4 px-3 pb-6">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-3 py-3 rounded-lg hover:bg-blue-50 transition-all">
                <Avatar className="mr-2 h-10 w-10 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={user.user_metadata?.avatar_url as string} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-primary font-semibold">{user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-900">{user.user_metadata?.username}</span>
                  <span className="text-xs text-gray-500">View profile</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-2 py-2">
                <UserCircle className="h-4 w-4 text-blue-500" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="flex items-center gap-2 py-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 py-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button 
            onClick={() => navigate('/auth')} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
          >
            Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
