import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOnClickOutside } from '../hooks/use-mobile';
import { useSupabase } from '../context/SupabaseContext';
import ThemeToggle from './ThemeToggle';
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  LogOut, 
  Bell,
  MessageSquare,
  Menu
} from 'lucide-react';

interface AvatarProps {
  src: string | null;
  alt: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, onClick }) => (
  <button onClick={onClick} className="rounded-full overflow-hidden h-8 w-8 border border-gray-300 dark:border-gray-700">
    <img src={src || `https://i.pravatar.cc/150?u=${alt}`} alt={alt} className="object-cover h-full w-full" />
  </button>
);

interface NotificationIndicatorProps {
}

const NotificationIndicator: React.FC<NotificationIndicatorProps> = () => {
  const [hasNotifications, setHasNotifications] = useState(true); // Example state

  return (
    <div className="relative">
      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
        <Bell size={20} />
      </button>
      {hasNotifications && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
      )}
    </div>
  );
};

interface MobileNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ to, icon, label }) => (
  <Link to={to} className="flex flex-col items-center gap-1 hover:text-red-500">
    {icon}
    <span className="text-xs">{label}</span>
  </Link>
);

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, signOut } = useSupabase();

  useOnClickOutside(menuRef, () => setMenuOpen(false));
  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm dark:bg-gray-900 dark:text-white">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="font-bold text-xl text-red-500">Orapol</Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationIndicator />
            <Avatar
              src={user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`}
              alt={user?.username || 'User'}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />
          </div>
        </div>
        
        {/* Mobile nav menu */}
        {menuOpen && (
          <div ref={menuRef} className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <nav className="p-4 flex flex-col gap-3">
              <Link to="/" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700">
                <Home size={20} className="text-gray-600 dark:text-gray-400" />
                Home
              </Link>
              <Link to="/messages" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700">
                <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
                Messages
              </Link>
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700">
                <User size={20} className="text-gray-600 dark:text-gray-400" />
                Profile
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700 w-full text-left">
                <LogOut size={20} className="text-gray-600 dark:text-gray-400" />
                Logout
              </button>
            </nav>
          </div>
        )}
        
        {/* User dropdown */}
        {dropdownOpen && (
          <div ref={dropdownRef} className="absolute top-full right-0 w-56 bg-white rounded-md shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <nav className="p-4 flex flex-col gap-3">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700">
                <User size={20} className="text-gray-600 dark:text-gray-400" />
                Profile
              </Link>
              <Link to="/messages" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700">
                <MessageSquare size={20} className="text-gray-600 dark:text-gray-400" />
                Messages
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md dark:hover:bg-gray-700 w-full text-left">
                <LogOut size={20} className="text-gray-600 dark:text-gray-400" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>
      
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-between z-40 px-4 py-2 dark:bg-gray-900 dark:border-gray-800">
        <MobileNavItem to="/" icon={<Home size={20} />} label="Home" />
        <MobileNavItem to="/search" icon={<Search size={20} />} label="Search" />
        <MobileNavItem to="/create" icon={<Plus size={20} />} label="Create" />
        <MobileNavItem to="/messages" icon={<MessageSquare size={20} />} label="Messages" />
        <MobileNavItem to="/profile" icon={<User size={20} />} label="Profile" />
      </nav>
    </>
  );
};

export default Header;
