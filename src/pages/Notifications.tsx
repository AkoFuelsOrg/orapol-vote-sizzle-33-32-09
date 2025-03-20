
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../integrations/supabase/client';
import { useBreakpoint } from '../hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ThumbsUp, UserPlus, Share2, Users, ShoppingBag, MoreHorizontal, Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'follow' | 'comment' | 'vote' | 'like' | 'share' | 'message' | 'post' | 'group' | 'marketplace' | 'system';
  content: string;
  is_read: boolean;
  created_at: string;
  related_user_id: string | null;
  related_item_id: string | null;
  related_item_type: string | null;
  user: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const Notifications: React.FC = () => {
  const { user } = useSupabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast: uiToast } = useToast();
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up a subscription for real-time notifications
      const channel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Received new notification via realtime:', payload);
            fetchNotifications();
            // Show a toast for new notifications
            uiToast({
              title: 'New Notification',
              description: payload.new.content,
            });
          }
        )
        .subscribe();

      // Fix for the error - channel.on requires 3 arguments: event name, event filter object, and callback
      channel.on(
        'system', 
        { event: 'status' }, 
        (status) => {
          console.log('Realtime subscription status:', status);
        }
      );
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {
      setError('No user is logged in');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Log user ID for debugging
      console.log('Fetching notifications for user ID:', user.id);
      
      // Fetch notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching notifications:', error);
        setError(`Error fetching notifications: ${error.message}`);
        throw error;
      }

      console.log('Raw notification data:', data);
      
      // For each notification with a related_user_id, fetch the user data
      const notificationsWithUserData = await Promise.all(
        (data || []).map(async (notification) => {
          let userData = null;
          
          if (notification.related_user_id) {
            try {
              // Fetch user profile data separately
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', notification.related_user_id)
                .maybeSingle();
                
              if (!profileError && profileData) {
                userData = profileData;
              } else if (profileError) {
                console.log('Error fetching profile data:', profileError);
              }
            } catch (err) {
              console.error('Error in profile fetch:', err);
            }
          }
          
          return {
            ...notification,
            type: notification.type as Notification['type'],
            user: userData
          } as Notification;
        })
      );
      
      setNotifications(notificationsWithUserData);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(`Error in fetchNotifications: ${error.message}`);
      uiToast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      uiToast({
        title: 'Error',
        description: `Failed to mark notification as read: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
      
      uiToast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      uiToast({
        title: 'Error',
        description: `Failed to mark notifications as read: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  // This function creates test notifications for various interaction types
  const createTestNotification = async () => {
    if (!user) return;
    
    try {
      // Create different types of test notifications
      const testNotifications = [
        {
          user_id: user.id,
          type: 'like',
          content: 'liked your post',
          is_read: false,
          related_item_type: 'post',
          related_item_id: 'test-post-id',
          related_user_id: user.id // Using same user for test purposes
        },
        {
          user_id: user.id,
          type: 'comment',
          content: 'commented on your post',
          is_read: false,
          related_item_type: 'post',
          related_item_id: 'test-post-id',
          related_user_id: user.id // Using same user for test purposes
        },
        {
          user_id: user.id,
          type: 'share',
          content: 'shared your post',
          is_read: false,
          related_item_type: 'post',
          related_item_id: 'test-post-id',
          related_user_id: user.id // Using same user for test purposes
        }
      ];
      
      const { data, error } = await supabase
        .from('notifications')
        .insert(testNotifications)
        .select();
        
      if (error) {
        console.error('Error creating test notifications:', error);
        throw error;
      }
      
      toast.success('Test notifications created');
      fetchNotifications();
    } catch (error: any) {
      console.error('Error creating test notifications:', error);
      toast.error(`Failed to create test notifications: ${error.message}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'vote':
        return <ThumbsUp className="h-5 w-5 text-purple-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'share':
        return <Share2 className="h-5 w-5 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'post':
        return <MoreHorizontal className="h-5 w-5 text-gray-500" />;
      case 'group':
        return <Users className="h-5 w-5 text-teal-500" />;
      case 'marketplace':
        return <ShoppingBag className="h-5 w-5 text-amber-500" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };

  const getNotificationLink = (notification: Notification) => {
    if (!notification.related_item_id) return '#';
    
    switch (notification.related_item_type) {
      case 'post':
        return `/post/${notification.related_item_id}`;
      case 'follow':
        return notification.related_user_id ? `/user/${notification.related_user_id}` : '#';
      case 'message':
        return notification.related_user_id ? `/messages/${notification.related_user_id}` : '/messages';
      case 'group':
        return `/group/${notification.related_item_id}`;
      case 'marketplace':
        return `/marketplace/${notification.related_item_id}`;
      default:
        // For other types like comments, likes, shares that are related to posts
        return notification.related_item_id ? `/post/${notification.related_item_id}` : '#';
    }
  };

  const groupNotificationsByDate = () => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      let groupKey: string;
      
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
      const isYesterday = date.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0);
      
      if (isToday) {
        groupKey = 'Today';
      } else if (isYesterday) {
        groupKey = 'Yesterday';
      } else {
        // Format date as "Month Day" (e.g., "Mar 15")
        groupKey = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(notification);
    });
    
    return groups;
  };

  // Helper function to get notification content based on type
  const getNotificationContent = (notification: Notification) => {
    if (notification.type === 'system') {
      return notification.content;
    }

    const username = notification.user?.username || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${username} liked your post`;
      case 'comment':
        return `${username} commented on your post`;
      case 'share':
        return `${username} shared your post`;
      case 'follow':
        return `${username} started following you`;
      default:
        return notification.content;
    }
  };

  return (
    <div className={`w-full ${isDesktop ? 'max-w-full' : ''} mx-auto py-8`}>
      <h1 className="text-2xl font-bold mb-6">Your Notifications</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notifications</CardTitle>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchNotifications}
              className="ml-2"
            >
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={createTestNotification}
              className="ml-2"
            >
              Create Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!user ? (
            <p className="text-muted-foreground">
              Please sign in to see your notifications.
            </p>
          ) : loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                  <h3 className="font-semibold mb-1">Error</h3>
                  <p>{error}</p>
                </div>
              )}
              
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">You don't have any notifications yet.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    New notifications will appear here when someone likes, comments on, or shares your posts.
                  </p>
                  <Button
                    onClick={createTestNotification}
                    className="mt-4"
                    variant="outline"
                  >
                    Create Test Notifications
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupNotificationsByDate()).map(([date, dateNotifications]) => (
                    <div key={date} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">{date}</span>
                        <Separator className="flex-1" />
                      </div>
                      
                      {dateNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={getNotificationLink(notification)}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          className={`block p-3 rounded-lg transition-colors ${
                            notification.is_read 
                              ? 'bg-secondary/30 hover:bg-secondary/50' 
                              : 'bg-secondary hover:bg-secondary/80 border-l-4 border-primary'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {notification.user ? (
                                <Avatar>
                                  <AvatarImage 
                                    src={notification.user.avatar_url || `https://i.pravatar.cc/150?u=${notification.related_user_id}`} 
                                    alt={notification.user.username || 'User'} 
                                  />
                                  <AvatarFallback>
                                    {notification.user.username?.substring(0, 2).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                                {notification.type === 'system' ? (
                                  <>System: {notification.content}</>
                                ) : (
                                  getNotificationContent(notification)
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
