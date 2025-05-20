
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { useBreakpoint } from '../hooks/use-mobile';
import UserList from '../components/UserList';
import Header from '../components/Header';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Followers: React.FC = () => {
  const { user } = useSupabase();
  const { breakpoint } = useBreakpoint();
  const isMobile = breakpoint === "mobile";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-12 px-3 sm:px-4 max-w-4xl mx-auto pb-20 w-full">
        <div className="mb-3 animate-fade-in">
          <Link to="/profile" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors py-2">
            <ArrowLeft size={18} className="mr-1.5" />
            <span>Back to Profile</span>
          </Link>
        </div>
        
        <Card className="animate-fade-in shadow-sm border-border/50 overflow-hidden">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b border-border/10 bg-gray-50/50">
            <CardTitle className="flex items-center text-base sm:text-xl font-medium">
              People Following You
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-4 sm:px-6 sm:py-5">
            {user ? (
              <UserList userId={user.id} type="followers" />
            ) : (
              <div className="text-muted-foreground text-center py-10 flex flex-col items-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <ArrowLeft size={20} className="opacity-40" />
                </div>
                <p className="font-medium mb-1">Not Signed In</p>
                <p className="text-sm">Please sign in to see your followers</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Followers;
