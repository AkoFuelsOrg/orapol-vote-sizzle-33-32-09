
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import '@/styles/auth-overrides.css';
import { Logo } from '@/components/Logo';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
    }
  };

  React.useEffect(() => {
    if (error) {
      toast.error('Authentication Failed', {
        description: error,
        position: 'top-right',
        duration: 4000,
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 overflow-hidden relative">
      {/* Enhanced background pattern */}
      <div className="absolute inset-0 bg-pattern-grid opacity-5 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" className="animate-pulse-slow drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 animate-fade-in bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Welcome to Tuwaye
          </h1>
          <p className="text-gray-600 mt-2 animate-fade-in delay-100">
            Connect and share with your community
          </p>
        </div>
        
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md animate-scale-in rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>
          
          <CardHeader className="space-y-1 pb-2 relative">
            <CardTitle className="text-2xl font-bold text-center">
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your details below to {isSignUp ? 'create' : 'access'} your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5 pt-4 relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-primary transition-all duration-200 bg-gray-50/50 h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-primary transition-all duration-200 bg-gray-50/50 h-12"
                    required
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full py-6 transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] rounded-xl h-12"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {isSignUp ? 'Create Account' : 'Sign In'} 
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-0 relative">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>
            
            <div className="text-center text-sm">
              {isSignUp ? (
                <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1 justify-center items-center">
                  <span className="text-gray-600">Already have an account?</span>
                  <button 
                    type="button"
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                    onClick={() => setIsSignUp(false)}
                  >
                    Sign in instead
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1 justify-center items-center">
                  <span className="text-gray-600">Don't have an account?</span>
                  <button 
                    type="button"
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                    onClick={() => setIsSignUp(true)}
                  >
                    Create one now
                  </button>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-6 text-center text-gray-500 text-sm animate-fade-in delay-200">
          <p>By continuing, you agree to our Terms of Service and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
