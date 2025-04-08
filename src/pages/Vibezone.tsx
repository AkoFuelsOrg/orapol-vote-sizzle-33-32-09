import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Share2, User, ChevronUp, ChevronDown, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { extractDominantColor } from '@/lib/image-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

interface VideoComment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const { fetchVideos, loading } = useVibezone();
  const navigate = useNavigate();
  const { user, profile } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [dominantColors, setDominantColors] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const prevVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsInitialLoading(true);
        const fetchedVideos = await fetchVideos();
        
        if (fetchedVideos) {
          const videoArray = Array.isArray(fetchedVideos) ? fetchedVideos : [];
          setVideos(videoArray);
          
          videoArray.forEach(async (video) => {
            if (video.thumbnail_url) {
              try {
                const color = await extractDominantColor(video.thumbnail_url);
                setDominantColors(prev => ({
                  ...prev,
                  [video.id]: color
                }));
              } catch (error) {
                console.error('Error extracting color:', error);
              }
            }
          });
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error("Error loading videos:", error);
        toast.error("Failed to load videos");
        setVideos([]);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadVideos();
    
    const videosChannel = supabase
      .channel('vibezone_videos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'videos'
        }, 
        () => {
          loadVideos();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(videosChannel);
    };
  }, [fetchVideos]);
  
  useEffect(() => {
    const loadComments = async () => {
      if (!videos[currentVideoIndex]) return;
      
      try {
        setIsLoadingComments(true);
        setShowComments(false);
        
        const { data: commentsData, error: commentsError } = await supabase
          .from('video_comments')
          .select(`
            id,
            content,
            created_at,
            user_id
          `)
          .eq('video_id', videos[currentVideoIndex].id)
          .order('created_at', { ascending: false });
        
        if (commentsError) throw commentsError;
        
        if (!commentsData || commentsData.length === 0) {
          setComments([]);
          setIsLoadingComments(false);
          return;
        }
        
        const userIds = commentsData.map(comment => comment.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        const userMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            userMap.set(profile.id, {
              id: profile.id,
              name: profile.username || 'Anonymous',
              avatar_url: profile.avatar_url
            });
          });
        }
        
        const formattedComments: VideoComment[] = commentsData.map(comment => {
          const userInfo = userMap.get(comment.user_id) || {
            id: comment.user_id,
            name: 'Anonymous',
            avatar_url: null
          };
          
          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user: userInfo
          };
        });
        
        setComments(formattedComments);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setIsLoadingComments(false);
      }
    };
    
    if (videos.length > 0 && currentVideoIndex >= 0) {
      loadComments();
    }
  }, [currentVideoIndex, videos]);
  
  useEffect(() => {
    if (videos.length === 0) return;
    
    if (currentVideoIndex < videos.length - 1 && nextVideoRef.current) {
      const nextVideo = videos[currentVideoIndex + 1];
      if (nextVideo && nextVideo.video_url) {
        nextVideoRef.current.src = nextVideo.video_url;
        nextVideoRef.current.preload = "auto";
        nextVideoRef.current.load();
      }
    }
    
    if (currentVideoIndex > 0 && prevVideoRef.current) {
      const prevVideo = videos[currentVideoIndex - 1];
      if (prevVideo && prevVideo.video_url) {
        prevVideoRef.current.src = prevVideo.video_url;
        prevVideoRef.current.preload = "auto";
        prevVideoRef.current.load();
      }
    }
  }, [currentVideoIndex, videos]);

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    } else {
      return `${views} views`;
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const navigateToNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setIsVideoLoading(true);
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const navigateToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setIsVideoLoading(true);
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const submitComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    
    if (!commentContent.trim()) {
      return;
    }
    
    if (!videos[currentVideoIndex]) return;
    
    try {
      setIsSubmittingComment(true);
      
      const { data: commentData, error: commentError } = await supabase
        .from('video_comments')
        .insert({
          video_id: videos[currentVideoIndex].id,
          user_id: user.id,
          content: commentContent.trim()
        })
        .select('id, content, created_at')
        .single();
      
      if (commentError) throw commentError;
      
      if (!commentData) {
        throw new Error('No data returned from comment insert');
      }
      
      const newComment: VideoComment = {
        id: commentData.id,
        content: commentData.content,
        created_at: commentData.created_at,
        user: {
          id: profile?.id || user.id,
          name: profile?.username || 'Anonymous',
          avatar_url: profile?.avatar_url
        }
      };
      
      setComments(prev => [newComment, ...prev]);
      setCommentContent("");
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const shouldShowSkeleton = isInitialLoading && videos.length === 0;
  
  const currentVideo = videos[currentVideoIndex];
  const dominantColor = currentVideo ? dominantColors[currentVideo.id] || "#000000" : "#000000";

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Vibezone</h1>
          <Sparkles className="h-5 w-5 text-primary/70 ml-2 animate-pulse-slow" />
        </div>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:shadow-md"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Upload
        </Button>
      </div>

      {shouldShowSkeleton ? (
        <div className="flex justify-center items-center h-screen">
          <div className="w-full max-w-md p-4">
            <Skeleton className="h-[80vh] w-full rounded-xl mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-full mr-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
          <div className="empty-state text-center p-6">
            <div className="empty-state-icon mb-4">
              <FilmIcon className="h-12 w-12 text-primary/70 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto mb-6">
              Be the first to upload a video to Vibezone and start sharing your creativity with others!
            </p>
            <Button 
              onClick={() => navigate('/vibezone/upload')}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative h-screen w-full overflow-hidden">
          {currentVideo && (
            <div className="relative h-full">
              <video 
                ref={nextVideoRef}
                className="hidden"
              />
              <video 
                ref={prevVideoRef}
                className="hidden"
              />
              
              <div 
                className="h-full w-full cursor-pointer"
                onClick={toggleVideoPlayback}
                style={{ backgroundColor: 'black' }}
              >
                {isVideoLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                )}
                
                {currentVideo.video_url ? (
                  <video
                    ref={videoRef}
                    src={currentVideo.video_url}
                    poster={currentVideo.thumbnail_url || undefined}
                    className="absolute inset-0 w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedData={handleVideoLoad}
                  />
                ) : currentVideo.thumbnail_url ? (
                  <div className="relative h-full">
                    <img 
                      src={currentVideo.thumbnail_url} 
                      alt={currentVideo.title || 'Video'} 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ filter: 'brightness(0.8)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FilmIcon className="h-16 w-16 text-white/50" />
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <FilmIcon className="h-20 w-20 text-gray-600" />
                  </div>
                )}
                
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 space-y-4">
                  <button 
                    className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToNextVideo();
                    }}
                    disabled={currentVideoIndex >= videos.length - 1}
                  >
                    <ChevronUp className="h-6 w-6" />
                  </button>
                  <button 
                    className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToPreviousVideo();
                    }}
                    disabled={currentVideoIndex <= 0}
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                  <h3 className="font-semibold text-lg text-white line-clamp-2 mb-2">
                    {currentVideo.title || 'Untitled Video'}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        {currentVideo.author?.avatar ? (
                          <AvatarImage 
                            src={currentVideo.author.avatar} 
                            alt={currentVideo.author.name || ''} 
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10">
                            <User className="h-5 w-5 text-primary/70" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm font-medium text-white">{currentVideo.author?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-300">
                          {formatViews(currentVideo.views || 0)} • {formatDistanceToNow(new Date(currentVideo.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button className="flex flex-col items-center">
                        <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs text-white mt-1">Like</span>
                      </button>
                      
                      <button 
                        className="flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComments();
                        }}
                      >
                        <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs text-white mt-1">Comment</span>
                      </button>
                      
                      <button className="flex flex-col items-center">
                        <div className="w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
                          <Share2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs text-white mt-1">Share</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {showComments && (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md h-2/3 rounded-t-3xl z-20 animate-slide-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-gray-800">
                    <div className="w-10 h-1 bg-gray-600 mx-auto rounded-full mb-4" />
                    <div className="flex justify-between items-center">
                      <h3 className="text-white text-lg font-bold">Comments</h3>
                      <button 
                        onClick={() => setShowComments(false)} 
                        className="p-1 rounded-full hover:bg-gray-800 transition-colors"
                        aria-label="Close comments"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 overflow-y-auto h-[calc(100%-180px)]">
                    {isLoadingComments ? (
                      <div className="flex justify-center my-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-gray-400 my-8">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map(comment => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              {comment.user.avatar_url ? (
                                <AvatarImage src={comment.user.avatar_url} alt={comment.user.name || 'User'} />
                              ) : (
                                <AvatarFallback className="bg-primary/10">
                                  <User className="h-4 w-4 text-primary/70" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center">
                                <p className="text-white text-sm font-medium">{comment.user.name || 'Anonymous'}</p>
                                <span className="text-gray-500 text-xs ml-2">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/95 border-t border-gray-800">
                    {user ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} alt={profile.username || 'User'} />
                          ) : (
                            <AvatarFallback className="bg-primary/10">
                              <User className="h-4 w-4 text-primary/70" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 relative">
                          <Textarea
                            placeholder="Add a comment..."
                            className="resize-none bg-gray-800 border-gray-700 text-white rounded-full min-h-0 py-2 pr-12"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                          />
                          <button
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary disabled:text-gray-500"
                            disabled={!commentContent.trim() || isSubmittingComment}
                            onClick={submitComment}
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="w-full py-2.5 bg-primary/10 text-primary rounded-full text-sm"
                        onClick={() => navigate('/auth')}
                      >
                        Sign in to comment
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="absolute top-16 left-0 right-0 flex justify-center">
                <div className="flex space-x-1">
                  {videos.map((_, index) => (
                    <div 
                      key={`indicator-${index}`}
                      className={`h-1 ${index === currentVideoIndex ? 'w-6 bg-white' : 'w-4 bg-white/40'} rounded-full`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vibezone;
