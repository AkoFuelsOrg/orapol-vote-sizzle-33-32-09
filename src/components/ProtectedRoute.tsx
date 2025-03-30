
import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SupabaseContext } from '../context/SupabaseContext';
import AppLoader from './AppLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfileSetup?: boolean;
}

const ProtectedRoute = ({ children, requireProfileSetup = false }: ProtectedRouteProps) => {
  const { session, supabase } = useContext(SupabaseContext);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  
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
  }, [session, supabase]);
  
  if (loading) {
    return <AppLoader />;
  }
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  // For profile setup page: redirect to home if profile already set up
  if (requireProfileSetup && hasProfile) {
    return <Navigate to="/" replace />;
  }
  
  // For normal protected pages: redirect to profile setup if profile not set up
  if (!requireProfileSetup && !hasProfile) {
    return <Navigate to="/profile-setup" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
