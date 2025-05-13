
import React from 'react';
import { VideoComment, User } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle } from 'lucide-react';
import ReplyInput from './ReplyInput';

interface CommentItemProps {
  comment: VideoComment;
  user: User | null;
  updatingLike: string | null;
  onLikeComment: (comment: VideoComment) => void;
  onReply: (comment: VideoComment) => void;
  isReplying: boolean;
  replyContent: string;
  onReplyInputChange: (v: string) => void;
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
  const formatDate = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          {comment.user_avatar && (
            <img
              src={comment.user_avatar}
              alt={comment.username || "User"}
              className="rounded-full"
            />
          )}
        </Avatar>
        <div className="flex-1">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="font-medium text-sm">{comment.username || "Anonymous"}</span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.content}</p>
          </div>
          <div className="flex space-x-4 mt-1 px-2">
            <button
              onClick={() => onLikeComment(comment)}
              disabled={updatingLike === comment.id}
              className={`flex items-center space-x-1 text-xs ${
                comment.user_has_liked ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Heart
                size={14}
                className={comment.user_has_liked ? 'fill-blue-500' : ''}
              />
              <span>{comment.likes || 0}</span>
            </button>
            {user && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center space-x-1 text-xs text-gray-500"
              >
                <MessageCircle size={14} />
                <span>Reply</span>
              </button>
            )}
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
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-3">
              <Avatar className="h-6 w-6">
                {reply.user_avatar && (
                  <img
                    src={reply.user_avatar}
                    alt={reply.username || "User"}
                    className="rounded-full"
                  />
                )}
              </Avatar>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-xs">{reply.username || "Anonymous"}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  <p className="text-xs mt-1">{reply.content}</p>
                </div>
                <div className="flex space-x-4 mt-1 px-2">
                  <button
                    onClick={() => onLikeReply(comment.id, reply)}
                    className={`flex items-center space-x-1 text-xs ${
                      reply.user_has_liked ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    <Heart
                      size={12}
                      className={reply.user_has_liked ? 'fill-blue-500' : ''}
                    />
                    <span>{reply.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
