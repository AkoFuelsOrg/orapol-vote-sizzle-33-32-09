import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X, Maximize, Bookmark, Trash2, Edit } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card, CardContent, CardFooter } from './ui/card';
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';
import PostCommentSection from './PostCommentSection';
import { AspectRatio } from './ui/aspect-ratio';
import { getAvatarUrl } from '../lib/avatar-utils';
import { 
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger 
} from './ui/drawer';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import CreatePostModal from './CreatePostModal';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  onPostDeleted?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onPostUpdate, 
  onPostDeleted 
}) => {
  const { user } = useSupabase();
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [hasLiked, setHasLiked] = useState(post.userLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isPostOwner = user && post.author.id === user.id;
  
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
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setHasLiked(false);
        setLikeCount(prev => prev - 1);
      }
      
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error: any) {
      console.error('Error liking post:', error);
      toast.error(error.message || "Failed to like post");
    }
  };

  const updateCommentCount = (count: number) => {
    setCommentCount(count);
  };

  const toggleCommentForm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCommentForm(!showCommentForm);
  };

  const handleShare = async (e: React.MouseEvent, platform?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to share posts");
      return;
    }
    
    const postUrl = `${window.location.origin}/post/${post.id}`;
    let sharedSuccessfully = false;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(postUrl)
          .then(() => {
            toast.success("Link copied to clipboard");
            sharedSuccessfully = true;
          })
          .catch(() => toast.error("Failed to copy link"));
        if (isMobile) setIsShareOpen(false);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=Check out this post!`, '_blank', 'noopener,noreferrer');
        sharedSuccessfully = true;
        if (isMobile) setIsShareOpen(false);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank', 'noopener,noreferrer');
        sharedSuccessfully = true;
        if (isMobile) setIsShareOpen(false);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=Check out this post! ${encodeURIComponent(postUrl)}`, '_blank', 'noopener,noreferrer');
        sharedSuccessfully = true;
        if (isMobile) setIsShareOpen(false);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=Check out this post!`, '_blank', 'noopener,noreferrer');
        sharedSuccessfully = true;
        if (isMobile) setIsShareOpen(false);
        break;
      case 'email':
        window.location.href = `mailto:?subject=Check out this post!&body=${encodeURIComponent(postUrl)}`;
        sharedSuccessfully = true;
        if (isMobile) setIsShareOpen(false);
        break;
      default:
        setIsShareOpen(true);
    }
    
    if (sharedSuccessfully && user) {
      try {
        const { data: existingShare, error: checkError } = await supabase
          .from('post_shares')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking existing share:', checkError);
        }
          
        if (!existingShare) {
          const { error: insertError } = await supabase
            .from('post_shares')
            .insert({
              post_id: post.id,
              user_id: user.id,
              platform: platform || 'other'
            });
            
          if (insertError) {
            console.error('Error recording share:', insertError);
          } else {
            if (onPostUpdate) {
              onPostUpdate();
            }
          }
        }
      } catch (error) {
        console.error('Error recording share:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!user || !isPostOwner) {
      toast.error("You don't have permission to delete this post");
      return;
    }

    try {
      const { error: commentsError } = await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', post.id);

      if (commentsError) throw commentsError;

      const { error: likesError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id);

      if (likesError) throw likesError;

      const { error: sharesError } = await supabase
        .from('post_shares')
        .delete()
        .eq('post_id', post.id);

      if (sharesError) throw sharesError;

      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (postError) throw postError;

      toast.success("Post deleted successfully");
      
      // Call the onPostDeleted callback if provided
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
      
      if (onPostUpdate) {
        onPostUpdate();
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error(error.message || "Failed to delete post");
    }
  };

  const authorAvatarUrl = getAvatarUrl(post.author.avatar);

  const closeExpandedImage = () => {
    setIsImageExpanded(false);
  };

  const PostOptionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
            <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
            <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white">
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit size={16} className="text-blue-500" />
          <span>Edit Post</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 size={16} className="text-red-500" />
          <span>Delete Post</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ShareOptions = () => (
    <div className="grid grid-cols-2 gap-4 w-full px-1 py-3">
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-gray-50 transition-all border-gray-100 hover:border-primary/20" onClick={(e) => handleShare(e, 'copy')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span className="text-xs font-medium">Copy Link</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-blue-50 transition-all border-gray-100 hover:border-blue-200" onClick={(e) => handleShare(e, 'twitter')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
        </svg>
        <span className="text-xs font-medium">Twitter</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-blue-50 transition-all border-gray-100 hover:border-blue-200" onClick={(e) => handleShare(e, 'facebook')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
        <span className="text-xs font-medium">Facebook</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-green-50 transition-all border-gray-100 hover:border-green-200" onClick={(e) => handleShare(e, 'whatsapp')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <path d="M17.4 14.3a4 4 0 0 0-5.5-5.5l-6.8 6.8L2 22l6.8-2.9 6.8-6.8c.3.4.5.8.7 1.2A10 10 0 1 1 2 12a10 10 0 0 1 16.7-7.2c.3.4.6.8.7 1.3v8.2z"></path>
        </svg>
        <span className="text-xs font-medium">WhatsApp</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-blue-50 transition-all border-gray-100 hover:border-blue-200" onClick={(e) => handleShare(e, 'telegram')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
          <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
          <path d="M22 2 11 13"></path>
        </svg>
        <span className="text-xs font-medium">Telegram</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2 hover:bg-gray-50 transition-all border-gray-100 hover:border-gray-200" onClick={(e) => handleShare(e, 'email')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
        <span className="text-xs font-medium">Email</span>
      </Button>
    </div>
  );

  if (breakpoint === 'mobile') {
    return (
      <Card className="mb-4 overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 rounded-xl w-full bg-white">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <Link 
            to={`/user/${post.author.id}`}
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-70 transition-all duration-300"></div>
              <Avatar className="w-10 h-10 border-2 border-white shadow-sm group-hover:border-primary/20 transition-all">
                <AvatarImage 
                  src={authorAvatarUrl} 
                  alt={post.author.name} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 text-primary-foreground">
                  {post.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{post.author.name}</p>
              <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
            </div>
          </Link>
          {isPostOwner ? (
            <PostOptionsDropdown />
          ) : (
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
                <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
                <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="px-4 py-3">
          <p className="text-sm whitespace-pre-line break-words mb-2 leading-relaxed">{post.content}</p>
        </div>
        
        {post.image && (
          <div 
            className="relative w-full overflow-hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsImageExpanded(true);
            }}
          >
            <div className="bg-gray-50">
              <AspectRatio ratio={4/3}>
                <img 
                  src={post.image} 
                  alt="Post content" 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                />
              </AspectRatio>
            </div>
            
            {isImageExpanded && (
              <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-lg border-none shadow-2xl">
                  <DialogTitle className="sr-only">Post Image</DialogTitle>
                  <button 
                    onClick={closeExpandedImage}
                    className="absolute top-2 right-2 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 focus:outline-none"
                  >
                    <X size={24} />
                  </button>
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
        
        <div className="px-4 py-2.5 flex justify-between text-xs text-gray-500 border-t border-gray-100">
          <div className="flex items-center">
            {likeCount > 0 && (
              <div className="flex items-center">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-red-100 mr-1.5">
                  <Heart size={10} className="text-red-500" />
                </div>
                <span>{likeCount}</span>
              </div>
            )}
          </div>
          <div>{commentCount > 0 && `${commentCount} comments`}</div>
        </div>
        
        <div className="flex border-t border-gray-200">
          <button 
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 transition-colors ${
              hasLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleLike();
            }}
          >
            <Heart size={18} className={`${hasLiked ? 'fill-red-500' : ''}`} />
            <span className="text-xs font-medium">{hasLiked ? 'Liked' : 'Like'}</span>
          </button>
          
          <button 
            className="flex-1 py-2.5 flex items-center justify-center space-x-1.5 text-gray-600 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={toggleCommentForm}
          >
            <MessageCircle size={18} />
            <span className="text-xs font-medium">Comment</span>
          </button>
          
          <Drawer open={isShareOpen} onOpenChange={setIsShareOpen}>
            <DrawerTrigger asChild>
              <button 
                className="flex-1 py-2.5 flex items-center justify-center space-x-1.5 text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                onClick={(e) => handleShare(e)}
              >
                <Share2 size={18} />
                <span className="text-xs font-medium">Share</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="rounded-t-xl">
              <DrawerHeader className="border-b border-gray-100">
                <DrawerTitle className="text-center">Share This Post</DrawerTitle>
                <DrawerDescription className="text-center text-sm">
                  Choose a platform to share
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4">
                <ShareOptions />
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full border-gray-200">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        
        {showCommentForm && (
          <div className="border-t border-gray-200">
            <PostCommentSection 
              postId={post.id} 
              updateCommentCount={updateCommentCount}
              showCommentForm={showCommentForm}
            />
          </div>
        )}
        
        <CreatePostModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          groupId={post.groupId}
          marketplaceId={post.marketplace_id}
          initialContent={post.content}
          isEditing={true}
          postId={post.id}
          initialImage={post.image}
          onPostUpdate={onPostUpdate}
        />
      </Card>
    );
  }

  return (
    <Card className="mb-8 overflow-hidden border border-gray-200 rounded-2xl w-full mx-auto shadow-sm hover:shadow-md transition-all duration-300 min-h-[70vh] bg-white">
      <div className="flex flex-col md:flex-row h-full">
        {post.image && (
          <div className="md:w-3/5 min-h-[70vh] relative">
            <div 
              className="relative w-full h-full overflow-hidden bg-gray-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsImageExpanded(true);
              }}
            >
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-full object-cover cursor-pointer transition-transform duration-700 hover:scale-105"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-20 pointer-events-none" />
              
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md border border-white/80">
                <Link 
                  to={`/user/${post.author.id}`}
                  className="flex items-center space-x-2 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar className="w-8 h-8 border-2 border-white group-hover:border-primary/20 transition-all">
                    <AvatarImage 
                      src={authorAvatarUrl} 
                      alt={post.author.name} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 text-primary-foreground">
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{post.author.name}</span>
                </Link>
              </div>
              
              <button 
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors border border-white/80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsImageExpanded(true);
                }}
              >
                <Maximize size={16} className="text-gray-700" />
              </button>
            </div>
            
            {isImageExpanded && (
              <Dialog open={isImageExpanded} onOpenChange={setIsImageExpanded}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-xl border-none shadow-2xl">
                  <DialogTitle className="sr-only">Post Image</DialogTitle>
                  <button 
                    onClick={closeExpandedImage}
                    className="absolute top-4 right-4 z-50 text-white bg-black/40 p-2 rounded-full hover:bg-black/60 focus:outline-none"
                  >
                    <X size={24} />
                  </button>
                  <div className="relative w-full overflow-hidden rounded-lg p-1">
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full h-auto max-h-[85vh] object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
        
        <div className={`${post.image ? 'md:w-2/5' : 'w-full'} flex flex-col min-h-[70vh] bg-white border-l border-gray-100`}>
          {!post.image && (
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <Link 
                to={`/user/${post.author.id}`}
                className="flex items-center space-x-3 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-full blur-md opacity-0 group-hover:opacity-70 transition-all duration-300"></div>
                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm group-hover:border-primary/20 transition-all">
                    <AvatarImage 
                      src={authorAvatarUrl} 
                      alt={post.author.name} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30 text-primary-foreground">
                      {post.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{post.author.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </Link>
              {isPostOwner ? (
                <PostOptionsDropdown />
              ) : (
                <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
                    <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
                    <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {post.image && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                  <span className="mx-2 text-gray-300">•</span>
                  <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
                {isPostOwner ? (
                  <PostOptionsDropdown />
                ) : (
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor" />
                      <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="currentColor" />
                      <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="currentColor" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className="px-5 py-4">
            <div className="space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-line break-words">
                {post.image ? '' : <span className="font-semibold">{post.author.name}</span>}{" "}
                <span>
                  {post.content}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto border-t border-gray-100 bg-gray-50/50">
            <PostCommentSection 
              postId={post.id} 
              updateCommentCount={updateCommentCount}
              showCommentForm={showCommentForm}
            />
          </div>
          
          <CardFooter className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
            <div className="flex items-center space-x-4">
              <button 
                className={`flex items-center justify-center space-x-1.5 p-2 rounded-full transition-colors ${
                  hasLiked 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLike();
                }}
              >
                <Heart size={20} className={`${hasLiked ? 'fill-red-500' : ''} transition-all ${hasLiked ? 'scale-110' : 'scale-100'}`} />
              </button>
              
              <button 
                className="flex items-center justify-center p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={toggleCommentForm}
              >
                <MessageCircle size={20} />
              </button>
              
              {isMobile ? (
                <Drawer open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DrawerTrigger asChild>
                    <button 
                      className="flex items-center justify-center p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={(e) => handleShare(e)}
                    >
                      <Share2 size={20} />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="rounded-t-xl">
                    <DrawerHeader className="border-b border-gray-100">
                      <DrawerTitle className="text-center">Share This Post</DrawerTitle>
                      <DrawerDescription className="text-center text-sm">
                        Choose a platform to share
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4">
                      <ShareOptions />
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full border-gray-200">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <button 
                    className="flex items-center justify-center p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={(e) => handleShare(e)}
                  >
                    <Share2 size={20} />
                  </button>
                  <DialogContent className="sm:max-w-md rounded-xl">
                    <DialogTitle className="text-center">Share This Post</DialogTitle>
                    <div className="p-2">
                      <ShareOptions />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="flex items-center justify-center h-5 w-5 bg-red-100 rounded-full">
                  <Heart size={10} className="text-red-500" />
                </div>
                <span className="text-sm font-medium">{likeCount}</span>
              </div>
              
              <button className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
                <Bookmark size={20} />
              </button>
            </div>
          </CardFooter>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        groupId={post.groupId}
        marketplaceId={post.marketplace_id}
        initialContent={post.content}
        isEditing={true}
        postId={post.id}
        initialImage={post.image}
        onPostUpdate={onPostUpdate}
      />
    </Card>
  );
};

export default PostCard;
