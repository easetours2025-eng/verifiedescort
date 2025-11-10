import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, CreditCard, TrendingUp, RefreshCw, Search, Eye, EyeOff, Trash2, Shield, ShieldCheck, LayoutGrid, Table2, LogOut, Video, Wallet, DollarSign, Building2, Bell, Flag, Timer, Star, Plus, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/AdminSidebar';
import AdminGlobalSearch from '@/components/AdminGlobalSearch';
import StatsCard from '@/components/StatsCard';
import Footer from '@/components/Footer';
import ChartCard from '@/components/ChartCard';
import TimelineCard from '@/components/TimelineCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AdminSubscriptionManagement from '@/components/AdminSubscriptionManagement';
import AdminActiveSubscriptions from '@/components/AdminActiveSubscriptions';
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
import AdminVideoSection from '@/components/AdminVideoSection';
import UserManagement from '@/components/UserManagement';
import AdminManagement from '@/components/AdminManagement';
import AllUsersManagement from '@/components/AllUsersManagement';
import AdminPaymentVerification from '@/components/AdminPaymentVerification';
import AdminPayPalManagement from '@/components/AdminPayPalManagement';
import { AdminNotifications } from '@/components/AdminNotifications';
import PremiumSupportUsers from '@/components/PremiumSupportUsers';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AdminWhatsAppAnalytics from '@/components/AdminWhatsAppAnalytics';
import AdminCallAnalytics from '@/components/AdminCallAnalytics';
import AdminExpiredSubscriptions from '@/components/AdminExpiredSubscriptions';
import AdminSitemapMonitoring from '@/components/AdminSitemapMonitoring';

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
  is_special_offer_active?: boolean;
  special_offer_registered_at?: string;
  subscription_tier?: string;
}

