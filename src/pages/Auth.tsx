
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Helmet } from 'react-helmet';
import { supabase } from '../integrations/supabase/client';
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#00a0ff]">
      <Helmet>
        <title>TUWAYE - Authentication</title>
      </Helmet>
      
      <div className="text-center mb-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
          <img 
            src="/lovable-uploads/219fa93b-be40-496d-b7da-25b52bfeb46e.png" 
            alt="Tuwaye Logo" 
            className="w-12 h-12"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-0">Tuwaye</h1>
        <p className="text-white text-lg mb-6">Let's Talk</p>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
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
                className="pl-10 h-12 border-gray-300"
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
                className="pl-10 h-12 border-gray-300"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-[#00a0ff] hover:bg-[#0090e6]"
            disabled={loading}
          >
            {loading ? (
              "Loading..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isLogin ? "Sign In" : "Sign Up"} <LogIn className="w-5 h-5" />
              </span>
            )}
          </Button>
        </form>
        
        <div className="text-center mt-6">
          {isLogin ? (
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button 
                onClick={() => setIsLogin(false)} 
                className="text-[#00a0ff] hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-gray-600">
              Already have an account?{" "}
              <button 
                onClick={() => setIsLogin(true)} 
                className="text-[#00a0ff] hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-white text-sm flex flex-wrap justify-center gap-4">
        <a href="#" className="hover:underline">Terms</a>
        <a href="#" className="hover:underline">Privacy</a>
        <a href="#" className="hover:underline">Cookies</a>
        <a href="#" className="hover:underline">Help</a>
      </div>
      
      <div className="mt-4 text-white text-sm">
        © 2023 Tuwaye
      </div>
    </div>
  );
};

export default Auth;
