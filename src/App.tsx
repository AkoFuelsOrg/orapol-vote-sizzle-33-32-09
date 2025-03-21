import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { AppLoader } from '@/components/AppLoader';

const Index = React.lazy(() => import('./pages/Index'));
const Auth = React.lazy(() => import('./pages/Auth'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Users = React.lazy(() => import('./pages/Users'));
const Vibezone = React.lazy(() => import('./pages/Vibezone'));
const WatchVideo = React.lazy(() => import('./pages/WatchVideo'));
const UploadVideo = React.lazy(() => import('./pages/UploadVideo'));
const MyCampaigns = React.lazy(() => import('./pages/MyCampaigns'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <React.Suspense fallback={<AppLoader />}>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/not-found" element={<NotFound />} />
          
          {/* Core Routes */}
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          
          {/* Vibezone Routes */}
          <Route path="/vibezone" element={<ProtectedRoute><Vibezone /></ProtectedRoute>} />
          <Route path="/vibezone/watch/:id" element={<WatchVideo />} />
          <Route path="/vibezone/upload" element={<ProtectedRoute><UploadVideo /></ProtectedRoute>} />
          <Route path="/vibezone/campaigns" element={<ProtectedRoute><MyCampaigns /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Routes>
      </Router>
    </React.Suspense>
  );
}

export default App;
