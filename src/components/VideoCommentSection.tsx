import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useVibezone } from '@/context/VibezoneContext';
import { VideoComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, Reply, MoreVertical, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VideoCommentSectionProps {
  videoId: string;
  onCommentCountChange?: (count: number) => void;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ 
  videoId,
  onCommentCountChange
}) => {
  const { user } = useSupabase();
  const { fetchVideoComments, addVideoComment } = useVibezone();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<VideoComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingLike, setUpdatingLike] = useState<string | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const mountedRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousCommentsRef = useRef<VideoComment[]>([]);
  const commentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchComments = useCallback(async () => {
    if (commentsFetched && !videoId) return;
    
    setLoading(true);
    try {
      const commentsData = await fetchVideoComments(videoId);
      
      const { count } = await supabase
        .from('video_comments')
        .select('id', { count: 'exact', head: true })
        .eq('video_id', videoId);
      
      if (onCommentCountChange && typeof count === 'number') {
        onCommentCountChange(count);
      }
      
      if (user) {
        const { data: userLikes } = await supabase
          .from('video_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        const likedCommentsMap = new Map();
        if (userLikes) {
          userLikes.forEach(like => {
            likedCommentsMap.set(like.comment_id, true);
          });
        }
        
        const commentsWithLikeStatus = commentsData.map(comment => ({
          ...comment,
          user_has_liked: likedCommentsMap.has(comment.id)
        }));
        
        if (mountedRef.current) {
          if (JSON.stringify(commentsWithLikeStatus) !== JSON.stringify(previousCommentsRef.current)) {
            setComments(commentsWithLikeStatus);
            previousCommentsRef.current = commentsWithLikeStatus;
          }
          setCommentsFetched(true);
        }
      } else {
        const commentsWithLikeStatus = commentsData.map(comment => ({
          ...comment,
          user_has_liked: false
        }));
        
        if (mountedRef.current) {
          if (JSON.stringify(commentsWithLikeStatus) !== JSON.stringify(previousCommentsRef.current)) {
            setComments(commentsWithLikeStatus);
            previousCommentsRef.current = commentsWithLikeStatus;
          }
          setCommentsFetched(true);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      if (mountedRef.current) {
        toast.error('Failed to load comments');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [videoId, user, fetchVideoComments, onCommentCountChange, commentsFetched]);

  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
  }, [videoId, fetchComments]);
  
  useEffect(() => {
    if (!videoId) return;
    
    const commentsChannel = supabase
      .channel(`video_comments_${videoId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'video_comments',
          filter: `video_id=eq.${videoId}`
        },
        () => {
          if (commentUpdateTimeoutRef.current) {
            clearTimeout(commentUpdateTimeoutRef.current);
          }
          
          commentUpdateTimeoutRef.current = setTimeout(() => {
            fetchComments();
          }, 500);
        }
      )
      .subscribe();
    
    return () => {
      if (commentUpdateTimeoutRef.current) {
        clearTimeout(commentUpdateTimeoutRef.current);
      }
      supabase.removeChannel(commentsChannel);
    };
  }, [videoId, fetchComments]);

  const handleLikeComment = async (comment: VideoComment) => {
    if (!user) {
      toast.error('You must be logged in to like comments');
      return;
    }
    
    if (updatingLike === comment.id) return;
    
    try {
      setUpdatingLike(comment.id);
      
      const updatedComments = [...comments];
      const commentIndex = updatedComments.findIndex(c => c.id === comment.id);
      
      if (commentIndex !== -1) {
        const isCurrentlyLiked = updatedComments[commentIndex].user_has_liked;
        
        const newLikesCount = isCurrentlyLiked 
          ? Math.max(0, (updatedComments[commentIndex].likes || 1) - 1) 
          : (updatedComments[commentIndex].likes || 0) + 1;
          
        updatedComments[commentIndex] = {
          ...updatedComments[commentIndex],
          likes: newLikesCount,
          user_has_liked: !isCurrentlyLiked
        };
        
        if (mountedRef.current) {
          setComments(updatedComments);
        }
        
        if (isCurrentlyLiked) {
          const { error } = await supabase
            .from('video_comment_likes')
            .delete()
            .eq('comment_id', comment.id)
            .eq('user_id', user.id);
            
          if (error && mountedRef.current) {
            const revertedComments = [...comments];
            revertedComments[commentIndex] = comment;
            setComments(revertedComments);
            throw error;
          }
          
          await supabase
            .from('video_comments')
            .update({ likes: newLikesCount })
            .eq('id', comment.id);
        } else {
          const { error } = await supabase
            .from('video_comment_likes')
            .insert({
              comment_id: comment.id,
              user_id: user.id
            });
            
          if (error && mountedRef.current) {
            const revertedComments = [...comments];
            revertedComments[commentIndex] = comment;
            setComments(revertedComments);
            throw error;
          }
          
          await supabase
            .from('video_comments')
            .update({ likes: newLikesCount })
            .eq('id', comment.id);
        }
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      if (mountedRef.current) {
        toast.error('Failed to update like status');
      }
    } finally {
      if (mountedRef.current) {
        setTimeout(() => {
          setUpdatingLike(null);
        }, 300);
      }
    }
  };

  const handleLikeReply = async (parentId: string, reply: VideoComment) => {
    if (!user) {
      toast.error('You must be logged in to like replies');
      return;
    }
    
    if (updatingLike === reply.id) return;
    
    try {
      setUpdatingLike(reply.id);
      
      const updatedComments = [...comments];
      const parentIndex = updatedComments.findIndex(c => c.id === parentId);
      
      if (parentIndex !== -1 && updatedComments[parentIndex].replies) {
        const replyIndex = updatedComments[parentIndex].replies!.findIndex(r => r.id === reply.id);
        
        if (replyIndex !== -1) {
          const isCurrentlyLiked = updatedComments[parentIndex].replies![replyIndex].user_has_liked;
          
          const updatedReply = {
            ...updatedComments[parentIndex].replies![replyIndex],
            likes: isCurrentlyLiked 
              ? Math.max(0, (updatedComments[parentIndex].replies![replyIndex].likes || 1) - 1) 
              : (updatedComments[parentIndex].replies![replyIndex].likes || 0) + 1,
            user_has_liked: !isCurrentlyLiked
          };
          
          updatedComments[parentIndex].replies![replyIndex] = updatedReply;
          
          if (mountedRef.current) {
            setComments(updatedComments);
          }
          
          if (isCurrentlyLiked) {
            const { error } = await supabase
              .from('video_comment_likes')
              .delete()
              .eq('comment_id', reply.id)
              .eq('user_id', user.id);
              
            if (error && mountedRef.current) {
              const revertedComments = [...comments];
              setComments(revertedComments);
              throw error;
            }
            
            const newLikesCount = Math.max(0, (reply.likes || 0) - 1);
            
            await supabase
              .from('video_comments')
              .update({ likes: newLikesCount })
              .eq('id', reply.id);
          } else {
            const { error } = await supabase
              .from('video_comment_likes')
              .insert({
                comment_id: reply.id,
                user_id: user.id
              });
              
            if (error && mountedRef.current) {
              const revertedComments = [...comments];
              setComments(revertedComments);
              throw error;
            }
            
            const newLikesCount = (reply.likes || 0) + 1;
            
            await supabase
              .from('video_comments')
              .update({ likes: newLikesCount })
              .eq('id', reply.id);
          }
        }
      }
    } catch (error) {
      console.error('Error updating reply like status:', error);
      if (mountedRef.current) {
        toast.error('Failed to update like status');
      }
    } finally {
      if (mountedRef.current) {
        setUpdatingLike(null);
      }
    }
  };

  const addComment = async () => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    if (newComment.trim() === '') return;
    
    try {
      setSubmittingComment(true);
      const comment = await addVideoComment(videoId, newComment);
      if (comment && mountedRef.current) {
        setComments(prevComments => [comment, ...prevComments]);
        setNewComment('');
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        
        const newCommentCount = comments.length + 1;
        if (onCommentCountChange) {
          onCommentCountChange(newCommentCount);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (mountedRef.current) {
        toast.error('Failed to add comment');
      }
    } finally {
      if (mountedRef.current) {
        setSubmittingComment(false);
      }
    }
  };

  const replyToComment = (comment: VideoComment) => {
    setReplyingTo(comment);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const submitReply = async () => {
    if (!replyContent.trim()) return;
    if (!replyingTo) return;
    
    setSubmittingReply(true);
    
    try {
      const newReply = await addVideoComment(videoId, replyContent);
      
      if (newReply && mountedRef.current) {
        const { error } = await supabase
          .from('video_comments')
          .update({ parent_id: replyingTo.id })
          .eq('id', newReply.id);
        
        if (error) throw error;
        
        const updatedComments = [...comments];
        const parentIndex = updatedComments.findIndex(c => c.id === replyingTo.id);
        
        if (parentIndex !== -1) {
          if (!updatedComments[parentIndex].replies) {
            updatedComments[parentIndex].replies = [];
          }
          
          updatedComments[parentIndex].replies!.push({
            ...newReply,
            user_has_liked: false
          });
          
          if (mountedRef.current) {
            setComments(updatedComments);
            
            setReplyContent('');
            setReplyingTo(null);
            
            const newCommentCount = comments.length + 1;
            if (onCommentCountChange) {
              onCommentCountChange(newCommentCount);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      if (mountedRef.current) {
        toast.error('Failed to add reply');
      }
    } finally {
      if (mountedRef.current) {
        setSubmittingReply(false);
      }
    }
  };

  if (loading && !commentsFetched) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start space-x-2 mb-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user?.user_metadata?.avatar_url as string}
              alt={user?.user_metadata?.username as string}
              className="rounded-full"
            />
          )}
        </Avatar>
        <div className="flex-1 flex">
          <Input
            type="text"
            placeholder="Add a comment..."
            className="flex-1"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addComment();
              }
            }}
            ref={inputRef}
          />
          <Button 
            onClick={addComment} 
            disabled={submittingComment || !newComment.trim()} 
            className="ml-2 whitespace-nowrap"
          >
            {submittingComment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Post</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <img
                      src={comment.author?.avatar || comment.author?.avatar_url || "https://via.placeholder.com/40"}
                      alt={comment.author?.name || comment.author?.username || 'User'}
                      className="rounded-full"
                    />
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold">{comment.author?.name || comment.author?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center h-8 px-2 ${updatingLike === comment.id ? 'pointer-events-none' : ''}`}
                        onClick={() => handleLikeComment(comment)}
                        disabled={updatingLike === comment.id}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-1.5 ${comment.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        {comment.likes && comment.likes > 0 && <span className="text-xs">{comment.likes}</span>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center h-8 px-2"
                        onClick={() => replyToComment(comment)}
                      >
                        <Reply className="h-4 w-4 mr-1.5" />
                        <span className="text-xs">Reply</span>
                      </Button>
                    </div>
                    
                    {replyingTo?.id === comment.id && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Avatar className="h-6 w-6 flex-shrink-0">
                          {user?.user_metadata?.avatar_url && (
                            <img
                              src={user?.user_metadata?.avatar_url as string}
                              alt={user?.user_metadata?.username as string}
                              className="rounded-full"
                            />
                          )}
                        </Avatar>
                        <Input
                          type="text"
                          placeholder="Add a reply..."
                          className="flex-1 h-8 text-sm"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              submitReply();
                            }
                          }}
                        />
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            onClick={submitReply} 
                            disabled={submittingReply || !replyContent.trim()} 
                            className="h-8"
                          >
                            {submittingReply ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Reply"
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={cancelReply} 
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="pt-2">
                            <div className="flex space-x-2">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <img
                                  src={reply.author?.avatar || reply.author?.avatar_url || "https://via.placeholder.com/40"}
                                  alt={reply.author?.name || reply.author?.username || 'User'}
                                  className="rounded-full"
                                />
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-xs font-semibold">{reply.author?.name || reply.author?.username || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</p>
                                </div>
                                <p className="text-xs mt-0.5">{reply.content}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`flex items-center h-6 px-1 mt-1 ${updatingLike === reply.id ? 'pointer-events-none' : ''}`}
                                  onClick={() => handleLikeReply(comment.id, reply)}
                                  disabled={updatingLike === reply.id}
                                >
                                  <ThumbsUp className={`h-3 w-3 mr-1 ${reply.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                                  {reply.likes && reply.likes > 0 && <span className="text-xs">{reply.likes}</span>}
                                </Button>
                              </div>
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
    </div>
  );
};

export default VideoCommentSection;
