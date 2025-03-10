
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
  Bell,
  ChevronRight
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
            
            if (item.action) {
              return (
                <li key={item.path}>
                  <button
                    onClick={item.action}
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
            }
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center w-full px-4 py-3 rounded-lg transition-colors group",
                    location.pathname === item.path || 
                    (item.path === '/messages' && location.pathname.startsWith('/messages')) ||
                    (item.path === '/followers' && location.pathname === '/followers') ||
                    (item.path === '/following' && location.pathname === '/following') ||
                    (item.path === '/notifications' && location.pathname === '/notifications') ||
                    (item.path === '/voted-polls' && location.pathname === '/voted-polls')
                      ? "bg-red-50 text-red-500 font-medium" 
                      : "text-gray-700 hover:text-red-500 hover:bg-red-50"
                  )}
                >
                  <Icon size={18} className="mr-3" />
                  <span>{item.label}</span>
                  <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
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
  );
};

export default Sidebar;
