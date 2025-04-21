
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, Reply } from 'lucide-react';
import ReplyInput from './ReplyInput';
import { formatDistanceToNow } from 'date-fns';
import { VideoComment, User } from '@/lib/types';

interface CommentItemProps {
  comment: VideoComment;
  user: User | null;
  updatingLike: string | null;
  onLikeComment: (comment: VideoComment) => void;
  onReply: (comment: VideoComment) => void;
  isReplying: boolean;
  replyContent: string;
  onReplyInputChange: (content: string) => void;
  onReplyCancel: () => void;
  onReplySubmit: () => void;
  submittingReply: boolean;
  onLikeReply: (parentId: string, reply: VideoComment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  user,
  updatingLike,
  onLikeComment,
  onReply,
  isReplying,
  replyContent,
  onReplyInputChange,
  onReplyCancel,
  onReplySubmit,
  submittingReply,
  onLikeReply,
}) => {
  return (
    <div className="group">
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
              onClick={() => onLikeComment(comment)}
              disabled={updatingLike === comment.id}
            >
              <ThumbsUp className={`h-4 w-4 mr-1.5 ${comment.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
              {comment.likes && comment.likes > 0 && <span className="text-xs">{comment.likes}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center h-8 px-2"
              onClick={() => onReply(comment)}
            >
              <Reply className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Reply</span>
            </Button>
          </div>
          {isReplying && (
            <ReplyInput
              user={user}
              replyContent={replyContent}
              onChange={onReplyInputChange}
              onSubmit={onReplySubmit}
              onCancel={onReplyCancel}
              submittingReply={submittingReply}
            />
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
                        onClick={() => onLikeReply(comment.id, reply)}
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
  );
};

export default CommentItem;
