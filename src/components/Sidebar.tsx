
import React, { useState, useEffect } from 'react';
import {
  Home,
  MessageSquare,
  UserCircle,
  Users,
  ShoppingBag,
  Film,
  Bookmark,
  LogOut,
  PlusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import CreatePostModal from './CreatePostModal';

const Sidebar = () => {
  const { user, profile, signOut } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const navLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/vibezone', icon: Film, label: 'Vibezone' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/marketplaces', icon: ShoppingBag, label: 'Marketplaces' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/favourites', icon: Bookmark, label: 'Favourites' },
  ];

  // Get the user's profile data directly from the profile object
  // This is coming from useSupabase hook which already fetches the profile
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const coverUrl = profile?.cover_url || user?.user_metadata?.cover_url;
  const username = profile?.username || user?.user_metadata?.username || 'User';
  const email = user?.email || '';

  return (
    <>
      <div 
        className={`fixed top-0 left-0 h-[95vh] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-gray-100 flex flex-col shadow-md mt-12 overflow-hidden z-30`}
      >
        {/* Collapse Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 right-3 h-7 w-7 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
        >
          {collapsed ? 
            <ChevronRight className="h-4 w-4 text-gray-500" /> : 
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          }
        </button>
        
        {user && (
          <div className="shrink-0 mt-4">
            {/* Profile Cover Image */}
            <div className="relative h-24 overflow-hidden">
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-200" />
              )}
              
              {/* Decorative Curve */}
              <div className="absolute -bottom-5 left-0 right-0 h-10 bg-white" style={{ 
                borderTopLeftRadius: '50%', 
                borderTopRightRadius: '50%' 
              }}></div>
            </div>
            
            <div className="flex flex-col items-center -mt-14 pb-2">
              {!collapsed && (
                <div className="bg-white rounded-full p-1 shadow-sm mb-1">
                  <img 
                    src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                    alt="Tuwaye Logo" 
                    className="h-8 w-8"
                  />
                </div>
              )}
              
              {/* Profile Avatar - Positioned to overlap the cover image */}
              <Avatar className={`border-4 border-white shadow-md ${
                collapsed ? 'h-14 w-14' : 'h-20 w-20'
              }`}>
                <AvatarImage src={avatarUrl} alt={username} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {!collapsed && (
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
              )}
            </div>
            
            <div className="w-full px-3 py-2">
              <div className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent ${
                collapsed ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}></div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto px-2">
          <nav className="flex flex-col py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 mx-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`
                  }
                >
                  <link.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'} ${
                    collapsed ? 'mx-auto' : ''
                  }`} />
                  {!collapsed && (
                    <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>{link.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        <div className={`p-3 space-y-2 bg-gradient-to-b from-transparent to-gray-50 border-t border-gray-100 shrink-0 ${
          collapsed ? 'flex flex-col items-center' : ''
        }`}>
          {collapsed ? (
            <>
              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="w-10 h-10 p-0 rounded-full shadow-sm hover:shadow-md transition-shadow"
                title="Create Post"
              >
                <PlusCircle className="h-5 w-5 text-primary" />
              </Button>
              
              <Button 
                onClick={signOut}
                className="w-10 h-10 p-0 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm hover:shadow-md transition-shadow"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={() => setModalOpen(true)}
                className="w-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700 justify-start gap-2 shadow-sm py-2.5 hover:shadow transition-shadow"
              >
                <PlusCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Create Post</span>
              </Button>
              
              <Button 
                onClick={signOut}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 justify-start gap-2 shadow-sm py-2.5 hover:shadow transition-shadow"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </Button>
            </>
          )}
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
