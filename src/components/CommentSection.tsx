
import React, { useState } from 'react';
import { Comment } from '../lib/types';
import { usePollContext } from '../context/PollContext';
import { Heart } from 'lucide-react';

interface CommentSectionProps {
  pollId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ pollId }) => {
  const { getCommentsForPoll, addComment, likeComment, currentUser } = usePollContext();
  const [newComment, setNewComment] = useState('');
  
  const comments = getCommentsForPoll(pollId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(pollId, newComment);
      setNewComment('');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      <form onSubmit={handleSubmit} className="mb-6 flex">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-8 h-8 rounded-full mr-3 border border-border/50 object-cover"
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full pl-4 pr-20 py-2.5 rounded-full border border-input focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 px-3.5 py-1.5 rounded-full transition-all
              ${newComment.trim() 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer' 
                : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
          >
            Post
          </button>
        </div>
      </form>
      
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-secondary/50 rounded-lg p-4 animate-fade-in">
              <div className="flex items-start">
                <img 
                  src={comment.author.avatar} 
                  alt={comment.author.name} 
                  className="w-8 h-8 rounded-full mr-3 border border-border/50 object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <p className="font-medium text-sm">{comment.author.name}</p>
                      <span className="mx-1.5 text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                    </div>
                    <button 
                      onClick={() => likeComment(comment.id)}
                      className="flex items-center text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Heart size={14} className="mr-1" />
                      {comment.likes}
                    </button>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
