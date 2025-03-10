
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {isDesktop && <Sidebar />}
      {!isDesktop && <Header />}
      <div className="flex-1">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex">
          <main className="flex-1">{children}</main>
        </div>
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
