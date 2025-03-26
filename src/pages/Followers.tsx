
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
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";
  const isMobile = breakpoint === "mobile";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-16 px-4 max-w-4xl mx-auto pb-20 w-full">
        <div className="mb-4 animate-fade-in">
          <Link to="/profile" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Profile</span>
          </Link>
        </div>
        
        <Card className="animate-fade-in shadow-sm border-border/50">
          <CardHeader className={`${isMobile ? 'px-4 py-4' : 'px-6 py-5'}`}>
            <CardTitle className="flex items-center text-xl">
              People Following You
            </CardTitle>
          </CardHeader>
          <CardContent className={`${isMobile ? 'px-4 pb-6' : 'px-6 pb-6'}`}>
            {user ? (
              <UserList userId={user.id} type="followers" />
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Please sign in to see your followers.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Followers;
