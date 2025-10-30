import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, DollarSign, Mail, Users, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from '@/lib/currency-utils';

interface PayPalPayment {
  id: string;
  celebrity_id: string;
  amount: number;
  paypal_email: string;
  transaction_id?: string;
  payment_date: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  celebrity_name?: string;
  celebrity_email?: string;
  country?: string;
  subscription_tier?: string;
  duration_type?: string;
}

export default function AdminPayPalManagement() {
  const [payments, setPayments] = useState<PayPalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paypalEmail] = useState("rashidjuma198@gmail.com");
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("paypal_payments")
        .select(`
          *,
          celebrity:celebrity_profiles!celebrity_id (
            stage_name,
            email,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(payment => ({
        id: payment.id,
        celebrity_id: payment.celebrity_id,
        amount: payment.amount_usd,
        paypal_email: payment.paypal_email,
        transaction_id: payment.paypal_transaction_id,
        payment_date: payment.created_at,
        is_verified: payment.is_verified,
        verified_at: payment.verified_at,
        verified_by: payment.verified_by,
        celebrity_name: payment.celebrity?.stage_name || 'Unknown',
        celebrity_email: payment.celebrity?.email || '',
        country: payment.celebrity?.country || 'Unknown',
        subscription_tier: payment.subscription_tier,
        duration_type: payment.duration_type
      }));

      setPayments(formattedData);
    } catch (error) {
      console.error("Error fetching PayPal payments:", error);
      toast.error("Failed to load PayPal payments");
    } finally {
      setLoading(false);
    }
  };

  const copyPayPalEmail = () => {
    navigator.clipboard.writeText(paypalEmail);
    setCopied(true);
    toast.success("PayPal email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      const { data: adminUser } = await supabase.auth.getUser();
      
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('paypal_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // Update payment verification
      const { error: updateError } = await supabase
        .from('paypal_payments')
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminUser.user?.id,
          payment_status: 'verified'
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Update celebrity subscription if tier and duration are provided
      if (payment.subscription_tier && payment.duration_type) {
        const durationDays = payment.duration_type === '1_month' ? 30 
                           : payment.duration_type === '2_weeks' ? 14 
                           : 7;

        const subscriptionEnd = new Date();
        subscriptionEnd.setDate(subscriptionEnd.getDate() + durationDays);

        const { error: subError } = await supabase
          .from('celebrity_subscriptions')
          .upsert({
            celebrity_id: payment.celebrity_id,
            subscription_tier: payment.subscription_tier,
            duration_type: payment.duration_type,
            subscription_start: new Date().toISOString(),
            subscription_end: subscriptionEnd.toISOString(),
            is_active: true,
            amount_paid: payment.amount_usd,
            last_payment_id: paymentId
          }, {
            onConflict: 'celebrity_id'
          });

        if (subError) throw subError;
      }
      
      toast.success("Payment verified successfully and subscription activated");
      fetchPayments();
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.celebrity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paypal_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'verified' && payment.is_verified) ||
      (filterStatus === 'pending' && !payment.is_verified);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    verified: payments.filter(p => p.is_verified).length,
    pending: payments.filter(p => !p.is_verified).length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">PayPal Payment Management</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage international PayPal payments</p>
        </div>

        {/* PayPal Email Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Mail className="h-5 w-5" />
              PayPal Account
            </CardTitle>
            <CardDescription>Share this email with international clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <code className="flex-1 font-mono text-sm">••••••••••••••••</code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyPayPalEmail}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Email
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Email is hidden for security. Click copy to get the full email address.
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{stats.verified}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Amount (KES)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">KSH {stats.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'verified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('verified')}
            >
              Verified
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </Button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading payments...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Celebrity</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>PayPal Email</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.celebrity_name}
                        <div className="text-xs text-muted-foreground">
                          {payment.celebrity_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.country}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.paypal_email}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.transaction_id || 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex flex-col">
                          <span>{formatPrice(payment.amount, payment.country)}</span>
                          {payment.country && payment.country !== 'Kenya' && (
                            <span className="text-xs text-muted-foreground">
                              (KSH {payment.amount.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {payment.is_verified ? (
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!payment.is_verified && (
                          <Button
                            size="sm"
                            onClick={() => verifyPayment(payment.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
