import React, { useRef, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { VideoComment } from '@/lib/types';
import { useVibezone } from '@/context/VibezoneContext';
import { useVideoComments } from './hooks/useVideoComments';
import CommentList from './CommentList';
import { toast } from 'sonner';

interface VideoCommentSectionProps {
  videoId: string;
  onCommentCountChange?: (count: number) => void;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({
  videoId,
  onCommentCountChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [newComment, setNewComment] = useState('');
  const [replyState, setReplyState] = useState<{
    replyingId: string | null;
    replyContent: string;
    submittingReply: boolean;
  }>({ replyingId: null, replyContent: '', submittingReply: false });

  const {
    user,
    comments,
    loading,
    submittingComment,
    updatingLike,
    handleLikeComment,
    addComment,
    setComments,
    setUpdatingLike,
  } = useVideoComments(videoId, onCommentCountChange);

  const { addVideoComment } = useVibezone();

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
          
          setComments(updatedComments);
          
          if (isCurrentlyLiked) {
            const { error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
              supabase
                .from('video_comment_likes')
                .delete()
                .eq('comment_id', reply.id)
                .eq('user_id', user.id)
            );
              
            if (error) {
              const revertedComments = [...comments];
              setComments(revertedComments);
              throw error;
            }
            
            const newLikesCount = Math.max(0, (reply.likes || 0) - 1);
            
            await import('@/integrations/supabase/client').then(({ supabase }) =>
              supabase
                .from('video_comments')
                .update({ likes: newLikesCount })
                .eq('id', reply.id)
            );
          } else {
            const { error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
              supabase
                .from('video_comment_likes')
                .insert({
                  comment_id: reply.id,
                  user_id: user.id
                })
            );
              
            if (error) {
              const revertedComments = [...comments];
              setComments(revertedComments);
              throw error;
            }
            
            const newLikesCount = (reply.likes || 0) + 1;
            
            await import('@/integrations/supabase/client').then(({ supabase }) =>
              supabase
                .from('video_comments')
                .update({ likes: newLikesCount })
                .eq('id', reply.id)
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating reply like status:', error);
      toast.error('Failed to update like status');
    } finally {
      setUpdatingLike(null);
    }
  };

  const onReplyTo = (comment: VideoComment) => {
    setReplyState({
      replyingId: comment.id,
      replyContent: '',
      submittingReply: false,
    });
  };

  const onReplyInputChange = (content: string) => {
    setReplyState((state) => ({
      ...state,
      replyContent: content
    }));
  };

  const onReplyCancel = () => {
    setReplyState({ replyingId: null, replyContent: '', submittingReply: false });
  };

  const onReplySubmit = async () => {
    if (!replyState.replyContent.trim() || !replyState.replyingId) return;
    setReplyState((state) => ({ ...state, submittingReply: true }));
    try {
      const newReply = await addVideoComment(videoId, replyState.replyContent);
      if (newReply) {
        const { error } = await import('@/integrations/supabase/client').then(({ supabase }) =>
          supabase
            .from('video_comments')
            .update({ parent_id: replyState.replyingId })
            .eq('id', newReply.id)
        );
        if (error) throw error;
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === replyState.replyingId) {
              return {
                ...comment,
                replies: [...(comment.replies ?? []), { ...newReply, user_has_liked: false }]
              };
            }
            return comment;
          })
        );
        setReplyState({ replyingId: null, replyContent: '', submittingReply: false });
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error('Failed to add reply');
    } finally {
      setReplyState((state) => ({ ...state, submittingReply: false }));
    }
  };

  if (loading) {
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
                addComment(newComment, inputRef);
                setNewComment('');
              }
            }}
            ref={inputRef}
          />
          <Button
            onClick={() => {
              addComment(newComment, inputRef);
              setNewComment('');
            }}
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
          <CommentList
            comments={comments}
            user={user}
            updatingLike={updatingLike}
            replyState={replyState}
            onLikeComment={handleLikeComment}
            onReplyTo={onReplyTo}
            onReplyInputChange={onReplyInputChange}
            onReplyCancel={onReplyCancel}
            onReplySubmit={onReplySubmit}
            onLikeReply={handleLikeReply}
          />
        )}
      </div>
    </div>
  );
};

export default VideoCommentSection;
