
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './styles/index.css';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './hooks/useAuth';
import Index from './pages/Index';
import Auth from './pages/Auth';
import ProfileSetupWrapper from './pages/ProfileSetupWrapper';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Following from './pages/Following';
import Followers from './pages/Followers';
import FindFriends from './pages/FindFriends';
import NewVibezone from './pages/NewVibezone';
import ProtectedRoute from './components/ProtectedRoute';
import AppWrapper from './components/AppWrapper';
import SplashScreen from './components/SplashScreen';
import NotFound from './pages/NotFound';
import Marketplaces from './pages/Marketplaces';
import MarketplaceProfile from './pages/MarketplaceProfile';
import Groups from './pages/Groups';
import GroupProfile from './pages/GroupProfile';
import SearchResults from './pages/SearchResults';
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import VotedPolls from './pages/VotedPolls';
import Favourites from './pages/Favourites';
import WatchVideo from './pages/WatchVideo';
import UploadVideo from './pages/UploadVideo';

function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashScreenVisible(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (isSplashScreenVisible) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />

        <Route
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppWrapper>
                <Outlet />
              </AppWrapper>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Index />} />
          <Route path="/profile-setup" element={<ProfileSetupWrapper />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/following" element={<Following />} />
          <Route path="/followers" element={<Followers />} />
          <Route path="/find-friends" element={<FindFriends />} />
          <Route path="/vibezone" element={<NewVibezone />} />
          <Route path="/marketplaces" element={<Marketplaces />} />
          <Route path="/marketplace/:id" element={<MarketplaceProfile />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/group/:id" element={<GroupProfile />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/create-poll" element={<CreatePoll />} />
          <Route path="/poll/:pollId" element={<PollDetail />} />
          <Route path="/voted-polls" element={<VotedPolls />} />
          <Route path="/favorites" element={<Favourites />} />
          <Route path="/watch/:videoId" element={<WatchVideo />} />
          <Route path="/upload-video" element={<UploadVideo />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
