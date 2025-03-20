
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useSupabase } from '../context/SupabaseContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  author: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  content: string;
  created_at: string;
  likes: number;
  user_has_liked: boolean;
}

interface PostCommentProps {
  comment: Comment;
  onLike: (commentId: string, isLiked: boolean) => void;
  showReplies?: boolean;
  replyCount?: number;
  postId?: string;
}

const PostComment: React.FC<PostCommentProps> = ({ 
  comment, 
  onLike, 
  showReplies = false,
  replyCount = 0,
  postId
}) => {
  const { user, profile } = useSupabase();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If less than a week, show days/hours
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        return formatDistanceToNow(date, { addSuffix: false }) + ' ago';
      }
      
      // If weeks, show "x w"
      if (diffDays <= 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} w`;
      }
      
      // If months, show "x m"
      return `${Math.floor(diffDays / 30)} m`;
    } catch (error) {
      return '';
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }
    
    if (!replyContent.trim() || !postId) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: replyData, error: replyError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: comment.id
        })
        .select();
      
      if (replyError) throw replyError;
      
      toast.success('Reply added');
      setReplyContent('');
      setShowReplyForm(false);
      
      // Refresh the page to show the new reply
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex py-2">
      <Link to={`/user/${comment.author.id}`} className="flex-shrink-0 mr-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar_url || ''} alt={comment.author.username || ''} />
          <AvatarFallback>{comment.author.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="inline-flex items-start">
              <Link to={`/user/${comment.author.id}`} className="font-semibold text-sm mr-2">
                {comment.author.username || 'Anonymous'}
              </Link>
              <p className="text-sm break-words">
                {comment.content}
              </p>
            </div>
            
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
              <span>{formatTimeAgo(comment.created_at)}</span>
              <span>{comment.likes > 0 ? `${comment.likes} likes` : ''}</span>
              <button 
                className="font-semibold"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                Reply
              </button>
              {replyCount > 0 && showReplies && (
                <button className="text-gray-400 flex items-center">
                  <span className="inline-block w-5 h-px bg-gray-300 mr-2"></span>
                  View replies ({replyCount})
                </button>
              )}
            </div>
            
            {showReplyForm && user && (
              <form onSubmit={handleSubmitReply} className="mt-2 flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <Input
                  className="flex-1 h-8 text-xs"
                  placeholder="Add a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <Button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  variant="ghost"
                  className="text-blue-500 ml-1 text-xs h-8 px-2"
                >
                  Post
                </Button>
              </form>
            )}
          </div>
          
          <button 
            onClick={() => onLike(comment.id, comment.user_has_liked)} 
            className="flex-shrink-0 ml-2 p-1"
          >
            <Heart 
              size={12} 
              className={`${comment.user_has_liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComment;
