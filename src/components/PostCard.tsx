
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { MoreHorizontal, Heart, MessageSquare, Share2, Trash2, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useSupabase } from '../context/SupabaseContext';
import { Post } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  onPostDeleted?: (postId: string) => void;
  onEdit?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate, onPostDeleted, onEdit }) => {
  const { user, profile } = useSupabase();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.userLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const { toast } = useToast();
  
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to like this post.",
      })
      return;
    }

    try {
      const optimisticLike = !isLiked;
      const optimisticLikeCount = isLiked ? likeCount - 1 : likeCount + 1;

      setIsLiked(optimisticLike);
      setLikeCount(optimisticLikeCount);

      if (optimisticLike) {
        const { error } = await supabase
          .from('post_likes')
          .upsert(
            { post_id: post.id, user_id: user.id },
            { onConflict: 'post_id,user_id', ignoreDuplicates: false }
          );

        if (error) {
          console.error('Error toggling like:', error);
          setIsLiked(isLiked);
          setLikeCount(likeCount);
          toast({
            title: "Error",
            description: "Failed to update like. Please try again.",
            variant: "destructive",
          });
        } else if (onPostUpdate) {
          onPostUpdate();
        }
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing like:', error);
          setIsLiked(isLiked);
          setLikeCount(likeCount);
          toast({
            title: "Error",
            description: "Failed to update like. Please try again.",
            variant: "destructive",
          });
        } else if (onPostUpdate) {
          onPostUpdate();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(isLiked);
      setLikeCount(likeCount);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  };
  
  const handleDelete = async () => {
    if (!user || user.id !== post.author.id) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to delete this post.",
        variant: "destructive",
      })
      return;
    }
    
    try {
      // Optimistically update the UI
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
      
      // Call the Supabase function to delete the post
      const { error } = await supabase.functions.invoke('delete-post', {
        body: { post_id: post.id },
      });
      
      if (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Post deleted successfully.",
        })
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  };

  const handleShare = async (platform: string) => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      
      if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.content)}`, '_blank');
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
      } else if (platform === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.content} ${postUrl}`)}`, '_blank');
      } else if (platform === 'copy') {
        navigator.clipboard.writeText(postUrl);
        toast({
          title: "Copied!",
          description: "Post URL copied to clipboard.",
        })
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      })
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/user/${post.author.id}`}>
            <Avatar className="mr-3 h-8 w-8">
              {post.author.avatar ? (
                <AvatarImage src={post.author.avatar} alt={post.author.name || "User"} />
              ) : null}
              <AvatarFallback className="bg-muted">
                {post.author.name ? post.author.name[0].toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link to={`/user/${post.author.id}`}>
              <CardTitle className="text-sm font-semibold hover:underline">{post.author.name}</CardTitle>
            </Link>
            <CardDescription className="text-xs text-gray-500">{timeAgo}</CardDescription>
          </div>
        </div>
        {user && (post.author.id === user.id) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit ? onEdit(post.id) : null}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <CardDescription className="text-sm">{post.content}</CardDescription>
        {post.image && (
          <img src={post.image} alt="Post Image" className="mt-4 rounded-md" />
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4 text-gray-500">
          <Button variant="ghost" size="icon" onClick={toggleLike}>
            <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'red' : 'none'} />
            <span className="sr-only">Like</span>
          </Button>
          <span>{likeCount}</span>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/post/${post.id}`)}>
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Comment</span>
          </Button>
          <span>{post.commentCount}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Share to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleShare('facebook')}>Facebook</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('twitter')}>Twitter</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('linkedin')}>LinkedIn</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('whatsapp')}>WhatsApp</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('copy')}>Copy Link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
