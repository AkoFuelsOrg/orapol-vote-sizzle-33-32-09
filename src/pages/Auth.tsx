
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';

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
    <div className="min-h-screen flex bg-gradient-to-r from-[#3eb0ff]/80 to-[#3eb0ff]">
      {isDesktop && (
        <div className="flex-1 flex flex-col justify-center items-center relative p-12">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-white mb-3 drop-shadow-md tracking-tight">TUWAYE</h1>
            <p className="text-white/90 text-lg mb-6">Connect with friends and share what matters to you.</p>
            <div className="relative">
              <img 
                src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
                alt="Let's Talk" 
                className="w-64 h-auto mx-auto drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`${isDesktop ? 'flex-1' : 'w-full'} flex items-center justify-center p-6`}>
        <Card className="w-full max-w-md shadow-xl border-none bg-white/95 backdrop-blur-md">
          {!isDesktop && (
            <CardHeader className="space-y-1 text-center pb-2">
              <h1 className="text-3xl font-bold text-gray-900">TUWAYE</h1>
              <div className="flex justify-center py-2">
                <img 
                  src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
                  alt="Let's Talk" 
                  className="w-36 h-auto drop-shadow-md"
                />
              </div>
            </CardHeader>
          )}
          
          <CardContent className="pt-6">
            {message && (
              <div className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-lg text-center text-sm">
                {message}
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 flex items-center justify-center gap-2 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pb-6 pt-1">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
