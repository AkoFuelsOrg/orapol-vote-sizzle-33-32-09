
import React, { useRef } from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import { useVideoComments } from './hooks/useVideoComments';
import { useState } from 'react';
import { VideoComment } from '@/lib/types';

interface VideoCommentSectionProps {
  videoId: string;
  onCommentCountChange?: (count: number) => void;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId, onCommentCountChange }) => {
  const { 
    user,
    comments, 
    loading, 
    submittingComment,
    updatingLike,
    handleLikeComment,
    addComment,
    setComments
  } = useVideoComments(videoId, onCommentCountChange);
  
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = (content: string) => {
    addComment(content, inputRef);
  };

  const handleReplyTo = (comment: VideoComment) => {
    setReplyingId(comment.id);
    setReplyContent('');
  };

  const handleReplyCancel = () => {
    setReplyingId(null);
    setReplyContent('');
  };

  const handleReplySubmit = async () => {
    if (!replyingId || !replyContent.trim()) return;
    
    setSubmittingReply(true);
    try {
      // For now, we'll add it as a normal comment
      // In a real implementation, we would handle reply differently
      await addComment(`Reply to comment: ${replyContent}`, inputRef);
      setReplyingId(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReplyInputChange = (value: string) => {
    setReplyContent(value);
  };

  const handleLikeReply = (parentId: string, reply: VideoComment) => {
    // For now, we'll just handle it like a regular comment
    handleLikeComment(reply);
  };

  const replyState = {
    replyingId,
    replyContent,
    submittingReply
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      <ReplyInput 
        user={user}
        replyContent=""
        onChange={handleAddComment}
        onSubmit={() => {}}
        onCancel={() => {}}
        submittingReply={false}
        placeholder="Add a comment..."
      />
      
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <CommentList 
          comments={comments}
          user={user}
          updatingLike={updatingLike}
          replyState={replyState}
          onLikeComment={handleLikeComment}
          onReplyTo={handleReplyTo}
          onReplyInputChange={handleReplyInputChange}
          onReplyCancel={handleReplyCancel}
          onReplySubmit={handleReplySubmit}
          onLikeReply={handleLikeReply}
        />
      )}
    </div>
  );
};

export default VideoCommentSection;
