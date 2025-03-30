import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { handleProfileCreationError } from '../lib/auth-error-handler';
import { supabase } from '../integrations/supabase/client';

export const useAuth = () => {
  const navigate = useNavigate();
  const { session, user } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) throw signUpError;
      
      // Handle profile creation separately to catch RLS errors
      try {
        // This part might trigger RLS errors if not handled properly
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user?.id,
            email: email,
            created_at: new Date().toISOString(),
          });
        
        // Use our handler to process the error
        if (profileError) {
          const errorMessage = handleProfileCreationError(profileError);
          if (errorMessage) throw new Error(errorMessage);
          // If handler returns empty string, continue silently
        }
      } catch (profileError: any) {
        // Only set error if handler returned a message
        if (profileError.message) {
          setError(profileError.message);
        }
        // Otherwise continue silently
      }
      
      // Redirect to profile setup
      if (data.user) {
        navigate('/profile-setup');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && user) {
      navigate('/');
    } else if (session && !user) {
      navigate('/profile-setup');
    }
  }, [session, user, navigate]);

  return {
    signUp,
    signIn,
    signOut,
    loading,
    error,
  };
};

export default useAuth;
