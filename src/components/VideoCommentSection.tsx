
import React, { useState, useEffect, useRef } from 'react';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { VideoComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface VideoCommentSectionProps {
  videoId: string;
  onNewComment?: () => Promise<void>;
}

const VideoCommentSection: React.FC<VideoCommentSectionProps> = ({ videoId, onNewComment }) => {
  const { fetchVideoComments, addVideoComment } = useVibezone();
  const { user, profile } = useSupabase();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isInitialMount = useRef(true);
  const commentsLoaded = useRef(false);

  // Load comments only once on initial mount
  useEffect(() => {
    const loadComments = async () => {
      if (!videoId || commentsLoaded.current) return;
      
      try {
        setLoading(true);
        const commentsData = await fetchVideoComments(videoId);
        // Process comments to ensure author property is properly typed
        const processedComments = commentsData.map(comment => {
          const authorData = comment.author as any;
          return {
            ...comment,
            author: authorData && typeof authorData !== 'string' ? {
              id: authorData.id || '',
              name: authorData.username || 'Unknown User',
              avatar: authorData.avatar_url || '',
              username: authorData.username || 'Unknown User',
              avatar_url: authorData.avatar_url || ''
            } : {
              id: '',
              name: 'Unknown User',
              avatar: '',
              username: 'Unknown User',
              avatar_url: ''
            }
          } as VideoComment;
        });
        
        setComments(processedComments);
        commentsLoaded.current = true;
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadComments();
    }
  }, [videoId, fetchVideoComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    if (!videoId || !commentText.trim()) return;
    
    try {
      setSubmitting(true);
      const newComment = await addVideoComment(videoId, commentText.trim());
      if (newComment) {
        // Ensure the author property is properly typed
        const authorData = newComment.author as any;
        const processedComment = {
          ...newComment,
          author: authorData && typeof authorData !== 'string' ? {
            id: authorData.id || '',
            name: authorData.username || 'Unknown User',
            avatar: authorData.avatar_url || '',
            username: authorData.username || 'Unknown User',
            avatar_url: authorData.avatar_url || ''
          } : {
            id: '',
            name: 'Unknown User',
            avatar: '',
            username: 'Unknown User',
            avatar_url: ''
          }
        } as VideoComment;
        
        setComments(prev => [processedComment, ...prev]);
        setCommentText('');
        toast.success('Comment added');
        
        if (onNewComment) {
          await onNewComment();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Render comment skeleton
  const renderCommentSkeleton = () => (
    <div className="flex gap-3 mb-4 animate-pulse">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="w-full">
        <Skeleton className="h-4 w-1/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );

  // Render the content based on loading state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index}>{renderCommentSkeleton()}</div>
          ))}
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 mb-4">
            <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
              <img 
                src={comment.author?.avatar || comment.author?.avatar_url || "https://via.placeholder.com/32"} 
                alt={comment.author?.name || comment.author?.username || 'User'} 
                className="rounded-full"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username || 'Unknown'}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-1 break-words">{comment.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <button className="text-xs text-gray-500 flex items-center">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {comment.likes > 0 && comment.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4 flex items-center">
        <MessageSquare className="inline mr-2 h-5 w-5" />
        {loading ? 'Loading comments...' : 
          `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}`}
      </h3>
      
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="mb-6 flex items-start gap-3">
          <Avatar className="h-8 w-8 mt-1">
            <img 
              src={profile?.avatar_url || user.user_metadata?.avatar_url || "https://via.placeholder.com/32"} 
              alt={profile?.username || user.user_metadata?.username || 'You'} 
              className="rounded-full"
            />
          </Avatar>
          <div className="flex-1">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full"
              disabled={loading} 
            />
            <div className="flex justify-end mt-2">
              <Button 
                type="submit" 
                size="sm"
                disabled={!commentText.trim() || submitting || loading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Comment
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Sign in to add a comment</p>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index}>
                <div className="flex gap-3 mb-4 animate-pulse">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 mb-4">
                <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                  <img 
                    src={comment.author?.avatar || comment.author?.avatar_url || "https://via.placeholder.com/32"} 
                    alt={comment.author?.name || comment.author?.username || 'User'} 
                    className="rounded-full"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button className="text-xs text-gray-500 flex items-center">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {comment.likes > 0 && comment.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCommentSection;
