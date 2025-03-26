import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Loader2, Smile } from 'lucide-react';
import { toast } from 'sonner';
import PostComment from './PostComment';
import EmojiPicker from './EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface Author {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface CommentType {
  id: string;
  content: string;
  created_at: string;
  author: Author;
  likes: number;
  user_has_liked: boolean;
  reply_count?: number;
}

interface PostCommentSectionProps {
  postId: string;
  updateCommentCount: (count: number) => void;
  showCommentForm?: boolean;
}

const PostCommentSection: React.FC<PostCommentSectionProps> = ({ 
  postId, 
  updateCommentCount,
  showCommentForm = false
}) => {
  const { user, profile } = useSupabase();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      const { count, error: countError } = await supabase
        .from('post_comments')
        .select('id', { count: 'exact', head: false })
        .eq('post_id', postId)
        .is('parent_id', null);
      
      if (countError) throw countError;
      
      setTotalComments(count || 0);
      updateCommentCount(count || 0);
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          id, 
          content, 
          created_at, 
          likes, 
          user_id,
          parent_id,
          post_id
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (commentsError) throw commentsError;
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }
      
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      const commentsWithCounts = await Promise.all(commentsData.map(async (comment) => {
        const { count, error: countError } = await supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('parent_id', comment.id);
        
        if (countError) throw countError;
        
        return {
          ...comment,
          reply_count: count || 0
        };
      }));
      
      let formattedComments: CommentType[] = [];
      
      if (user) {
        const { data: likes, error: likesError } = await supabase
          .from('post_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        if (likesError) throw likesError;
        
        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        formattedComments = commentsWithCounts.map(comment => {
          const authorProfile = profileMap.get(comment.user_id);
          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            likes: comment.likes || 0,
            reply_count: comment.reply_count,
            author: {
              id: authorProfile?.id || comment.user_id,
              username: authorProfile?.username || 'Anonymous',
              avatar_url: authorProfile?.avatar_url || null
            },
            user_has_liked: likedCommentIds.has(comment.id)
          };
        });
      } else {
        formattedComments = commentsWithCounts.map(comment => {
          const authorProfile = profileMap.get(comment.user_id);
          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            likes: comment.likes || 0,
            reply_count: comment.reply_count,
            author: {
              id: authorProfile?.id || comment.user_id,
              username: authorProfile?.username || 'Anonymous',
              avatar_url: authorProfile?.avatar_url || null
            },
            user_has_liked: false
          };
        });
      }
      
      setComments(formattedComments);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    setCommentContent(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    
    if (!commentContent.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: commentData, error: commentError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentContent.trim()
        })
        .select();
      
      if (commentError) throw commentError;
      
      const newCommentCount = totalComments + 1;
      setTotalComments(newCommentCount);
      updateCommentCount(newCommentCount);
      
      await supabase
        .from('posts')
        .update({ comment_count: newCommentCount })
        .eq('id', postId);
      
      if (commentData && commentData[0]) {
        const newComment: CommentType = {
          id: commentData[0].id,
          content: commentData[0].content,
          created_at: commentData[0].created_at,
          likes: 0,
          author: {
            id: profile?.id || user.id,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url
          },
          user_has_liked: false,
          reply_count: 0
        };
        
        setComments(prev => [newComment, ...prev]);
      }
      
      setCommentContent('');
      toast.success('Comment added');
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentlyLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like comments');
      return;
    }
    
    try {
      if (currentlyLiked) {
        const { error } = await supabase
          .from('post_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('post_comments')
          .update({ likes: Math.max(0, (comments.find(c => c.id === commentId)?.likes || 1) - 1) })
          .eq('id', commentId);
          
        if (updateError) throw updateError;
      } else {
        const { error } = await supabase
          .from('post_comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('post_comments')
          .update({ likes: (comments.find(c => c.id === commentId)?.likes || 0) + 1 })
          .eq('id', commentId);
          
        if (updateError) throw updateError;
      }
      
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId
            ? {
                ...comment,
                likes: currentlyLiked 
                  ? Math.max(0, comment.likes - 1) 
                  : comment.likes + 1,
                user_has_liked: !currentlyLiked
              }
            : comment
        )
      );
    } catch (error: any) {
      console.error('Error liking comment:', error);
      toast.error(error.message || 'Failed to update like status');
    }
  };

  return (
    <div className="border-t pt-1">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="px-5 max-h-[300px] overflow-y-auto">
            {comments.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div>
                {comments.map(comment => (
                  <PostComment 
                    key={comment.id} 
                    comment={comment} 
                    onLike={handleLikeComment}
                    showReplies={true}
                    replyCount={comment.reply_count}
                    postId={postId}
                  />
                ))}
                
                {totalComments > comments.length && (
                  <div className="py-2 text-sm text-gray-500 text-center">
                    View all {totalComments} comments
                  </div>
                )}
              </div>
            )}
          </div>
          
          {showCommentForm && (
            <div className="px-5 pt-3 pb-3 border-t">
              {user ? (
                <form onSubmit={handleSubmitComment} className="flex flex-col space-y-3">
                  <div className="flex items-start">
                    <Avatar className="h-8 w-8 mr-3 mt-1">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        className="min-h-[80px] w-full resize-none bg-gray-50 border-gray-200 rounded-lg focus:border-blue-300 placeholder:text-gray-400 text-sm"
                        placeholder="Add a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                      />
                      <div className="absolute bottom-2 right-2">
                        <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                          <PopoverTrigger asChild>
                            <button 
                              type="button" 
                              className="text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full hover:bg-gray-100"
                            >
                              <Smile className="h-5 w-5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 border-none shadow-lg" align="end">
                            <EmojiPicker 
                              onSelectEmoji={handleInsertEmoji} 
                              onClose={() => setIsEmojiPickerOpen(false)} 
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting || !commentContent.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-3 bg-gray-50 rounded-lg text-gray-500 text-sm border border-gray-100">
                  Please sign in to leave a comment
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostCommentSection;
