
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PollCard from '../components/PollCard';
import CommentSection from '../components/CommentSection';
import Header from '../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Poll, PollOption } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const PollDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      fetchPollDetails(id);
    }
  }, [id, user]);
  
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
          // Use type assertion with optional chaining to safely access properties
          const option = opt as Record<string, unknown>;
          return {
            id: String(option?.id || ''),
            text: String(option?.text || ''),
            votes: Number(option?.votes || 0)
          };
        }
        return { id: '', text: '', votes: 0 };
      });
    }
    
    return [];
  };
  
  const fetchPollDetails = async (pollId: string) => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      setPoll(formattedPoll);
    } catch (error: any) {
      console.error('Error fetching poll details:', error);
      setError(error.message || 'Failed to load poll');
      toast.error('Failed to load poll details');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-20 px-4 max-w-lg mx-auto flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  
  if (error || !poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-lg mb-4">Poll not found</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-20 px-4 max-w-lg mx-auto pb-20">
        <div className="mb-4 animate-fade-in">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            <span>Back to Polls</span>
          </Link>
        </div>
        
        <div className="mb-6">
          <PollCard poll={poll} preview={true} />
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5">
          <CommentSection pollId={poll.id} />
        </div>
      </main>
    </div>
  );
};

export default PollDetail;
