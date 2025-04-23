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
  LogIn,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import CreatePostModal from './CreatePostModal';

const Sidebar = () => {
  const { user, profile, signOut, signIn } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  
  const authenticatedNavLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/vibezone', icon: Film, label: 'Vibezone' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/marketplaces', icon: ShoppingBag, label: 'Marketplaces' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/favourites', icon: Bookmark, label: 'Favourites' },
    { href: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];
  
  const unauthenticatedNavLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/help', icon: HelpCircle, label: 'Help & Support' },
  ];
  
  const navLinks = user ? authenticatedNavLinks : unauthenticatedNavLinks;

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const coverUrl = profile?.cover_url || user?.user_metadata?.cover_url;
  const username = profile?.username || user?.user_metadata?.username || 'User';
  const email = user?.email || '';

  return (
    <>
      <div 
        className={`fixed top-0 left-0 h-[95vh] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-gray-100 flex flex-col shadow-lg mt-12 overflow-hidden z-30`}
      >
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-4 right-3 h-8 w-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center z-10 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
        >
          {collapsed ? 
            <ChevronRight className="h-4 w-4 text-primary" /> : 
            <ChevronLeft className="h-4 w-4 text-primary" />
          }
        </button>
        
        {user && (
          <div className="shrink-0 mt-4">
            <div className="relative h-28 overflow-hidden">
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 via-purple-300/30 to-indigo-200/30" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 backdrop-blur-[2px]"></div>
              
              <div className="absolute -bottom-2 right-4 text-white/80">
                <Sparkles className="h-4 w-4 animate-pulse-slow" />
              </div>
              
              <div className="absolute -bottom-5 left-0 right-0 h-10 bg-white" style={{ 
                borderTopLeftRadius: '50%', 
                borderTopRightRadius: '50%',
                boxShadow: 'inset 0 -2px 10px rgba(0,0,0,0.03)'
              }}></div>
            </div>
            
            <div className="flex flex-col items-center -mt-14 pb-2">
              {!collapsed && (
                <div className="bg-white rounded-full p-1 shadow-sm mb-1 border border-primary/10">
                  <img 
                    src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                    alt="Tuwaye Logo" 
                    className="h-8 w-8"
                  />
                </div>
              )}
              
              <Avatar className={`border-4 border-white shadow-lg ${
                collapsed ? 'h-14 w-14' : 'h-20 w-20'
              } transition-all duration-300 hover:border-primary/20`}>
                <AvatarImage 
                  src={avatarUrl} 
                  alt={username} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/60 text-primary-foreground text-lg font-medium">
                  {username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {!collapsed && (
                <div className="mt-2 text-center">
                  <h3 className="font-semibold text-base text-gray-900 tracking-tight">
                    {username}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-[90%] mx-auto truncate">
                    {email}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-primary text-xs hover:bg-primary/5 hover:scale-105 transition-all active:scale-95"
                    onClick={() => navigate('/profile')}
                  >
                    View Profile
                  </Button>
                </div>
              )}
            </div>
            
            <div className="w-full px-3 py-2">
              <div className={`h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent ${
                collapsed ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}></div>
            </div>
          </div>
        )}

        {!user && (
          <div className="shrink-0 mt-8 flex justify-center">
            <div className="bg-white rounded-full p-1 shadow-sm mb-4 border border-primary/10">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className={collapsed ? "h-12 w-12" : "h-16 w-16"}
              />
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-y-auto px-2">
          <nav className="flex flex-col py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const isHovered = hoveredLink === link.href;
              
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 mx-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 text-primary font-medium shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`
                  }
                  onMouseEnter={() => setHoveredLink(link.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <div className={`relative ${collapsed ? 'mx-auto' : ''}`}>
                    <link.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500'} transition-transform duration-300 ${
                      isHovered ? 'scale-110' : 'scale-100'
                    }`} />
                    
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {!collapsed && (
                    <span className={`text-sm ${isActive ? 'font-medium' : ''} transition-all duration-200 ${
                      isHovered ? 'translate-x-0.5' : 'translate-x-0'
                    }`}>
                      {link.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        <div className={`p-3 space-y-2 bg-gradient-to-b from-transparent via-gray-50/80 to-gray-100/50 border-t border-gray-100 shrink-0 ${
          collapsed ? 'flex flex-col items-center' : ''
        }`}>
          {user ? (
            collapsed ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalOpen(true)}
                  className="w-10 h-10 p-0 rounded-full shadow-md hover:shadow-lg border-primary/20 transition-all hover:scale-105 active:scale-95"
                  title="Create Post"
                >
                  <PlusCircle className="h-5 w-5 text-primary" />
                </Button>
                
                <Button 
                  onClick={signOut}
                  className="w-10 h-10 p-0 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
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
                  className="w-full border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-primary/5 text-gray-700 justify-start gap-2 shadow-md py-2.5 hover:shadow-lg transition-all border-primary/20 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="p-1 rounded-full bg-primary/10">
                    <PlusCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Create Post</span>
                </Button>
                
                <Button 
                  onClick={signOut}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 justify-start gap-2 shadow-md py-2.5 hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="p-1 rounded-full bg-red-100">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Sign Out</span>
                </Button>
              </>
            )
          ) : (
            collapsed ? (
              <Button 
                onClick={() => navigate('/auth')}
                className="w-10 h-10 p-0 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                title="Sign In"
              >
                <LogIn className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-primary hover:bg-primary/90 text-white justify-start gap-2 shadow-md py-2.5 hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="p-1 rounded-full bg-primary/20">
                  <LogIn className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Sign In</span>
              </Button>
            )
          )}
        </div>
      </div>
      
      {user && (
        <CreatePostModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </>
  );
};

export default Sidebar;
