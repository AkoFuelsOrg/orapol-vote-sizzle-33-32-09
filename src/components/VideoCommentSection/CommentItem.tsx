
import React, { useState } from 'react';
import { VideoComment, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply, ThumbsUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReplyInput from './ReplyInput';

interface CommentItemProps {
  comment: VideoComment;
  user: User | null;
  replyState: {
    isReplying: boolean;
    commentId: string;
  };
  setReplyState: React.Dispatch<React.SetStateAction<{
    isReplying: boolean;
    commentId: string;
  }>>;
  onLikeComment: (comment: VideoComment) => Promise<void>;
  onReplySubmit: (commentId: string, content: string) => Promise<void>;
  updatingLike: string;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  user,
  replyState,
  setReplyState,
  onLikeComment,
  onReplySubmit,
  updatingLike,
  level = 0
}) => {
  const isReplying = replyState.isReplying && replyState.commentId === comment.id;
  const isUpdating = updatingLike === comment.id;
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplyClick = () => {
    if (!user) {
      // Handle not logged in state
      return;
    }
    setReplyState({
      isReplying: !isReplying,
      commentId: comment.id
    });
  };

  const handleReplySubmit = async (content: string) => {
    if (!user || !content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReplySubmit(comment.id, content);
      setReplyContent('');
      setReplyState({
        isReplying: false,
        commentId: ''
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`py-3 ${level > 0 ? 'pl-4 ml-4 border-l border-gray-200' : ''}`}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={comment.author?.avatar_url || comment.author?.avatar || '/lovable-uploads/default-avatar.png'} 
            alt={comment.author?.name || comment.author?.username || 'User'} 
          />
          <AvatarFallback>
            {comment.author?.name ? getInitials(comment.author.name) : comment.author?.username ? getInitials(comment.author.username) : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">
                {comment.author?.name || comment.author?.username || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <p className="mt-1 text-sm">{comment.content}</p>
          
          <div className="flex items-center mt-2 space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onLikeComment(comment)}
              className={`h-6 px-2 text-xs ${comment.user_has_liked ? 'text-blue-500' : 'text-gray-500'}`}
              disabled={isUpdating}
            >
              <ThumbsUp 
                size={14} 
                className={`mr-1 ${comment.user_has_liked ? 'fill-blue-500' : ''}`} 
              />
              {comment.likes || 0}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleReplyClick} 
              className="h-6 px-2 text-xs text-gray-500"
            >
              <Reply size={14} className="mr-1" />
              Reply
            </Button>
          </div>
          
          {isReplying && user && (
            <div className="mt-3">
              <ReplyInput
                user={user}
                replyContent={replyContent}
                onChange={setReplyContent}
                onSubmit={() => handleReplySubmit(replyContent)}
                onCancel={() => setReplyState({ isReplying: false, commentId: '' })}
                submittingReply={isSubmitting}
                placeholder={`Replying to ${comment.author?.name || comment.author?.username || 'Anonymous'}...`}
              />
            </div>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              replyState={replyState}
              setReplyState={setReplyState}
              onLikeComment={onLikeComment}
              onReplySubmit={onReplySubmit}
              updatingLike={updatingLike}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
