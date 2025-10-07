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
  celebrity_profiles?: {
    id: string;
    stage_name: string;
    email: string;
  };
  // Alias for backward compatibility
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

  console.log('AdminPaymentVerification: Responsive version loaded');

  useEffect(() => {
    fetchPayments();
    setupRealtimeSubscription();
  }, []);


  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Get admin email from session
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email;

      if (!adminEmail) {
        toast({
          title: 'Error',
          description: 'Admin authentication required',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Fetch payments using admin-data edge function
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'get_payment_data',
          adminEmail 
        }
      });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch payments: ${error.message}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!data.success) {
        toast({
          title: 'Error',
          description: data.message || 'Failed to fetch payment records',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const enrichedPayments = data.payments || [];
      
      // Normalize celebrity data for backward compatibility
      const normalizedPayments = enrichedPayments.map(payment => ({
        ...payment,
        celebrity: payment.celebrity_profiles || payment.celebrity
      }));
      
      setPayments(normalizedPayments);

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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
          <CardTitle className="text-lg sm:text-xl">Payment Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Celebrity</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">Phone</TableHead>
                  <TableHead className="min-w-[100px]">M-Pesa Code</TableHead>
                  <TableHead className="min-w-[120px]">Amount</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Tier/Duration</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="text-sm">{payment.celebrity?.stage_name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">{payment.celebrity?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{payment.phone_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span className="font-mono text-xs">{payment.mpesa_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-sm">KSH {Number(payment.amount).toLocaleString()}</div>
                          {payment.expected_amount && (
                            <div className="text-xs">
                              Exp: <span className="font-semibold">KSH {Number(payment.expected_amount).toLocaleString()}</span>
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
                      <TableCell className="hidden md:table-cell">
                        {payment.subscription_tier && (
                          <div>
                            <Badge variant="outline" className="mb-1 text-xs">
                              {payment.subscription_tier}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {payment.duration_type?.replace('_', ' ')}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.is_verified ? (
                          <Badge className="bg-green-500 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!payment.is_verified && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="default" className="text-xs h-8">
                                <CheckCircle className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Verify</span>
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

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No payments found</p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{payment.celebrity?.stage_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{payment.celebrity?.email}</p>
                      </div>
                      <div>
                        {payment.is_verified ? (
                          <Badge className="bg-green-500 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{payment.phone_number}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">M-Pesa:</span>
                        <p className="font-mono font-medium">{payment.mpesa_code}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Amount:</span>
                        <span className="font-bold text-sm">KSH {Number(payment.amount).toLocaleString()}</span>
                      </div>
                      {payment.expected_amount && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Expected:</span>
                          <span className="text-xs font-semibold">KSH {Number(payment.expected_amount).toLocaleString()}</span>
                        </div>
                      )}
                      {payment.payment_status === 'underpaid' && (
                        <Badge variant="destructive" className="text-xs w-full justify-center">Underpaid</Badge>
                      )}
                      {payment.payment_status === 'overpaid' && (
                        <Badge variant="secondary" className="text-xs w-full justify-center">
                          +KSH {payment.credit_balance} credit
                        </Badge>
                      )}
                    </div>

                    {payment.subscription_tier && (
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {payment.subscription_tier}
                        </Badge>
                        <span className="text-muted-foreground">{payment.duration_type?.replace('_', ' ')}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>

                    {!payment.is_verified && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="default" className="w-full">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify Payment
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
                      <p className="text-xs text-center text-muted-foreground">
                        Verified on {new Date(payment.verified_at!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentVerification;
