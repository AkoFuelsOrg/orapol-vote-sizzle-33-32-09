
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useSupabase } from '../context/SupabaseContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

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

interface Reply extends Comment {}

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
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

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

  const fetchReplies = async () => {
    if (!comment.id) return;
    
    try {
      setLoadingReplies(true);
      
      const { data: repliesData, error: repliesError } = await supabase
        .from('post_comments')
        .select(`
          id, 
          content, 
          created_at, 
          likes, 
          user_id
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });
      
      if (repliesError) throw repliesError;
      
      if (!repliesData || repliesData.length === 0) {
        setReplies([]);
        setLoadingReplies(false);
        return;
      }
      
      const userIds = [...new Set(repliesData.map(reply => reply.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      let formattedReplies: Reply[] = [];
      
      if (user) {
        const { data: likes, error: likesError } = await supabase
          .from('post_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        if (likesError) throw likesError;
        
        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        formattedReplies = repliesData.map(reply => {
          const authorProfile = profileMap.get(reply.user_id);
          return {
            id: reply.id,
            content: reply.content,
            created_at: reply.created_at,
            likes: reply.likes || 0,
            author: {
              id: authorProfile?.id || reply.user_id,
              username: authorProfile?.username || 'Anonymous',
              avatar_url: authorProfile?.avatar_url || null
            },
            user_has_liked: likedCommentIds.has(reply.id)
          };
        });
      } else {
        formattedReplies = repliesData.map(reply => {
          const authorProfile = profileMap.get(reply.user_id);
          return {
            id: reply.id,
            content: reply.content,
            created_at: reply.created_at,
            likes: reply.likes || 0,
            author: {
              id: authorProfile?.id || reply.user_id,
              username: authorProfile?.username || 'Anonymous',
              avatar_url: authorProfile?.avatar_url || null
            },
            user_has_liked: false
          };
        });
      }
      
      setReplies(formattedReplies);
    } catch (error: any) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (open && replies.length === 0) {
      fetchReplies();
    }
  }, [open]);

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
        .select('*, profiles!inner(id, username, avatar_url)');
      
      if (replyError) throw replyError;
      
      toast.success('Reply added');

      // Add the new reply to the local state
      if (replyData && replyData[0]) {
        const newReply: Reply = {
          id: replyData[0].id,
          content: replyData[0].content,
          created_at: replyData[0].created_at,
          likes: 0,
          author: {
            id: profile?.id || user.id,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url
          },
          user_has_liked: false
        };
        
        setReplies(prev => [...prev, newReply]);
      }
      
      setReplyContent('');
      setShowReplyForm(false);
      
      // If replies weren't shown, show them now
      if (!open) {
        setOpen(true);
      }
      
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
                <Collapsible
                  open={open}
                  onOpenChange={setOpen}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <button className="text-gray-400 flex items-center">
                      <span className="inline-block w-5 h-px bg-gray-300 mr-2"></span>
                      {open ? (
                        <span className="flex items-center">
                          Hide replies <ChevronUp size={12} className="ml-1" />
                        </span>
                      ) : (
                        <span className="flex items-center">
                          View replies ({replyCount}) <ChevronDown size={12} className="ml-1" />
                        </span>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2 pl-4 border-l border-gray-200">
                    {loadingReplies ? (
                      <div className="py-2 text-sm text-gray-500">Loading replies...</div>
                    ) : replies.length > 0 ? (
                      replies.map(reply => (
                        <div key={reply.id} className="flex py-2">
                          <Link to={`/user/${reply.author.id}`} className="flex-shrink-0 mr-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={reply.author.avatar_url || ''} alt={reply.author.username || ''} />
                              <AvatarFallback>{reply.author.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                            </Avatar>
                          </Link>
                          
                          <div className="flex-1 min-w-0">
                            <div className="inline-flex items-start">
                              <Link to={`/user/${reply.author.id}`} className="font-semibold text-xs mr-2">
                                {reply.author.username || 'Anonymous'}
                              </Link>
                              <p className="text-xs break-words">
                                {reply.content}
                              </p>
                            </div>
                            
                            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                              <span>{formatTimeAgo(reply.created_at)}</span>
                              <span>{reply.likes > 0 ? `${reply.likes} likes` : ''}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => onLike(reply.id, reply.user_has_liked)} 
                            className="flex-shrink-0 ml-2 p-1"
                          >
                            <Heart 
                              size={12} 
                              className={`${reply.user_has_liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 text-sm text-gray-500">No replies yet</div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
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
