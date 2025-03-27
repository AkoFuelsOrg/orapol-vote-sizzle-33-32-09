import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, LogIn, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
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

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3c9147ee-68a9-469d-a3c0-84763e903fd5.png')`,
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="absolute inset-0 bg-blue-500 bg-opacity-70"></div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-none bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 mb-6">
              {isSignUp 
                ? 'Sign up to start your journey' 
                : 'Sign in to continue to Tuwaye'}
            </p>
          </div>

          {formProgress > 0 && (
            <Progress value={formProgress} className="h-1 mb-4 bg-blue-100" />
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            setIsLoading(true);
            isSignUp ? signUp(email, password) : signIn(email, password);
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password {!isSignUp && (
                  <span 
                    onClick={() => {/* TODO: Implement forgot password */}}
                    className="text-xs text-blue-600 float-right cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="p-6 pt-0 text-center">
          <div className="w-full border-t border-gray-200 my-4"></div>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:underline text-sm"
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
