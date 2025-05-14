
import { useState } from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import { useVideoComments } from './hooks/useVideoComments';

interface VideoCommentSectionProps {
  videoId: string;
}

const VideoCommentSection = ({ videoId }: VideoCommentSectionProps) => {
  const [showReplyFor, setShowReplyFor] = useState<string | null>(null);
  const { comments, isLoading, addComment, addReply, likeComment } = useVideoComments(videoId);

  const handleReplyClick = (commentId: string) => {
    setShowReplyFor(showReplyFor === commentId ? null : commentId);
  };

  const handleReplySubmit = async (content: string, parentId: string) => {
    await addReply(content, parentId);
    setShowReplyFor(null);
  };

  return (
    <div className="py-4">
      <ReplyInput onSubmit={content => addComment(content)} placeholder="Add a comment..." />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <CommentList 
          comments={comments}
          onReplyClick={handleReplyClick}
          showReplyFor={showReplyFor}
          onReplySubmit={handleReplySubmit}
          onLikeComment={likeComment}
        />
      )}
    </div>
  );
};

export default VideoCommentSection;
