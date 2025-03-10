
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { useBreakpoint } from '../hooks/use-mobile';
import UserList from '../components/UserList';

const Followers: React.FC = () => {
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  return (
    <div className={`w-full ${isDesktop ? 'max-w-full' : ''} mx-auto py-8`}>
      <h1 className="text-2xl font-bold mb-6">Your Followers</h1>
      <Card>
        <CardHeader>
          <CardTitle>People Following You</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <UserList userId={user.id} type="followers" />
          ) : (
            <p className="text-muted-foreground">
              Please sign in to see your followers.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Followers;
