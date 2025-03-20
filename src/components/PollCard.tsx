
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronDown, ChevronUp, X, Maximize, Heart, Share2, Bookmark } from 'lucide-react';
import { Poll, PollOption } from '../lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';
import { cn } from '@/lib/utils';

interface PollCardProps {
  poll: Poll;
  preview?: boolean;
}

const PollCard: React.FC<PollCardProps> = ({ poll, preview = false }) => {
  const { user } = useSupabase();
  const [isVoting, setIsVoting] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);
  const [expandedOptionImage, setExpandedOptionImage] = React.useState<string | null>(null);
  
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
      month: 'long', 
      day: 'numeric' 
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

  const handleOptionImageClick = (e: React.MouseEvent, imageUrl: string) => {
    // This is critical to make sure this event doesn't trigger the voting function
    e.preventDefault();
    e.stopPropagation();
    setExpandedOptionImage(imageUrl);
    console.log("Option image clicked, expanded:", imageUrl);
  };

  const renderOptionImage = (option: PollOption) => {
    if (!option.imageUrl) return null;
    
    return (
      <div 
        className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden relative group cursor-pointer"
        onClick={(e) => {
          handleOptionImageClick(e, option.imageUrl!);
        }}
      >
        <img 
          src={option.imageUrl} 
          alt={option.text} 
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-20"
        >
          <Maximize size={16} className="text-white" />
        </div>
      </div>
    );
  };

  const renderOptionContent = (option: PollOption) => {
    return (
      <div
        key={option.id}
        className={`w-full relative p-3 rounded-lg border text-left transition-all duration-200 group
          ${poll.userVoted === option.id 
            ? 'border-primary bg-primary/5' 
            : poll.userVoted 
              ? 'border-border/50 hover:border-border' 
              : 'border-border/50 hover:border-primary hover:bg-primary/5'}`}
      >
        <div className="flex items-center space-x-3">
          {renderOptionImage(option)}
          
          <div 
            className="flex justify-between items-center relative z-10 flex-1"
            onClick={(e) => handleVote(option.id, e)}
          >
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
      </div>
    );
  };

  const cardContent = (
    <>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Link 
          to={`/user/${poll.author.id}`}
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <img 
              src={poll.author.avatar} 
              alt={poll.author.name} 
              className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500"
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{poll.author.name}</p>
          </div>
        </Link>
        <button className="text-gray-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
            <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
            <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      
      {/* Poll Question */}
      <div className="px-4 pb-3">
        <h3 className="text-base font-semibold">{poll.question}</h3>
      </div>
      
      {/* Poll Image */}
      {poll.image && (
        <>
          <div 
            className="relative"
            onDoubleClick={handleImageDoubleClick}
          >
            <img 
              src={poll.image} 
              alt={poll.question} 
              className="w-full h-auto object-cover"
            />
          </div>
          
          {isImageExpanded && (
            <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
              <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-lg border-none shadow-2xl">
                <DialogTitle className="sr-only">Poll Image</DialogTitle>
                <DialogClose className="absolute top-4 right-4 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                  <X size={24} />
                </DialogClose>
                <div className="relative w-full overflow-hidden rounded-lg p-1">
                  <img 
                    src={poll.image} 
                    alt={poll.question} 
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
      
      {/* Poll Options */}
      <div className="px-4 py-2">
        <Collapsible 
          open={isExpanded} 
          onOpenChange={setIsExpanded} 
          className="w-full"
        >
          <div className="space-y-2.5 relative">
            {isVoting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {poll.options.slice(0, 2).map((option) => renderOptionContent(option))}
          </div>
          
          <CollapsibleContent className="space-y-2.5 mt-2">
            {poll.options.slice(2).map((option) => renderOptionContent(option))}
          </CollapsibleContent>
          
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
      </div>
      
      {/* Action buttons */}
      <div className="px-4 pt-3 pb-1 flex justify-between">
        <div className="flex space-x-4">
          <button className="focus:outline-none">
            <Heart size={24} className="text-black" />
          </button>
          <Link to={`/poll/${poll.id}`} className="focus:outline-none">
            <MessageCircle size={24} className="text-black" />
          </Link>
          <button 
            className="focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.origin + `/poll/${poll.id}`);
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 size={24} className="text-black" />
          </button>
        </div>
        <button className="focus:outline-none">
          <Bookmark size={24} className="text-black" />
        </button>
      </div>
      
      {/* Votes count */}
      <div className="px-4 pt-1 pb-1">
        <p className="font-semibold text-sm">{poll.totalVotes} votes</p>
      </div>
      
      {/* Comments count */}
      {poll.commentCount > 0 && (
        <Link to={`/poll/${poll.id}`} className="block px-4 pb-1">
          <p className="text-sm text-gray-500">View all {poll.commentCount} comments</p>
        </Link>
      )}
      
      {/* Date */}
      <div className="px-4 py-2">
        <p className="text-xs uppercase text-gray-500">{formatDate(poll.createdAt)}</p>
      </div>
      
      {expandedOptionImage && (
        <Dialog open={!!expandedOptionImage} onOpenChange={(open) => !open && setExpandedOptionImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-lg border-none shadow-2xl">
            <DialogTitle className="sr-only">Option Image</DialogTitle>
            <DialogClose className="absolute top-4 right-4 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
              <X size={24} />
            </DialogClose>
            <div className="relative w-full overflow-hidden rounded-lg p-1">
              <img 
                src={expandedOptionImage} 
                alt="Poll option" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return (
    <div 
      className="bg-white rounded-md border border-gray-200 mb-4 overflow-hidden"
      onDoubleClick={handleDoubleClick}
    >
      {!preview ? (
        <Link 
          to={`/poll/${poll.id}`}
          className="block"
        >
          {cardContent}
        </Link>
      ) : (
        <div>
          {cardContent}
        </div>
      )}
    </div>
  );
};

export default PollCard;
