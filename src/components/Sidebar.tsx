
import React from 'react';
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
  Bell
} from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, profile, signOut, loading } = useSupabase();
  
  const menuItems = [
    { path: '/', label: 'Polls', icon: MessageCircle },
    ...(user && !loading ? [
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
  
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold text-red-500">Orapol</h1>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            if (item.action) {
              return (
                <li key={item.path}>
                  <button
                    onClick={item.action}
                    className={cn(
                      "flex items-center w-full px-4 py-3 rounded-lg transition-colors",
                      location.pathname === item.path 
                        ? "bg-secondary text-primary" 
                        : "text-primary/70 hover:text-primary hover:bg-secondary/70"
                    )}
                  >
                    <Icon size={20} className="mr-3" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center w-full px-4 py-3 rounded-lg transition-colors",
                    location.pathname === item.path || 
                    (item.path === '/messages' && location.pathname.startsWith('/messages')) ||
                    (item.path === '/followers' && location.pathname === '/followers') ||
                    (item.path === '/following' && location.pathname === '/following') ||
                    (item.path === '/notifications' && location.pathname === '/notifications') ||
                    (item.path === '/voted-polls' && location.pathname === '/voted-polls')
                      ? "bg-secondary text-primary" 
                      : "text-primary/70 hover:text-primary hover:bg-secondary/70"
                  )}
                >
                  <Icon size={20} className="mr-3" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {user && !loading && (
        <div className="p-4 border-t border-gray-200">
          <Link to="/profile" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary/70">
            {profile?.avatar_url ? (
              <Avatar>
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.username || user.email || "Profile"}
                />
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar>
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="font-medium">{profile?.username || user.email?.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
