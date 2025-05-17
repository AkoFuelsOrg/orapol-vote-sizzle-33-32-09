import React, { createContext, useContext, useState } from 'react';
import { Poll, Comment, User, PollOption, Post } from '../lib/types';
import { initialPolls, initialComments, currentUser } from '../lib/data';
import { toast } from "sonner";
import { supabase } from '../integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface PollContextType {
  polls: Poll[];
  posts: Post[];
  comments: Comment[];
  currentUser: User;
  addPoll: (question: string, options: string[], image?: string, optionImages?: (string | null)[]) => void;
  addPost: (content: string, image?: string) => void;
  votePoll: (pollId: string, optionId: string) => void;
  likePost: (postId: string) => void;
  addComment: (pollId: string, content: string) => void;
  likeComment: (commentId: string) => void;
  getPollById: (id: string) => Poll | undefined;
  getPostById: (id: string) => Post | undefined;
  getCommentsForPoll: (pollId: string) => Comment[];
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>(initialComments);

  const defaultAvatarUrl = "/lovable-uploads/d731e3a9-5c0f-466c-8468-16c2465aca8a.png";

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

    const author = {
      id: currentUser.id,
      name: currentUser.name || currentUser.username || "Anonymous User", // Ensure name is always provided
      avatar: currentUser.avatar || currentUser.avatar_url || defaultAvatarUrl
    };

    const newPoll: Poll = {
      id: generateId(),
      question,
      options,
      author,
      createdAt: new Date().toISOString(),
      totalVotes: 0,
      commentCount: 0,
      image: image || undefined,
    };

    setPolls([newPoll, ...polls]);
    toast.success("Poll created successfully");
  };

  const addPost = (content: string, image?: string) => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    const author = {
      id: currentUser.id,
      name: currentUser.name || currentUser.username || "Anonymous User", // Ensure name is always provided
      avatar: currentUser.avatar || currentUser.avatar_url || defaultAvatarUrl
    };

    const newPost: Post = {
      id: generateId(),
      content,
      author,
      createdAt: new Date().toISOString(),
      image: image || undefined,
      commentCount: 0,
      likeCount: 0,
      userLiked: false
    };

    setPosts([newPost, ...posts]);
    toast.success("Post created successfully");
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

  const likePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const newLikedState = !post.userLiked;
          return {
            ...post,
            likeCount: newLikedState ? post.likeCount + 1 : post.likeCount - 1,
            userLiked: newLikedState
          };
        }
        return post;
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

  const getPostById = (id: string) => {
    return posts.find((post) => post.id === id);
  };

  const getCommentsForPoll = (pollId: string) => {
    return comments.filter((comment) => comment.pollId === pollId);
  };

  return (
    <PollContext.Provider
      value={{
        polls,
        posts,
        comments,
        currentUser,
        addPoll,
        addPost,
        votePoll,
        likePost,
        addComment,
        likeComment,
        getPollById,
        getPostById,
        getCommentsForPoll,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};
