
import React, { useState, useEffect, useRef } from 'react';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Share2, User, ChevronUp, ChevronDown, Send, X, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import VideoCommentSection from '@/components/VideoCommentSection';
import UserAvatar from '@/components/UserAvatar';
import { getAvatarUrl } from '@/lib/avatar-utils';
import { supabase } from '@/integrations/supabase/client';

interface VideoComment {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  video_id: string;
  username: string;
  user_avatar: string | null;
}

interface VideoCardProps {
  video: Video;
  index: number;
  playingVideo: string | null;
  toggleVideoPlayback: (videoId: string) => void;
  handleLikeVideo: (videoId: string) => void;
  likedVideos: { [key: string]: boolean };
  handleCommentClick: (video: Video) => void;
  isFollowing: { [key: string]: boolean };
  handleFollow: (userId: string) => void;
  followLoading: { [key: string]: boolean };
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  index,
  playingVideo,
  toggleVideoPlayback,
  handleLikeVideo,
  likedVideos,
  handleCommentClick,
  isFollowing,
  handleFollow,
  followLoading,
}) => {
  return (
    <div
      key={video.id}
      className="w-full h-[calc(100vh-64px)] flex justify-center items-center snap-start"
    >
      <div className="relative w-full h-full max-w-md">
        <div 
          className="absolute inset-0 bg-black cursor-pointer"
          onClick={() => toggleVideoPlayback(video.id)}
        >
          <video
            id={`video-${video.id}`}
            src={video.url}
            loop
            className="w-full h-full object-contain"
            poster={video.thumbnail_url || undefined}
          />
          {!playingVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <FilmIcon size={64} className="text-white opacity-80" />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={video.user_avatar || getAvatarUrl()} alt={video.username || 'User'} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{video.username || 'Anonymous'}</p>
              <p className="text-xs opacity-80">
                {video.created_at ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true }) : 'Recently'}
              </p>
            </div>
          </div>
          <p className="mb-4">{video.description}</p>
        </div>

        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
          {video.user_id && (
            <button 
              className="flex flex-col items-center"
              onClick={(e) => {
                e.stopPropagation();
                if (video.user_id) handleFollow(video.user_id);
              }}
              disabled={followLoading[video.user_id || ''] || !video.user_id}
            >
              <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                {followLoading[video.user_id] ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : isFollowing[video.user_id] ? (
                  <UserCheck className="h-6 w-6 text-white" />
                ) : (
                  <UserPlus className="h-6 w-6 text-white" />
                )}
              </div>
              <span className="text-xs text-white mt-1">
                {isFollowing[video.user_id] ? 'Following' : 'Follow'}
              </span>
            </button>
          )}

          <button 
            className="flex flex-col items-center"
            onClick={() => handleLikeVideo(video.id)}
          >
            <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <Heart 
                className={`h-6 w-6 ${likedVideos[video.id] ? 'text-red-500 fill-red-500' : 'text-white'}`} 
              />
            </div>
            <span className="text-xs text-white mt-1">{video.likes || 0}</span>
          </button>

          <button 
            className="flex flex-col items-center"
            onClick={() => handleCommentClick(video)}
          >
            <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white mt-1">{video.comments_count || 0}</span>
          </button>

          <button className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs text-white mt-1">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const VibezoneContent: React.FC = () => {
  const { videos, loading, fetchVideos, likeVideo } = useVibezone();
  const { user } = useSupabase();
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [likedVideos, setLikedVideos] = useState<{[key: string]: boolean}>({});
  const [commentingVideo, setCommentingVideo] = useState<Video | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<VideoComment[]>([]);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState<{[key: string]: boolean}>({});
  const [followLoading, setFollowLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (user) {
      const likedVideoIds = videos.filter(video => video.liked_by?.includes(user.id)).map(video => video.id);
      const initialLikedVideos = likedVideoIds.reduce((acc: {[key: string]: boolean}, videoId) => {
        acc[videoId] = true;
        return acc;
      }, {});
      setLikedVideos(initialLikedVideos);
    } else {
      setLikedVideos({});
    }
  }, [videos, user]);

  // Check if the current user is following video creators
  useEffect(() => {
    if (user && videos.length > 0) {
      const checkFollowStatuses = async () => {
        const followStatuses: { [key: string]: boolean } = {};
        
        for (const video of videos) {
          if (video.user_id && video.user_id !== user.id) {
            try {
              const { data } = await supabase
                .from('channel_subscriptions')
                .select('id')
                .eq('channel_id', video.user_id)
                .eq('subscriber_id', user.id)
                .single();
                
              followStatuses[video.user_id] = !!data;
            } catch (error) {
              followStatuses[video.user_id] = false;
            }
          }
        }
        
        setIsFollowing(followStatuses);
      };
      
      checkFollowStatuses();
    }
  }, [videos, user]);

  const toggleVideoPlayback = (videoId: string) => {
    const videoElement = document.getElementById(`video-${videoId}`) as HTMLVideoElement;
    if (videoElement) {
      if (playingVideo === videoId) {
        videoElement.pause();
        setPlayingVideo(null);
      } else {
        if (playingVideo) {
          const currentlyPlaying = document.getElementById(`video-${playingVideo}`) as HTMLVideoElement;
          if (currentlyPlaying) {
            currentlyPlaying.pause();
          }
        }
        videoElement.play();
        setPlayingVideo(videoId);
      }
    }
  };

  const handleLikeVideo = async (videoId: string) => {
    if (!user) {
      toast.error("You must be logged in to like videos");
      navigate('/auth');
      return;
    }

    try {
      await likeVideo(videoId);
      setLikedVideos(prev => ({
        ...prev,
        [videoId]: !prev[videoId]
      }));
    } catch (error: any) {
      toast.error(error.message || 'Error liking video');
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) {
      toast.error("You must be logged in to follow users");
      navigate('/auth');
      return;
    }
    
    if (user.id === targetUserId) {
      toast.error("You cannot follow yourself");
      return;
    }
    
    setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      if (isFollowing[targetUserId]) {
        // If already following, unfollow
        const { error } = await supabase
          .from('channel_subscriptions')
          .delete()
          .eq('channel_id', targetUserId)
          .eq('subscriber_id', user.id);
          
        if (error) throw error;
        
        setIsFollowing(prev => ({ ...prev, [targetUserId]: false }));
        toast.success("Unfollowed successfully");
      } else {
        // Follow user
        const { error } = await supabase
          .from('channel_subscriptions')
          .insert({
            channel_id: targetUserId,
            subscriber_id: user.id
          });
          
        if (error) throw error;
        
        setIsFollowing(prev => ({ ...prev, [targetUserId]: true }));
        toast.success("Following successfully");
      }
    } catch (error: any) {
      toast.error(error.message || 'Error updating follow status');
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleCommentClick = (video: Video) => {
    setCommentingVideo(video);
    setNewComment('');
  };

  const handleCloseCommentSection = () => {
    setCommentingVideo(null);
    setNewComment('');
  };

  const handlePostComment = async () => {
    if (!user) {
      toast.error("You must be logged in to comment");
      navigate('/auth');
      return;
    }

    if (!commentingVideo) return;
    
    try {
      // Use an inline comment posting function since addComment doesn't exist in VibezoneContext
      const { data, error } = await supabase
        .from('video_comments')
        .insert({
          video_id: commentingVideo.id,
          user_id: user.id,
          content: newComment
        })
        .select();
      
      if (error) throw error;
      
      setNewComment('');
      toast.success('Comment added successfully!');
      setCommentingVideo(null);
    } catch (error: any) {
      toast.error(error.message || 'Error adding comment');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      );
    }

    if (videos.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          <FilmIcon className="h-10 w-10" />
          <p className="text-lg text-muted-foreground">No vibez yet. Start creating!</p>
          <Button onClick={() => navigate('/studio')}>
            <Plus className="mr-2" />
            Create a Vibe
          </Button>
        </div>
      );
    }

    return (
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-scroll">
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            index={index}
            playingVideo={playingVideo}
            toggleVideoPlayback={toggleVideoPlayback}
            handleLikeVideo={handleLikeVideo}
            likedVideos={likedVideos}
            handleCommentClick={handleCommentClick}
            isFollowing={isFollowing}
            handleFollow={handleFollow}
            followLoading={followLoading}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      {commentingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-lg max-h-[70vh] md:max-h-[80vh] rounded-t-xl md:rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Comments</h3>
              <button onClick={handleCloseCommentSection} className="text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="mb-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={comment.user_avatar || getAvatarUrl()} />
                        <AvatarFallback>{comment.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <span className="font-semibold text-sm">{comment.username}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handlePostComment}
                  disabled={!newComment.trim()}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Vibezone: React.FC = () => {
  return (
    <Card className="h-[calc(100vh-64px)] rounded-none">
      <VibezoneContent />
    </Card>
  );
};

export default Vibezone;
