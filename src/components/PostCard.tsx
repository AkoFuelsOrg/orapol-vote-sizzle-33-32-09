
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X, Maximize, Bookmark } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const { user } = useSupabase();
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);
  const [hasLiked, setHasLiked] = React.useState(post.userLiked || false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric'
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
      
      // Call the update callback if provided
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      toast.error(error.message || "Failed to like post");
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Link 
          to={`/user/${post.author.id}`}
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()} // Prevent event propagation
        >
          <div className="relative">
            <img 
              src={post.author.avatar} 
              alt={post.author.name} 
              className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500"
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author.name}</p>
          </div>
        </Link>
        <button className="text-gray-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
            <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
            <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      
      {/* Main content - restructured to have image on left and content on right */}
      <div className="flex flex-col md:flex-row">
        {/* Image on the left */}
        {post.image && (
          <div className="md:w-1/2 relative">
            <div 
              className="aspect-square w-full overflow-hidden bg-gray-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageExpanded(true);
              }}
            >
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-full object-cover cursor-pointer"
              />
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
          </div>
        )}
        
        {/* Content on the right */}
        <div className={`${post.image ? 'md:w-1/2' : 'w-full'} flex flex-col`}>
          {/* Caption */}
          <div className="px-4 py-3">
            <div className="flex space-x-1">
              <p className="text-sm">
                <span className="font-semibold">{post.author.name}</span>{" "}
                <span className="whitespace-pre-line break-words">
                  {post.content}
                </span>
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="px-4 pt-2 pb-1 flex justify-between mt-auto">
            <div className="flex space-x-4">
              <button 
                className="focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLike();
                }}
              >
                <Heart size={24} className={`${hasLiked ? 'fill-red-500 text-red-500' : 'text-black'}`} />
              </button>
              <Link to={`/post/${post.id}`} className="focus:outline-none">
                <MessageCircle size={24} className="text-black" />
              </Link>
              <button 
                className="focus:outline-none"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
                  toast.success("Link copied to clipboard");
                }}
              >
                <Share2 size={24} className="text-black" />
              </button>
            </div>
            <button className="focus:outline-none">
              <Bookmark size={24} className="text-black" />
            </button>
          </div>
          
          {/* Likes count */}
          <div className="px-4 pt-1 pb-1">
            <p className="font-semibold text-sm">{likeCount} likes</p>
          </div>
          
          {/* Comments link */}
          {post.commentCount > 0 && (
            <Link to={`/post/${post.id}`} className="block px-4 pb-1">
              <p className="text-sm text-gray-500">View all {post.commentCount} comments</p>
            </Link>
          )}
          
          {/* Date */}
          <div className="px-4 py-2 mt-auto">
            <p className="text-xs uppercase text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
