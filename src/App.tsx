import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PollProvider } from "./context/PollContext";
import { SupabaseProvider } from "./context/SupabaseContext";
import ProtectedRoute from "./components/ProtectedRoute";
import UserProfile from "./pages/UserProfile";

import Index from "./pages/Index";
import CreatePoll from "./pages/CreatePoll";
import PollDetail from "./pages/PollDetail";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SupabaseProvider>
          <PollProvider>
            <Toaster />
            <Sonner position="top-center" closeButton={true} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PollProvider>
        </SupabaseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
