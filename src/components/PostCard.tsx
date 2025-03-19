
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X, Maximize } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useSupabase();
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);
  const [hasLiked, setHasLiked] = React.useState(post.userLiked || false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    
    try {
      if (!hasLiked) {
        // Add like with type-safe approach
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
          
        if (error) throw error;
        
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success("Post liked");
      } else {
        // Remove like with type-safe approach
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setHasLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      toast.error(error.message || "Failed to like post");
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow animate-fade-in">
      <Link to={`/post/${post.id}`} className="block">
        <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
          <Link 
            to={`/user/${post.author.id}`}
            className="flex items-center space-x-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-primary">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
          </Link>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          <p className="text-base whitespace-pre-line break-words mb-4">
            {post.content}
          </p>
          
          {post.image && (
            <div 
              className="rounded-lg overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageExpanded(true);
              }}
            >
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-auto max-h-[300px] object-cover"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize size={24} className="text-white drop-shadow-lg" />
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-4 py-3 border-t flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center space-x-1 p-1 rounded-md hover:bg-gray-100 ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <Heart size={18} className={hasLiked ? 'fill-primary' : ''} />
              <span>{likeCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1 p-1 rounded-md hover:bg-gray-100 text-muted-foreground"
            >
              <MessageCircle size={18} />
              <span>{post.commentCount}</span>
            </Button>
          </div>
          
          <Button 
            variant="ghost"
            size="sm"
            className="p-1 rounded-md hover:bg-gray-100 text-muted-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 size={18} />
          </Button>
        </CardFooter>
      </Link>

      {isImageExpanded && (
        <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-lg border-none shadow-2xl">
            <DialogTitle className="sr-only">Post Image</DialogTitle>
            <DialogClose className="absolute top-4 right-4 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
              <X size={24} />
            </DialogClose>
            <div className="relative w-full overflow-hidden rounded-lg p-1">
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default PostCard;
