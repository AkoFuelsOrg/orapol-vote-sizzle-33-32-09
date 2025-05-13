
import React from 'react';
import CommentItem from './CommentItem';
import { VideoComment, User } from '@/lib/types';

interface CommentListProps {
  comments: VideoComment[];
  user: User | null;
  updatingLike: string | null;
  replyState: {
    replyingId: string | null;
    replyContent: string;
    submittingReply: boolean;
  };
  onLikeComment: (comment: VideoComment) => void;
  onReplyTo: (comment: VideoComment) => void;
  onReplyInputChange: (v: string) => void;
  onReplyCancel: () => void;
  onReplySubmit: () => void;
  onLikeReply: (parentId: string, reply: VideoComment) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  user,
  updatingLike,
  replyState,
  onLikeComment,
  onReplyTo,
  onReplyInputChange,
  onReplyCancel,
  onReplySubmit,
  onLikeReply,
}) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          user={user}
          updatingLike={updatingLike}
          onLikeComment={onLikeComment}
          onReply={onReplyTo}
          isReplying={replyState.replyingId === comment.id}
          replyContent={replyState.replyingId === comment.id ? replyState.replyContent : ''}
          onReplyInputChange={onReplyInputChange}
          onReplyCancel={onReplyCancel}
          onReplySubmit={onReplySubmit}
          submittingReply={replyState.submittingReply}
          onLikeReply={onLikeReply}
        />
      ))}
    </div>
  );
};

export default CommentList;
