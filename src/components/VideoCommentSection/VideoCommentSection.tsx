
import React, { useState, useRef } from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import { useVideoComments } from './hooks/useVideoComments';
import { useSupabase } from '@/context/SupabaseContext';
import { Loader2 } from 'lucide-react';

interface VideoCommentSectionProps {
  videoId: string;
  onCommentCountChange?: (count: number) => void;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId, onCommentCountChange }) => {
  const { user } = useSupabase();
  const { comments, loading, error, addComment, handleLikeComment, updatingLike } = useVideoComments(videoId, onCommentCountChange);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [replyState, setReplyState] = useState({
    replyingId: null as string | null,
    replyContent: '',
    submittingReply: false
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    await addComment(commentText, inputRef);
    setCommentText('');
    setIsSubmitting(false);
  };

  const handleReplyTo = (comment: any) => {
    setReplyState({
      ...replyState,
      replyingId: comment.id,
      replyContent: ''
    });
  };

  const handleReplyInputChange = (value: string) => {
    setReplyState({
      ...replyState,
      replyContent: value
    });
  };

  const handleReplyCancel = () => {
    setReplyState({
      ...replyState,
      replyingId: null,
      replyContent: ''
    });
  };

  const handleReplySubmit = async () => {
    // Function stub for reply submission
    // Will be implemented in future
    setReplyState({
      ...replyState,
      replyingId: null,
      replyContent: ''
    });
  };

  const handleLikeReply = (parentId: string, reply: any) => {
    // Function stub for liking replies
    // Will be implemented in future
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <ReplyInput
            user={user}
            replyContent={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmitComment}
            onCancel={() => setCommentText('')}
            submittingReply={isSubmitting}
            placeholder="Add a comment..."
          />
        </form>
      )}
      
      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">
          Error loading comments. Please try again.
        </div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          No comments yet. Be the first to comment!
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
