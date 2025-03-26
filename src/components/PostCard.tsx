import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, ThumbsUp } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import PostCommentSection from './PostCommentSection';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.userLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const { user } = useSupabase();
  
  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to like posts');
      return;
    }
    
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
          
        if (error) throw error;
        
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/post/' + post.id)
      .then(() => {
        toast.success('Post link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
  };
  
  const updateCommentCount = (count: number) => {
    if (onPostUpdate) {
      onPostUpdate();
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author.id}`}>
              <img 
                src={post.author.avatar || "https://i.pravatar.cc/150"} 
                alt={post.author.name || "User"} 
                className="w-10 h-10 rounded-full"
              />
            </Link>
            <div>
              <Link to={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                {post.author.name || "Anonymous"}
              </Link>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <button className="rounded-full p-1 hover:bg-gray-100">
            <MoreHorizontal size={18} />
          </button>
        </div>
        
        <div className="mb-3 whitespace-pre-wrap">{post.content}</div>
        
        {post.image && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post media" 
              className="w-full h-auto max-h-[500px] object-contain bg-black"
            />
          </div>
        )}

        {post.video && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <video 
              src={post.video} 
              controls
              className="w-full h-auto max-h-[500px] bg-black"
            />
          </div>
        )}
        
        <div className="flex justify-between items-center mt-3 pt-2 text-gray-500 border-t">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleLikeToggle}
              className={`flex items-center gap-1 p-1 rounded hover:bg-gray-100 ${isLiked ? 'text-red-500' : ''}`}
            >
              <ThumbsUp size={18} className={isLiked ? 'fill-red-500' : ''} />
              <span>{likeCount}</span>
            </button>
          </div>
          
          <button 
            onClick={toggleComments}
            className="flex items-center gap-1 p-1 rounded hover:bg-gray-100"
          >
            <MessageCircle size={18} />
            <span>{post.commentCount}</span>
          </button>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 p-1 rounded hover:bg-gray-100"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
      
      {showComments && (
        <PostCommentSection 
          postId={post.id} 
          updateCommentCount={updateCommentCount}
          showCommentForm={true}
        />
      )}
    </div>
  );
};

export default PostCard;
