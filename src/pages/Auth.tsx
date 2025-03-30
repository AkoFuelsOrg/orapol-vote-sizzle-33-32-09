
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { AtSign, Lock, LogIn } from 'lucide-react';

const Auth = () => {
  const { session } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      // Check if this is a new signup by checking if profile exists
      const checkProfileExists = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error || !data || !data.username) {
          // If profile doesn't exist or username is not set, redirect to profile setup
          navigate('/profile-setup');
        } else {
          // If profile exists, redirect to home
          navigate('/');
        }
      };
      
      checkProfileExists();
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast({
        title: "Success!",
        description: "You have successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Error logging in",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      toast({
        title: "Success!",
        description: "Check your email for the confirmation link.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0080ff] to-[#00a0ff]">
      <Helmet>
        <title>TUWAYE - Authentication</title>
      </Helmet>
      
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center mx-auto mb-3 animate-fade-in">
          <img 
            src="/lovable-uploads/142738e7-3764-4db2-8b2f-b9a9614f97e9.png" 
            alt="Tuwaye Logo" 
            className="w-16 h-16 animate-pulse-slow"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-0 text-shadow animate-fade-in">Tuwaye</h1>
        <p className="text-white/90 text-lg mb-6 font-light animate-fade-in">Let's Talk</p>
      </div>
      
      <Card className="w-full max-w-md border-none bg-white/95 backdrop-blur-md shadow-xl rounded-2xl animate-scale-in">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-600 mt-1">
              {isLogin 
                ? "Sign in to continue to Tuwaye" 
                : "Sign up to get started with Tuwaye"}
            </p>
          </div>
          
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium">Email Address</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 border-gray-300 focus:border-[#00a0ff] focus:ring-[#00a0ff]/20 transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-gray-700 font-medium">Password</label>
                {isLogin && (
                  <a href="#" className="text-[#00a0ff] text-sm hover:underline">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 border-gray-300 focus:border-[#00a0ff] focus:ring-[#00a0ff]/20 transition-all"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#00a0ff] hover:bg-[#0090e6] transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? "Sign In" : "Sign Up"} <LogIn className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500">or</span>
              </div>
            </div>
            
            {isLogin ? (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button 
                  onClick={() => setIsLogin(false)} 
                  className="text-[#00a0ff] hover:text-[#0090e6] hover:underline font-medium transition-colors"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{" "}
                <button 
                  onClick={() => setIsLogin(true)} 
                  className="text-[#00a0ff] hover:text-[#0090e6] hover:underline font-medium transition-colors"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-white/80 text-sm flex flex-wrap justify-center gap-6">
        <a href="#" className="hover:text-white transition-colors">Terms</a>
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Help</a>
      </div>
      
      <div className="mt-4 text-white/80 text-sm">
        © {new Date().getFullYear()} Tuwaye
      </div>
    </div>
  );
};

export default Auth;