const AdminDashboard = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [celebrities, setCelebrities] = useState<CelebrityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPayment, setSearchPayment] = useState('');
  const [searchCelebrity, setSearchCelebrity] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  console.log('AdminDashboard rendering with activeTab:', activeTab);

  // Check admin authentication via Supabase Auth and role verification
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/admin-auth');
          return;
        }

        // Verify admin role server-side
        const { data: hasAdminRole, error } = await supabase.rpc('is_user_admin');
        
        if (error || !hasAdminRole) {
          console.error('Admin role verification failed:', error);
          await supabase.auth.signOut();
          navigate('/admin-auth');
          return;
        }

        // Set admin user data from authenticated session
        setAdminUser({
          id: session.user.id,
          email: session.user.email || 'admin@admin.com',
          loginTime: new Date().toISOString()
        });
      } catch (error) {
        console.error('Admin auth check failed:', error);
        navigate('/admin-auth');
      }
    };

    checkAdminAuth();
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
      
      // Since the edge function isn't working, let's query directly using admin privileges
      // First, try to get payments data - query without joins to avoid RLS complexity
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_verification')
        .select('*')
        .order('created_at', { ascending: false });

      // Get celebrity profiles for joining with payments
      const { data: celebrityProfilesData, error: profilesError } = await supabase
        .from('celebrity_profiles')
        .select('id, stage_name, real_name, email, is_verified');

      // Get celebrities data
      const { data: celebritiesData, error: celebritiesError } = await supabase
        .from('celebrity_profiles')
        .select(`
          *,
          celebrity_subscriptions (
            is_active,
            subscription_end,
            subscription_tier
          )
        `)
        .order('created_at', { ascending: false });

      if (celebritiesError) {
        // Error handled - will show empty data
      }

      // Process the data
      const processedPayments = (paymentsData || []).map(payment => {
        const celebrity = celebrityProfilesData?.find(c => c.id === payment.celebrity_id);
        return {
          ...payment,
          celebrity: celebrity
        };
      }).filter(payment => payment.celebrity);
      
      const processedCelebrities = (celebritiesData || []).map(celebrity => {
        // Cast celebrity_subscriptions to array since it's a relation query
        const subscriptions = Array.isArray(celebrity.celebrity_subscriptions) 
          ? celebrity.celebrity_subscriptions 
          : celebrity.celebrity_subscriptions 
            ? [celebrity.celebrity_subscriptions] 
            : [];
            
        const activeSubscription = subscriptions.find(
          (sub: any) => sub.is_active && new Date(sub.subscription_end) > new Date()
        );
        
        let subscription_status: 'active' | 'inactive' | 'expired' = 'inactive';
        if (activeSubscription) {
          subscription_status = 'active';
        } else if (subscriptions.some((sub: any) => !sub.is_active)) {
          subscription_status = 'expired';
        }
        
        return {
          ...celebrity,
          subscription_status,
          subscription_end: activeSubscription?.subscription_end,
          subscription_tier: activeSubscription?.subscription_tier || 'basic'
        };
      });

      setPayments(processedPayments);
      setCelebrities(processedCelebrities);
    } catch (error) {
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
      // Get the payment details first to check payment type
      const { data: payment, error: fetchError } = await supabase
        .from('payment_verification')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) {
        throw fetchError || new Error('Payment not found');
      }

      // Use the verify-payment edge function which handles both subscription and featured payments
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentId }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to verify payment');
      }

      toast({
        title: "Payment Verified",
        description: data.message,
      });

      fetchData();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: `Failed to verify payment: ${error.message || 'Unknown error'}`,
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

  const filteredCelebrities = celebrities.filter(celebrity => {
    const matchesSearch = !searchCelebrity ||
      celebrity.stage_name.toLowerCase().includes(searchCelebrity.toLowerCase()) ||
      celebrity.email.toLowerCase().includes(searchCelebrity.toLowerCase());

    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'special' && celebrity.is_special_offer_active) ||
      (categoryFilter === 'premium' && celebrity.subscription_status === 'active' && celebrity.subscription_tier === 'premium') ||
      (categoryFilter === 'basic' && celebrity.subscription_status === 'active' && celebrity.subscription_tier === 'basic');

    return matchesSearch && matchesCategory;
  });

  // Category counts
  const specialOfferUsers = celebrities.filter(c => c.is_special_offer_active);
  const premiumUsers = celebrities.filter(c => c.subscription_status === 'active' && c.subscription_tier === 'premium');
  const basicUsers = celebrities.filter(c => c.subscription_status === 'active' && c.subscription_tier === 'basic');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={cn(
        "flex-1 w-full transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top Header */}
        <header className="bg-background border-b border-border sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 sm:gap-4 flex-1 lg:ml-0">
              <AdminGlobalSearch onNavigate={setActiveTab} />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <AdminNotifications />
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Flag className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Timer className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-border">
                <Avatar>
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  localStorage.removeItem('admin_session');
                  navigate('/admin-auth');
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-3 sm:p-6 lg:p-8">
          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'payments' && (
            <AdminPaymentVerification />
          )}

          {activeTab === 'paypal' && (
            <AdminPayPalManagement />
          )}

          {activeTab === 'users' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">User Management</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <UserManagement onUserCreated={fetchData} />
                <AdminManagement onAdminCreated={() => {}} />
              </div>
              <AllUsersManagement />
            </div>
          )}

          {activeTab === 'celebrities' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Celebrity Management</h1>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Celebrity Management</CardTitle>
                <p className="text-xs md:text-sm text-gray-600">View and manage celebrity profiles and subscriptions</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-4 md:mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search celebrities by name or email..."
                      value={searchCelebrity}
                      onChange={(e) => setSearchCelebrity(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="special">Special Offer (5-day)</SelectItem>
                      <SelectItem value="premium">Premium Users</SelectItem>
                      <SelectItem value="basic">Basic Users</SelectItem>
                    </SelectContent>
                  </Select>
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
                                   {celebrity.is_special_offer_active && (
                                     <Badge variant="default" className="bg-orange-100 text-orange-800">
                                       Special Offer (5-day)
                                     </Badge>
                                   )}
                                   {celebrity.subscription_status === 'active' && celebrity.subscription_tier === 'premium' && (
                                     <Badge variant="default" className="bg-purple-100 text-purple-800">
                                       Premium Plan
                                     </Badge>
                                   )}
                                   {celebrity.subscription_status === 'active' && celebrity.subscription_tier === 'basic' && (
                                     <Badge variant="default" className="bg-blue-100 text-blue-800">
                                       Basic Plan
                                     </Badge>
                                   )}
                                   <Badge variant={celebrity.subscription_status === 'active' ? 'default' : 'secondary'}>
                                     {celebrity.subscription_status === 'active' ? 'Active' : 'Inactive'}
                                   </Badge>
                                   <Badge variant={celebrity.is_available ? 'default' : 'secondary'}>
                                     {celebrity.is_available ? 'Available' : 'Unavailable'}
                                   </Badge>
                                   {celebrity.is_verified && (
                                     <Badge variant="default" className="bg-green-100 text-green-800">
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
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="text-xs px-2 py-1">
                                      <Trash2 className="h-3 w-3 mr-1" />
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
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4 sm:space-y-6">
              <AdminSubscriptionManagement />
              <div className="mt-6 sm:mt-8">
                <AdminActiveSubscriptions />
              </div>
            </div>
          )}

          {activeTab === 'whatsapp-analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">WhatsApp Analytics</h1>
              <AdminWhatsAppAnalytics />
            </div>
          )}

          {activeTab === 'call-analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Call Analytics</h1>
              <AdminCallAnalytics />
            </div>
          )}

          {activeTab === 'expired-subscriptions' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Expired Subscriptions</h1>
              <AdminExpiredSubscriptions />
            </div>
          )}

          {activeTab === 'sitemap-monitoring' && (
            <AdminSitemapMonitoring />
          )}

          {activeTab === 'premium-support' && (
            <PremiumSupportUsers />
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Video Management</h1>
              <AdminVideoSection />
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;