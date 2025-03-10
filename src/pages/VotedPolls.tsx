
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';

const VotedPolls: React.FC = () => {
  const { user } = useSupabase();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Voted Polls</h1>
      <Card>
        <CardHeader>
          <CardTitle>Polls You've Voted On</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Here you'll see all the polls you've participated in.
          </p>
          <div className="mt-4">
            {/* Placeholder for voted polls list */}
            <p>Coming soon: A list of all polls you've voted on.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VotedPolls;
