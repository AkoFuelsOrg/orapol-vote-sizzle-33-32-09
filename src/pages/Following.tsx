
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';

const Following: React.FC = () => {
  const { user } = useSupabase();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Users You Follow</h1>
      <Card>
        <CardHeader>
          <CardTitle>People You're Following</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you'll see all the users you follow.
          </p>
          <div className="mt-4">
            {/* Placeholder for following list */}
            <p>Coming soon: A list of all users you follow.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Following;
