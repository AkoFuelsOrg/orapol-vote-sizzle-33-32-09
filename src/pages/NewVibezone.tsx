
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, UserPlus, Zap } from 'lucide-react';

// Mock data for vibezone posts
const vibezonePosts = [
  {
    id: 1,
    user: {
      name: "Sarah Johnson",
      username: "@sarah_j",
      avatar: "/lovable-uploads/default-avatar.png"
    },
    content: "Just finished an amazing painting session! The creative energy today was incredible ✨🎨 #ArtistLife #Vibezone",
    image: "/lovable-uploads/219fa93b-be40-496d-b7da-25b52bfeb46e.png",
    likes: 124,
    comments: 28,
    shares: 15,
    time: "2h ago",
    isLiked: false
  },
  {
    id: 2,
    user: {
      name: "Michael Chen",
      username: "@m_chen_design",
      avatar: "/lovable-uploads/default-avatar.png"
    },
    content: "Today's sunset was absolutely breathtaking. Moments like these remind me of the beauty in everyday life. What's your favorite time of day? #NatureLover #EveningVibes",
    image: "/lovable-uploads/143ae866-e284-4f13-82da-318647724a55.png",
    likes: 237,
    comments: 43,
    shares: 21,
    time: "5h ago",
    isLiked: false
  },
  {
    id: 3,
    user: {
      name: "Alex Rodriguez",
      username: "@alex_talks",
      avatar: "/lovable-uploads/default-avatar.png"
    },
    content: "Just had the most enlightening conversation about sustainable living with @eco_friendly_lisa. So many practical tips to implement! Who's into sustainable living here? Let's connect! #GreenLiving #Sustainability",
    likes: 89,
    comments: 31,
    shares: 12,
    time: "8h ago",
    isLiked: false
  },
  {
    id: 4,
    user: {
      name: "Priya Patel",
      username: "@priya_creates",
      avatar: "/lovable-uploads/default-avatar.png"
    },
    content: "Finally launched my podcast! It's been months in the making, and I'm so excited to share these stories with you all. First episode is now live - link in bio! 🎙️ #NewPodcast #CreatorLife",
    image: "/lovable-uploads/142738e7-3764-4db2-8b2f-b9a9614f97e9.png",
    likes: 312,
    comments: 67,
    shares: 42,
    time: "1d ago",
    isLiked: false
  }
];

// Mock data for trending topics
const trendingTopics = [
  { id: 1, name: "#TuWayeTalks", posts: 1243 },
  { id: 2, name: "#CreativeMinds", posts: 856 },
  { id: 3, name: "#InspirationalQuotes", posts: 742 },
  { id: 4, name: "#MondayMotivation", posts: 631 },
  { id: 5, name: "#PositiveVibesOnly", posts: 529 }
];

// Mock data for suggested users
const suggestedUsers = [
  { id: 1, name: "Emma Watson", username: "@emma_creates", avatar: "/lovable-uploads/default-avatar.png", followers: 5400 },
  { id: 2, name: "David Kim", username: "@david_designs", avatar: "/lovable-uploads/default-avatar.png", followers: 3200 },
  { id: 3, name: "Lisa Johnson", username: "@lisa_talks", avatar: "/lovable-uploads/default-avatar.png", followers: 2800 }
];

// Active users mock data
const activeUsers = [
  { id: 1, name: "Thomas Reed", avatar: "/lovable-uploads/default-avatar.png" },
  { id: 2, name: "Grace Lee", avatar: "/lovable-uploads/default-avatar.png" },
  { id: 3, name: "Marcus Johnson", avatar: "/lovable-uploads/default-avatar.png" },
  { id: 4, name: "Sophia Chen", avatar: "/lovable-uploads/default-avatar.png" },
  { id: 5, name: "Olivia Davis", avatar: "/lovable-uploads/default-avatar.png" },
  { id: 6, name: "James Wilson", avatar: "/lovable-uploads/default-avatar.png" }
];

