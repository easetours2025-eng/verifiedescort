import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, DollarSign, Eye } from 'lucide-react';

interface PaymentRecord {
  id: string;
  celebrity_id: string;
  phone_number: string;
  mpesa_code: string;
  amount: number;
  is_verified: boolean;
  created_at: string;
  celebrity_profiles: {
    stage_name: string;
    email: string;
  } | null;
}

interface CelebrityProfile {
  id: string;
  stage_name: string;
  email: string;
  created_at: string;
  is_available: boolean;
  celebrity_subscriptions: Array<{
    is_active: boolean;
    subscription_end: string;
  }> | null;
}

const AdminDashboard = () => {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [celebrities, setCelebrities] = useState<CelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch payment records
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_verification')
        .select(`
          *,
          celebrity_profiles!celebrity_id (
            stage_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch celebrity profiles with subscription status
      const { data: celebs, error: celebsError } = await supabase
        .from('celebrity_profiles')
        .select(`
          *,
          celebrity_subscriptions!celebrity_id (
            is_active,
            subscription_end
          )
        `)
        .order('created_at', { ascending: false });

      if (celebsError) throw celebsError;

      setPaymentRecords((payments as any) || []);
      setCelebrities((celebs as any) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string, celebrityId: string) => {
    try {
      // Mark payment as verified
      const { error: paymentError } = await supabase
        .from('payment_verification')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Create or update celebrity subscription
      const subscriptionStart = new Date();
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

      const { error: subscriptionError } = await supabase
        .from('celebrity_subscriptions')
        .upsert({
          celebrity_id: celebrityId,
          is_active: true,
          subscription_start: subscriptionStart.toISOString(),
          subscription_end: subscriptionEnd.toISOString()
        });

      if (subscriptionError) throw subscriptionError;

      toast({
        title: "Payment Verified",
        description: "Celebrity subscription activated for 1 month",
      });

      fetchData();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payment_verification')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "Payment record has been removed",
      });

      fetchData();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (isVerified: boolean) => {
    return isVerified ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-yellow-500" />
    );
  };

  const getSubscriptionStatus = (celebrity: CelebrityProfile): {
    status: string;
    variant: "default" | "destructive" | "secondary" | "outline";
    endDate: string | null;
  } => {
    const activeSubscription = celebrity.celebrity_subscriptions?.find(sub => sub.is_active);
    if (activeSubscription) {
      const endDate = new Date(activeSubscription.subscription_end);
      const isExpired = endDate < new Date();
      return {
        status: isExpired ? 'Expired' : 'Active',
        variant: isExpired ? 'destructive' : 'default',
        endDate: endDate.toLocaleDateString()
      };
    }
    return {
      status: 'Inactive',
      variant: 'secondary',
      endDate: null
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalCelebrities: celebrities.length,
    activeCelebrities: celebrities.filter(c => 
      c.celebrity_subscriptions?.some(sub => 
        sub.is_active && new Date(sub.subscription_end) > new Date()
      )
    ).length,
    pendingPayments: paymentRecords.filter(p => !p.is_verified).length,
    totalRevenue: paymentRecords.filter(p => p.is_verified).reduce((sum, p) => sum + Number(p.amount), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage celebrity payments and profiles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Celebrities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCelebrities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCelebrities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-forerange" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {stats.totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="payments">Payment Verification</TabsTrigger>
            <TabsTrigger value="celebrities">Celebrity Management</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Verification</CardTitle>
                <CardDescription>
                  Review and verify M-Pesa payments from celebrities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentRecords.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No payment records found
                    </p>
                  ) : (
                    paymentRecords.map((payment) => (
                      <Card key={payment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.is_verified)}
                              <h3 className="font-medium">
                                {payment.celebrity_profiles?.stage_name}
                              </h3>
                              <Badge variant={payment.is_verified ? "default" : "secondary"}>
                                {payment.is_verified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Phone:</strong> {payment.phone_number}</p>
                              <p><strong>M-Pesa Code:</strong> {payment.mpesa_code}</p>
                              <p><strong>Amount:</strong> KSh {payment.amount}</p>
                              <p><strong>Email:</strong> {payment.celebrity_profiles?.email}</p>
                              <p><strong>Submitted:</strong> {new Date(payment.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {!payment.is_verified && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => verifyPayment(payment.id, payment.celebrity_id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectPayment(payment.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="celebrities">
            <Card>
              <CardHeader>
                <CardTitle>Celebrity Management</CardTitle>
                <CardDescription>
                  View and manage celebrity profiles and subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {celebrities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No celebrities found
                    </p>
                  ) : (
                    celebrities.map((celebrity) => {
                      const subscriptionInfo = getSubscriptionStatus(celebrity);
                      return (
                        <Card key={celebrity.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{celebrity.stage_name}</h3>
                                <Badge variant={subscriptionInfo.variant}>
                                  {subscriptionInfo.status}
                                </Badge>
                                {celebrity.is_available && (
                                  <Badge variant="outline">Available</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p><strong>Email:</strong> {celebrity.email}</p>
                                <p><strong>Joined:</strong> {new Date(celebrity.created_at).toLocaleDateString()}</p>
                                {subscriptionInfo.endDate && (
                                  <p><strong>Subscription ends:</strong> {subscriptionInfo.endDate}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;