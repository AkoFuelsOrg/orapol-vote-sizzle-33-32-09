
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2, UserX, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { confirmAlert } from '@/components/ui/confirm-alert';
import { useSupabase } from '@/context/SupabaseContext';
import { Post } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { timeAgo } from '@/lib/utils';

export interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
  onPostDeleted: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate = () => {}, onPostDeleted = () => {} }) => {
  const { user } = useSupabase();
  const [isLiked, setIsLiked] = useState<boolean>(post.userLiked || false);
  const [likeCount, setLikeCount] = useState<number>(post.likeCount || 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isAuthor = user?.id === post.author?.id;

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLiked) {
        // Unlike post
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setLikeCount(prev => prev - 1);
      } else {
        // Like post
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) throw error;
        setLikeCount(prev => prev + 1);
      }

      setIsLiked(!isLiked);
      onPostUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!isAuthor) return;
    
    const confirmed = await confirmAlert({
      title: "Delete Post",
      description: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "destructive"
    });

    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Post deleted successfully');
      onPostDeleted();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Link to={`/user/${post.author?.id}`} className="flex items-center gap-3 group">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage src={post.author?.avatar || ""} alt={post.author?.name || "User"} />
              <AvatarFallback className="bg-primary/10">
                <User size={16} className="text-primary" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                {post.author?.name || "Anonymous User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </Link>

          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleDeletePost}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div>
          <p className="text-sm sm:text-base whitespace-pre-line">{post.content}</p>
        </div>
        
        {post.image && (
          <div className="pt-2">
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full h-auto rounded-md object-cover"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
              onClick={handleLikeToggle}
              disabled={isLoading}
            >
              <Heart size={18} className={isLiked ? "fill-current" : ""} />
              <span>{likeCount}</span>
            </Button>
            
            <Link to={`/post/${post.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-gray-600"
              >
                <MessageCircle size={18} />
                <span>{post.commentCount}</span>
              </Button>
            </Link>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-gray-600"
          >
            <Share size={18} />
            <span>Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
