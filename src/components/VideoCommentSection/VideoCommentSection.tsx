
import React, { useState } from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import useVideoComments from './hooks/useVideoComments';
import { useSupabase } from '@/context/SupabaseContext';
import { Loader2 } from 'lucide-react';

interface VideoCommentSectionProps {
  videoId: string;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId }) => {
  const { user } = useSupabase();
  const { comments, loading, error, addComment } = useVideoComments(videoId);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    await addComment(commentText);
    setCommentText('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <ReplyInput
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            disabled={isSubmitting}
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
        <CommentList comments={comments} />
      )}
    </div>
  );
};

export default VideoCommentSection;
