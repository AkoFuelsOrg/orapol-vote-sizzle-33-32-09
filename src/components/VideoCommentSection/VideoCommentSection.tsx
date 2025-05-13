
import React, { useRef, useState } from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import { useVideoComments } from './hooks/useVideoComments';
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
  
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(newComment, inputRef);
      setNewComment('');
    }
  };

  const handleReplySubmit = async (commentId: string, content: string) => {
    if (!content.trim() || !commentId) return;
    
    // In a real implementation, you would handle replies differently
    // For now, we'll add it as a normal comment with reply context
    await addComment(`Reply to comment: ${content}`, inputRef);
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      <ReplyInput 
        user={user}
        replyContent={newComment}
        onChange={setNewComment}
        onSubmit={handleAddComment}
        onCancel={() => setNewComment('')}
        submittingReply={submittingComment}
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
          onLikeComment={handleLikeComment}
          onReplySubmit={handleReplySubmit}
        />
      )}
    </div>
  );
};

export default VideoCommentSection;
