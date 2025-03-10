
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { useBreakpoint } from '../hooks/use-mobile';

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
          <p className="text-muted-foreground">
            Here you'll see all the users who follow you.
          </p>
          <div className="mt-4">
            {/* Placeholder for followers list */}
            <p>Coming soon: A list of all your followers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Followers;
