
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { useSupabase } from '@/context/SupabaseContext';
import { Video, VideoComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchVideo, fetchVideoComments, addVideoComment, likeVideo, unlikeVideo, viewVideo, hasLikedVideo } = useVibezone();
  const { user } = useSupabase();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecorded = useRef(false);
  
  useEffect(() => {
    const loadVideo = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const videoData = await fetchVideo(id);
        if (videoData) {
          setVideo(videoData);
          setLikesCount(videoData.likes);
          
          // Check if the user has liked this video
          if (user) {
            const userLiked = await hasLikedVideo(id);
            setLiked(userLiked);
          }
          
          // Load comments
          const commentsData = await fetchVideoComments(id);
          setComments(commentsData);
        }
      } catch (error) {
        console.error('Error loading video:', error);
        toast.error('Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    loadVideo();
  }, [id, fetchVideo, fetchVideoComments, hasLikedVideo, user]);
  
  // Record a view when the video starts playing
  const handleVideoPlay = async () => {
    if (!id || viewRecorded.current) return;
    
    try {
      const success = await viewVideo(id);
      if (success) {
        viewRecorded.current = true;
        if (video) {
          setVideo({
            ...video,
            views: video.views + 1
          });
        }
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };
  
  const handleLike = async () => {
    if (!user) {
      toast.error('You must be logged in to like videos');
      return;
    }
    
    if (!id) return;
    
    try {
      if (liked) {
        const success = await unlikeVideo(id);
        if (success) {
          setLiked(false);
          setLikesCount(prev => prev - 1);
        }
      } else {
        const success = await likeVideo(id);
        if (success) {
          setLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };
  
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    
    if (!id || !commentText.trim()) return;
    
    try {
      const newComment = await addVideoComment(id, commentText.trim());
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };
  
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} ${views === 1 ? 'view' : 'views'}`;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (!video) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Video not found</h2>
          <p className="mt-2 text-gray-600">The video you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.video_url}
              className="w-full h-auto"
              controls
              onPlay={handleVideoPlay}
              poster={video.thumbnail_url}
            />
          </div>
          
          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-600">
                {formatViews(video.views)} • {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
              </div>
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center" 
                  onClick={handleLike}
                >
                  <ThumbsUp 
                    className={`h-5 w-5 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Share2 className="h-5 w-5 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Channel Info */}
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <img 
                src={video.author?.avatar || "https://via.placeholder.com/40"} 
                alt={video.author?.name || 'Author'} 
                className="rounded-full"
              />
            </Avatar>
            <div className="ml-3">
              <h3 className="font-semibold">{video.author?.name || 'Unknown'}</h3>
            </div>
          </div>
          
          {/* Video Description */}
          {video.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-line">{video.description}</p>
            </div>
          )}
          
          <Separator className="my-6" />
          
          {/* Comments Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              <MessageSquare className="inline mr-2 h-5 w-5" />
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </h3>
            
            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-6 flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-1">
                  <img 
                    src={user.user_metadata?.avatar_url || "https://via.placeholder.com/32"} 
                    alt={user.user_metadata?.username || 'You'} 
                    className="rounded-full"
                  />
                </Avatar>
                <div className="flex-1">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full"
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!commentText.trim()}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Comment
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-6 text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Sign in to add a comment</p>
              </div>
            )}
            
            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 mt-1">
                    <img 
                      src={comment.author?.avatar || "https://via.placeholder.com/32"} 
                      alt={comment.author?.name || 'User'} 
                      className="rounded-full"
                    />
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{comment.author?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button className="text-xs text-gray-500 flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {comment.likes > 0 && comment.likes}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Related Videos */}
        <div className="hidden lg:block">
          <h3 className="font-semibold mb-4">Related Videos</h3>
          <div className="space-y-4">
            {/* This would be populated with related videos in a real implementation */}
            <div className="text-center py-10 text-gray-500">
              <p>Related videos will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchVideo;
