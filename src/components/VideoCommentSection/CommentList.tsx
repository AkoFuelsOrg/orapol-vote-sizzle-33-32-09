
import React from 'react';
import CommentItem from './CommentItem';
import { VideoComment, User } from '@/lib/types';
import { useState } from 'react';

interface CommentListProps {
  comments: VideoComment[];
  user: User | null;
  updatingLike: string | null;
  onLikeComment: (comment: VideoComment) => Promise<void>;
  onReplySubmit: (commentId: string, content: string) => Promise<void>;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  user,
  updatingLike,
  onLikeComment,
  onReplySubmit,
}) => {
  const [replyState, setReplyState] = useState({
    isReplying: false,
    commentId: ''
  });

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          user={user}
          updatingLike={updatingLike || ''}
          onLikeComment={onLikeComment}
          onReplySubmit={onReplySubmit}
          replyState={replyState}
          setReplyState={setReplyState}
        />
      ))}
    </div>
  );
};

export default CommentList;
