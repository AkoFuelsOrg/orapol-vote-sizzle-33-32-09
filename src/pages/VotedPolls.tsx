import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import Header from '../components/Header';
import { Loader2 } from 'lucide-react';
import { Poll, PollOption } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const VotedPolls: React.FC = () => {
  const [votedPolls, setVotedPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabase();

  useEffect(() => {
    fetchVotedPolls();
  }, [user]);

  const convertJsonToPollOptions = (jsonOptions: Json): PollOption[] => {
    if (typeof jsonOptions === 'string') {
      try {
        return JSON.parse(jsonOptions);
      } catch (error) {
        console.error('Error parsing JSON options:', error);
        return [];
      }
    }

    if (Array.isArray(jsonOptions)) {
      return jsonOptions.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          const option = opt as Record<string, unknown>;
          return {
            id: String(option?.id || ''),
            text: String(option?.text || ''),
            votes: Number(option?.votes || 0),
            imageUrl: option?.imageUrl as string | undefined
          };
        }
        return { id: '', text: '', votes: 0 };
      });
    }

    return [];
  };

  const fetchVotedPolls = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await useSupabase().supabase
        .from('poll_votes')
        .select(`
          option_id,
          polls (
            id,
            question,
            options,
            created_at,
            total_votes,
            comment_count,
            image,
            views,
            profiles:user_id (id, username, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const votedPolls = data.map((item) => ({
          id: item.polls.id,
          question: item.polls.question,
          options: convertJsonToPollOptions(item.polls.options),
          totalVotes: item.polls.total_votes || 0,
          commentCount: item.polls.comment_count || 0,
          createdAt: item.polls.created_at,
          author: {
            id: item.polls.profiles.id,
            name: item.polls.profiles.username || 'Anonymous',
            avatar: item.polls.profiles.avatar_url || 'https://i.pravatar.cc/150',
          },
          image: item.polls.image,
          views: item.polls.views || 0,
          userVoted: item.option_id,
        }));
        setVotedPolls(votedPolls);
      }
    } catch (error: any) {
      console.error('Error fetching voted polls:', error);
      toast.error('Failed to load voted polls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <main className="pt-20 px-4 max-w-3xl mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Your Voted Polls</h2>
          <p className="text-muted-foreground">See the polls you've voted on</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : votedPolls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No voted polls yet</h3>
            <p className="text-muted-foreground mb-4">Vote on polls to see them here!</p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Discover Polls
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {votedPolls.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VotedPolls;
