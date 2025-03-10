
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  useEffect(() => {
    // Redirect to home if user is already logged in
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-500 mb-2">
            Orapol
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
          </p>
        </div>
        
        {message && (
          <div className="mb-6 p-4 bg-secondary text-secondary-foreground rounded-lg text-center">
            {message}
          </div>
        )}
        
        <div className="bg-white shadow-sm rounded-xl border border-border/50 p-6 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 border border-input rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              className="w-full p-3.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium btn-animate"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                isSignUp ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
