
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';
import { useBreakpoint } from '../hooks/use-mobile';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    // Redirect to home if user is already logged in
    if (user && !loading) {
      navigate('/');
    }

    // Hide sidebar and header when on auth page for desktop
    if (isDesktop) {
      const sidebar = document.querySelector('.w-64.h-screen');
      const topHeader = document.querySelector('.w-full.bg-gradient-to-r');
      
      if (sidebar) sidebar.classList.add('hidden');
      if (topHeader) topHeader.classList.add('hidden');
      
      return () => {
        // Show them again when leaving the page
        if (sidebar) sidebar.classList.remove('hidden');
        if (topHeader) topHeader.classList.remove('hidden');
      };
    }
  }, [user, loading, navigate, isDesktop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  if (loading) {
    return <SplashScreen message="Checking authentication..." />;
  }

  return (
    <div className={`min-h-screen flex ${isDesktop ? 'bg-[#3eb0ff]' : 'bg-[#3eb0ff]'} p-4`}>
      {isDesktop && (
        <div className="flex-1 flex flex-col justify-center items-center relative">
          <div className="z-10 text-center">
            <div className="mb-4 flex flex-col items-center">
              <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-md">TUWAYE</h1>
              <img 
                src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
                alt="Let's Talk" 
                className="w-64 h-auto drop-shadow-lg animate-float"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`${isDesktop ? 'flex-1' : 'w-full'} flex flex-col items-center justify-center`}>
        <div className="w-full max-w-md">
          {!isDesktop && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                TUWAYE
              </h1>
              <img 
                src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
                alt="Let's Talk" 
                className="w-48 h-auto mx-auto mt-2 drop-shadow-md"
              />
            </div>
          )}
          
          {message && (
            <div className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-lg text-center">
              {message}
            </div>
          )}
          
          <div className="bg-white shadow-sm rounded-xl border border-border/50 p-6 animate-scale-in backdrop-blur-sm bg-white/95">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {isSignUp ? 'Create an Account' : 'Sign In'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                  required
                  minLength={6}
                />
              </div>
              
              <button
                type="submit"
                className="w-full p-3.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium btn-animate"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline text-sm font-medium"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
