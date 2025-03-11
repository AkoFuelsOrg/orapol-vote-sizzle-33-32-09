import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabase } from '../context/SupabaseContext';
import { User } from '../lib/types';
import { MessageSquare, Heart, Send, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CommentAuthor {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface CommentType {
  id: string;
  content: string;
  created_at: string;
  author: CommentAuthor;
  likes: number;
  user_has_liked: boolean;
  parent_id: string | null;
  reply_count?: number;
}

const CommentSection: React.FC = () => {
  const { id: pollId } = useParams<{ id: string }>();
  const { user, profile } = useSupabase();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [repliesLoading, setRepliesLoading] = useState<Record<string, boolean>>({});
  const [pollCommentCount, setPollCommentCount] = useState(0);

  useEffect(() => {
    if (pollId) {
      fetchPollCommentCount();
    }
  }, [pollId]);

  const fetchPollCommentCount = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('comment_count')
        .eq('id', pollId)
        .single();
      
      if (error) throw error;
      
      setPollCommentCount(data.comment_count || 0);
    } catch (error) {
      console.error('Error fetching poll comment count:', error);
    }
  };

  const loadComments = async () => {
    if (!pollId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, 
          content, 
          created_at, 
          likes, 
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('poll_id', pollId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const commentsWithCounts = await Promise.all(data.map(async (comment) => {
        const { count, error: countError } = await supabase
          .from('comments')
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
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        if (likesError) throw likesError;
        
        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        formattedComments = commentsWithCounts.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          parent_id: comment.parent_id,
          reply_count: comment.reply_count,
          author: {
            id: comment.profiles.id,
            username: comment.profiles.username || 'Anonymous',
            avatar_url: comment.profiles.avatar_url
          },
          user_has_liked: likedCommentIds.has(comment.id)
        }));
      } else {
        formattedComments = commentsWithCounts.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          likes: comment.likes || 0,
          parent_id: comment.parent_id,
          reply_count: comment.reply_count,
          author: {
            id: comment.profiles.id,
            username: comment.profiles.username || 'Anonymous',
            avatar_url: comment.profiles.avatar_url
          },
          user_has_liked: false
        }));
      }
      
      setComments(formattedComments);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (!commentId) return;
    
    try {
      setRepliesLoading(prev => ({ ...prev, [commentId]: true }));
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, 
          content, 
          created_at, 
          likes, 
          parent_id,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      let formattedReplies: CommentType[] = [];
      
      if (user) {
        const { data: likes, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        if (likesError) throw likesError;
        
        const likedCommentIds = new Set(likes?.map(like => like.comment_id) || []);
        
        formattedReplies = data.map(reply => ({
          id: reply.id,
          content: reply.content,
          created_at: reply.created_at,
          likes: reply.likes || 0,
          parent_id: reply.parent_id,
          author: {
            id: reply.profiles.id,
            username: reply.profiles.username || 'Anonymous',
            avatar_url: reply.profiles.avatar_url
          },
          user_has_liked: likedCommentIds.has(reply.id)
        }));
      } else {
        formattedReplies = data.map(reply => ({
          id: reply.id,
          content: reply.content,
          created_at: reply.created_at,
          likes: reply.likes || 0,
          parent_id: reply.parent_id,
          author: {
            id: reply.profiles.id,
            username: reply.profiles.username || 'Anonymous',
            avatar_url: reply.profiles.avatar_url
          },
          user_has_liked: false
        }));
      }
      
      setComments(prev => [
        ...prev.filter(c => c.parent_id !== commentId && c.id !== commentId),
        ...formattedReplies,
        ...prev.filter(c => c.id === commentId)
      ]);
      
      setShowReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (error: any) {
      console.error('Error loading replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setRepliesLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const hideReplies = (commentId: string) => {
    setShowReplies(prev => ({ ...prev, [commentId]: false }));
    setComments(prev => prev.filter(c => c.parent_id !== commentId));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    
    if (!commentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          content: commentContent.trim()
        })
        .select();
      
      if (commentError) throw commentError;
      
      const newCommentCount = pollCommentCount + 1;
      setPollCommentCount(newCommentCount);
      
      await supabase
        .from('polls')
        .update({ comment_count: newCommentCount })
        .eq('id', pollId);
      
      if (commentData && commentData[0]) {
        const newComment: CommentType = {
          id: commentData[0].id,
          content: commentData[0].content,
          created_at: commentData[0].created_at,
          parent_id: commentData[0].parent_id,
          likes: commentData[0].likes || 0,
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
      toast.success('Comment added successfully');
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
          .from('comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('comments')
          .update({ likes: Math.max(0, (comments.find(c => c.id === commentId)?.likes || 1) - 1) })
          .eq('id', commentId);
          
        if (updateError) throw updateError;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId
          });
        
        if (error) throw error;
        
        const { error: updateError } = await supabase
          .from('comments')
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

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast.error('Please sign in to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data: replyData, error: replyError } = await supabase
        .from('comments')
        .insert({
          poll_id: pollId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        })
        .select();
      
      if (replyError) throw replyError;
      
      const newCommentCount = pollCommentCount + 1;
      setPollCommentCount(newCommentCount);
      
      await supabase
        .from('polls')
        .update({ 
          comment_count: newCommentCount
        })
        .eq('id', pollId);
      
      if (replyData && replyData[0] && showReplies[parentId]) {
        const newReply: CommentType = {
          id: replyData[0].id,
          content: replyData[0].content,
          created_at: replyData[0].created_at,
          parent_id: replyData[0].parent_id,
          likes: replyData[0].likes || 0,
          author: {
            id: profile?.id || user.id,
            username: profile?.username || 'Anonymous',
            avatar_url: profile?.avatar_url
          },
          user_has_liked: false
        };
        
        setComments(prev => [
          ...prev,
          newReply
        ]);
      }
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === parentId
            ? { ...comment, reply_count: (comment.reply_count || 0) + 1 }
            : comment
        )
      );
      
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply added successfully');
      
      if (!showReplies[parentId]) {
        loadReplies(parentId);
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      toast.error(error.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReplyForm = (commentId: string | null) => {
    setReplyingTo(prevId => prevId === commentId ? null : commentId);
    if (commentId) {
      setReplyContent('');
    }
  };

  const toggleExpand = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const toggleReplies = (commentId: string) => {
    if (showReplies[commentId]) {
      hideReplies(commentId);
    } else {
      loadReplies(commentId);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  const isTopLevelComment = (comment: CommentType) => !comment.parent_id;

  const topLevelComments = comments.filter(isTopLevelComment);

  const getRepliesForComment = (commentId: string) => 
    comments.filter(comment => comment.parent_id === commentId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments
      </h2>
      
      {user ? (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting || !commentContent.trim()}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <Card className="p-4 text-center bg-muted/50">
          <p>Please sign in to leave a comment</p>
        </Card>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(comment => (
            <div key={comment.id} className="border rounded-lg p-4 bg-card">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src={comment.author.avatar_url || ''} alt={comment.author.username || ''} />
                  <AvatarFallback>{comment.author.username?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{comment.author.username || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(comment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className={`${expandedComments[comment.id] || comment.content.length < 200 ? '' : 'line-clamp-3'}`}>
                      {comment.content}
                    </p>
                    {comment.content.length > 200 && (
                      <button 
                        onClick={() => toggleExpand(comment.id)} 
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        {expandedComments[comment.id] ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <button 
                      onClick={() => handleLikeComment(comment.id, comment.user_has_liked)}
                      className="flex items-center gap-1 text-sm"
                    >
                      <Heart 
                        className={`h-4 w-4 ${comment.user_has_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                      />
                      <span>{comment.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => toggleReplyForm(comment.id)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                    {comment.reply_count > 0 && (
                      <button 
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1 text-sm text-primary"
                      >
                        {showReplies[comment.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder={`Reply to ${comment.author.username || 'Anonymous'}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleReplyForm(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={submitting || !replyContent.trim()}
                          className="flex items-center gap-2"
                        >
                          {submitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {repliesLoading[comment.id] && (
                    <div className="mt-4 ml-2 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                  
                  {showReplies[comment.id] && getRepliesForComment(comment.id).map(reply => (
                    <div key={reply.id} className="mt-4 border-t pt-3">
                      <div className="flex gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={reply.author.avatar_url || ''} alt={reply.author.username || ''} />
                          <AvatarFallback>{reply.author.username?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">{reply.author.username || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(reply.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm">{reply.content}</p>
                          </div>
                          <div className="mt-2 flex items-center gap-4">
                            <button 
                              onClick={() => handleLikeComment(reply.id, reply.user_has_liked)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Heart 
                                className={`h-3 w-3 ${reply.user_has_liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
                              />
                              <span>{reply.likes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
