
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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

const Vibezone: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { fetchVideos, loading, hasLikedVideo, likeVideo, unlikeVideo, downloadVideo } = useVibezone();
  const navigate = useNavigate();
  const { user } = useSupabase();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  
  // Stable references for video elements
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const scrollPositionRef = useRef(0);
  
  // State stored in refs to avoid triggering re-renders
  const likedVideosRef = useRef<Record<string, boolean>>({});
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const commentCountsRef = useRef<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const followingStatusRef = useRef<Record<string, boolean>>({});
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const canMessageUsersRef = useRef<Record<string, boolean>>({});
  const [canMessageUsers, setCanMessageUsers] = useState<Record<string, boolean>>({});
  const [actionLoadingUsers, setActionLoadingUsers] = useState<Record<string, boolean>>({});
  
  // Refs for stable interaction with video elements
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

  // Track videos in a ref to avoid missing dependency warnings
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Cleanup when unmounting
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      Object.values(videoElementsRef.current).forEach(video => {
        video.pause();
        video.src = '';
        video.load();
      });
    };
  }, []);

  // Update state refs when state changes to avoid unnecessary re-renders
  useEffect(() => {
    likedVideosRef.current = likedVideos;
  }, [likedVideos]);

  useEffect(() => {
    commentCountsRef.current = commentCounts;
  }, [commentCounts]);

  useEffect(() => {
    followingStatusRef.current = followingStatus;
  }, [followingStatus]);

  useEffect(() => {
    canMessageUsersRef.current = canMessageUsers;
  }, [canMessageUsers]);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        if (!isMounted.current) return;
        
        setIsInitialLoading(true);
        isLoadingRef.current = true;
        const fetchedVideos = await fetchVideos();
        console.log("Fetched videos:", fetchedVideos?.length || 0);
        
        if (!isMounted.current) return;
        
        if (fetchedVideos && fetchedVideos.length > 0) {
          // Cache video data in ref to avoid triggering re-renders
          fetchedVideos.forEach(video => {
            if (video.id) {
              videoDataRef.current[video.id] = video;
            }
          });
          
          setVideos(prevVideos => {
            // Only update state if videos actually changed
            if (!prevVideos.length && fetchedVideos.length > 0) {
              return [...fetchedVideos];
            }
            if (prevVideos.length !== fetchedVideos.length) {
              return [...fetchedVideos]; 
            }
            
            const hasChanges = fetchedVideos.some((video, index) => {
              return !prevVideos[index] || prevVideos[index].id !== video.id;
            });
            
            return hasChanges ? [...fetchedVideos] : prevVideos;
          });
          
          if (user && isMounted.current) {
            // Batch state updates to minimize re-renders
            const likedStatus: Record<string, boolean> = {...likedVideosRef.current};
            const following: Record<string, boolean> = {...followingStatusRef.current};
            const canMessage: Record<string, boolean> = {...canMessageUsersRef.current};
            
            // Fetch like status for all videos in parallel
            const likePromises = fetchedVideos.map(async video => {
              if (video.id) {
                const isLiked = await hasLikedVideo(video.id);
                return { id: video.id, isLiked };
              }
              return null;
            });
            
            const likeResults = await Promise.all(likePromises);
            if (isMounted.current) {
              let hasChanges = false;
              likeResults.forEach(result => {
                if (result) {
                  if (likedStatus[result.id] !== result.isLiked) {
                    likedStatus[result.id] = result.isLiked;
                    hasChanges = true;
                  }
                }
              });
              
              if (hasChanges) {
                setLikedVideos(likedStatus);
              }
            }
            
            // Fetch following status for all authors in parallel
            const followPromises = fetchedVideos.map(async video => {
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
              let hasFollowChanges = false;
              followResults.forEach(result => {
                if (result && following[result.authorId] !== result.isFollowing) {
                  following[result.authorId] = result.isFollowing;
                  hasFollowChanges = true;
                }
              });
              
              if (hasFollowChanges) {
                setFollowingStatus(following);
              }
            }
            
            // Check which users can be messaged
            const messagePromises = fetchedVideos.map(async video => {
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
              let hasMessageChanges = false;
              messageResults.forEach(result => {
                if (result && canMessage[result.authorId] !== result.canMessage) {
                  canMessage[result.authorId] = result.canMessage;
                  hasMessageChanges = true;
                }
              });
              
              if (hasMessageChanges) {
                setCanMessageUsers(canMessage);
              }
            }
          }
          
          // Get comment counts for all videos in parallel
          const commentPromises = fetchedVideos.map(async video => {
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
            const commentCountsData = {...commentCountsRef.current};
            let hasCountChanges = false;
            
            commentResults.forEach(result => {
              if (result && commentCountsData[result.id] !== result.count) {
                commentCountsData[result.id] = result.count;
                hasCountChanges = true;
              }
            });
            
            if (hasCountChanges) {
              setCommentCounts(commentCountsData);
            }
          }
        } else if (isMounted.current) {
          console.log("No videos returned or empty array");
        }
      } catch (error) {
        console.error("Error loading videos:", error);
        if (isMounted.current) {
          toast.error("Failed to load videos");
        }
      } finally {
        if (isMounted.current) {
          setIsInitialLoading(false);
          isLoadingRef.current = false;
          initialRenderCompleteRef.current = true;
        }
      }
    };
    
    loadVideos();
    
    // Setup real-time subscriptions
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
            loadVideos();
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
            const following: Record<string, boolean> = {...followingStatusRef.current};
            let hasChanges = false;
            
            for (const video of videosRef.current) {
              if (video.author?.id && user.id !== video.author.id) {
                const { data } = await supabase
                  .from('follows')
                  .select('id')
                  .eq('follower_id', user.id)
                  .eq('following_id', video.author.id)
                  .maybeSingle();
                
                const isFollowing = !!data;
                if (following[video.author.id] !== isFollowing) {
                  following[video.author.id] = isFollowing;
                  hasChanges = true;
                }
              }
            }
            
            if (isMounted.current && hasChanges) {
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
  }, [fetchVideos, user, hasLikedVideo]);

  // Improved video observer setup with stability fixes
  const setupVideoObservers = useCallback(() => {
    if (isLoadingRef.current || videos.length === 0 || showComments) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target as HTMLVideoElement;
        const videoId = element.dataset.videoId;
        
        if (!videoId) return;
        
        const index = videos.findIndex(v => v.id === videoId);
        if (index === -1) return;
        
        if (entry.isIntersecting) {
          console.log(`Video ${videoId} is intersecting, index: ${index}`);
          setCurrentVideoIndex(index);
          
          // Pause all other videos first
          Object.entries(videoElementsRef.current).forEach(([id, videoEl]) => {
            if (id !== videoId && !videoEl.paused) {
              console.log(`Pausing video ${id}`);
              videoEl.pause();
              videoPlayingStateRef.current[id] = false;
            }
          });
          
          if (!showComments && element && loadedMetadataRef.current.has(videoId)) {
            console.log(`Attempting to play video ${videoId}`);
            if (element.paused) {
              element.muted = isMuted;
              videoPlayingStateRef.current[videoId] = true;
              
              // Wait to ensure any pending state updates complete
              setTimeout(() => {
                // Ensure the video is ready to play
                if (element.readyState >= 2) {
                  const playPromise = element.play();
                  if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                      console.error(`Error playing video ${videoId}:`, err);
                      // Try with muted as fallback
                      element.muted = true;
                      element.play().catch(err => {
                        console.error(`Still couldn't play video ${videoId}:`, err);
                        videoPlayingStateRef.current[videoId] = false;
                      });
                    });
                  }
                } else {
                  // If video is not ready, set up event listener
                  const handleCanPlay = () => {
                    console.log(`Video ${videoId} can play now`);
                    const playPromise = element.play();
                    if (playPromise !== undefined) {
                      playPromise.catch(() => {
                        element.muted = true;
                        element.play().catch(err => {
                          console.error(`Error playing video on canplay event:`, err);
                        });
                      });
                    }
                    element.removeEventListener('canplay', handleCanPlay);
                  };
                  
                  element.addEventListener('canplay', handleCanPlay);
                }
              }, 0);
            }
          }
        } else if (videoPlayingStateRef.current[videoId]) {
          console.log(`Video ${videoId} is no longer intersecting, pausing`);
          element.pause();
          videoPlayingStateRef.current[videoId] = false;
        }
      });
    }, { 
      threshold: 0.6,
      rootMargin: "-5%"
    });

    // Delay observer setup to ensure DOM has stabilized
    setTimeout(() => {
      if (!isMounted.current) return;
      
      videoRefs.current.forEach((videoEl) => {
        if (videoEl && videoEl.dataset.videoId) {
          observerRef.current!.observe(videoEl);
        }
      });
    }, 100);
    
  }, [videos, showComments, isMuted]);

  useEffect(() => {
    console.log("Setting up video observers");
    setupVideoObservers();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupVideoObservers]);

  // Apply mute setting to all videos
  useEffect(() => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = isMuted;
      }
    });
  }, [isMuted]);

  const handleVideoMetadataLoaded = (video: HTMLVideoElement, videoId: string, index: number) => {
    if (!video || !videoId || !isMounted.current) return;
    
    console.log(`Video ${videoId} metadata loaded, index: ${index}`);
    videoElementsRef.current[videoId] = video;
    
    videosLoadedRef.current.add(videoId);
    loadedMetadataRef.current.add(videoId);
    
    if (index === currentVideoIndex && !showComments) {
      videoPlayingStateRef.current[videoId] = true;
      video.muted = isMuted;
      
      // Add a small delay to ensure state has stabilized
      setTimeout(() => {
        if (!isMounted.current) return;
        
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
      }, 0);
    }
  };

  const handleVideoRef = (element: HTMLVideoElement | null, index: number) => {
    if (!element || !videos[index]?.id || !isMounted.current) return;
    
    const videoId = videos[index].id;
    videoRefs.current[index] = element;
    
    console.log(`Video ref set for index ${index}, id: ${videoId}`);
    element.dataset.videoId = videoId;
    
    videoElementsRef.current[videoId] = element;
    
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
        
        // Wait for React rendering to finish before playing
        setTimeout(() => {
          if (!isMounted.current) return;
          
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
        }, 0);
      }
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return `${views}`;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  // Stabilized like video handler
  const handleLikeVideo = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }
    
    if (!video.id) return;
    
    try {
      const isLiked = likedVideosRef.current[video.id] || false;
      
      // Optimistic UI update
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
        // Revert optimistic update on error
        setLikedVideos(prev => ({
          ...prev,
          [video.id]: !prev[video.id]
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
          
          setTimeout(() => {
            if (!isMounted.current) return;
            
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
          }, 0);
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

  // Stabilized follow handler to prevent flickering
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
    
    // Prevent multiple clicks while action is loading
    if (actionLoadingUsers[authorId]) {
      return;
    }
    
    setActionLoadingUsers(prev => ({ ...prev, [authorId]: true }));
    
    try {
      const isFollowing = followingStatusRef.current[authorId];
      
      // Optimistic UI update
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
      
      // Revert optimistic update on error
      setFollowingStatus(prev => ({ ...prev, [authorId]: !prev[authorId] }));
    } finally {
      // Add a short delay before removing loading state to prevent flicker
      setTimeout(() => {
        if (isMounted.current) {
          setActionLoadingUsers(prev => ({ ...prev, [authorId]: false }));
        }
      }, 300);
    }
  };

  // Memoize values to prevent unnecessary re-renders
  const shouldShowSkeleton = useMemo(() => 
    isInitialLoading && videos.length === 0, [isInitialLoading, videos.length]
  );
  
  // Render video-related buttons in a stable way
  const renderInteractionButtons = (video: Video) => {
    const isLiked = video.id ? likedVideosRef.current[video.id] || false : false;
    const commentCount = video.id ? commentCountsRef.current[video.id] || 0 : 0;
    
    return (
      <div className="absolute right-3 bottom-16 flex flex-col gap-6">
        <button 
          className="flex flex-col items-center"
          onClick={(e) => handleLikeVideo(e, video)}
        >
          <div className="bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/70 transition-colors">
            <Heart 
              className={`h-6 w-6 ${video.id && isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
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
            {formatViews(commentCount)}
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
    );
  };
  
  // Render author follow/message buttons in a stable way
  const renderAuthorButtons = (video: Video) => {
    if (!user || !video.author?.id || user.id === video.author.id) {
      return null;
    }
    
    const isFollowing = followingStatusRef.current[video.author.id] || false;
    const canMessage = canMessageUsersRef.current[video.author.id] || false;
    const isLoading = actionLoadingUsers[video.author.id] || false;
    
    return (
      <div className="flex space-x-2 mt-2">
        <Button
          onClick={(e) => handleFollowUser(e, video.author?.id || '')}
          disabled={isLoading}
          variant={isFollowing ? "secondary" : "default"}
          size="sm"
          className="h-8 text-xs"
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : isFollowing ? (
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
        
        {canMessage && (
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
    );
  };

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
        <div className="snap-y snap-mandatory h-[calc(100vh-4rem)] overflow-y-scroll scrollbar-hide will-change-transform">
          {videos.map((video, index) => (
            <div 
              key={video.id || `video-${index}`}
              className="snap-start h-[calc(100vh-4rem)] w-full flex items-center justify-center relative will-change-transform"
              data-index={index}
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
                  
                  {renderAuthorButtons(video)}
                </div>
                
                {renderInteractionButtons(video)}

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
