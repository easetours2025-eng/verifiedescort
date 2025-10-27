import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, MessageCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ExpiredSubscription {
  id: string;
  user_id: string;
  stage_name: string;
  phone_number: string;
  email: string;
  subscription_end: string;
  subscription_tier: string;
  days_expired: number;
}

const AdminExpiredSubscriptions = () => {
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<ExpiredSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpiredSubscriptions();
    setupRealtimeSubscription();
  }, []);

  const fetchExpiredSubscriptions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_celebrities_with_expired_subscriptions');

      if (error) {
        console.error('Error fetching expired subscriptions:', error);
        throw error;
      }

      setExpiredSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching expired subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load expired subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'celebrity_subscriptions'
        },
        () => {
          fetchExpiredSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleWhatsAppContact = (subscription: ExpiredSubscription) => {
    const phoneNumber = subscription.phone_number.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi ${subscription.stage_name}! 👋\n\n` +
      `This is Royal Escorts Admin. We noticed that your subscription has expired ${subscription.days_expired} days ago.\n\n` +
      `Your profile is currently not displayed on our homepage because your ${subscription.subscription_tier} subscription ended on ${format(new Date(subscription.subscription_end), 'MMM dd, yyyy')}.\n\n` +
      `To reactivate your profile and continue enjoying our premium services, please renew your subscription.\n\n` +
      `If you've already made a payment, please send us your M-PESA confirmation code and we'll verify it immediately.\n\n` +
      `Thank you for being part of Royal Escorts! 💎`
    );
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: `Message prepared for ${subscription.stage_name}`,
    });
  };

  const getAvatarUrl = (stageName: string) => {
    return undefined; // No profile picture path in this view
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip_elite': return 'bg-purple-500';
      case 'prime_plus': return 'bg-blue-500';
      case 'basic_pro': return 'bg-green-500';
      case 'starter': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'vip_elite': return 'VIP Elite';
      case 'prime_plus': return 'Prime Plus';
      case 'basic_pro': return 'Basic Pro';
      case 'starter': return 'Starter';
      default: return tier;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Celebrities with expired subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Expired</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiredSubscriptions.filter(s => s.days_expired <= 7).length}
            </div>
            <p className="text-xs text-muted-foreground">Expired in last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiredSubscriptions.filter(s => s.days_expired > 30).length}
            </div>
            <p className="text-xs text-muted-foreground">Expired over 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Expired Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expired Subscriptions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Contact these celebrities to remind them about renewal
          </p>
        </CardHeader>
        <CardContent>
          {expiredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No expired subscriptions found</p>
              <p className="text-sm text-muted-foreground mt-2">All celebrities have active subscriptions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Celebrity</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subscription Tier</TableHead>
                  <TableHead>Expired Date</TableHead>
                  <TableHead>Days Expired</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={getAvatarUrl(subscription.stage_name)} />
                          <AvatarFallback>
                            {subscription.stage_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{subscription.stage_name}</div>
                          <div className="text-sm text-muted-foreground">{subscription.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{subscription.phone_number}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(subscription.subscription_tier)}>
                        {getTierLabel(subscription.subscription_tier)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(subscription.subscription_end), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={subscription.days_expired <= 7 ? "default" : subscription.days_expired <= 30 ? "secondary" : "destructive"}
                      >
                        {subscription.days_expired} days
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-200"
                        onClick={() => handleWhatsAppContact(subscription)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                        WhatsApp
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExpiredSubscriptions;
