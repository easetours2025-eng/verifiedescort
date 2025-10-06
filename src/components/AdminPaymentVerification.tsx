import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Search, DollarSign, Calendar, Phone, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PaymentRecord {
  id: string;
  celebrity_id: string;
  phone_number: string;
  mpesa_code: string;
  amount: number;
  expected_amount?: number;
  payment_status?: string;
  credit_balance?: number;
  is_verified: boolean;
  payment_date: string;
  verified_at?: string;
  subscription_tier?: string;
  duration_type?: string;
  celebrity?: {
    id: string;
    stage_name: string;
    email: string;
  };
}

interface PaymentStats {
  total_payments: number;
  total_amount: number;
  verified_payments: number;
  verified_amount: number;
  pending_payments: number;
  pending_amount: number;
}

const AdminPaymentVerification = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<PaymentStats>({
    total_payments: 0,
    total_amount: 0,
    verified_payments: 0,
    verified_amount: 0,
    pending_payments: 0,
    pending_amount: 0,
  });

  useEffect(() => {
    fetchPayments();
    setupRealtimeSubscription();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_verification')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        toast({
          title: 'Error',
          description: `Failed to fetch payments: ${paymentsError.message}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Fetch celebrity profiles
      const { data: celebritiesData, error: celebritiesError } = await supabase
        .from('celebrity_profiles')
        .select('id, stage_name, email');

      if (celebritiesError) {
        console.error('Error fetching celebrities:', celebritiesError);
        // Continue even if celebrity fetch fails
      }

      // Join data
      const enrichedPayments = paymentsData?.map(payment => ({
        ...payment,
        celebrity: celebritiesData?.find(c => c.id === payment.celebrity_id),
      })) || [];

      setPayments(enrichedPayments);

      // Calculate stats
      const totalAmount = enrichedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const verifiedPayments = enrichedPayments.filter(p => p.is_verified);
      const verifiedAmount = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const pendingPayments = enrichedPayments.filter(p => !p.is_verified);
      const pendingAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      setStats({
        total_payments: enrichedPayments.length,
        total_amount: totalAmount,
        verified_payments: verifiedPayments.length,
        verified_amount: verifiedAmount,
        pending_payments: pendingPayments.length,
        pending_amount: pendingAmount,
      });

    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payment records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('payment_verification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_verification',
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const verifyPayment = async (payment: PaymentRecord) => {
    try {
      // Call the edge function to verify payment with admin privileges
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentId: payment.id }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      if (data.alreadyVerified) {
        toast({
          title: 'Already Verified',
          description: 'This payment was already verified.',
        });
        fetchPayments();
        return;
      }

      if (data.isUnderpaid) {
        toast({
          title: 'Payment Verified',
          description: 'Payment verified but subscription not activated due to insufficient amount.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: data.message,
        });
      }

      fetchPayments();
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.celebrity?.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.mpesa_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.phone_number?.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && payment.is_verified) ||
      (statusFilter === 'pending' && !payment.is_verified);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {stats.total_amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.total_payments} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">KSH {stats.verified_amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.verified_payments} verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">KSH {stats.pending_amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.pending_payments} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by celebrity, M-Pesa code, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Celebrity</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>M-Pesa Code</TableHead>
                  <TableHead>Amount/Expected</TableHead>
                  <TableHead>Tier/Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{payment.celebrity?.stage_name}</div>
                          <div className="text-xs text-muted-foreground">{payment.celebrity?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {payment.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span className="font-mono">{payment.mpesa_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold">KSH {Number(payment.amount).toLocaleString()}</div>
                          {payment.expected_amount && (
                            <div className="text-xs">
                              Expected: <span className="font-semibold">KSH {Number(payment.expected_amount).toLocaleString()}</span>
                            </div>
                          )}
                          {payment.payment_status === 'underpaid' && (
                            <Badge variant="destructive" className="text-xs">Underpaid</Badge>
                          )}
                          {payment.payment_status === 'overpaid' && (
                            <Badge variant="secondary" className="text-xs">
                              +KSH {payment.credit_balance} credit
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.subscription_tier && (
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {payment.subscription_tier}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {payment.duration_type?.replace('_', ' ')}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.is_verified ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!payment.is_verified && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Verify Payment</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will verify the payment
                                {payment.expected_amount && payment.amount < payment.expected_amount ? (
                                  <span className="text-destructive font-semibold">
                                    {' '}but the subscription will NOT be activated because payment (KSH {payment.amount}) is less than expected (KSH {payment.expected_amount})
                                  </span>
                                ) : (
                                  <span>
                                    , activate the subscription for <strong>{payment.celebrity?.stage_name}</strong>, and mark them as verified
                                  </span>
                                )}
                                {payment.credit_balance && payment.credit_balance > 0 && (
                                  <span className="text-green-600 font-semibold">
                                    . KSH {payment.credit_balance} will be credited to the celebrity account.
                                  </span>
                                )}
                                {' '}This action cannot be undone.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => verifyPayment(payment)}>
                                  Verify Payment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {payment.is_verified && (
                          <span className="text-xs text-muted-foreground">
                            Verified {new Date(payment.verified_at!).toLocaleDateString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentVerification;
