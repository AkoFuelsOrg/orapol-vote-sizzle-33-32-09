import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PollProvider } from "./context/PollContext";
import { SupabaseProvider } from "./context/SupabaseContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProfile from "./pages/UserProfile";
import AppLoader from "./components/AppLoader";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import TopHeader from "./components/TopHeader";
import RightChatColumn from "./components/RightChatColumn";
import { useBreakpoint } from "./hooks/use-mobile";

import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Messages from "./pages/Messages";
import VotedPolls from "./pages/VotedPolls";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  const location = useLocation();
  
  // Don't show right chat column on messages page
  const showRightChat = isDesktop && !location.pathname.startsWith('/messages');
  
  // Check if current route is profile, user profile, or poll detail page
  const isFullWidthPage = 
    location.pathname === '/profile' || 
    location.pathname.startsWith('/user/') || 
    location.pathname.startsWith('/poll/');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex flex-1">
        {isDesktop && <Sidebar />}
        {!isDesktop && <Header />}
        <div className={`flex-1 ${isDesktop ? 'ml-64' : ''} ${showRightChat ? 'mr-80' : ''}`}>
          <div className={`w-full mx-auto px-4 py-4 flex ${isDesktop ? 'mt-16' : ''} ${!isFullWidthPage && !showRightChat ? 'max-w-3xl' : ''}`}>
            <main className="flex-1">{children}</main>
          </div>
        </div>
        {showRightChat && <RightChatColumn />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SupabaseProvider>
          <PollProvider>
            <Toaster />
            <Sonner position="top-center" closeButton={true} />
            <AppLoader>
              <ResponsiveLayout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <CreatePoll />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/poll/:id" element={<PollDetail />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/user/:id" element={<UserProfile />} />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages/:id"
                    element={
                      <ProtectedRoute>
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/voted-polls"
                    element={
                      <ProtectedRoute>
                        <VotedPolls />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/followers"
                    element={
                      <ProtectedRoute>
                        <Followers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/following"
                    element={
                      <ProtectedRoute>
                        <Following />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ResponsiveLayout>
            </AppLoader>
          </PollProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
