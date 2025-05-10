
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseProvider } from "./context/SupabaseContext";
import { PollProvider } from "./context/PollContext";
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
import NetworkStatusHandler from "./components/NetworkStatusHandler";
import { useBreakpoint } from "./hooks/use-mobile";
import AppWrapper from "./components/AppWrapper";
import ContactUs from "./pages/ContactUs";
import MobileTabMenu from "./components/MobileTabMenu";

// Import all page components
import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import FindFriends from "./pages/FindFriends";
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
import UploadVideo from "./pages/UploadVideo";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    },
  },
});

const ResponsiveLayout = ({ children }: { children: React.ReactNode }) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  const location = useLocation();
  
  if (location.pathname === '/auth' || location.pathname === '/profile-setup' || location.pathname === '/find-friends') {
    return <>{children}</>;
  }
  
  // Apply standard layout to privacy, terms, and help pages but without right chat column
  if (location.pathname === '/privacy' || location.pathname === '/terms' || location.pathname === '/help') {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <TopHeader />
        <div className="flex flex-1">
          {isDesktop && <Sidebar />}
          {!isDesktop && <Header />}
          <div className={`flex-1 ${isDesktop ? 'ml-64' : ''}`}>
            <div className={`${isDesktop ? 'w-full mx-auto mt-16' : 'w-full mt-0'} px-4 py-6 max-w-6xl mx-auto`}>
              <main className="flex-1 w-full">{children}</main>
            </div>
          </div>
        </div>
        {!isDesktop && <MobileTabMenu />}
      </div>
    );
  }
  
  const showRightChat = isDesktop && 
    !location.pathname.startsWith('/messages') && 
    !location.pathname.startsWith('/vibezone');
  
  const isFullWidthPage = 
    location.pathname === '/profile' || 
    location.pathname.startsWith('/user/') ||
    location.pathname.startsWith('/group/') ||
    location.pathname.startsWith('/marketplace/') ||
    location.pathname.startsWith('/poll/') ||
    location.pathname.startsWith('/vibezone');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex flex-1">
        {isDesktop && <Sidebar />}
        {!isDesktop && <Header />}
        <div className={`flex-1 ${isDesktop ? 'ml-64' : ''} ${showRightChat ? 'mr-80' : ''}`}>
          <div className={`
            ${isDesktop ? 'w-full mx-auto mt-16' : 'w-full mt-0 pb-16'} 
            ${!isDesktop ? 'px-2' : 'px-4'} py-6 
            ${!isFullWidthPage && !showRightChat && isDesktop ? 'max-w-6xl mx-auto' : ''}
          `}>
            <main className="flex-1 w-full">{children}</main>
          </div>
        </div>
        {showRightChat && <RightChatColumn />}
      </div>
      {!isDesktop && <MobileTabMenu />}
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
                  {/* Setting toaster components to not display any alerts */}
                  <Toaster />
                  <Sonner position="top-center" closeButton={true} />
                  <NetworkStatusHandler />
                  <AppLoader>
                    <AppWrapper>
                      <ResponsiveLayout>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route 
                            path="/profile-setup" 
                            element={
                              <ProfileSetup />
                            } 
                          />
                          <Route 
                            path="/find-friends" 
                            element={
                              <ProtectedRoute>
                                <FindFriends />
                              </ProtectedRoute>
                            } 
                          />
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
                            path="/vibezone/upload"
                            element={
                              <ProtectedRoute>
                                <UploadVideo />
                              </ProtectedRoute>
                            }
                          />
                          {/* Privacy, Terms, and Help pages */}
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/help" element={<Help />} />
                          {/* Contact Us page */}
                          <Route path="/contact-us" element={<ContactUs />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ResponsiveLayout>
                    </AppWrapper>
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
