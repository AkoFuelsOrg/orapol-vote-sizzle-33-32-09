
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { useVibezone } from '@/context/VibezoneContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VideoComment } from '@/lib/types';

export function useVideoComments(videoId: string, onCommentCountChange?: (count: number) => void) {
  const { user } = useSupabase();
  const { fetchVideoComments, addVideoComment } = useVibezone();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingLike, setUpdatingLike] = useState<string | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const mountedRef = useRef(true);
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
        setError(error as Error);
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

  const addComment = async (newComment: string, inputRef: React.RefObject<HTMLInputElement>) => {
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

  return {
    user,
    comments,
    loading,
    error,
    submittingComment,
    updatingLike,
    setUpdatingLike,
    handleLikeComment,
    addComment,
    setComments,
  };
}
