
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PollCard from '../components/PollCard';
import Header from '../components/Header';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '../lib/types';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const Index: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [animateItems, setAnimateItems] = useState(false);
  const { user } = useSupabase();
  
  useEffect(() => {
    fetchPolls();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('public:polls')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'polls' },
        (payload) => {
          fetchPollWithDetails(payload.new.id);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  useEffect(() => {
    // Trigger animations after a small delay for a staggered effect
    setAnimateItems(true);
  }, [polls]);
  
  // Function to convert JSON options from Supabase to PollOption type
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
          return {
            id: String(opt.id || ''),
            text: String(opt.text || ''),
            votes: Number(opt.votes || 0)
          };
        }
        return { id: '', text: '', votes: 0 };
      });
    }
    
    return [];
  };

  const fetchPollWithDetails = async (pollId: string) => {
    try {
      // Fetch the poll with author information
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', pollId)
        .single();
      
      if (pollError) throw pollError;
      
      // Check if the user has voted on this poll
      let userVoted = undefined;
      
      if (user) {
        const { data: voteData } = await supabase
          .from('poll_votes')
          .select('option_id')
          .eq('poll_id', pollId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (voteData) {
          userVoted = voteData.option_id;
        }
      }
      
      // Format the poll for our application
      const formattedPoll: Poll = {
        id: pollData.id,
        question: pollData.question,
        options: convertJsonToPollOptions(pollData.options),
        author: {
          id: pollData.profiles.id,
          name: pollData.profiles.username || 'Anonymous',
          avatar: pollData.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: pollData.created_at,
        totalVotes: pollData.total_votes || 0,
        commentCount: pollData.comment_count || 0,
        userVoted,
        image: pollData.image
      };
      
      // Add to polls without duplicates
      setPolls(prevPolls => {
        const pollExists = prevPolls.some(p => p.id === formattedPoll.id);
        if (pollExists) {
          return prevPolls.map(p => p.id === formattedPoll.id ? formattedPoll : p);
        } else {
          return [formattedPoll, ...prevPolls];
        }
      });
    } catch (error) {
      console.error('Error fetching poll details:', error);
    }
  };
  
  const fetchPolls = async () => {
    try {
      setLoading(true);
      
      // Fetch polls with author information
      const { data, error } = await supabase
        .from('polls')
        .select(`
          id,
          question,
          options,
          created_at,
          total_votes,
          comment_count,
          image,
          profiles:user_id (id, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Fetch user votes if the user is logged in
      let userVotes: Record<string, string> = {};
      
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('poll_votes')
          .select('poll_id, option_id')
          .eq('user_id', user.id);
        
        if (!votesError && votesData) {
          userVotes = votesData.reduce((acc, vote) => {
            acc[vote.poll_id] = vote.option_id;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      // Format polls for our application
      const formattedPolls: Poll[] = data.map(poll => ({
        id: poll.id,
        question: poll.question,
        options: convertJsonToPollOptions(poll.options),
        author: {
          id: poll.profiles.id,
          name: poll.profiles.username || 'Anonymous',
          avatar: poll.profiles.avatar_url || 'https://i.pravatar.cc/150'
        },
        createdAt: poll.created_at,
        totalVotes: poll.total_votes || 0,
        commentCount: poll.comment_count || 0,
        userVoted: userVotes[poll.id],
        image: poll.image
      }));
      
      setPolls(formattedPolls);
    } catch (error: any) {
      console.error('Error fetching polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Discover Polls</h2>
          <p className="text-muted-foreground">Vote and share your opinion</p>
        </div>
        
        {!user && (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 mb-6 text-center animate-fade-in">
            <h3 className="text-lg font-medium mb-2">Join Orapol Today</h3>
            <p className="text-muted-foreground mb-4">Sign up to create your own polls and vote on others</p>
            <Link 
              to="/auth" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up / Login
            </Link>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : polls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No polls yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a poll!</p>
            {user && (
              <Link 
                to="/create" 
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Poll
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll, index) => (
              <div 
                key={poll.id} 
                className={`transition-opacity duration-500 ${
                  animateItems 
                    ? 'opacity-100' 
                    : 'opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <PollCard poll={poll} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
