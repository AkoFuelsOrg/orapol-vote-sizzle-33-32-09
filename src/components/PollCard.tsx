
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Loader2, ChevronDown, ChevronUp, X, Maximize, Share2 } from 'lucide-react';
import { Poll, PollOption } from '../lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

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
  };
  
  const handleOptionImageClick = (e: React.MouseEvent, imageUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedOptionImage(imageUrl);
  };

  const renderOptionImage = (option: PollOption) => {
    if (!option.imageUrl) return null;
    
    return (
      <div 
        className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden relative group cursor-pointer"
        onClick={(e) => handleOptionImageClick(e, option.imageUrl!)}
      >
        <img 
          src={option.imageUrl} 
          alt={option.text} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-20">
          <Maximize size={16} className="text-white" />
        </div>
      </div>
    );
  };

  const renderOptionContent = (option: PollOption) => {
    return (
      <div
        key={option.id}
        className={`w-full relative p-3 rounded-lg border text-left transition-all duration-200 group mb-2
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
            <span className="text-xs font-medium text-primary">
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
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 pb-2 flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <Link 
            to={`/user/${poll.author.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center space-x-3"
          >
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={poll.author.avatar} alt={poll.author.name} />
              <AvatarFallback>{poll.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-primary">{poll.author.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(poll.createdAt)}</p>
            </div>
          </Link>
        </div>
        <div className="px-2 py-1 rounded-full bg-secondary/80 text-xs font-medium">
          {poll.totalVotes} votes
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <h3 className="text-base font-semibold mb-4 text-foreground">{poll.question}</h3>
        
        {poll.image && (
          <div className="mb-4 rounded-lg overflow-hidden relative">
            <img 
              src={poll.image} 
              alt={poll.question} 
              className="w-full h-48 object-cover cursor-pointer"
              onClick={() => setIsImageExpanded(true)}
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize size={20} className="text-white drop-shadow-lg" />
            </div>
          </div>
        )}
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="w-full">
          <div className="space-y-2 relative">
            {isVoting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            {poll.options.slice(0, 2).map((option) => renderOptionContent(option))}
          </div>
          
          <CollapsibleContent className="space-y-2 py-1">
            {poll.options.slice(2).map((option) => renderOptionContent(option))}
          </CollapsibleContent>
          
          {poll.options.length > 2 && (
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-center p-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1">
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
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t flex justify-between items-center">
        <div className="flex items-center">
          <button className="flex items-center space-x-1 p-1.5 rounded-md hover:bg-gray-100 text-muted-foreground">
            <MessageCircle size={18} />
            <span className="text-xs">{poll.commentCount}</span>
          </button>
        </div>
        
        <button 
          className="p-1.5 rounded-md hover:bg-gray-100 text-muted-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(window.location.origin + `/poll/${poll.id}`);
            toast.success("Link copied to clipboard");
          }}
        >
          <Share2 size={18} />
        </button>
      </CardFooter>
      
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
    </Card>
  );

  return (
    <div className="animate-fade-in">
      {!preview ? (
        <Link to={`/poll/${poll.id}`}>
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
