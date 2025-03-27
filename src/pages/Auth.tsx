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
    if (user && !loading) {
      navigate('/');
    }

    if (isDesktop) {
      const sidebar = document.querySelector('.w-64.h-screen');
      const topHeader = document.querySelector('.w-full.bg-gradient-to-r');
      
      if (sidebar) sidebar.classList.add('hidden');
      if (topHeader) topHeader.classList.add('hidden');
      
      return () => {
        if (sidebar) sidebar.classList.remove('hidden');
        if (topHeader) topHeader.classList.remove('hidden');
      };
    }
  }, [user, loading, navigate, isDesktop]);

  useEffect(() => {
    let progress = 0;
    if (email.length > 0) progress += 50;
    if (password.length > 5) progress += 50;
    setFormProgress(progress);
  }, [email, password]);

  const changeLanguage = (value: string) => {
    setLanguage(value);
    console.log(`Language changed to: ${value}`);
  };

  return (
    <div 
      className="h-[98vh] flex flex-col items-center justify-between relative bg-cover bg-center overflow-auto"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3c9147ee-68a9-469d-a3c0-84763e903fd5.png')`,
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="absolute inset-0 bg-blue-500 bg-opacity-70"></div>
      
      <div className="flex-1 flex items-center justify-center w-full py-4">
        <div className="flex flex-col items-center justify-center relative z-10 max-w-md w-full gap-4 py-4">
          <div className="flex flex-col items-center mb-1 text-center">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl border-2 border-white/50 mb-2">
              <img 
                src="/lovable-uploads/26f8f928-28ac-46f3-857a-e06edd03c91d.png" 
                alt="Tuwaye Logo" 
                className="h-14 w-14 object-contain animate-pulse-slow"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-wide text-shadow">
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
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-1">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  {isSignUp 
                    ? 'Sign up to start your journey' 
                    : 'Sign in to continue to Tuwaye'}
                </p>
              </div>

              {formProgress > 0 && (
                <Progress value={formProgress} className="h-1 mb-3 bg-blue-100" />
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsLoading(true);
                isSignUp ? signUp(email, password) : signIn(email, password);
              }} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-gray-700 text-sm">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-gray-700 text-sm">
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
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 h-9"
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 hover:shadow-lg h-9"
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
            
            <CardFooter className="p-4 pt-0 text-center">
              <div className="w-full border-t border-gray-200 my-3"></div>
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
      </div>

      <footer className="relative z-10 w-full bg-white/10 backdrop-blur-md border-t border-white/20 py-2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <GlobeIcon className="h-4 w-4 text-white/80" />
              <Select value={language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-[150px] bg-white/20 text-white border-white/30 focus:ring-white/50 h-8 text-xs">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="text-xs">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4 text-white/80 text-xs">
              <a href="#" className="hover:text-white hover:underline transition-colors">Terms</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Privacy</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Cookies</a>
              <a href="#" className="hover:text-white hover:underline transition-colors">Help</a>
            </div>

            <div className="text-white/70 text-xs">
              © {new Date().getFullYear()} Tuwaye
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
