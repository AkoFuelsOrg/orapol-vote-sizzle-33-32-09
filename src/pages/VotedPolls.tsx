
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { useBreakpoint } from '../hooks/use-mobile';
import { supabase } from '../integrations/supabase/client';
import PollCard from '../components/PollCard';
import { Loader2 } from 'lucide-react';

const VotedPolls: React.FC = () => {
  const { user } = useSupabase();
  const [votedPolls, setVotedPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    if (user) {
      fetchVotedPolls();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVotedPolls = async () => {
    try {
      setLoading(true);
      
      // Get all poll votes by the user
      const { data: pollVotes, error: votesError } = await supabase
        .from('poll_votes')
        .select('poll_id')
        .eq('user_id', user?.id);
        
      if (votesError) throw votesError;
      
      if (pollVotes && pollVotes.length > 0) {
        // Get the unique poll IDs
        const pollIds = [...new Set(pollVotes.map(vote => vote.poll_id))];
        
        // Fetch the actual polls
        const { data: polls, error: pollsError } = await supabase
          .from('polls')
          .select(`
            *,
            profiles:user_id (id, username, avatar_url)
          `)
          .in('id', pollIds)
          .order('created_at', { ascending: false });
          
        if (pollsError) throw pollsError;
        
        if (polls) {
          setVotedPolls(polls);
        }
      }
    } catch (error) {
      console.error('Error fetching voted polls:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${isDesktop ? 'max-w-full' : ''} mx-auto py-8`}>
      <h1 className="text-2xl font-bold mb-6">Your Voted Polls</h1>
      <Card>
        <CardHeader>
          <CardTitle>Polls You've Voted On</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? (
            <p className="text-muted-foreground">
              Please sign in to see polls you've voted on.
            </p>
          ) : loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : votedPolls.length === 0 ? (
            <p className="text-muted-foreground">
              You haven't voted on any polls yet.
            </p>
          ) : (
            <div className="space-y-4">
              {votedPolls.map(poll => (
                <PollCard
                  key={poll.id}
                  poll={{
                    id: poll.id,
                    question: poll.question,
                    options: poll.options,
                    totalVotes: poll.total_votes,
                    commentCount: poll.comment_count,
                    createdAt: poll.created_at,
                    author: {
                      id: poll.profiles.id,
                      name: poll.profiles.username || 'Anonymous',
                      avatar: poll.profiles.avatar_url || `https://i.pravatar.cc/150?u=${poll.profiles.id}`
                    },
                    image: poll.image,
                    views: poll.views || 0
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VotedPolls;
