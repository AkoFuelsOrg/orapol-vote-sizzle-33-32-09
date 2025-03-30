
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import AppLoader from './AppLoader';
import { supabase } from '../integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfileSetup?: boolean;
}

const ProtectedRoute = ({ children, requireProfileSetup = false }: ProtectedRouteProps) => {
  const { session } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const checkProfile = async () => {
      if (session) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();
          
          setHasProfile(!!data && !!data.username);
        } catch (error) {
          setHasProfile(false);
        }
      }
      setLoading(false);
    };
    
    checkProfile();
  }, [session]);
  
  if (loading) {
    return <AppLoader>Loading...</AppLoader>;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  // For profile setup page: redirect to home if profile already set up
  if (requireProfileSetup && hasProfile) {
    return <Navigate to="/" replace />;
  }
  
  // Special case for find-friends page - always accessible after authentication
  if (location.pathname === '/find-friends') {
    return <>{children}</>;
  }
  
  // For normal protected pages: redirect to profile setup if profile not set up
  if (!requireProfileSetup && !hasProfile) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
