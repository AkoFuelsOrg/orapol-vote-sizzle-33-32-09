import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Poll, PollOption } from '../lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface PollCardProps {
  poll: Poll;
  preview?: boolean;
}

const PollCard: React.FC<PollCardProps> = ({ poll, preview = false }) => {
  const { user } = useSupabase();
  const [isVoting, setIsVoting] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);
  
  const handleVote = async (optionId: string, e: React.MouseEvent) => {
    if (preview || isVoting) return;
    e.preventDefault(); // Prevent navigation when clicking on an option
    
    if (!user) {
      toast.error("Please sign in to vote on polls");
      return;
    }
    
    if (poll.userVoted) {
      toast.error("You've already voted on this poll");
      return;
    }
    
    try {
      setIsVoting(true);
      
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: poll.id,
          user_id: user.id,
          option_id: optionId
        });
      
      if (voteError) throw voteError;
      
      const updatedOptions = poll.options.map(option => {
        if (option.id === optionId) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });
      
      const { error: updateError } = await supabase
        .from('polls')
        .update({ 
          options: updatedOptions as unknown as Json,
          total_votes: poll.totalVotes + 1
        })
        .eq('id', poll.id);
      
      if (updateError) throw updateError;
      
      toast.success("Vote recorded successfully");
      
      poll.options = updatedOptions;
      poll.totalVotes += 1;
      poll.userVoted = optionId;
      
    } catch (error: any) {
      console.error('Error voting on poll:', error);
      toast.error(error.message || "Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const calculatePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when double-clicking
    e.stopPropagation(); // Stop event propagation
    setIsExpanded(!isExpanded);
    console.log("Double clicked, isExpanded set to:", !isExpanded); // Debug log
  };
  
  const handleImageDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageExpanded(!isImageExpanded);
    console.log("Image double clicked, expanded:", !isImageExpanded);
  };

  const cardContent = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link 
          to={`/user/${poll.author.id}`}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()} // Prevent double-click handler from triggering
        >
          <img 
            src={poll.author.avatar} 
            alt={poll.author.name} 
            className="w-8 h-8 rounded-full border border-border/50 object-cover"
          />
          <div>
            <p className="text-sm font-medium">{poll.author.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(poll.createdAt)}</p>
          </div>
        </Link>
        <div className="pill bg-secondary text-secondary-foreground">
          {poll.totalVotes} votes
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-4">{poll.question}</h3>
      
      {poll.image && (
        <>
          <div 
            className="mb-4 rounded-lg overflow-hidden relative cursor-pointer"
            onDoubleClick={handleImageDoubleClick}
          >
            <img 
              src={poll.image} 
              alt={poll.question} 
              className="w-full h-48 object-cover"
            />
          </div>
          
          {isImageExpanded && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsImageExpanded(false)}
            >
              <button 
                className="absolute top-4 right-4 text-white bg-black/40 p-2 rounded-full hover:bg-black/60"
                onClick={() => setIsImageExpanded(false)}
              >
                <X size={24} />
              </button>
              <img 
                src={poll.image} 
                alt={poll.question} 
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              />
            </div>
          )}
        </>
      )}
      
      <Collapsible 
        open={isExpanded} 
        onOpenChange={setIsExpanded} 
        className="w-full"
      >
        <div className="space-y-2.5 mb-4 relative">
          {isVoting && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {poll.options.slice(0, 2).map((option) => (
            <button
              key={option.id}
              onClick={(e) => handleVote(option.id, e)}
              disabled={!!poll.userVoted || isVoting || !user}
              className={`w-full relative p-3 rounded-lg border text-left transition-all duration-200 group
                ${poll.userVoted === option.id 
                  ? 'border-primary bg-primary/5' 
                  : poll.userVoted 
                    ? 'border-border/50 hover:border-border' 
                    : 'border-border/50 hover:border-primary hover:bg-primary/5'}`}
            >
              <div className="flex items-center space-x-3">
                {option.imageUrl && (
                  <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                    <img 
                      src={option.imageUrl} 
                      alt={option.text} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center relative z-10 flex-1">
                  <span className="text-sm font-medium">{option.text}</span>
                  <span className="text-xs font-medium">
                    {calculatePercentage(option.votes)}%
                  </span>
                </div>
              </div>
              
              <div 
                className={`absolute top-0 left-0 h-full rounded-lg ${
                  poll.userVoted === option.id 
                    ? 'bg-primary/10' 
                    : 'bg-secondary/60'
                } transition-all duration-300`}
                style={{ width: `${calculatePercentage(option.votes)}%` }}
              />
            </button>
          ))}
        </div>
        
        {poll.options.length > 2 && (
          <CollapsibleContent className="space-y-2.5">
            {poll.options.slice(2).map((option) => (
              <button
                key={option.id}
                onClick={(e) => handleVote(option.id, e)}
                disabled={!!poll.userVoted || isVoting || !user}
                className={`w-full relative p-3 rounded-lg border text-left transition-all duration-200 group
                  ${poll.userVoted === option.id 
                    ? 'border-primary bg-primary/5' 
                    : poll.userVoted 
                      ? 'border-border/50 hover:border-border' 
                      : 'border-border/50 hover:border-primary hover:bg-primary/5'}`}
              >
                <div className="flex items-center space-x-3">
                  {option.imageUrl && (
                    <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden">
                      <img 
                        src={option.imageUrl} 
                        alt={option.text} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center relative z-10 flex-1">
                    <span className="text-sm font-medium">{option.text}</span>
                    <span className="text-xs font-medium">
                      {calculatePercentage(option.votes)}%
                    </span>
                  </div>
                </div>
                
                <div 
                  className={`absolute top-0 left-0 h-full rounded-lg ${
                    poll.userVoted === option.id 
                      ? 'bg-primary/10' 
                      : 'bg-secondary/60'
                  } transition-all duration-300`}
                  style={{ width: `${calculatePercentage(option.votes)}%` }}
                />
              </button>
            ))}
          </CollapsibleContent>
        )}
        
        {poll.options.length > 2 && (
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center p-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span>{isExpanded ? "Show less" : "Show more options"}</span>
              {isExpanded ? (
                <ChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
        )}
      </Collapsible>
      
      <div className="flex items-center">
        <MessageCircle size={15} className="mr-1 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{poll.commentCount} comments</span>
      </div>
    </>
  );

  return (
    <div 
      className={`bg-white rounded-xl p-5 shadow-sm border border-border/50 card-hover animate-fade-in ${!preview ? 'block' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {!preview ? (
        <Link 
          to={`/poll/${poll.id}`}
          onClick={(e) => e.stopPropagation()} // Prevent double-click from triggering navigation
          className="block"
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
};

export default PollCard;
