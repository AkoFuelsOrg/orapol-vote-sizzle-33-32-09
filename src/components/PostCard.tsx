
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X, Maximize } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';

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

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    
    try {
      if (!hasLiked) {
        // Add like
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
        // Remove like
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
    <div className="bg-white rounded-xl p-5 shadow-sm border border-border/50 card-hover animate-fade-in">
      <Link to={`/post/${post.id}`} className="block">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link 
            to={`/user/${post.author.id}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()} // Prevent event propagation
          >
            <img 
              src={post.author.avatar} 
              alt={post.author.name} 
              className="w-8 h-8 rounded-full border-2 border-red-500 object-cover"
            />
            <div>
              <p className="text-sm font-medium text-red-500">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
          </Link>
        </div>
        
        {/* Content */}
        <div className="mb-4">
          <p className="text-base whitespace-pre-line break-words">
            {post.content}
          </p>
        </div>
        
        {/* Image */}
        {post.image && (
          <>
            <div 
              className="mb-4 rounded-lg overflow-hidden relative cursor-pointer"
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
          </>
        )}
        
        {/* Post stats */}
        <div className="flex items-center justify-between py-2 border-t border-b my-2">
          <div className="flex items-center space-x-2" onClick={(e) => e.preventDefault()}>
            <button 
              className={`flex items-center space-x-1 p-1.5 rounded-md hover:bg-gray-100 ${hasLiked ? 'text-red-500' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
            >
              <Heart size={18} className={hasLiked ? 'fill-red-500' : ''} />
              <span>{likeCount}</span>
            </button>
            
            <button className="flex items-center space-x-1 p-1.5 rounded-md hover:bg-gray-100">
              <MessageCircle size={18} />
              <span>{post.commentCount}</span>
            </button>
          </div>
          
          <button 
            className="p-1.5 rounded-md hover:bg-gray-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </Link>
    </div>
  );
};

export default PostCard;
