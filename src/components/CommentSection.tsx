
import React, { useState, useEffect } from 'react';
import { Heart, Send, Loader2, Reply, MessageSquare } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '../lib/types';
import { toast } from 'sonner';
import { Button } from './ui/button';

interface CommentSectionProps {
  pollId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pollId }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, profile } = useSupabase();
  const [likedComments, setLikedComments] = useState<{[key: string]: boolean}>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  useEffect(() => {
    fetchComments();
    
    // Set up realtime subscription for new comments
    const channel = supabase
      .channel('public:comments')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `poll_id=eq.${pollId}`
        },
        (payload) => {
          fetchCommentDetails(payload.new.id);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  // Fetch user liked comments on mount
  useEffect(() => {
    if (user) {
      fetchUserLikedComments();
    }
  }, [user]);
  
  const fetchUserLikedComments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const likes: {[key: string]: boolean} = {};
      data.forEach(like => {
        likes[like.comment_id] = true;
      });
      
      setLikedComments(likes);
    } catch (error) {
      console.error('Error fetching liked comments:', error);
    }
  };
  
  const fetchCommentDetails = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          likes,
          poll_id,
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', commentId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedComment: Comment = {
          id: data.id,
          pollId: data.poll_id,
          content: data.content,
          createdAt: data.created_at,
          likes: data.likes || 0,
          parentId: data.parent_id,
          author: {
            id: data.profiles.id,
            name: data.profiles.username || 'Anonymous',
            avatar: data.profiles.avatar_url || 'https://i.pravatar.cc/150'
          }
        };
        
        setComments(prev => [formattedComment, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching new comment:', error);
    }
  };
  
  const fetchComments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          likes,
          poll_id,
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch all replies to any comment
      const { data: repliesData, error: repliesError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          likes,
          poll_id,
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true });
        
      if (repliesError) throw repliesError;
      
      if (data) {
        const formattedComments: Comment[] = data.map(comment => ({
          id: comment.id,
          pollId: comment.poll_id,
          content: comment.content,
          createdAt: comment.created_at,
          likes: comment.likes || 0,
          parentId: comment.parent_id,
          author: {
            id: comment.profiles.id,
            name: comment.profiles.username || 'Anonymous',
            avatar: comment.profiles.avatar_url || `https://i.pravatar.cc/150?u=${comment.profiles.id}`
          },
          replies: []
        }));

        // Format replies and attach them to parent comments
        if (repliesData) {
          const replies: Comment[] = repliesData.map(reply => ({
            id: reply.id,
            pollId: reply.poll_id,
            content: reply.content,
            createdAt: reply.created_at,
            likes: reply.likes || 0,
            parentId: reply.parent_id,
            author: {
              id: reply.profiles.id,
              name: reply.profiles.username || 'Anonymous',
              avatar: reply.profiles.avatar_url || `https://i.pravatar.cc/150?u=${reply.profiles.id}`
            }
          }));

          // Attach replies to their parent comments
          for (const reply of replies) {
            if (reply.parentId) {
              const parentComment = formattedComments.find(c => c.id === reply.parentId);
              if (parentComment) {
                if (!parentComment.replies) {
                  parentComment.replies = [];
                }
                parentComment.replies.push(reply);
              }
            }
          }
        }
        
        setComments(formattedComments);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Insert the comment
      const { error } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          content: commentText.trim()
        });
      
      if (error) throw error;
      
      // Update the poll's comment count
      await supabase
        .from('polls')
        .update({ comment_count: comments.length + 1 })
        .eq('id', pollId);
      
      setCommentText('');
      toast.success('Comment added');
      
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !replyTo) return;
    
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }
    
    try {
      setSubmittingReply(true);
      
      // Insert the reply
      const { error } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          content: replyText.trim(),
          parent_id: replyTo
        });
      
      if (error) throw error;
      
      // Update the poll's comment count
      await supabase
        .from('polls')
        .update({ comment_count: comments.length + 1 })
        .eq('id', pollId);
      
      setReplyText('');
      setReplyTo(null);
      toast.success('Reply added');
      
      // Refresh comments to include the new reply
      fetchComments();
      
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setSubmittingReply(false);
    }
  };
  
  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    
    // If already liked by this user, don't allow again
    if (likedComments[commentId]) {
      toast.error('You already liked this comment');
      return;
    }
    
    try {
      // Find the current comment likes
      const currentComment = findCommentById(commentId);
      
      if (!currentComment) return;
      
      // First, record the like in comment_likes table
      const { error: likeError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });
        
      if (likeError) throw likeError;
      
      // Update the comment in the database
      const { error } = await supabase
        .from('comments')
        .update({ likes: (currentComment.likes || 0) + 1 })
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Mark as liked by this user
      setLikedComments(prev => ({
        ...prev,
        [commentId]: true
      }));
      
      // Update the local state
      setComments(updateCommentLikes(comments, commentId));
      
      toast.success('Comment liked');
      
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to like comment');
    }
  };
  
  // Helper function to find a comment by ID (including in replies)
  const findCommentById = (commentId: string): Comment | null => {
    // Check main comments
    const mainComment = comments.find(c => c.id === commentId);
    if (mainComment) return mainComment;
    
    // Check in replies
    for (const comment of comments) {
      if (comment.replies) {
        const reply = comment.replies.find(r => r.id === commentId);
        if (reply) return reply;
      }
    }
    
    return null;
  };
  
  // Helper function to update likes in nested comments structure
  const updateCommentLikes = (commentsList: Comment[], commentId: string): Comment[] => {
    return commentsList.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: (comment.likes || 0) + 1
        };
      }
      
      // Check replies if they exist
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, commentId)
        };
      }
      
      return comment;
    });
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

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-2">
            <img 
              src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`} 
              alt="Your avatar" 
              className="w-8 h-8 rounded-full border-2 border-red-500 object-cover shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full py-2 px-4 pr-12 border border-input rounded-full focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-3 bg-secondary/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Please <a href="/auth" className="text-primary hover:underline">sign in</a> to comment
          </p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex space-x-3">
                <img 
                  src={comment.author.avatar || `https://i.pravatar.cc/150?u=${comment.author.id}`} 
                  alt={comment.author.name} 
                  className="w-8 h-8 rounded-full border-2 border-red-500 object-cover shrink-0 mt-1"
                />
                <div className="flex-1">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatDate(comment.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm break-words">{comment.content}</p>
                  </div>
                  <div className="flex space-x-4 mt-1">
                    <button 
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center mt-1 px-2 py-1 text-xs ${
                        likedComments[comment.id] ? 'text-red-500' : 'text-muted-foreground hover:text-primary'
                      } transition-colors`}
                      disabled={!user || likedComments[comment.id]}
                    >
                      <Heart size={14} className={`mr-1 ${likedComments[comment.id] ? 'fill-red-500' : ''}`} />
                      <span>{comment.likes} likes</span>
                    </button>
                    
                    <button 
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="flex items-center mt-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      disabled={!user}
                    >
                      <Reply size={14} className="mr-1" />
                      <span>Reply</span>
                    </button>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="flex items-center mt-1 px-2 py-1 text-xs text-muted-foreground">
                        <MessageSquare size={14} className="mr-1" />
                        <span>{comment.replies.length} replies</span>
                      </div>
                    )}
                  </div>
                  
                  {replyTo === comment.id && (
                    <form onSubmit={handleSubmitReply} className="mt-2">
                      <div className="flex space-x-2">
                        <img 
                          src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`} 
                          alt="Your avatar" 
                          className="w-6 h-6 rounded-full border-2 border-red-500 object-cover shrink-0"
                        />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.author.name}...`}
                            className="w-full py-1.5 px-3 pr-10 text-sm border border-input rounded-full focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                            disabled={submittingReply}
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim() || submittingReply}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                          >
                            {submittingReply ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Send size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                  
                  {/* Display replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 pl-4 space-y-2 border-l-2 border-secondary/50">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-2">
                          <img 
                            src={reply.author.avatar || `https://i.pravatar.cc/150?u=${reply.author.id}`} 
                            alt={reply.author.name} 
                            className="w-6 h-6 rounded-full border-2 border-red-500 object-cover shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            <div className="bg-secondary/20 rounded-lg p-2">
                              <div className="flex items-start mb-1">
                                <span className="font-medium text-xs">{reply.author.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{formatDate(reply.createdAt)}</span>
                              </div>
                              <p className="text-xs break-words">{reply.content}</p>
                            </div>
                            <button 
                              onClick={() => handleLikeComment(reply.id)}
                              className={`flex items-center mt-0.5 px-1.5 py-0.5 text-xs ${
                                likedComments[reply.id] ? 'text-red-500' : 'text-muted-foreground hover:text-primary'
                              } transition-colors`}
                              disabled={!user || likedComments[reply.id]}
                            >
                              <Heart size={12} className={`mr-0.5 ${likedComments[reply.id] ? 'fill-red-500' : ''}`} />
                              <span>{reply.likes} likes</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
