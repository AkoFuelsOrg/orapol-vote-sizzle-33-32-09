import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Share2, X, Maximize, Bookmark } from 'lucide-react';
import { Post } from '../lib/types';
import { useSupabase } from '../context/SupabaseContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogClose } from './ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import PostCommentSection from './PostCommentSection';
import { AspectRatio } from './ui/aspect-ratio';
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

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const { user } = useSupabase();
  const isMobile = useIsMobile();
  const [isImageExpanded, setIsImageExpanded] = React.useState(false);
  const [hasLiked, setHasLiked] = React.useState(post.userLiked || false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [commentCount, setCommentCount] = React.useState(post.commentCount);
  const [showCommentForm, setShowCommentForm] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  
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

  const handleShare = (e: React.MouseEvent, platform?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard");
        if (isMobile) setIsShareOpen(false);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=Check out this post!`, '_blank');
        if (isMobile) setIsShareOpen(false);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
        if (isMobile) setIsShareOpen(false);
        break;
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=Check out this post! ${encodeURIComponent(postUrl)}`, '_blank');
        if (isMobile) setIsShareOpen(false);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=Check out this post!`, '_blank');
        if (isMobile) setIsShareOpen(false);
        break;
      case 'email':
        window.open(`mailto:?subject=Check out this post!&body=${encodeURIComponent(postUrl)}`, '_blank');
        if (isMobile) setIsShareOpen(false);
        break;
      default:
        setIsShareOpen(true);
    }
  };

  const ShareOptions = () => (
    <div className="grid grid-cols-2 gap-4 w-full px-1 py-3">
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'copy')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span className="text-xs">Copy Link</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'twitter')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 4.01C21 4.5 20.02 4.84 19 5.01C18.1 4.11 16.82 3.61 15.5 3.61C12.92 3.61 10.85 5.68 10.85 8.25C10.85 8.65 10.9 9.03 10.99 9.39C7.14 9.19 3.78 7.37 1.53 4.68C1.13 5.41 0.889 6.28 0.889 7.2C0.889 8.94 1.7 10.5 3 11.38C2.24 11.35 1.5 11.15 0.889 10.82V10.88C0.889 13.15 2.47 15.05 4.61 15.5C3.84 15.72 3.05 15.75 2.29 15.58C2.82 17.37 4.32 18.66 6.12 18.7C4.57 20.03 2.57 20.81 0.389 20.81C0.0289999 20.81 -0.33 20.8 -0.69 20.75C1.13 22.15 3.29 23 5.65 23C15.45 23 20.79 14.9 20.79 7.98C20.79 7.75 20.79 7.53 20.78 7.31C21.78 6.62 22.65 5.73 23.31 4.72C22.39 5.13 21.41 5.39 20.39 5.52C21.45 4.89 22.26 3.88 22.65 2.68C21.66 3.27 20.57 3.69 19.42 3.92C18.15 2.66 16.31 2.17 14.57 2.63C12.84 3.09 11.51 4.42 11.12 6.17C10.73 7.92 11.23 9.75 12.44 11C9.54 10.93 6.76 9.9 4.61 8.09C2.71 10.71 3.66 14.26 6.41 15.94C5.71 15.93 5.02 15.76 4.38 15.44C4.38 15.46 4.38 15.48 4.38 15.51C4.38 17.95 6.11 20.03 8.49 20.45C7.63 20.67 6.73 20.67 5.88 20.44C6.5 22.49 8.36 23.88 10.51 23.9C8.76 25.31 6.58 26.05 4.35 25.89C6.53 27.28 9.11 28.03 11.75 28C16.65 28.04 21.33 26.08 24.52 22.46C27.72 18.84 29.13 14.04 28.41 9.28C28.4 9.05 28.4 8.83 28.39 8.6C28.4 8.39 28.4 8.19 28.4 7.98C28.4 7.84 28.4 7.7 28.39 7.57C28.4 7.37 28.4 7.18 28.39 6.98" fill="currentColor"/>
        </svg>
        <span className="text-xs">Twitter</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'facebook')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
        <span className="text-xs">Facebook</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'whatsapp')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 2h-11A4.5 4.5 0 0 0 2 6.5v11A4.5 4.5 0 0 0 6.5 22h11a4.5 4.5 0 0 0 4.5-4.5v-11A4.5 4.5 0 0 0 17.5 2Z"></path>
          <path d="M16 11.4A4.6 4.6 0 0 1 11.4 16H8l-3 1 1-3v-3.4A4.6 4.6 0 0 1 11.4 6H16Z"></path>
        </svg>
        <span className="text-xs">WhatsApp</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'telegram')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
          <path d="M22 2 11 13"></path>
        </svg>
        <span className="text-xs">Telegram</span>
      </Button>
      
      <Button variant="outline" className="flex flex-col items-center justify-center h-20 space-y-2" onClick={(e) => handleShare(e, 'email')}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
        <span className="text-xs">Email</span>
      </Button>
    </div>
  );

  return (
    <Card className="mb-8 overflow-hidden border border-gray-200 rounded-lg w-full mx-auto shadow-sm min-h-[70vh]">
      <div className="flex flex-col md:flex-row h-full">
        {post.image && (
          <div className="md:w-3/5 min-h-[70vh]">
            <div 
              className="relative w-full h-full"
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
              
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/20 p-2 rounded-full">
                <Link 
                  to={`/user/${post.author.id}`}
                  className="flex items-center space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={post.author.avatar} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-white">{post.author.name}</span>
                </Link>
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
          </div>
        )}
        
        <div className={`${post.image ? 'md:w-2/5' : 'w-full'} flex flex-col min-h-[70vh]`}>
          {!post.image && (
            <div className="px-5 py-4 flex items-center justify-between border-b">
              <Link 
                to={`/user/${post.author.id}`}
                className="flex items-center space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="w-8 h-8 ring-2 ring-red-500">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
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
          )}
          
          {post.image && (
            <div className="px-5 py-4 border-b">
              <Link 
                to={`/user/${post.author.id}`}
                className="flex items-center space-x-2"
              >
                <p className="text-sm font-semibold">{post.author.name}</p>
              </Link>
            </div>
          )}
          
          <div className="px-5 py-3">
            <div className="flex space-x-1">
              <p className="text-sm">
                {post.image ? '' : <span className="font-semibold">{post.author.name}</span>}{" "}
                <span className="whitespace-pre-line break-words">
                  {post.content}
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            <PostCommentSection 
              postId={post.id} 
              updateCommentCount={updateCommentCount}
              showCommentForm={showCommentForm}
            />
          </div>
          
          <div className="px-5 pt-3 pb-2 flex justify-between mt-auto">
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
              <button 
                className="focus:outline-none"
                onClick={toggleCommentForm}
              >
                <MessageCircle size={24} className="text-black" />
              </button>
              
              {isMobile ? (
                <Drawer open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DrawerTrigger asChild>
                    <button 
                      className="focus:outline-none"
                      onClick={(e) => handleShare(e)}
                    >
                      <Share2 size={24} className="text-black" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Share</DrawerTitle>
                      <DrawerDescription>
                        Choose a platform to share this post.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4">
                      <ShareOptions />
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <button 
                    className="focus:outline-none"
                    onClick={(e) => handleShare(e)}
                  >
                    <Share2 size={24} className="text-black" />
                  </button>
                  <DialogContent className="sm:max-w-md">
                    <DialogTitle>Share</DialogTitle>
                    <div className="p-2">
                      <ShareOptions />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <button className="focus:outline-none">
              <Bookmark size={24} className="text-black" />
            </button>
          </div>
          
          <div className="px-5 pt-1 pb-1">
            <p className="font-semibold text-sm">{likeCount} likes</p>
          </div>
          
          <div className="px-5 py-3 mt-auto border-t">
            <p className="text-xs uppercase text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
