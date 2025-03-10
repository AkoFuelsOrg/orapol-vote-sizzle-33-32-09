
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { useBreakpoint } from '../hooks/use-mobile';
import UserList from '../components/UserList';

const Following: React.FC = () => {
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  return (
    <div className={`w-full ${isDesktop ? 'max-w-full' : ''} mx-auto py-8`}>
      <h1 className="text-2xl font-bold mb-6">Users You Follow</h1>
      <Card>
        <CardHeader>
          <CardTitle>People You're Following</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <UserList userId={user.id} type="following" />
          ) : (
            <p className="text-muted-foreground">
              Please sign in to see who you're following.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Following;
