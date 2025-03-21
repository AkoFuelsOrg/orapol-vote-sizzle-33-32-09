import React, { useState, useEffect, useRef } from 'react';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { VideoComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, MessageSquare, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VideoCommentSectionProps {
  videoId: string;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId }) => {
  const { fetchVideoComments, addVideoComment } = useVibezone();
  const { user, profile } = useSupabase();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const isInitialMount = useRef(true);
  const commentsLoaded = useRef(false);

  useEffect(() => {
    const loadComments = async () => {
      if (!videoId || commentsLoaded.current) return;
      
      try {
        setLoading(true);
        let commentsData = await fetchVideoComments(videoId);
        
        const parentComments: VideoComment[] = [];
        const repliesMap: Record<string, VideoComment[]> = {};
        
        commentsData.forEach(comment => {
          if (!comment.parent_id) {
            comment.replies = [];
            parentComments.push(comment);
          } else {
            if (!repliesMap[comment.parent_id]) {
              repliesMap[comment.parent_id] = [];
            }
            repliesMap[comment.parent_id].push(comment);
          }
        });
        
        parentComments.forEach(parent => {
          if (repliesMap[parent.id]) {
            parent.replies = repliesMap[parent.id];
          }
        });
        
        setComments(parentComments);
        commentsLoaded.current = true;
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadComments();
    }
  }, [videoId, fetchVideoComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    if (!videoId || !commentText.trim()) return;
    
    try {
      setSubmitting(true);
      const newComment = await addVideoComment(videoId, commentText.trim());
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        toast.success('Comment added');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to reply');
      return;
    }
    
    if (!videoId || !replyText.trim() || !replyingTo) return;
    
    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: user.id,
          content: replyText.trim(),
          parent_id: replyingTo
        })
        .select()
        .single();
      
      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error("No data returned from insert operation");
      }
      
      const newReply: VideoComment = {
        id: data.id,
        video_id: data.video_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        parent_id: data.parent_id || undefined,
        author: {
          id: user.id,
          username: profile?.username || user?.user_metadata?.username || 'Unknown User',
          avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
        },
        likes: 0
      };
      
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === replyingTo) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });
      });
      
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply added');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isReply: boolean, parentId?: string) => {
    if (!user) {
      toast.error('You must be logged in to like comments');
      return;
    }
    
    try {
      let currentlyLiked = false;
      
      if (isReply && parentId) {
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.replies) {
          const reply = parentComment.replies.find(r => r.id === commentId);
          currentlyLiked = reply?.user_has_liked || false;
        }
      } else {
        const comment = comments.find(c => c.id === commentId);
        currentlyLiked = comment?.user_has_liked || false;
      }
      
      if (currentlyLiked) {
        const { error } = await supabase
          .from('video_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('video_comments')
          .update({ likes: supabase.rpc('decrement_likes', { comment_id: commentId }) })
          .eq('id', commentId);
          
        if (updateError) throw updateError;
      } else {
        const { error } = await supabase
          .from('video_comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('video_comments')
          .update({ likes: supabase.rpc('increment_likes', { comment_id: commentId }) })
          .eq('id', commentId);
          
        if (updateError) throw updateError;
      }
      
      setComments(prevComments => 
        prevComments.map(comment => {
          if (!isReply && comment.id === commentId) {
            return {
              ...comment,
              likes: currentlyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1,
              user_has_liked: !currentlyLiked
            };
          } else if (isReply && parentId && comment.id === parentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === commentId
                  ? {
                      ...reply,
                      likes: currentlyLiked ? Math.max(0, reply.likes - 1) : reply.likes + 1,
                      user_has_liked: !currentlyLiked
                    }
                  : reply
              )
            };
          }
          return comment;
        })
      );
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error('Failed to update like status');
    }
  };

  const renderCommentSkeleton = () => (
    <div className="flex gap-3 mb-4 animate-pulse">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="w-full">
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );

  const renderComment = (comment: VideoComment, isReply = false, parentId?: string) => (
    <div key={comment.id} className={`flex gap-3 mb-4 ${isReply ? 'ml-12 border-l-2 pl-4 border-gray-100' : ''}`}>
      <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
        <img 
          src={comment.author?.avatar || comment.author?.avatar_url || "https://via.placeholder.com/32"} 
          alt={comment.author?.name || comment.author?.username || 'User'} 
          className="rounded-full"
        />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username || 'Unknown'}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mt-1 break-words">{comment.content}</p>
        <div className="flex items-center gap-4 mt-1">
          <button 
            className={`text-xs flex items-center ${comment.user_has_liked ? 'text-red-500' : 'text-gray-500'}`}
            onClick={() => handleLikeComment(comment.id, isReply, parentId)}
          >
            <ThumbsUp className={`h-3 w-3 mr-1 ${comment.user_has_liked ? 'fill-red-500' : ''}`} />
            {comment.likes > 0 && comment.likes}
          </button>
          {!isReply && user && (
            <button 
              className="text-xs text-gray-500 flex items-center"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </button>
          )}
        </div>
        
        {replyingTo === comment.id && (
          <form onSubmit={handleAddReply} className="mt-3 flex items-start gap-2">
            <Avatar className="h-6 w-6 mt-1">
              <img 
                src={profile?.avatar_url || user?.user_metadata?.avatar_url || "https://via.placeholder.com/24"} 
                alt={profile?.username || user?.user_metadata?.username || 'You'} 
                className="rounded-full"
              />
            </Avatar>
            <div className="flex-1">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full text-sm"
              />
              <div className="flex justify-end mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  type="button" 
                  onClick={() => setReplyingTo(null)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={!replyText.trim() || submitting}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Reply
                </Button>
              </div>
            </div>
          </form>
        )}
        
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, true, comment.id))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index}>{renderCommentSkeleton()}</div>
          ))}
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map(comment => renderComment(comment))}
      </div>
    );
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center">
        <MessageSquare className="inline mr-2 h-5 w-5" />
        {loading ? 'Loading comments...' : 
          `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
      </h3>
      
      {user ? (
        <form onSubmit={handleAddComment} className="mb-6 flex items-start gap-3">
          <Avatar className="h-8 w-8 mt-1">
            <img 
              src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://via.placeholder.com/32"} 
              alt={profile?.username || user.user_metadata?.username || 'You'} 
              className="rounded-full"
            />
          </Avatar>
          <div className="flex-1">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full"
              disabled={loading} 
            />
            <div className="flex justify-end mt-2">
              <Button 
                type="submit" 
                size="sm"
                disabled={!commentText.trim() || submitting || loading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Sign in to add a comment</p>
        </div>
      )}
      
      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default VideoCommentSection;
