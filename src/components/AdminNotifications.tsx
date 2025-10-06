import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, UserPlus, CreditCard, AlertCircle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'new_user' | 'payment_pending' | 'payment_verified' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscriptions();
  }, []);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const notifs: Notification[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch new users from last 24 hours
      const { data: newUsers } = await supabase
        .from('celebrity_profiles')
        .select('id, stage_name, email, created_at')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (newUsers) {
        newUsers.forEach(user => {
          notifs.push({
            id: `user_${user.id}`,
            type: 'new_user',
            title: 'New User Joined',
            message: `${user.stage_name} (${user.email}) has joined the platform`,
            timestamp: user.created_at,
            read: false,
            data: user
          });
        });
      }

      // Fetch pending payments
      const { data: pendingPayments } = await supabase
        .from('payment_verification')
        .select(`
          id,
          celebrity_id,
          amount,
          mpesa_code,
          created_at,
          celebrity_profiles (stage_name, email)
        `)
        .eq('is_verified', false)
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingPayments) {
        pendingPayments.forEach(payment => {
          const celebrity = payment.celebrity_profiles as any;
          notifs.push({
            id: `payment_pending_${payment.id}`,
            type: 'payment_pending',
            title: 'New Payment Verification Required',
            message: `${celebrity?.stage_name || 'Unknown'} submitted payment of KSh ${payment.amount} - Code: ${payment.mpesa_code}`,
            timestamp: payment.created_at,
            read: false,
            data: payment
          });
        });
      }

      // Fetch recently verified payments
      const { data: verifiedPayments } = await supabase
        .from('payment_verification')
        .select(`
          id,
          amount,
          verified_at,
          celebrity_profiles (stage_name)
        `)
        .eq('is_verified', true)
        .not('verified_at', 'is', null)
        .gte('verified_at', oneDayAgo.toISOString())
        .order('verified_at', { ascending: false })
        .limit(5);

      if (verifiedPayments) {
        verifiedPayments.forEach(payment => {
          const celebrity = payment.celebrity_profiles as any;
          notifs.push({
            id: `payment_verified_${payment.id}`,
            type: 'payment_verified',
            title: 'Payment Verified',
            message: `Payment of KSh ${payment.amount} for ${celebrity?.stage_name || 'Unknown'} was verified`,
            timestamp: payment.verified_at!,
            read: false,
            data: payment
          });
        });
      }

      // Sort by timestamp
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Listen for new celebrity profiles
    const profileChannel = supabase
      .channel('profile-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'celebrity_profiles'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Listen for new payment verifications
    const paymentChannel = supabase
      .channel('payment-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_verification'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
      paymentChannel.unsubscribe();
    };
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'payment_pending':
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      case 'payment_verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </p>
                        {!notification.read && (
                          <Badge variant="default" className="h-4 px-1.5 text-[10px]">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
