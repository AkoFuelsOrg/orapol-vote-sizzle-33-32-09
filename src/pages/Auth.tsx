
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Mail, Lock, LogIn, UserPlus, ArrowRight, CheckCircle, GlobeIcon } from 'lucide-react';
import SplashScreen from '../components/SplashScreen';
import { useBreakpoint } from '../hooks/use-mobile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'sw', name: 'Swahili' },
  { code: 'lg', name: 'Luganda' },
  { code: 'ar', name: 'العربية' },
];

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [language, setLanguage] = useState('en');
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

  const changeLanguage = (value: string) => {
    setLanguage(value);
    // In a real app, this would update the app's language context
    console.log(`Language changed to: ${value}`);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-between relative bg-cover bg-center"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3c9147ee-68a9-469d-a3c0-84763e903fd5.png')`,
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="absolute inset-0 bg-blue-500 bg-opacity-70"></div>
      
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="flex flex-col items-center justify-center relative z-10 max-w-md w-full gap-6 py-10">
          {/* Logo and Slogan */}
          <div className="flex flex-col items-center mb-2 text-center">
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-xl border-2 border-white/50 mb-3">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-16 w-16 object-contain animate-pulse-slow"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-wide text-shadow">
              Tuwaye
            </h1>
            <div className="relative">
              <p className="text-lg font-medium text-white italic tracking-wider shadow-text">
                Let's Talk
              </p>
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"></div>
            </div>
          </div>
        
          <Card className="w-full shadow-2xl border-none bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
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
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:shadow-lg"
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
          
          {/* Footer note */}
          <p className="text-white/70 text-sm text-center mt-2">
            Connect with friends and community
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-white/10 backdrop-blur-md border-t border-white/20 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <GlobeIcon className="h-5 w-5 text-white/80" />
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[180px] bg-white/20 text-white border-white/30 focus:ring-white/50">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-6 text-white/80 text-sm">
              <a href="#" className="hover:text-white hover:underline transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Cookie Policy</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Help Center</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">About Us</a>
            </div>

            {/* Copyright */}
            <div className="text-white/70 text-sm">
              © {new Date().getFullYear()} Tuwaye. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
