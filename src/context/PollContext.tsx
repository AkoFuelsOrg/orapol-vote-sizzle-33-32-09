
import React, { createContext, useContext, useState } from 'react';
import { Poll, Comment, User, PollOption } from '../lib/types';
import { initialPolls, initialComments, currentUser } from '../lib/data';
import { toast } from "sonner";
import { supabase } from '../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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

  // Generate a simple ID for new items
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Add a new poll
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
      image: image || undefined, // Add the image URL if provided
      views: 0, // Initialize views to 0
    };

    setPolls([newPoll, ...polls]);
    toast.success("Poll created successfully");
  };

  // Vote on a poll
  const votePoll = (pollId: string, optionId: string) => {
    setPolls(
      polls.map((poll) => {
        if (poll.id === pollId) {
          // Check if user has already voted
          if (poll.userVoted) {
            toast.error("You've already voted on this poll");
            return poll;
          }

          // Update the option votes
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

  // Add a comment to a poll
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

    // Update comment count on the poll
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

  // Like a comment
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

  // Get a poll by ID
  const getPollById = (id: string) => {
    return polls.find((poll) => poll.id === id);
  };

  // Get comments for a specific poll
  const getCommentsForPoll = (pollId: string) => {
    return comments.filter((comment) => comment.pollId === pollId);
  };

  // Record a view for a poll
  const recordPollView = async (pollId: string) => {
    try {
      // Update local state first for immediate feedback
      setPolls(
        polls.map((poll) => {
          if (poll.id === pollId) {
            return {
              ...poll,
              views: poll.views + 1,
            };
          }
          return poll;
        })
      );
      
      // Record the view in Supabase
      const { error } = await supabase
        .from('poll_views')
        .insert({
          poll_id: pollId,
          user_id: supabase.auth.getUser() ? (await supabase.auth.getUser()).data.user?.id : null,
          ip_address: null // We don't track IP addresses on the client side for privacy
        })
        .select('id')
        .single();
      
      if (error && error.code !== '23505') { // Ignore unique constraint violations (user already viewed)
        console.error('Error recording poll view:', error);
      }
      
      // Update the view count in the polls table using the RPC function
      await supabase.rpc('increment_poll_views', {
        poll_id: pollId
      });
      
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
