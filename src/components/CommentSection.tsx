
import React, { useState, useEffect } from 'react';
import { Heart, Send, Loader2 } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '../lib/types';
import { toast } from 'sonner';

interface CommentSectionProps {
  pollId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pollId }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useSupabase();
  
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
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('id', commentId)
        .single();
      
      if (error) throw error;
      
      const formattedComment: Comment = {
        id: data.id,
        pollId,
        content: data.content,
        createdAt: data.created_at,
        likes: data.likes || 0,
        author: {
          id: data.profiles.id,
          name: data.profiles.username || 'Anonymous',
          avatar: data.profiles.avatar_url || 'https://i.pravatar.cc/150'
        }
      };
      
      setComments(prev => [formattedComment, ...prev]);
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
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedComments: Comment[] = data.map(comment => ({
        id: comment.id,
        pollId,
        content: comment.content,
        createdAt: comment.created_at,
        likes: comment.likes || 0,
        author: {
          id: comment.profiles.id,
          name: comment.profiles.username || 'Anonymous',
          avatar: comment.profiles.avatar_url || 'https://i.pravatar.cc/150'
        }
      }));
      
      setComments(formattedComments);
    } catch (error) {
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
  
  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    
    try {
      // Update the comment in the database
      const { error } = await supabase
        .from('comments')
        .update({ likes: comments.find(c => c.id === commentId)?.likes + 1 || 1 })
        .eq('id', commentId);
      
      if (error) throw error;
      
      // Update the local state
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.likes + 1
          };
        }
        return comment;
      }));
      
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to like comment');
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

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-2">
            <img 
              src={user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?u=' + user.id} 
              alt="Your avatar" 
              className="w-8 h-8 rounded-full border border-border/50 object-cover shrink-0"
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
            <div key={comment.id} className="flex space-x-3">
              <img 
                src={comment.author.avatar} 
                alt={comment.author.name} 
                className="w-8 h-8 rounded-full border border-border/50 object-cover shrink-0 mt-1"
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
                <button 
                  onClick={() => handleLikeComment(comment.id)}
                  className="flex items-center mt-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  disabled={!user}
                >
                  <Heart size={14} className="mr-1" />
                  <span>{comment.likes} likes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