const NewVibezone: React.FC = () => {
  const [posts, setPosts] = useState(vibezonePosts);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const isLiked = post.isLiked;
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !isLiked
        };
      }
      return post;
    }));

    toast({
      title: "Post liked!",
      description: "Your reaction has been recorded.",
      duration: 2000,
    });
  };

  const handleComment = (postId: number) => {
    navigate(`/post/${postId}`);
  };

  const handleShare = (postId: number) => {
    toast({
      title: "Share options",
      description: "Share options coming soon!",
      duration: 2000,
    });
  };

  const handleFollow = (userId: number) => {
    toast({
      title: "User followed!",
      description: "You are now following this user.",
      duration: 2000,
    });
  };

  const handleTopicClick = (topic: string) => {
    navigate(`/search?q=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-orange-50">
      <Helmet>
        <title>Vibezone | TUWAYE - Lets Talk</title>
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col-reverse md:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="sticky top-20 z-10 bg-white/80 backdrop-blur-sm rounded-lg mb-6 p-4 shadow-sm">
              <h1 className="text-2xl font-bold text-purple-800">Vibezone</h1>
              <p className="text-gray-600">Connect, share, and discover vibrant conversations</p>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="trending" className="w-full mb-6">
              <TabsList className="w-full mb-4 bg-white/70 backdrop-blur-sm">
                <TabsTrigger value="trending" className="flex-1">Trending</TabsTrigger>
                <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
                <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trending" className="mt-0">
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="following" className="mt-0">
                <div className="flex items-center justify-center h-64 bg-white/60 rounded-lg">
                  <div className="text-center">
                    <Zap className="mx-auto h-12 w-12 text-purple-500 mb-2" />
                    <h3 className="text-xl font-medium text-gray-900">Discover people to follow</h3>
                    <p className="mt-1 text-gray-500">
                      Follow people to see their updates in your feed
                    </p>
                    <Button
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={() => navigate('/find-friends')}
                    >
                      Find Friends
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0">
                <div className="space-y-4">
                  {[...posts].reverse().map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onLike={handleLike} 
                      onComment={handleComment}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            {/* Active Now Section */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-purple-800">Active Now</h3>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-green-500">
                          <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500"></span>
                      </div>
                      <span className="text-xs mt-1 text-gray-700">{user.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Trending Topics */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-purple-800">Trending Topics</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {trendingTopics.map((topic) => (
                    <li 
                      key={topic.id} 
                      className="cursor-pointer hover:bg-purple-50 p-2 rounded-md transition-colors"
                      onClick={() => handleTopicClick(topic.name)}
                    >
                      <div className="font-medium text-purple-700">{topic.name}</div>
                      <div className="text-sm text-gray-500">{topic.posts.toLocaleString()} posts</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            {/* Suggested Users */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-purple-800">Suggested For You</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <li key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-2">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.followers.toLocaleString()} followers</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleFollow(user.id)}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Follow
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="link" 
                  className="text-purple-600 w-full"
                  onClick={() => navigate('/find-friends')}
                >
                  View more suggestions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PostCardProps {
  post: typeof vibezonePosts[0];
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onShare: (id: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare }) => {
  return (
    <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.user.avatar} alt={post.user.name} className="object-cover" />
            <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{post.user.name}</div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500">{post.user.username}</span>
              <span className="mx-1 text-gray-300">•</span>
              <span className="text-xs text-gray-500">{post.time}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
        
        {post.image && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto object-cover hover:scale-[1.01] transition-transform cursor-pointer" 
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${post.isLiked ? 'text-red-500' : 'text-gray-600'}`}
            onClick={() => onLike(post.id)}
          >
            <Heart className={`h-5 w-5 mr-1 ${post.isLiked ? 'fill-red-500' : ''}`} />
            <span>{post.likes}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600"
            onClick={() => onComment(post.id)}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            <span>{post.comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-600"
            onClick={() => onShare(post.id)}
          >
            <Share2 className="h-5 w-5 mr-1" />
            <span>{post.shares}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NewVibezone;
