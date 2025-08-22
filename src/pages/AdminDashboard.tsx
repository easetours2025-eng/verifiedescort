import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Service role client for admin operations (bypasses RLS)
const adminSupabase = createClient(
  "https://kpjqcrhoablsllkgonbl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcxNjc1OSwiZXhwIjoyMDcxMjkyNzU5fQ.hf4bHBhxhO4-DQb9Nd5zWI2jN4-PQYBNXv1Qb_Oz6F0",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, CreditCard, TrendingUp, RefreshCw, Search, Eye, EyeOff, Trash2, Shield, ShieldCheck, LayoutGrid, Table2, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Data Interfaces
interface PaymentRecord {
  id: string;
  celebrity_id: string;
  phone_number: string;
  mpesa_code: string;
  amount: number;
  is_verified: boolean;
  payment_date: string;
  verified_at?: string;
  celebrity?: {
    id: string;
    stage_name: string;
    real_name?: string;
    email: string;
    is_verified: boolean;
  };
}

interface CelebrityProfile {
  id: string;
  user_id: string;
  stage_name: string;
  real_name?: string;
  email: string;
  location?: string;
  base_price: number;
  hourly_rate?: number;
  is_verified: boolean;
  is_available: boolean;
  created_at: string;
  subscription_status: 'active' | 'inactive' | 'expired';
  subscription_end?: string;
}

const AdminDashboard = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [celebrities, setCelebrities] = useState<CelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPayment, setSearchPayment] = useState('');
  const [searchCelebrity, setSearchCelebrity] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const navigate = useNavigate();

  // Check admin authentication and set up Supabase session
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      navigate('/admin-auth');
      return;
    }

    try {
      const session = JSON.parse(adminSession);
      // Check if session is not too old (optional security measure)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLogin > 24) { // Session expires after 24 hours
        localStorage.removeItem('admin_session');
        navigate('/admin-auth');
        return;
      }

      // Set up admin context for RLS - we'll fetch data directly without relying on RLS
      setAdminUser(session.admin);
    } catch (error) {
      console.error('Invalid admin session:', error);
      localStorage.removeItem('admin_session');
      navigate('/admin-auth');
      return;
    }
  }, [navigate]);

  const [adminUser, setAdminUser] = useState<any>(null);

  // Core Component Logic and Data Fetching
  useEffect(() => {
    fetchData();
    setupRealtimeSubscriptions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use admin client to bypass RLS for admin operations
      const { data: paymentsData, error: paymentsError } = await adminSupabase
        .from('payment_verification')
        .select('*')
        .order('created_at', { ascending: false });

      // Get celebrity profiles to join the data
      const { data: celebrityProfilesData, error: celebrityError } = await adminSupabase
        .from('celebrity_profiles')
        .select('id, stage_name, real_name, email, is_verified');

      if (paymentsError) {
        console.error('Payments error:', paymentsError);
        throw paymentsError;
      }
      
      if (celebrityError) {
        console.error('Celebrity profiles error:', celebrityError);
        throw celebrityError;
      }

      // Fetch celebrity profiles with subscription status using admin client
      const { data: celebritiesData, error: celebritiesError } = await adminSupabase
        .from('celebrity_profiles')
        .select(`
          *,
          celebrity_subscriptions (
            is_active,
            subscription_end
          )
        `)
        .order('created_at', { ascending: false });

      if (celebritiesError) throw celebritiesError;

      // Process payments data by joining with celebrity profiles
      const processedPayments = paymentsData?.map(payment => {
        const celebrity = celebrityProfilesData?.find(c => c.id === payment.celebrity_id);
        return {
          ...payment,
          celebrity_profiles: celebrity
        };
      }).filter(payment => payment.celebrity_profiles) || []; // Only include payments with valid celebrity profiles

      // Process celebrities data with subscription status
      const processedCelebrities = celebritiesData?.map(celebrity => {
        const activeSubscription = celebrity.celebrity_subscriptions?.find(
          (sub: any) => sub.is_active && new Date(sub.subscription_end) > new Date()
        );
        
        return {
          ...celebrity,
          subscription_status: (activeSubscription ? 'active' : 'inactive') as 'active' | 'inactive' | 'expired',
          subscription_end: activeSubscription?.subscription_end
        };
      }) || [];

      setPayments(processedPayments);
      setCelebrities(processedCelebrities as CelebrityProfile[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Listen for payment changes
    const paymentChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_verification'
        },
        (payload) => {
          console.log('Payment change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    // Listen for celebrity profile changes
    const celebrityChannel = supabase
      .channel('celebrity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'celebrity_profiles'
        },
        (payload) => {
          console.log('Celebrity change detected:', payload);
          fetchData();
        }
      )
      .subscribe();

    // Listen for subscription changes
    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'celebrity_subscriptions'
        },
        (payload) => {
          console.log('Subscription change detected:', payload);
          fetchData();
        }
      )
      .subscribe();
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "All data has been updated with the latest information.",
    });
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

      // Mark celebrity as verified
      const { error: celebrityError } = await supabase
        .from('celebrity_profiles')
        .update({ is_verified: true })
        .eq('id', celebrityId);

      if (celebrityError) throw celebrityError;

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
        description: "Celebrity subscription activated and profile verified for 1 month",
      });

      fetchData();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleCelebrityVerification = async (celebrityId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('celebrity_profiles')
        .update({ is_verified: isVerified })
        .eq('id', celebrityId);

      if (error) throw error;

      toast({
        title: isVerified ? "Celebrity Verified" : "Celebrity Unverified",
        description: `Celebrity has been ${isVerified ? 'verified' : 'unverified'} successfully.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast({
        title: "Error",
        description: "Failed to update celebrity verification status.",
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
        description: "Payment has been rejected and removed.",
      });

      fetchData();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (payment: PaymentRecord) => {
    if (payment.is_verified) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <Clock className="h-5 w-5 text-yellow-600" />;
  };

  const getSubscriptionStatus = (celebrity: CelebrityProfile) => {
    if (celebrity.subscription_status === 'active') {
      return { text: 'Active', variant: 'default' as const };
    }
    return { text: 'Inactive', variant: 'secondary' as const };
  };

  const toggleCelebrityAvailability = async (celebrityId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('celebrity_profiles')
        .update({ is_available: isAvailable })
        .eq('id', celebrityId);

      if (error) throw error;

      toast({
        title: isAvailable ? "Celebrity Enabled" : "Celebrity Disabled",
        description: `Celebrity has been ${isAvailable ? 'enabled' : 'disabled'} successfully.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast({
        title: "Error",
        description: "Failed to update celebrity availability.",
        variant: "destructive",
      });
    }
  };

  const deleteCelebrity = async (celebrityId: string) => {
    if (!confirm('Are you sure? This will permanently delete the celebrity profile and all associated data.')) return;
    
    try {
      const { error } = await supabase
        .from('celebrity_profiles')
        .delete()
        .eq('id', celebrityId);

      if (error) throw error;

      toast({
        title: "Celebrity Deleted",
        description: "Celebrity profile has been permanently deleted.",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting celebrity:', error);
      toast({
        title: "Error",
        description: "Failed to delete celebrity profile.",
        variant: "destructive",
      });
    }
  };

  // Filter functions
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchPayment || 
      payment.celebrity?.stage_name?.toLowerCase().includes(searchPayment.toLowerCase()) ||
      payment.celebrity?.email?.toLowerCase().includes(searchPayment.toLowerCase()) ||
      payment.phone_number.includes(searchPayment) ||
      payment.mpesa_code.toLowerCase().includes(searchPayment.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'verified' && payment.is_verified) ||
      (statusFilter === 'pending' && !payment.is_verified);

    return matchesSearch && matchesStatus;
  });

  const filteredCelebrities = celebrities.filter(celebrity =>
    !searchCelebrity ||
    celebrity.stage_name.toLowerCase().includes(searchCelebrity.toLowerCase()) ||
    celebrity.email.toLowerCase().includes(searchCelebrity.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            <Button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2 w-full md:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('admin_session');
                navigate('/admin-auth');
              }}
              className="flex items-center space-x-2 w-full md:w-auto"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Celebrities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{celebrities.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Active Subscriptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {celebrities.filter(c => c.subscription_status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {payments.filter(p => !p.is_verified).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                KSh {payments.filter(p => p.is_verified).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center space-x-2 text-xs md:text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment Verification</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="celebrities" className="flex items-center space-x-2 text-xs md:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Celebrity Management</span>
              <span className="sm:hidden">Celebrities</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Payment Verification</CardTitle>
                <p className="text-xs md:text-sm text-gray-600">Review and verify M-Pesa payments from celebrities</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4 md:mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by celebrity name, email, phone, or M-Pesa code..."
                      value={searchPayment}
                      onChange={(e) => setSearchPayment(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <Card key={payment.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(payment)}
                              <h3 className="font-semibold text-sm md:text-base">
                                {payment.celebrity?.stage_name} ({payment.celebrity?.real_name})
                              </h3>
                              {payment.celebrity?.is_verified && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                              <p><strong>Phone:</strong> {payment.phone_number}</p>
                              <p><strong>M-Pesa Code:</strong> {payment.mpesa_code}</p>
                              <p><strong>Amount:</strong> KSh {payment.amount}</p>
                              <p><strong>Date:</strong> {new Date(payment.payment_date).toLocaleDateString()}</p>
                            </div>
                            {payment.celebrity?.email && (
                              <p className="text-xs md:text-sm text-gray-600">
                                <strong>Email:</strong> {payment.celebrity.email}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                            {!payment.is_verified ? (
                              <>
                                <Button
                                  onClick={() => verifyPayment(payment.id, payment.celebrity_id)}
                                  className="bg-green-600 hover:bg-green-700 text-white w-full md:w-auto"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Verify
                                </Button>
                                <Button
                                  onClick={() => rejectPayment(payment.id)}
                                  variant="destructive"
                                  className="w-full md:w-auto"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Badge variant="default" className="bg-green-100 text-green-800 justify-center md:justify-start">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified on {new Date(payment.verified_at!).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredPayments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payments found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="celebrities" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Celebrity Management</CardTitle>
                <p className="text-xs md:text-sm text-gray-600">View and manage celebrity profiles and subscriptions</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4 md:mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search celebrities by name or email..."
                      value={searchCelebrity}
                      onChange={(e) => setSearchCelebrity(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className="flex items-center space-x-1"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Cards</span>
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="flex items-center space-x-1"
                    >
                      <Table2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Table</span>
                    </Button>
                  </div>
                </div>

                {viewMode === 'cards' ? (
                  <div className="space-y-4">
                    {filteredCelebrities.map((celebrity) => (
                      <Card key={celebrity.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                            <div className="space-y-2">
                              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
                                <h3 className="font-semibold text-sm md:text-base">{celebrity.stage_name}</h3>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant={celebrity.subscription_status === 'active' ? 'default' : 'secondary'}>
                                    {celebrity.subscription_status === 'active' ? 'Active' : 'Inactive'}
                                  </Badge>
                                  <Badge variant={celebrity.is_available ? 'default' : 'secondary'}>
                                    {celebrity.is_available ? 'Available' : 'Unavailable'}
                                  </Badge>
                                  {celebrity.is_verified && (
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                      <ShieldCheck className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                                <p><strong>Email:</strong> {celebrity.email}</p>
                                <p><strong>Joined:</strong> {new Date(celebrity.created_at).toLocaleDateString()}</p>
                                <p><strong>Base Price:</strong> KSh {celebrity.base_price}</p>
                                <p><strong>Location:</strong> {celebrity.location}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                              <Button
                                onClick={() => toggleCelebrityVerification(celebrity.id, !celebrity.is_verified)}
                                variant={celebrity.is_verified ? "secondary" : "default"}
                                size="sm"
                                className="w-full md:w-auto"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {celebrity.is_verified ? 'Unverify' : 'Verify'}
                              </Button>
                              <Button
                                onClick={() => toggleCelebrityAvailability(celebrity.id, !celebrity.is_available)}
                                variant={celebrity.is_available ? "destructive" : "default"}
                                size="sm"
                                className="w-full md:w-auto"
                              >
                                {celebrity.is_available ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Enable
                                  </>
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="w-full md:w-auto">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Celebrity Profile</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {celebrity.stage_name}'s profile? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCelebrity(celebrity.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {filteredCelebrities.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No celebrities found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Subscription</TableHead>
                          <TableHead className="hidden lg:table-cell">Price</TableHead>
                          <TableHead className="hidden md:table-cell">Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCelebrities.map((celebrity) => (
                          <TableRow key={celebrity.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">{celebrity.stage_name}</span>
                                <span className="text-xs text-gray-500 md:hidden">{celebrity.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {celebrity.email}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <Badge 
                                  variant={celebrity.is_available ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {celebrity.is_available ? 'Available' : 'Unavailable'}
                                </Badge>
                                {celebrity.is_verified && (
                                  <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge 
                                variant={celebrity.subscription_status === 'active' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {celebrity.subscription_status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              KSh {celebrity.base_price}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {new Date(celebrity.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-1">
                                <Button
                                  onClick={() => toggleCelebrityVerification(celebrity.id, !celebrity.is_verified)}
                                  variant={celebrity.is_verified ? "secondary" : "default"}
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  {celebrity.is_verified ? 'Unverify' : 'Verify'}
                                </Button>
                                <Button
                                  onClick={() => toggleCelebrityAvailability(celebrity.id, !celebrity.is_available)}
                                  variant={celebrity.is_available ? "destructive" : "default"}
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  {celebrity.is_available ? (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" />
                                      Enable
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredCelebrities.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No celebrities found matching your criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;