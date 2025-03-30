import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import AuthLogoOverride from '@/components/AuthLogoOverride';
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
    <div className="container h-screen flex items-center justify-center">
      <Card className="w-[400px] bg-white/90 border border-zinc-800/5 dark:border-zinc-200/5 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center"><AuthLogoOverride /> {isSignUp ? 'Create an account' : 'Login'}</CardTitle>
          <CardDescription className="text-center">Enter your email below to {isSignUp ? 'create' : 'sign in to'} your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={loading} className="w-full" onClick={handleSubmit}>
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </CardFooter>
        <div className="text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button className="underline" onClick={() => setIsSignUp(false)}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button className="underline" onClick={() => setIsSignUp(true)}>
                Create one
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Auth;
