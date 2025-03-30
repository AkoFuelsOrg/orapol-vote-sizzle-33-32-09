
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import AuthLogoOverride from '@/components/AuthLogoOverride';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import '@/styles/auth-overrides.css';

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
      
      // Only show error toast if there's an actual error message
      if (error) {
        toast.error(error);
      }
    } catch (err: any) {
      // Don't show RLS errors to the user
      if (!err.message?.includes("violates row-level security policy")) {
        toast.error(err.message || "Authentication error");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 bg-pattern-grid opacity-5 z-0"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/e75d5e1d-7b70-4d61-9955-995f071eeaad.png" 
              alt="TUWAYE Logo" 
              className="h-20 w-20 object-contain animate-pulse-slow"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 animate-fade-in">
            Welcome to Tuwaye
          </h1>
          <p className="text-gray-600 mt-2 animate-fade-in delay-100">
            Connect and share with your community
          </p>
        </div>
        
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm animate-scale-in">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-center">
              {isSignUp ? 'Create an account' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your details below to {isSignUp ? 'create' : 'access'} your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full py-6 transition-all duration-300 hover:bg-primary/90"
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
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
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
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
