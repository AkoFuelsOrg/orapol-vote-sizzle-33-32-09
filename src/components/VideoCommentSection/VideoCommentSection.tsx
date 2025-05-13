
import React from 'react';
import CommentList from './CommentList';
import ReplyInput from './ReplyInput';
import { useVideoComments } from './hooks/useVideoComments';

interface VideoCommentSectionProps {
  videoId: string;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId }) => {
  const { 
    comments, 
    isLoading, 
    error, 
    addComment, 
    addReply 
  } = useVideoComments(videoId);

  return (
    <div className="flex flex-col space-y-4 p-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      <ReplyInput 
        onSubmit={(content) => addComment(content)} 
        placeholder="Add a comment..."
      />
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">
          Failed to load comments
        </div>
      ) : (
        <CommentList 
          comments={comments} 
          onReplySubmit={addReply}
        />
      )}
    </div>
  );
};

export default VideoCommentSection;
