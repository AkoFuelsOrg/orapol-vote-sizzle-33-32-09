
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { SupabaseProvider } from './context/SupabaseContext';
import { Toaster } from './components/ui/sonner';
import { AppLoader } from './components/AppLoader';
import { ThemeProvider } from 'next-themes';
import VotedPolls from './pages/VotedPolls';
import Groups from './pages/Groups';
import GroupProfile from './pages/GroupProfile'; 
import CreatePoll from './pages/CreatePoll';
import PollDetail from './pages/PollDetail';
import Followers from './pages/Followers';
import Following from './pages/Following';
import UserProfile from './pages/UserProfile';
import SearchResults from './pages/SearchResults';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';
import { GroupProvider } from './context/GroupContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import Marketplaces from './pages/Marketplaces';
import MarketplaceProfile from './pages/MarketplaceProfile';

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {
        path: '/',
        element: <ProtectedRoute><Index /></ProtectedRoute>
      },
      {
        path: '/auth',
        element: <Auth />
      },
      {
        path: '/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: '/polls/voted',
        element: <ProtectedRoute><VotedPolls /></ProtectedRoute>
      },
      {
        path: '/create',
        element: <ProtectedRoute><CreatePoll /></ProtectedRoute>
      },
      {
        path: '/poll/:id',
        element: <ProtectedRoute><PollDetail /></ProtectedRoute>
      },
      {
        path: '/groups',
        element: <ProtectedRoute><Groups /></ProtectedRoute>
      },
      {
        path: '/group/:id',
        element: <ProtectedRoute><GroupProfile /></ProtectedRoute>
      },
      {
        path: '/marketplaces',
        element: <ProtectedRoute><Marketplaces /></ProtectedRoute>
      },
      {
        path: '/marketplace/:id',
        element: <ProtectedRoute><MarketplaceProfile /></ProtectedRoute>
      },
      {
        path: '/user/:id/followers',
        element: <ProtectedRoute><Followers /></ProtectedRoute>
      },
      {
        path: '/user/:id/following',
        element: <ProtectedRoute><Following /></ProtectedRoute>
      },
      {
        path: '/user/:id',
        element: <ProtectedRoute><UserProfile /></ProtectedRoute>
      },
      {
        path: '/search',
        element: <ProtectedRoute><SearchResults /></ProtectedRoute>
      },
      {
        path: '/notifications',
        element: <ProtectedRoute><Notifications /></ProtectedRoute>
      },
      {
        path: '/messages',
        element: <ProtectedRoute><Messages /></ProtectedRoute>
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  },
]);

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <SupabaseProvider>
        <GroupProvider>
          <MarketplaceProvider>
            <AppLoader>
              <RouterProvider router={router} />
              <Toaster position="top-center" richColors />
            </AppLoader>
          </MarketplaceProvider>
        </GroupProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;
