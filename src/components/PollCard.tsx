
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Poll } from '../lib/types';
import { usePollContext } from '../context/PollContext';

interface PollCardProps {
  poll: Poll;
  preview?: boolean;
}

const PollCard: React.FC<PollCardProps> = ({ poll, preview = false }) => {
  const { votePoll } = usePollContext();
  
  const handleVote = (optionId: string, e: React.MouseEvent) => {
    if (preview) return;
    
    e.preventDefault(); // Prevent navigation when clicking on an option
    votePoll(poll.id, optionId);
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
  
  // Calculate percentages for each option
  const calculatePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const cardContent = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img 
            src={poll.author.avatar} 
            alt={poll.author.name} 
            className="w-8 h-8 rounded-full border border-border/50 object-cover"
          />
          <div>
            <p className="text-sm font-medium">{poll.author.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(poll.createdAt)}</p>
          </div>
        </div>
        <div className="pill bg-secondary text-secondary-foreground">
          {poll.totalVotes} votes
        </div>
      </div>
      
      <h3 className="text-lg font-semibold mb-4">{poll.question}</h3>
      
      {poll.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img 
            src={poll.image} 
            alt={poll.question} 
            className="w-full h-48 object-cover"
          />
        </div>
      )}
      
      <div className="space-y-2.5 mb-4">
        {poll.options.map((option) => (
          <button
            key={option.id}
            onClick={(e) => handleVote(option.id, e)}
            disabled={!!poll.userVoted}
            className={`w-full relative p-3 rounded-lg border text-left transition-all duration-200 group
              ${poll.userVoted === option.id 
                ? 'border-primary bg-primary/5' 
                : poll.userVoted 
                  ? 'border-border/50 hover:border-border' 
                  : 'border-border/50 hover:border-primary hover:bg-primary/5'}`}
          >
            <div className="flex justify-between items-center relative z-10">
              <span className="text-sm font-medium">{option.text}</span>
              <span className="text-xs font-medium">
                {calculatePercentage(option.votes)}%
              </span>
            </div>
            
            {/* Progress bar */}
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
      
      <div className="flex items-center">
        <MessageCircle size={15} className="mr-1 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{poll.commentCount} comments</span>
      </div>
    </>
  );

  return preview ? (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border/50 card-hover animate-fade-in">
      {cardContent}
    </div>
  ) : (
    <Link 
      to={`/poll/${poll.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-border/50 card-hover animate-fade-in"
    >
      {cardContent}
    </Link>
  );
};

export default PollCard;
