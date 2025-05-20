import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVibezone } from '@/context/VibezoneContext';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, FilmIcon, Plus, Sparkles, Heart, MessageCircle, Download, BookmarkIcon, Volume2, VolumeX, Music, X, ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
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
import { isBreakpoint } from '@/utils/breakpoint-utils';

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [nextVideoPreloaded, setNextVideoPreloaded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const { fetchVideos, loading, hasLikedVideo, likeVideo, unlikeVideo, downloadVideo } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpoint(breakpoint, "mobile");
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollPositionRef = useRef(0);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [canMessageUsers, setCanMessageUsers] = useState<Record<string, boolean>>({});
  const [actionLoadingUsers, setActionLoadingUsers] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isLoadingRef = useRef(true);
  const videosLoadedRef = useRef<Set<string>>(new Set());
  const videoPlayingStateRef = useRef<Record<string, boolean>>({});
  const loadedMetadataRef = useRef<Set<string>>(new Set());
  const initialRenderCompleteRef = useRef(false);
  const videoElementsRef = useRef<Record<string, HTMLVideoElement>>({});
  const videoDataRef = useRef<Record<string, Video>>({});
  const isMounted = useRef(true);
  const videosRef = useRef<Video[]>([]);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const preloadingRef = useRef<Record<string, boolean>>({});

  // Keep track of videos array in ref for use in callbacks
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      // Clean up video elements to prevent memory leaks
      Object.values(videoElementsRef.current).forEach(video => {
        video.pause();
        video.src = '';
        video.load();
      });
    };
  }, []);

  // Function to preload the next video
  const preloadNextVideo = useCallback((currentIndex: number) => {
    if (currentIndex >= videos.length - 1 || !videos[currentIndex + 1]?.id) return;
    
    const nextVideoId = videos[currentIndex + 1].id;
    if (preloadingRef.current[nextVideoId]) return;
    
    // Mark this video as being preloaded
    preloadingRef.current[nextVideoId] = true;
    
    console.log(`Preloading next video: ${nextVideoId}`);
    
    // Get the video element for the next video
    const nextVideoElement = videoRefs.current[currentIndex + 1];
    if (nextVideoElement) {
      // Set preload attribute to auto to start loading the video
      nextVideoElement.preload = "auto";
      
      // Create an event listener for when metadata is loaded
      const handleMetadataLoaded = () => {
        console.log(`Next video metadata loaded: ${nextVideoId}`);
        loadedMetadataRef.current.add(nextVideoId);
        setNextVideoPreloaded(true);
        nextVideoElement.removeEventListener('loadedmetadata', handleMetadataLoaded);
      };
      
      // Add event listener for metadata loaded
      if (!loadedMetadataRef.current.has(nextVideoId)) {
        nextVideoElement.addEventListener('loadedmetadata', handleMetadataLoaded);
      } else {
        setNextVideoPreloaded(true);
      }
    }
  }, [videos]);

  // Load initial videos and setup data
  const loadVideos = useCallback(async (page: number = 1, replace: boolean = false) => {
    try {
      if (!isMounted.current) return;
      
      if (page === 1) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      isLoadingRef.current = true;
      const response = await fetchVideos(10, page);
      console.log(`Fetched videos for page ${page}:`, response?.data?.length || 0);
      
      if (!isMounted.current) return;
      
      if (response && response.data && response.data.length > 0) {
        // Store video data in ref for quick access
        response.data.forEach(video => {
          if (video.id) {
            videoDataRef.current[video.id] = video;
          }
        });
        
        setVideos(prevVideos => {
          if (replace) {
            return [...response.data];
          } else {
            // Filter out duplicates based on video ID
            const existingIds = new Set(prevVideos.map(v => v.id));
            const newVideos = response.data.filter(v => !existingIds.has(v.id));
            return [...prevVideos, ...newVideos];
          }
        });
        
        setHasMoreVideos(response.hasMore);
        
        if (user && isMounted.current) {
          const newVideos = replace ? response.data : response.data.filter(v => 
            !videos.some(existingVideo => existingVideo.id === v.id)
          );
          
          if (newVideos.length === 0) return;
          
          // Get liked status for new videos
          const likedStatus: Record<string, boolean> = {};
          const following: Record<string, boolean> = {};
          const canMessage: Record<string, boolean> = {};
          
          const likePromises = newVideos.map(async video => {
            if (video.id) {
              const isLiked = await hasLikedVideo(video.id);
              return { id: video.id, isLiked };
            }
            return null;
          });
          
          const likeResults = await Promise.all(likePromises);
          if (isMounted.current) {
            likeResults.forEach(result => {
              if (result) {
                likedStatus[result.id] = result.isLiked;
              }
            });
            
            setLikedVideos(prev => ({
              ...prev,
              ...likedStatus
            }));
          }
          
          // Get following status for video authors
          const followPromises = newVideos.map(async video => {
            if (video.author?.id && user.id !== video.author.id) {
              const { data } = await supabase
                .from('follows')
                .select('id')
                .eq('follower_id', user.id)
                .eq('following_id', video.author.id)
                .maybeSingle();
              
              return { authorId: video.author.id, isFollowing: !!data };
            }
            return null;
          });
          
          const followResults = await Promise.all(followPromises);
          if (isMounted.current) {
            followResults.forEach(result => {
              if (result) {
                following[result.authorId] = result.isFollowing;
              }
            });
            
            setFollowingStatus(prev => ({
              ...prev,
              ...following
            }));
          }
          
          // Get messaging permissions
          const messagePromises = newVideos.map(async video => {
            if (video.author?.id && user.id !== video.author.id) {
              const { data } = await supabase
                .rpc('can_message', { 
                  user_id_1: user.id, 
                  user_id_2: video.author.id 
                });
              
              return { authorId: video.author.id, canMessage: !!data };
            }
            return null;
          });
          
          const messageResults = await Promise.all(messagePromises);
          if (isMounted.current) {
            messageResults.forEach(result => {
              if (result) {
                canMessage[result.authorId] = result.canMessage;
              }
            });
            
            setCanMessageUsers(prev => ({
              ...prev,
              ...canMessage
            }));
          }
        }
        
        // Get comment counts for videos
        const commentPromises = response.data.map(async video => {
          if (video.id) {
            const { count } = await supabase
              .from('video_comments')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', video.id);
            
            return { id: video.id, count: count || 0 };
          }
          return null;
        });
        
        const commentResults = await Promise.all(commentPromises);
        if (isMounted.current) {
          const commentCountsData: Record<string, number> = {};
          commentResults.forEach(result => {
            if (result) {
              commentCountsData[result.id] = result.count;
            }
          });
          
          setCommentCounts(prev => ({
            ...prev,
            ...commentCountsData
          }));
        }
      } else if (isMounted.current) {
        console.log("No videos returned or empty array");
        setHasMoreVideos(false);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
      if (isMounted.current) {
        toast.error("Failed to load videos");
        setHasMoreVideos(false);
      }
    } finally {
      if (isMounted.current) {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
        initialRenderCompleteRef.current = true;
      }
    }
  }, [fetchVideos, user, hasLikedVideo, videos]);

  // Initial load and subscription to changes
  useEffect(() => {
    loadVideos(1, true);
    
    // Set up realtime subscriptions
    const videosChannel = supabase
      .channel('vibezone_videos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'videos'
        }, 
        () => {
          if (isMounted.current) {
            loadVideos(1, true);
          }
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
          if (payload.new && payload.new.video_id && isMounted.current) {
            const videoId = payload.new.video_id;
            const { count } = await supabase
              .from('video_comments')
              .select('id', { count: 'exact', head: true })
              .eq('video_id', videoId);
            
            if (isMounted.current) {
              setCommentCounts(prev => ({
                ...prev,
                [videoId]: count || 0
              }));
            }
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
          if (user && isMounted.current) {
            const following: Record<string, boolean> = {};
            
            for (const video of videosRef.current) {
              if (video.author?.id && user.id !== video.author.id) {
                const { data } = await supabase
                  .from('follows')
                  .select('id')
                  .eq('follower_id', user.id)
                  .eq('following_id', video.author.id)
                  .maybeSingle();
                
                following[video.author.id] = !!data;
              }
            }
            
            if (isMounted.current) {
              setFollowingStatus(following);
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(followsChannel);
    };
  }, [loadVideos, user]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || isLoadingMore || !hasMoreVideos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMoreVideos) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 } // Lower threshold for earlier loading
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => {
      if (loadMoreTriggerRef.current) {
        observer.unobserve(loadMoreTriggerRef.current);
      }
    };
  }, [isLoadingMore, hasMoreVideos]);

  // Load more videos when currentPage changes
  useEffect(() => {
    if (currentPage > 1) {
      loadVideos(currentPage);
    }
  }, [currentPage, loadVideos]);

  // Optimized video playing and observer setup
  const setupVideoObservers = useCallback(() => {
    if (isLoadingRef.current || videos.length === 0 || showComments) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        const videoId = video.dataset.videoId;
        
        if (!videoId) return;
        
        const index = videos.findIndex(v => v.id === videoId);
        if (index === -1) return;
        
        if (entry.isIntersecting) {
          console.log(`Video ${videoId} is intersecting, index: ${index}`);
          
          // Set current video index and trigger preloading for next video
          if (currentVideoIndex !== index) {
            setCurrentVideoIndex(index);
            preloadNextVideo(index);
          }
          
          // Pause all other videos first
          Object.entries(videoElementsRef.current).forEach(([id, videoEl]) => {
            if (id !== videoId && !videoEl.paused) {
              console.log(`Pausing video ${id}`);
              videoEl.pause();
              videoPlayingStateRef.current[id] = false;
            }
          });
          
          if (!showComments && video && loadedMetadataRef.current.has(videoId)) {
            console.log(`Attempting to play video ${videoId}`);
            if (video.paused) {
              video.muted = isMuted;
              videoPlayingStateRef.current[videoId] = true;
              
              // Ensure the video is ready to play
              if (video.readyState >= 2) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch((err) => {
                    console.error(`Error playing video ${videoId}:`, err);
                    // Try with muted as fallback
                    video.muted = true;
                    video.play().catch(err => {
                      console.error(`Still couldn't play video ${videoId}:`, err);
                      videoPlayingStateRef.current[videoId] = false;
                    });
                  });
                }
              } else {
                // If video is not ready, set up event listener
                const handleCanPlay = () => {
                  console.log(`Video ${videoId} can play now`);
                  const playPromise = video.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(() => {
                      video.muted = true;
                      video.play().catch(err => {
                        console.error(`Error playing video on canplay event:`, err);
                      });
                    });
                  }
                  video.removeEventListener('canplay', handleCanPlay);
                };
                
                video.addEventListener('canplay', handleCanPlay);
              }
            }
          }
        } else if (videoPlayingStateRef.current[videoId]) {
          console.log(`Video ${videoId} is no longer intersecting, pausing`);
          video.pause();
          videoPlayingStateRef.current[videoId] = false;
        }
      });
    }, { 
      threshold: 0.7, // Increased threshold for more precise intersection detection
      rootMargin: "-10% 0px" // Adjusted rootMargin for better visibility requirement
    });

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      videoRefs.current.forEach((video) => {
        if (video && video.dataset.videoId) {
          observerRef.current!.observe(video);
        }
      });
    }, 50);
    
  }, [videos, showComments, isMuted, currentVideoIndex, preloadNextVideo]);

  useEffect(() => {
    console.log("Setting up video observers");
    setupVideoObservers();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupVideoObservers]);

  // Update all video elements when mute state changes
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  // Handle video metadata loading
  const handleVideoMetadataLoaded = (video: HTMLVideoElement, videoId: string, index: number) => {
    if (!video || !videoId || !isMounted.current) return;
    
    console.log(`Video ${videoId} metadata loaded, index: ${index}`);
    videoElementsRef.current[videoId] = video;
    
    videosLoadedRef.current.add(videoId);
    loadedMetadataRef.current.add(videoId);
    
    // If this is the current video, play it immediately
    if (index === currentVideoIndex && !showComments) {
      videoPlayingStateRef.current[videoId] = true;
      video.muted = isMuted;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error(`Error playing video ${videoId} on metadata load:`, err);
          video.muted = true;
          video.play().catch(err => {
            console.error("Still couldn't play video on metadata load:", err);
            videoPlayingStateRef.current[videoId] = false;
          });
        });
      }
      
      // Preload next video after current one starts playing
      preloadNextVideo(index);
    }
  };

  // Create refs for video elements
  const handleVideoRef = (element: HTMLVideoElement | null, index: number) => {
    if (!element || !videos[index]?.id || !isMounted.current) return;
    
    const videoId = videos[index].id;
    videoRefs.current[index] = element;
    
    console.log(`Video ref set for index ${index}, id: ${videoId}`);
    element.dataset.videoId = videoId;
    
    videoElementsRef.current[videoId] = element;
    
    // Add priority loading for first few videos
    if (index < 3) {
      element.preload = "auto";
    }
    
    if (!loadedMetadataRef.current.has(videoId)) {
      const handleMetadata = () => {
        handleVideoMetadataLoaded(element, videoId, index);
        element.removeEventListener('loadedmetadata', handleMetadata);
      };
      
      element.addEventListener('loadedmetadata', handleMetadata);
      
      if (element.readyState >= 2) {
        handleMetadata();
      }
    } else if (index === currentVideoIndex && !showComments) {
      if (element.paused && !videoPlayingStateRef.current[videoId]) {
        videoPlayingStateRef.current[videoId] = true;
        element.muted = isMuted;
        
        console.log(`Playing video ${videoId} on ref assignment`);
        const playPromise = element.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error(`Error playing video ${videoId} on ref assignment:`, err);
            element.muted = true;
            element.play().catch(err => {
              console.error(`Still couldn't play video ${videoId}:`, err);
              videoPlayingStateRef.current[videoId] = false;
            });
          });
        }
      }
    }
  };

  // Utility functions for UI display
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return `${views}`;
    }
  };

  // UI interaction handlers
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

  const handleDownloadVideo = (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    
    if (!video.video_url || !video.title) {
      toast.error("Video information is incomplete");
      return;
    }
    
    downloadVideo(video.video_url, video.title);
  };

  const handleShowComments = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    scrollPositionRef.current = window.scrollY;
    setActiveVideoId(videoId);
    setShowComments(true);
    
    Object.values(videoElementsRef.current).forEach(video => {
      if (video) {
        const videoId = video.dataset.videoId;
        if (videoId) {
          videoPlayingStateRef.current[videoId] = false;
        }
        video.pause();
      }
    });
    
    document.body.style.overflow = 'hidden';
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setActiveVideoId(null);
    
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      
      if (videoRefs.current[currentVideoIndex] && videos[currentVideoIndex]?.id) {
        const videoId = videos[currentVideoIndex].id;
        const video = videoRefs.current[currentVideoIndex];
        
        if (video) {
          videoPlayingStateRef.current[videoId] = true;
          video.muted = isMuted;
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              video.muted = true;
              video.play().catch(err => {
                console.error("Error playing video after closing comments:", err);
                videoPlayingStateRef.current[videoId] = false;
              });
            });
          }
        }
      }
    });
    
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
    <div className="bg-black min-h-screen w-full">
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
        <div className="pt-20 pb-16 flex flex-col items-center gap-4">
          {[...Array(2)].map((_, index) => (
            <div key={`skeleton-${index}`} className="relative w-full aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden">
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
        <div className="pt-20 pb-16 flex flex-col items-center justify-center min-h-[80vh] text-center">
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
        <div className="snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide will-change-transform">
          {videos.map((video, index) => (
            <div 
              key={video.id || `video-${index}`}
              className="snap-start h-[calc(100vh-4rem)] w-full flex items-center justify-center relative will-change-transform"
              data-index={index}
            >
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={(el) => handleVideoRef(el, index)}
                  src={video.video_url}
                  className="w-full h-full object-contain bg-black"
                  loop
                  playsInline
                  muted={isMuted}
                  preload="metadata"
                  poster={video.thumbnail_url || undefined}
                  data-video-id={video.id}
                  key={`video-element-${video.id || index}`}
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
                    <div className="flex space-x-2 mt-2" style={{ display: 'none' }}>
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
                    style={{ display: 'none' }}
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
                    onClick={(e) => handleDownloadVideo(e, video)}
                  >
                    <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs mt-1">
                      Download
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

                {/* Loading indicator for next video preloading */}
                {index === currentVideoIndex + 1 && !loadedMetadataRef.current.has(video.id) && (
                  <div className="absolute bottom-4 right-4 animate-pulse">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                  </div>
                )}

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
          
          {/* Load more trigger element */}
          {hasMoreVideos && !isInitialLoading && (
            <div 
              ref={loadMoreTriggerRef} 
              className="h-20 flex items-center justify-center"
            >
              {isLoadingMore ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              ) : (
                <div className="h-1 w-1 opacity-0">Loading more</div>
              )}
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
