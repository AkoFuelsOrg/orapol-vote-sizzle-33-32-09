
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';

const Notifications: React.FC = () => {
  const { user } = useSupabase();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Notifications</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you'll see all your recent notifications.
          </p>
          <div className="mt-4">
            {/* Placeholder for notifications list */}
            <p>Coming soon: A list of all your notifications.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
