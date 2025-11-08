import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, MessageCircle, Clock, Gift, DollarSign, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [totalOfferRevenue, setTotalOfferRevenue] = useState(0);
  const [activatingOffer, setActivatingOffer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActivating, setIsBulkActivating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpiredSubscriptions();
    fetchOfferRevenue();
    setupRealtimeSubscription();
  }, []);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

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

  const fetchOfferRevenue = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_verification')
        .select('amount')
        .eq('payment_type', 'promotional_offer')
        .eq('is_verified', true);

      if (error) throw error;

      const total = data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      setTotalOfferRevenue(total);
    } catch (error) {
      console.error('Error fetching offer revenue:', error);
    }
  };

  const handleActivateOffer = async (subscription: ExpiredSubscription) => {
    setActivatingOffer(subscription.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('activate-promotional-offer', {
        body: {
          celebrityId: subscription.id,
          offerAmount: 500, // KES 500 promotional offer
        },
      });

      if (error) throw error;

      toast({
        title: "Offer Activated! 🎁",
        description: `${subscription.stage_name} now has 1-week VIP Elite access`,
      });

      // Refresh data
      await fetchExpiredSubscriptions();
      await fetchOfferRevenue();

    } catch (error) {
      console.error('Error activating offer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to activate promotional offer",
        variant: "destructive",
      });
    } finally {
      setActivatingOffer(null);
    }
  };

  const handleWhatsAppContact = (subscription: ExpiredSubscription, daysUntilExpiry?: number) => {
    const phoneNumber = subscription.phone_number.replace(/\D/g, '');
    
    let message = '';
    
    if (daysUntilExpiry !== undefined) {
      // For expiring soon subscriptions
      message = encodeURIComponent(
        `Hi ${subscription.stage_name}! 👋\n\n` +
        `This is Royal Escorts Admin. We wanted to remind you that your subscription is expiring in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}!\n\n` +
        `Your ${subscription.subscription_tier} subscription will end on ${format(new Date(subscription.subscription_end), 'MMM dd, yyyy')}.\n\n` +
        `To avoid any interruption in your profile visibility, please renew your subscription before it expires.\n\n` +
        `If you've already made a payment, please send us your M-PESA confirmation code and we'll verify it immediately.\n\n` +
        `Thank you for being part of Royal Escorts! 💎`
      );
    } else {
      // For expired subscriptions
      message = encodeURIComponent(
        `Hi ${subscription.stage_name}! 👋\n\n` +
        `This is Royal Escorts Admin. We noticed that your subscription has expired ${subscription.days_expired} days ago.\n\n` +
        `Your profile is currently not displayed on our homepage because your ${subscription.subscription_tier} subscription ended on ${format(new Date(subscription.subscription_end), 'MMM dd, yyyy')}.\n\n` +
        `To reactivate your profile and continue enjoying our premium services, please renew your subscription.\n\n` +
        `If you've already made a payment, please send us your M-PESA confirmation code and we'll verify it immediately.\n\n` +
        `Thank you for being part of Royal Escorts! 💎`
      );
    }
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    toast({
      title: "WhatsApp Opened",
      description: `Message prepared for ${subscription.stage_name}`,
    });
  };

  const handleDownloadData = (subscriptions: ExpiredSubscription[]) => {
    const csvData = [
      ['Celebrity', 'Email', 'Phone', 'Tier', 'Expired Date', 'Days Expired'],
      ...subscriptions.map(sub => [
        sub.stage_name,
        sub.email,
        sub.phone_number,
        getTierLabel(sub.subscription_tier),
        format(new Date(sub.subscription_end), 'MMM dd, yyyy'),
        sub.days_expired.toString()
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expired-subscriptions-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Data downloaded successfully"
    });
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = (subscriptions: ExpiredSubscription[]) => {
    if (selectedIds.size === subscriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscriptions.map(s => s.id)));
    }
  };

  const handleBulkWhatsApp = (subscriptions: ExpiredSubscription[], isExpiringSoon = false) => {
    const selected = subscriptions.filter(s => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select celebrities to contact",
        variant: "destructive"
      });
      return;
    }

    selected.forEach(subscription => {
      const daysUntilExpiry = isExpiringSoon ? Math.abs(subscription.days_expired) : undefined;
      handleWhatsAppContact(subscription, daysUntilExpiry);
    });

    toast({
      title: "WhatsApp Messages Opened",
      description: `Prepared messages for ${selected.length} ${selected.length === 1 ? 'celebrity' : 'celebrities'}`
    });
    setSelectedIds(new Set());
  };

  const handleBulkActivateOffers = async (subscriptions: ExpiredSubscription[]) => {
    const selected = subscriptions.filter(s => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select celebrities to activate offers",
        variant: "destructive"
      });
      return;
    }

    setIsBulkActivating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      let successCount = 0;
      let failCount = 0;

      for (const subscription of selected) {
        try {
          const { error } = await supabase.functions.invoke('activate-promotional-offer', {
            body: {
              celebrityId: subscription.id,
              offerAmount: 500,
            },
          });

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error(`Failed to activate offer for ${subscription.stage_name}:`, error);
          failCount++;
        }
      }

      toast({
        title: "Bulk Activation Complete",
        description: `Successfully activated ${successCount} offers${failCount > 0 ? `, ${failCount} failed` : ''}`,
      });

      await fetchExpiredSubscriptions();
      await fetchOfferRevenue();
      setSelectedIds(new Set());

    } catch (error) {
      console.error('Error in bulk activation:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk activation",
        variant: "destructive",
      });
    } finally {
      setIsBulkActivating(false);
    }
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

  const expiringSoonSubscriptions = expiredSubscriptions.filter(s => s.days_expired < 0 && s.days_expired >= -2);
  const actuallyExpiredSubscriptions = expiredSubscriptions.filter(s => s.days_expired > 0);

  const renderSubscriptionTable = (subscriptions: ExpiredSubscription[], isExpiringSoon = false) => (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          {isExpiringSoon 
            ? "Contact these celebrities to remind them before their subscription expires" 
            : "Contact these celebrities to remind them about renewal"}
        </p>
        <Button 
          onClick={() => handleDownloadData(subscriptions)} 
          variant="outline" 
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      
      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-base px-3 py-1">
              {selectedIds.size} Selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 border-green-200"
              onClick={() => handleBulkWhatsApp(subscriptions, isExpiringSoon)}
            >
              <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
              Send {selectedIds.size} WhatsApp {selectedIds.size === 1 ? 'Message' : 'Messages'}
            </Button>
            {!isExpiringSoon && (
              <Button
                variant="outline"
                size="sm"
                className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                onClick={() => handleBulkActivateOffers(subscriptions)}
                disabled={isBulkActivating}
              >
                {isBulkActivating ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2 text-purple-600" />
                    Activate {selectedIds.size} VIP Elite {selectedIds.size === 1 ? 'Offer' : 'Offers'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isExpiringSoon 
              ? "No subscriptions expiring soon" 
              : "No expired subscriptions found"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isExpiringSoon 
              ? "All subscriptions are either active or already expired" 
              : "All celebrities have active subscriptions"}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={subscriptions.length > 0 && selectedIds.size === subscriptions.length}
                  onCheckedChange={() => toggleSelectAll(subscriptions)}
                />
              </TableHead>
              <TableHead>Celebrity</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Subscription Tier</TableHead>
              <TableHead>{isExpiringSoon ? "Expires In" : "Expired Date"}</TableHead>
              <TableHead>{isExpiringSoon ? "Days Left" : "Days Expired"}</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => {
              const daysUntilExpiry = isExpiringSoon ? Math.abs(subscription.days_expired) : null;
              
              return (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(subscription.id)}
                      onCheckedChange={() => toggleSelection(subscription.id)}
                    />
                  </TableCell>
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
                      variant={
                        isExpiringSoon 
                          ? daysUntilExpiry === 1 ? "destructive" : "default"
                          : subscription.days_expired <= 7 ? "default" : subscription.days_expired <= 30 ? "secondary" : "destructive"
                      }
                    >
                      {isExpiringSoon ? `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}` : `${subscription.days_expired} days`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!isExpiringSoon && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                          onClick={() => handleActivateOffer(subscription)}
                          disabled={activatingOffer === subscription.id}
                        >
                          {activatingOffer === subscription.id ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Gift className="w-4 h-4 mr-2 text-purple-600" />
                              VIP Elite 1 Week
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100 border-green-200"
                        onClick={() => handleWhatsAppContact(subscription, isExpiringSoon ? daysUntilExpiry! : undefined)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                        WhatsApp
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoonSubscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Expiring in next 2 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actuallyExpiredSubscriptions.filter(s => s.days_expired <= 7).length}
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
              {actuallyExpiredSubscriptions.filter(s => s.days_expired > 30).length}
            </div>
            <p className="text-xs text-muted-foreground">Expired over 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotional Offers</CardTitle>
            <Gift className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalOfferRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total offer revenue (excluded from main revenue)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Subscriptions View */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">
                Expired ({actuallyExpiredSubscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="expiring" className="relative">
                Expiring Soon ({expiringSoonSubscriptions.length})
                {expiringSoonSubscriptions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                    {expiringSoonSubscriptions.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              {renderSubscriptionTable(actuallyExpiredSubscriptions, false)}
            </TabsContent>
            
            <TabsContent value="expiring" className="mt-6">
              {renderSubscriptionTable(expiringSoonSubscriptions, true)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExpiredSubscriptions;
