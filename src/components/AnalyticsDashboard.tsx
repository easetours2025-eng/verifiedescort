import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  DollarSign, 
  Video, 
  Image as ImageIcon, 
  Calendar as CalendarIcon,
  TrendingUp,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface SystemStats {
  totalCelebrities: number;
  activeCelebrities: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  totalVideos: number;
  totalMedia: number;
  totalViews: number;
  recentSignups: number;
}

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalCelebrities: 0,
    activeCelebrities: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalVideos: 0,
    totalMedia: 0,
    totalViews: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch celebrities stats
      const { data: celebrities, error: celebError } = await supabase
        .from('celebrity_profiles')
        .select('id, is_available, created_at');

      if (celebError) throw celebError;

      // Fetch subscriptions stats
      const { data: subscriptions, error: subsError } = await supabase
        .from('celebrity_subscriptions')
        .select('id, is_active, subscription_end, amount_paid');

      if (subsError) throw subsError;

      // Fetch payment stats
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_verification')
        .select('amount, is_verified');

      if (paymentsError) throw paymentsError;

      // Fetch videos stats
      const { data: videos, error: videosError } = await supabase
        .from('admin_videos')
        .select('id, view_count');

      if (videosError) throw videosError;

      // Fetch media stats
      const { data: media, error: mediaError } = await supabase
        .from('celebrity_media')
        .select('id');

      if (mediaError) throw mediaError;

      // Calculate stats
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const totalCelebrities = celebrities?.length || 0;
      const activeCelebrities = celebrities?.filter(c => c.is_available).length || 0;
      const recentSignups = celebrities?.filter(c => 
        new Date(c.created_at) >= sevenDaysAgo
      ).length || 0;

      const totalSubscriptions = subscriptions?.length || 0;
      const activeSubscriptions = subscriptions?.filter(s => 
        s.is_active && new Date(s.subscription_end) > now
      ).length || 0;

      const totalRevenue = payments?.filter(p => p.is_verified)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      const pendingPayments = payments?.filter(p => !p.is_verified).length || 0;

      const totalVideos = videos?.length || 0;
      const totalViews = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;
      const totalMedia = media?.length || 0;

      setStats({
        totalCelebrities,
        activeCelebrities,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
        pendingPayments,
        totalVideos,
        totalMedia,
        totalViews,
        recentSignups,
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">System Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive overview of your platform's performance
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Top Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Celebrities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCelebrities}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCelebrities} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalSubscriptions} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats and Calendar */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total Videos</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalVideos}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total Media</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalMedia}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total Views</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Platform Activity</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCelebrities} celebrities are currently active with {stats.activeSubscriptions} valid subscriptions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Content Library</p>
                <p className="text-xs text-muted-foreground">
                  Platform has {stats.totalVideos} videos and {stats.totalMedia} media items with {stats.totalViews.toLocaleString()} total views
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Payment Status</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingPayments} payments pending verification worth approximately KES {(stats.pendingPayments * 2000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Growth Trend</p>
                <p className="text-xs text-muted-foreground">
                  {stats.recentSignups} new celebrities joined in the last 7 days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
