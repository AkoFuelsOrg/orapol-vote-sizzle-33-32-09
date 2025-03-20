
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PollProvider } from "./context/PollContext";
import { SupabaseProvider } from "./context/SupabaseContext";
import { GroupProvider } from "./context/GroupContext";
import { MarketplaceProvider } from "./context/MarketplaceContext";
import { VibezoneProvider } from "./context/VibezoneContext";
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
import SearchResults from "./pages/SearchResults";
import Groups from "./pages/Groups";
import GroupProfile from "./pages/GroupProfile";
import Marketplaces from "./pages/Marketplaces";
import MarketplaceProfile from "./pages/MarketplaceProfile";
import Favourites from "./pages/Favourites";
import Vibezone from "./pages/Vibezone";
import WatchVideo from "./pages/WatchVideo";
import UploadVideo from "./pages/UploadVideo";

const queryClient = new QueryClient();

const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  const location = useLocation();
  
  // Don't render the layout for the Auth page
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }
  
  const showRightChat = isDesktop && !location.pathname.startsWith('/messages');
  
  const isFullWidthPage = 
    location.pathname === '/profile' || 
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/group/') ||
    location.pathname.startsWith('/marketplace/') ||
    location.pathname.startsWith('/poll/') ||
    location.pathname.startsWith('/vibezone/watch/');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex flex-1">
        {isDesktop && <Sidebar />}
        {!isDesktop && <Header />}
        <div className={`flex-1 ${isDesktop ? 'ml-64' : ''} ${showRightChat ? 'mr-80' : ''}`}>
          <div className={`${isDesktop ? 'w-full mx-auto mt-16' : 'w-full mt-0'} px-4 py-6 ${!isFullWidthPage && !showRightChat ? 'max-w-6xl mx-auto' : ''}`}>
            <main className="flex-1 w-full">{children}</main>
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
            <GroupProvider>
              <MarketplaceProvider>
                <VibezoneProvider>
                  <Toaster />
                  <Sonner position="top-center" closeButton={true} />
                  <AppLoader>
                    <ResponsiveLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/search" element={<SearchResults />} />
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
                        <Route
                          path="/favourites"
                          element={
                            <ProtectedRoute>
                              <Favourites />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/groups"
                          element={<Groups />}
                        />
                        <Route
                          path="/group/:id"
                          element={<GroupProfile />}
                        />
                        <Route
                          path="/marketplaces"
                          element={<Marketplaces />}
                        />
                        <Route
                          path="/marketplace/:id"
                          element={<MarketplaceProfile />}
                        />
                        <Route
                          path="/vibezone"
                          element={<Vibezone />}
                        />
                        <Route
                          path="/vibezone/watch/:id"
                          element={<WatchVideo />}
                        />
                        <Route
                          path="/vibezone/upload"
                          element={
                            <ProtectedRoute>
                              <UploadVideo />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ResponsiveLayout>
                  </AppLoader>
                </VibezoneProvider>
              </MarketplaceProvider>
            </GroupProvider>
          </PollProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
