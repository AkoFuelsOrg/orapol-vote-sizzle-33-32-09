
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, User, LogIn, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
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

  useEffect(() => {
    // Calculate form completion progress
    let progress = 0;
    if (email.length > 0) progress += 50;
    if (password.length > 5) progress += 50;
    setFormProgress(progress);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <SplashScreen message="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#3eb0ff]/80 via-[#3d82ff]/70 to-[#7b5eff]/80">
      {isDesktop && (
        <div className="flex-1 flex flex-col justify-center items-center relative p-12">
          <div className="text-center max-w-md">
            <h1 className="text-6xl font-bold text-white mb-3 drop-shadow-md tracking-tight">TUWAYE</h1>
            <p className="text-white/90 text-lg mb-6">Connect with friends and share what matters to you.</p>
            
            <div className="relative mt-8">
              <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm -m-6 animate-pulse-slow"></div>
              <img 
                src="/lovable-uploads/a9a6666f-a21a-4a74-b484-3fb5f3184fdc.png" 
                alt="Let's Talk" 
                className="w-64 h-auto mx-auto drop-shadow-xl animate-float relative z-10"
              />
            </div>
            
            <div className="mt-12 space-y-4 text-left bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <h3 className="text-white font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Connect with friends worldwide</span>
              </h3>
              <h3 className="text-white font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Share your thoughts and experiences</span>
              </h3>
              <h3 className="text-white font-medium flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span>Discover communities you'll love</span>
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className={`${isDesktop ? 'flex-1' : 'w-full'} flex items-center justify-center p-6 relative`}>
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
        
        <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden">
          {!isDesktop && (
            <CardHeader className="space-y-1 text-center pb-2 pt-6 px-8">
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
          
          <CardContent className={`pt-6 px-8 ${isDesktop ? 'pt-8' : ''}`}>
            {message && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-center text-sm border border-blue-100 animate-fade-in">
                {message}
              </div>
            )}
            
            <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 text-center mb-6">
              {isSignUp ? 'Start your journey with us today' : 'Sign in to continue your journey'}
            </p>
            
            {formProgress > 0 && (
              <div className="mb-6">
                <Progress value={formProgress} className="h-1 bg-gray-100" />
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-3 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-gray-400" />
                    Password
                  </Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-3 h-12 border-gray-200 focus:border-primary focus:ring-primary"
                    required
                    minLength={6}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 font-medium text-base shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-primary to-[#517beb]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                    <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pb-8 pt-1 px-8">
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
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors hover:underline"
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
