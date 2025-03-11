
import React, { createContext, useContext, useState } from 'react';
import { Poll, Comment, User, PollOption } from '../lib/types';
import { initialPolls, initialComments, currentUser } from '../lib/data';
import { toast } from "sonner";
import { supabase } from '../integrations/supabase/client';

interface PollContextType {
  polls: Poll[];
  comments: Comment[];
  currentUser: User;
  addPoll: (question: string, options: string[], image?: string, optionImages?: (string | null)[]) => void;
  votePoll: (pollId: string, optionId: string) => void;
  addComment: (pollId: string, content: string) => void;
  likeComment: (commentId: string) => void;
  getPollById: (id: string) => Poll | undefined;
  getCommentsForPoll: (pollId: string) => Comment[];
  recordPollView: (pollId: string) => Promise<void>;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const usePollContext = () => {
  const context = useContext(PollContext);
  if (!context) {
    throw new Error('usePollContext must be used within a PollProvider');
  }
  return context;
};

export const PollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addPoll = (question: string, optionTexts: string[], image?: string, optionImages?: (string | null)[]) => {
    if (!question || optionTexts.length < 2) {
      toast.error("Please provide a question and at least two options");
      return;
    }

    const options: PollOption[] = optionTexts.map((text, index) => ({
      id: generateId(),
      text,
      votes: 0,
      imageUrl: optionImages && optionImages[index] ? optionImages[index] : undefined
    }));

    const newPoll: Poll = {
      id: generateId(),
      question,
      options,
      author: currentUser,
      createdAt: new Date().toISOString(),
      totalVotes: 0,
      commentCount: 0,
      image: image || undefined,
      views: 0,
    };

    setPolls([newPoll, ...polls]);
    toast.success("Poll created successfully");
  };

  const votePoll = (pollId: string, optionId: string) => {
    setPolls(
      polls.map((poll) => {
        if (poll.id === pollId) {
          if (poll.userVoted) {
            toast.error("You've already voted on this poll");
            return poll;
          }

          const updatedOptions = poll.options.map((option) => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });

          toast.success("Vote recorded successfully");
          
          return {
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
            userVoted: optionId,
          };
        }
        return poll;
      })
    );
  };

  const addComment = (pollId: string, content: string) => {
    if (!content.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    const newComment: Comment = {
      id: generateId(),
      pollId,
      author: currentUser,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setComments([...comments, newComment]);

    setPolls(
      polls.map((poll) => {
        if (poll.id === pollId) {
          return {
            ...poll,
            commentCount: poll.commentCount + 1,
          };
        }
        return poll;
      })
    );

    toast.success("Comment added");
  };

  const likeComment = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.likes + 1,
          };
        }
        return comment;
      })
    );
  };

  const getPollById = (id: string) => {
    return polls.find((poll) => poll.id === id);
  };

  const getCommentsForPoll = (pollId: string) => {
    return comments.filter((comment) => comment.pollId === pollId);
  };

  const recordPollView = async (pollId: string) => {
    try {
      console.log('Recording view for poll:', pollId);
      
      // Update local state first for immediate feedback
      setPolls(prevPolls => 
        prevPolls.map(poll => {
          if (poll.id === pollId) {
            const updatedViews = (poll.views || 0) + 1;
            console.log(`Updating poll ${pollId} views from ${poll.views} to ${updatedViews}`);
            return {
              ...poll,
              views: updatedViews
            };
          }
          return poll;
        })
      );
      
      // Record view in database
      const { error: insertError } = await supabase
        .from('poll_views')
        .insert({
          poll_id: pollId,
          user_id: supabase.auth.getUser() ? (await supabase.auth.getUser()).data.user?.id : null,
          ip_address: null
        });
      
      if (insertError && insertError.code !== '23505') {
        console.error('Error recording poll view:', insertError);
      }
      
      // Update the poll views count in the database
      const { error: rpcError } = await supabase.rpc('increment_poll_views', { poll_id: pollId });
      
      if (rpcError) {
        console.error('Error incrementing poll views:', rpcError);
        
        // Fallback: directly update the views count if RPC fails
        const { data: viewsData } = await supabase
          .from('poll_views')
          .select('poll_id')
          .eq('poll_id', pollId);
          
        const viewCount = viewsData?.length || 0;
        
        const { error: updateError } = await supabase
          .from('polls')
          .update({ views: viewCount })
          .eq('id', pollId);
          
        if (updateError) {
          console.error('Error updating poll views:', updateError);
        }
      }
      
    } catch (error) {
      console.error('Error recording poll view:', error);
    }
  };

  return (
    <PollContext.Provider
      value={{
        polls,
        comments,
        currentUser,
        addPoll,
        votePoll,
        addComment,
        likeComment,
        getPollById,
        getCommentsForPoll,
        recordPollView,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};
