
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Share2, BookmarkIcon, Volume2, VolumeX, Music, X, ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSupabase } from '@/context/SupabaseContext';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import VideoCommentSection from '@/components/VideoCommentSection';
import { Link } from 'react-router-dom';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

const VIDEOS_PER_PAGE = 4;

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { fetchVideos, loading, hasLikedVideo, likeVideo, unlikeVideo } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollPositionRef = useRef(0);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [canMessageUsers, setCanMessageUsers] = useState<Record<string, boolean>>({});
  const [actionLoadingUsers, setActionLoadingUsers] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  
  // Function to load videos with pagination
  const loadVideos = useCallback(async (page: number = 1) => {
    try {
      if ((isLoadingMore && loadingMoreRef.current) || (!hasMore && page > 1)) {
        return;
      }
      
      if (page > 1) {
        setIsLoadingMore(true);
        loadingMoreRef.current = true;
      } else {
        setIsInitialLoading(true);
        isLoadingRef.current = true;
      }
      
      // Calculate offset based on page number
      const offset = (page - 1) * VIDEOS_PER_PAGE;
      
      // Get total count for pagination
      if (page === 1) {
        const { count } = await supabase
          .from('videos')
          .select('id', { count: 'exact', head: true });
        
        setTotalVideos(count || 0);
      }
      
      // Fetch videos with pagination
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + VIDEOS_PER_PAGE - 1);
      
      if (videosError) throw videosError;
      
      // Check if we've reached the end
      if (!videosData || videosData.length < VIDEOS_PER_PAGE) {
        setHasMore(false);
      }
      
      if (!videosData || videosData.length === 0) {
        if (page === 1) setVideos([]);
        return;
      }
      
      // Improve performance by doing all author queries in parallel
      const authorPromises = videosData.map(video => {
        if (!video.user_id) return Promise.resolve(null);
        
        return Promise.resolve(supabase
          .from('profiles')
          .select('*')
          .eq('id', video.user_id)
          .single())
          .then(({ data }) => data)
          .catch(() => null); // Explicitly handle promise catch here
      });
      
      const authorResults = await Promise.allSettled(authorPromises);
      
      const transformedVideos = videosData.map((video, index) => {
        const authorResult = authorResults[index];
        const userData = authorResult.status === 'fulfilled' ? authorResult.value : null;
        
        const authorInfo = userData ? {
          id: userData.id || '',
          name: userData.username || 'Unknown User',
          avatar: userData.avatar_url || '',
          username: userData.username || 'Unknown User',
          avatar_url: userData.avatar_url || ''
        } : { 
          id: '', 
          name: 'Unknown User', 
          avatar: '', 
          username: 'Unknown User', 
          avatar_url: '' 
        };
        
        return {
          ...video,
          author: authorInfo
        } as Video;
      });
      
      // Update liked status and comment counts for new videos
      if (user) {
        const likedPromises = transformedVideos.map(async video => {
          if (video.id) {
            try {
              const isLiked = await hasLikedVideo(video.id);
              return { videoId: video.id, isLiked };
            } catch (error) {
              return { videoId: video.id, isLiked: false };
            }
          }
          return null;
        });
        
        const likedResults = await Promise.allSettled(likedPromises);
        
        const newLikedStatus: Record<string, boolean> = { ...likedVideos };
        const newFollowingStatus: Record<string, boolean> = { ...followingStatus };
        const newCanMessage: Record<string, boolean> = { ...canMessageUsers };
        
        for (const result of likedResults) {
          if (result.status === 'fulfilled' && result.value) {
            const { videoId, isLiked } = result.value;
            if (videoId) {
              newLikedStatus[videoId] = isLiked;
            }
          }
        }
        
        // Get following status for all new video authors
        const authorIds = transformedVideos
          .map(video => video.author?.id)
          .filter(id => id && id !== user.id) as string[];
        
        if (authorIds.length > 0) {
          const uniqueAuthorIds = [...new Set(authorIds)];
          
          for (const authorId of uniqueAuthorIds) {
            const { data } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', user.id)
              .eq('following_id', authorId)
              .maybeSingle();
            
            newFollowingStatus[authorId] = !!data;
            
            const { data: canMessageData } = await supabase
              .rpc('can_message', { 
                user_id_1: user.id, 
                user_id_2: authorId 
              });
            
            newCanMessage[authorId] = !!canMessageData;
          }
        }
        
        setLikedVideos(newLikedStatus);
        setFollowingStatus(newFollowingStatus);
        setCanMessageUsers(newCanMessage);
      }
      
      // Get comment counts for new videos
      const commentCountPromises = transformedVideos.map(async video => {
        if (video.id) {
          try {
            const { count } = await supabase
              .from('video_comments')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', video.id);
            
            return { videoId: video.id, count: count || 0 };
          } catch (error) {
            return { videoId: video.id, count: 0 };
          }
        }
        return null;
      });
      
      const commentResults = await Promise.allSettled(commentCountPromises);
      
      const newCommentCounts: Record<string, number> = { ...commentCounts };
      
      for (const result of commentResults) {
        if (result.status === 'fulfilled' && result.value) {
          const { videoId, count } = result.value;
          if (videoId) {
            newCommentCounts[videoId] = count;
          }
        }
      }
      
      setCommentCounts(newCommentCounts);
      
      // Update videos state
      if (page === 1) {
        setVideos(transformedVideos);
      } else {
        setVideos(prev => [...prev, ...transformedVideos]);
      }
      
      setCurrentPage(page);
      
    } catch (error: any) {
      console.error("Error loading videos:", error);
      toast.error("Failed to load videos");
      if (page === 1) setVideos([]);
    } finally {
      if (page > 1) {
        setIsLoadingMore(false);
        loadingMoreRef.current = false;
      } else {
        setIsInitialLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [hasLikedVideo, user, likedVideos, followingStatus, canMessageUsers, commentCounts]);

  useEffect(() => {
    loadVideos(1);
    
    const videosChannel = supabase
      .channel('vibezone_videos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'videos'
        }, 
        (payload: { new: { video_id?: string } }) => {
          loadVideos(1);
        }
      )
      .subscribe();
      
    const commentsChannel = supabase
      .channel('vibezone_comments_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_comments'
        },
        async (payload: { new: { video_id?: string } }) => {
          if (payload.new && payload.new.video_id) {
            const videoId = payload.new.video_id;
            const { count } = await supabase
              .from('video_comments')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', videoId);
            
            setCommentCounts(prev => ({
              ...prev,
              [videoId]: count || 0
            }));
          }
        }
      )
      .subscribe();
      
    const followsChannel = supabase
      .channel('vibezone_follows_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows'
        },
        async () => {
          if (user) {
            loadVideos(1);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(followsChannel);
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadVideos, user]);

  // Load more videos when user is at the third video of the current page
  useEffect(() => {
    const loadMoreThreshold = 3; // Load more after reaching the 3rd video
    
    if (currentVideoIndex >= 0 && 
        videos.length > 0 && 
        currentVideoIndex % VIDEOS_PER_PAGE >= loadMoreThreshold && 
        hasMore && 
        !isLoadingMore && 
        !loadingMoreRef.current) {
      const nextPage = Math.floor(currentVideoIndex / VIDEOS_PER_PAGE) + 2;
      loadVideos(nextPage);
    }
  }, [currentVideoIndex, videos.length, hasMore, isLoadingMore, loadVideos]);

  // Setup video observation logic
  useEffect(() => {
    if (isLoadingRef.current || videos.length === 0) {
      return;
    }

    videoRefs.current = videoRefs.current.slice(0, videos.length);
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        const index = parseInt(video.dataset.index || '0');
        
        if (entry.isIntersecting && !showComments) {
          setCurrentVideoIndex(index);
          
          videoRefs.current.forEach((ref, i) => {
            if (ref) {
              if (i === index) {
                if (ref.paused) {
                  ref.play().catch(err => console.error("Error playing video:", err));
                }
              } else {
                ref.pause();
                ref.currentTime = 0;
              }
            }
          });
        }
      });
    }, { 
      threshold: 0.7,
      rootMargin: "-10%"
    });

    videoRefs.current.forEach((video, index) => {
      if (video) {
        video.dataset.index = index.toString();
        observerRef.current!.observe(video);
      }
    });
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos, showComments]);

  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return `${views}`;
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null, index: number) => {
    if (element) {
      videoRefs.current[index] = element;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const handleLikeVideo = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }
    
    if (!video.id) return;
    
    try {
      const isLiked = likedVideos[video.id] || false;
      
      setLikedVideos(prev => ({
        ...prev,
        [video.id]: !isLiked
      }));
      
      if (isLiked) {
        await unlikeVideo(video.id);
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, likes: Math.max((v.likes || 1) - 1, 0) } : v
        ));
      } else {
        await likeVideo(video.id);
        setVideos(prev => prev.map(v => 
          v.id === video.id ? { ...v, likes: (v.likes || 0) + 1 } : v
        ));
      }
    } catch (error) {
      console.error('Error handling like:', error);
      if (video.id) {
        setLikedVideos(prev => ({
          ...prev,
          [video.id]: !likedVideos[video.id]
        }));
      }
      toast.error('Failed to update like status');
    }
  };

  const handleShareVideo = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    const videoUrl = `${window.location.origin}/vibezone/watch/${video.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title || 'Check out this video',
        url: videoUrl,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(videoUrl)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(err => console.error('Could not copy link:', err));
    }
  };

  const handleShowComments = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    scrollPositionRef.current = window.scrollY;
    setActiveVideoId(videoId);
    setShowComments(true);
    
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
      }
    });
    
    document.body.style.overflow = 'hidden';
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setActiveVideoId(null);
    
    setTimeout(() => {
      window.scrollTo(0, scrollPositionRef.current);
      
      if (videoRefs.current[currentVideoIndex]) {
        videoRefs.current[currentVideoIndex].play().catch(err => console.error("Error playing video:", err));
      }
    }, 0);
    
    document.body.style.overflow = 'auto';
  };

  const updateCommentCount = (videoId: string, count: number) => {
    setCommentCounts(prev => ({
      ...prev,
      [videoId]: count
    }));
  };

  const handleFollowUser = async (e: React.MouseEvent, authorId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to follow users");
      return;
    }
    
    if (user.id === authorId) {
      toast.info("You cannot follow yourself");
      return;
    }
    
    setActionLoadingUsers(prev => ({ ...prev, [authorId]: true }));
    
    try {
      const isFollowing = followingStatus[authorId];
      
      setFollowingStatus(prev => ({ ...prev, [authorId]: !isFollowing }));
      
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', authorId);
          
        toast.success("Unfollowed successfully");
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: authorId });
          
        toast.success("Followed successfully");
        
        const { data: canMessageData } = await supabase
          .rpc('can_message', { user_id_1: user.id, user_id_2: authorId });
        
        setCanMessageUsers(prev => ({ ...prev, [authorId]: !!canMessageData }));
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error("Failed to update follow status");
      
      setFollowingStatus(prev => ({ ...prev, [authorId]: !followingStatus[authorId] }));
    } finally {
      setActionLoadingUsers(prev => ({ ...prev, [authorId]: false }));
    }
  };

  const shouldShowSkeleton = isInitialLoading && videos.length === 0;

  return (
    <div className="bg-black min-h-screen">
      <div className="fixed top-16 sm:top-4 left-0 w-full z-30 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white flex items-center">
            Vibezone
            <Sparkles className="h-4 w-4 text-yellow-400 ml-1 animate-pulse-slow" />
          </h1>
        </div>
        <Button 
          onClick={() => navigate('/vibezone/upload')}
          variant="ghost"
          className="rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 p-2"
          size="icon"
        >
          <Plus className="h-5 w-5 text-white" />
        </Button>
      </div>

      {shouldShowSkeleton ? (
        <div className="pt-20 pb-16 px-2 flex flex-col items-center gap-4">
          {[...Array(2)].map((_, index) => (
            <div key={`skeleton-${index}`} className="relative w-full max-w-md aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden">
              <Skeleton className="w-full h-full" />
              <div className="absolute bottom-0 left-0 w-full p-4">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="ml-2 space-y-2 flex-1">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
              <div className="absolute right-2 bottom-20 flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="pt-20 pb-16 px-4 flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="bg-gray-800/50 p-8 rounded-xl">
            <FilmIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-md mx-auto mb-6">
              Be the first to upload a video to Vibezone and start sharing your creativity with others!
            </p>
            <Button 
              onClick={() => navigate('/vibezone/upload')}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide">
          {videos.map((video, index) => (
            <div 
              key={`video-container-${video.id || index}`}
              className="snap-start h-[calc(100vh-4rem)] w-full flex items-center justify-center relative"
            >
              <div className="relative w-full h-full max-w-md mx-auto bg-black">
                <video 
                  ref={(el) => handleVideoRef(el, index)}
                  src={video.video_url}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  poster={video.thumbnail_url || undefined}
                  key={`video-element-${video.id || index}`}
                  data-index={index}
                />
                
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
                
                <div className="absolute bottom-4 left-0 p-4 w-full pr-20">
                  <h3 className="font-semibold text-white line-clamp-2 text-lg">
                    {video.title || 'Untitled Video'}
                  </h3>
                  <div className="flex items-center mt-2">
                    <Link to={video.author?.id ? `/user/${video.author.id}` : '#'} className="flex-shrink-0">
                      {video.author?.avatar ? (
                        <Avatar className="w-8 h-8 border-2 border-red-500">
                          <img 
                            src={video.author.avatar} 
                            alt={video.author.name || ''} 
                            className="object-cover"
                          />
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                          <FilmIcon className="h-4 w-4 text-red-500" />
                        </div>
                      )}
                    </Link>
                    <div className="ml-2 overflow-hidden">
                      <Link 
                        to={video.author?.id ? `/user/${video.author.id}` : '#'} 
                        className="text-sm font-medium text-white hover:underline"
                      >
                        @{video.author?.username || 'unknown'}
                      </Link>
                      <p className="text-xs text-gray-300">
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {user && video.author?.id && user.id !== video.author.id && (
                    <div className="flex space-x-2 mt-2">
                      <Button
                        onClick={(e) => handleFollowUser(e, video.author?.id || '')}
                        disabled={!!actionLoadingUsers[video.author?.id || '']}
                        variant={followingStatus[video.author?.id || ''] ? "secondary" : "default"}
                        size="sm"
                        className="h-8 text-xs"
                      >
                        {actionLoadingUsers[video.author?.id || ''] ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : followingStatus[video.author?.id || ''] ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            <span>Following</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1" />
                            <span>Follow</span>
                          </>
                        )}
                      </Button>
                      
                      {canMessageUsers[video.author?.id || ''] && (
                        <Button 
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Link to={`/messages/${video.author?.id}`}>
                            <MessageCircle className="h-3 w-3 mr-1" />
                            <span>Message</span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="absolute right-3 bottom-16 flex flex-col gap-6">
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => handleLikeVideo(e, video)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <Heart 
                        className={`h-6 w-6 ${video.id && likedVideos[video.id] ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                      />
                    </div>
                    <span className="text-white text-xs mt-1">
                      {formatViews(video.likes || 0)}
                    </span>
                  </button>
                  
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => video.id && handleShowComments(e, video.id)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      {video.id && formatViews(commentCounts[video.id] || 0)}
                    </span>
                  </button>
                  
                  <button 
                    className="flex flex-col items-center"
                    onClick={(e) => handleShareVideo(e, video)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      Share
                    </span>
                  </button>
                  
                  <button 
                    className="flex flex-col items-center" 
                    onClick={toggleMute}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      {isMuted ? (
                        <VolumeX className="h-6 w-6 text-white" />
                      ) : (
                        <Volume2 className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </button>
                </div>

                <div className="absolute bottom-28 left-4 flex items-center">
                  <Music className="h-4 w-4 text-white mr-2 animate-spin-slow" />
                  <div className="overflow-hidden max-w-[60%]">
                    <p className="text-xs text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      {video.title ? `Original audio - ${video.title}` : 'Original audio'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoadingMore && (
            <div className="h-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            </div>
          )}
          
          {!hasMore && videos.length > 0 && (
            <div className="h-20 flex items-center justify-center text-white text-sm">
              No more videos to load
            </div>
          )}
        </div>
      )}

      {showComments && activeVideoId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="bg-white dark:bg-gray-900 w-full md:w-[450px] h-full md:max-h-[80vh] md:max-w-[450px] md:rounded-xl overflow-hidden flex flex-col md:m-auto animate-fade-in">
            <div className="p-4 border-b flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-700 dark:text-gray-300"
                onClick={handleCloseComments}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h3 className="font-semibold text-lg flex-1 text-center">Comments</h3>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-700 dark:text-gray-300"
                onClick={handleCloseComments}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <VideoCommentSection 
                videoId={activeVideoId} 
                onCommentCountChange={(count) => updateCommentCount(activeVideoId, count)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vibezone;
