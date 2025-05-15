
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal, 
  Share2, 
  Trash, 
  Edit,
  BookmarkPlus,
  BookmarkCheck,
  Flag,
  Copy
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/context/SupabaseContext';
import { Post, PostWithAuthor } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/use-toast';
import { USER_AVATAR_FALLBACK } from '@/lib/default-avatar-provider';

export interface PostCardProps {
  post: PostWithAuthor;
  onPostUpdate: () => void;
  onPostDeleted: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate, onPostDeleted }) => {
  const { user, profile, supabase } = useSupabase();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  
  const handleLike = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsLiked(!isLiked);
    
    try {
      if (!isLiked) {
        // Add like
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id });
      } else {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      }
      
      onPostUpdate();
    } catch (error) {
      console.error('Error updating like:', error);
      setIsLiked(!isLiked); // revert on error
    }
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setIsSaved(!isSaved);
    
    try {
      if (!isSaved) {
        // Save post
        await supabase
          .from('saved_posts')
          .insert({ post_id: post.id, user_id: user.id });
      } else {
        // Unsave post
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      }
      
      onPostUpdate();
    } catch (error) {
      console.error('Error updating saved status:', error);
      setIsSaved(!isSaved); // revert on error
    }
  };

  const handleDeletePost = async () => {
    if (!user || user.id !== post.author?.id) return;
    
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      toast({
        description: "Post deleted successfully",
      });
      
      // Call the onPostDeleted prop with the post ID
      onPostDeleted(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        variant: "destructive",
        description: "Failed to delete post",
      });
    }
  };

  const handleReport = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    try {
      await supabase
        .from('reports')
        .insert({
          content_id: post.id,
          content_type: 'post',
          reporter_id: user.id,
          reason: 'inappropriate content'
        });
      
      toast({
        description: "Post reported. Thank you for helping keep our community safe.",
      });
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        variant: "destructive",
        description: "Failed to report post",
      });
    }
  };

  const handleCopyLink = () => {
    toast({
      description: "Link copied to clipboard!",
    });
  };

  const handleNavigateToProfile = () => {
    navigate(`/user/${post.author?.id}`);
  };

  const handleNavigateToPost = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return;
    }
    
    navigate(`/post/${post.id}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleNavigateToPost}>
      <div className="p-4">
        {/* Author info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleNavigateToProfile(); }}>
            <Avatar className="h-9 w-9 border border-gray-200">
              {post.author?.avatar_url ? (
                <AvatarImage src={post.author.avatar_url} alt={post.author.username || "User"} />
              ) : (
                <AvatarFallback>{USER_AVATAR_FALLBACK}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium text-sm">{post.author?.username || "Anonymous"}</div>
              <div className="text-gray-500 text-xs">
                {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : "Just now"}
              </div>
            </div>
          </div>
          
          {/* Post options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
                <span>Copy link</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handleSave}>
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    <span>Save post</span>
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handleReport}>
                <Flag className="h-4 w-4" />
                <span>Report post</span>
              </DropdownMenuItem>
              
              {user && user.id === post.author?.id && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/edit-post/${post.id}`); }}>
                    <Edit className="h-4 w-4" />
                    <span>Edit post</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-red-500 focus:text-red-500" onClick={handleDeletePost}>
                    <Trash className="h-4 w-4" />
                    <span>Delete post</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Post content */}
        <div className="mb-3">
          <h3 className="font-medium text-lg mb-2">{post.title}</h3>
          <p className="text-gray-700">{post.content}</p>
        </div>
        
        {/* Post media */}
        {post.image_url && (
          <div className="mb-3 -mx-4">
            <img src={post.image_url} alt="Post" className="w-full object-cover max-h-96" />
          </div>
        )}
        
        {/* Post actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500' : ''}`} />
              <span>{post.likes_count || 0}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1.5 text-gray-600"
              onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.comments_count || 0}</span>
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 text-gray-600"
            onClick={(e) => { 
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              handleCopyLink();
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
