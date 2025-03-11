
import React, { useState, useEffect } from 'react';
import { Heart, Send, Loader2, MessageCircleReply, X } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '../lib/types';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from './ui/dialog';

interface CommentSectionProps {
  pollId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pollId }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, profile } = useSupabase();
  const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [repliesVisible, setRepliesVisible] = useState<{[key: string]: boolean}>({});
  const [loadingReplies, setLoadingReplies] = useState<{[key: string]: boolean}>({});
  const [repliesByParent, setRepliesByParent] = useState<{[key: string]: Comment[]}>({});
  const [likedComments, setLikedComments] = useState<{[key: string]: boolean}>({});
  
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
  
  const fetchCommentDetails = async (commentId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          likes,
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', commentId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const formattedComment: Comment = {
          id: data.id,
          pollId,
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
        
        setComments(prev => {
          // If it's a reply, update the parent's reply count and add to replies
          if (formattedComment.parentId) {
            const parentIndex = prev.findIndex(c => c.id === formattedComment.parentId);
            if (parentIndex >= 0) {
              const updatedParent = {
                ...prev[parentIndex],
                replyCount: (prev[parentIndex].replyCount || 0) + 1
              };
              
              setRepliesByParent(current => ({
                ...current,
                [formattedComment.parentId!]: [
                  formattedComment,
                  ...(current[formattedComment.parentId!] || [])
                ]
              }));
              
              const newComments = [...prev];
              newComments[parentIndex] = updatedParent;
              return newComments;
            }
            return prev;
          }
          
          // If it's a top-level comment, add to the top of the list
          return [formattedComment, ...prev];
        });
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
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const formattedComments: Comment[] = data.map(comment => ({
          id: comment.id,
          pollId,
          content: comment.content,
          createdAt: comment.created_at,
          likes: comment.likes || 0,
          replyCount: 0, // Will be updated when fetching reply counts
          author: {
            id: comment.profiles.id,
            name: comment.profiles.username || 'Anonymous',
            avatar: comment.profiles.avatar_url || `https://i.pravatar.cc/150?u=${comment.profiles.id}`
          }
        }));
        
        setComments(formattedComments);
        
        // Fetch reply counts for each comment
        await Promise.all(formattedComments.map(async (comment) => {
          const { count } = await supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('poll_id', pollId)
            .eq('parent_id', comment.id);
          
          if (count !== null) {
            setComments(prev => 
              prev.map(c => 
                c.id === comment.id ? { ...c, replyCount: count } : c
              )
            );
          }
        }));
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchReplies = async (parentId: string) => {
    if (loadingReplies[parentId]) return;
    
    try {
      setLoadingReplies(prev => ({ ...prev, [parentId]: true }));
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          likes,
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        const formattedReplies: Comment[] = data.map(reply => ({
          id: reply.id,
          pollId,
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
        
        setRepliesByParent(prev => ({
          ...prev,
          [parentId]: formattedReplies
        }));
      }
    } catch (error: any) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(prev => ({ ...prev, [parentId]: false }));
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
  
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !replyToComment) return;
    
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Insert the reply
      const { error } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          content: replyText.trim(),
          parent_id: replyToComment.id
        });
      
      if (error) throw error;
      
      setReplyText('');
      setReplyDialogOpen(false);
      
      // Show replies for this comment if they weren't visible already
      if (!repliesVisible[replyToComment.id]) {
        toggleReplies(replyToComment.id);
      }
      
      toast.success('Reply added');
      
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
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
      const currentComment = comments.find(c => c.id === commentId) || 
                            Object.values(repliesByParent).flat().find(c => c.id === commentId);
      
      if (!currentComment) return;
      
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
      const isInMainComments = comments.some(c => c.id === commentId);
      if (isInMainComments) {
        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: (comment.likes || 0) + 1
            };
          }
          return comment;
        }));
      } else {
        // It's in replies
        setRepliesByParent(prev => {
          const result = { ...prev };
          
          for (const parentId in result) {
            result[parentId] = result[parentId].map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  likes: (reply.likes || 0) + 1
                };
              }
              return reply;
            });
          }
          
          return result;
        });
      }
      
      toast.success('Comment liked');
      
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to like comment');
    }
  };
  
  const toggleReplies = (commentId: string) => {
    // If replies aren't loaded yet, fetch them
    if (!repliesByParent[commentId] && !loadingReplies[commentId]) {
      fetchReplies(commentId);
    }
    
    // Toggle visibility
    setRepliesVisible(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };
  
  const openReplyDialog = (comment: Comment) => {
    setReplyToComment(comment);
    setReplyText('');
    setReplyDialogOpen(true);
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
                      onClick={() => openReplyDialog(comment)}
                      className="flex items-center mt-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      disabled={!user}
                    >
                      <MessageCircleReply size={14} className="mr-1" />
                      <span>Reply</span>
                    </button>
                    
                    {comment.replyCount ? (
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center mt-1 px-2 py-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <span>{repliesVisible[comment.id] ? 'Hide' : 'View'} {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              
              {/* Replies section */}
              {repliesVisible[comment.id] && (
                <div className="ml-11 space-y-3 mt-2">
                  {loadingReplies[comment.id] ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : repliesByParent[comment.id]?.length > 0 ? (
                    repliesByParent[comment.id].map(reply => (
                      <div key={reply.id} className="flex space-x-3">
                        <img 
                          src={reply.author.avatar || `https://i.pravatar.cc/150?u=${reply.author.id}`} 
                          alt={reply.author.name} 
                          className="w-7 h-7 rounded-full border-2 border-red-500 object-cover shrink-0 mt-1"
                        />
                        <div className="flex-1">
                          <div className="bg-secondary/20 rounded-lg p-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-xs">{reply.author.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">{formatDate(reply.createdAt)}</span>
                              </div>
                            </div>
                            <p className="text-xs break-words">{reply.content}</p>
                          </div>
                          <button 
                            onClick={() => handleLikeComment(reply.id)}
                            className={`flex items-center mt-1 px-2 py-0.5 text-xs ${
                              likedComments[reply.id] ? 'text-red-500' : 'text-muted-foreground hover:text-primary'
                            } transition-colors`}
                            disabled={!user || likedComments[reply.id]}
                          >
                            <Heart size={12} className={`mr-1 ${likedComments[reply.id] ? 'fill-red-500' : ''}`} />
                            <span>{reply.likes} likes</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-center text-muted-foreground py-1">No replies yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to {replyToComment?.author.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="bg-secondary/20 p-3 rounded-lg">
              <p className="text-sm opacity-80">{replyToComment?.content}</p>
            </div>
            <div className="flex space-x-2">
              <img 
                src={profile?.avatar_url || `https://i.pravatar.cc/150?u=${user?.id}`} 
                alt="Your avatar" 
                className="w-8 h-8 rounded-full border-2 border-red-500 object-cover shrink-0" 
              />
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                className="flex-1 p-3 border border-input rounded-lg resize-none min-h-[100px] focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReplyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommentSection;
