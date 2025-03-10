
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Plus, User, LogOut } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut, loading } = useSupabase();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card h-16 px-4 animate-fade-in">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold text-red-500">
            Orapol
          </h1>
        </Link>
        
        <nav className="flex items-center space-x-1">
          <Link 
            to="/" 
            className={`p-2.5 rounded-full transition-colors duration-200 ${
              location.pathname === '/' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
            }`}
          >
            <MessageCircle size={20} />
          </Link>
          
          {user && !loading ? (
            <>
              <Link 
                to="/create" 
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  location.pathname === '/create' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
                }`}
              >
                <Plus size={20} />
              </Link>
              <Link 
                to="/profile" 
                className={`p-2.5 rounded-full transition-colors duration-200 ${
                  location.pathname === '/profile' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
                }`}
              >
                <User size={20} />
              </Link>
              <button
                onClick={() => signOut()}
                className="p-2.5 rounded-full text-primary/70 hover:text-primary hover:bg-secondary/70 transition-colors duration-200"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link 
              to="/auth" 
              className={`p-2.5 rounded-full transition-colors duration-200 ${
                location.pathname === '/auth' ? 'bg-secondary text-primary' : 'text-primary/70 hover:text-primary hover:bg-secondary/70'
              }`}
            >
              <User size={20} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
