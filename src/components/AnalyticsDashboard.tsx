import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  DollarSign, 
  Image as ImageIcon, 
  Calendar as CalendarIcon,
  TrendingUp,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface SystemStats {
  totalCelebrities: number;
  activeCelebrities: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  totalMedia: number;
  totalViews: number;
  recentSignups: number;
}

interface ChartData {
  name: string;
  value: number;
}

const chartConfig = {
  celebrities: {
    label: "Celebrities",
    color: "hsl(var(--chart-1))",
  },
  subscriptions: {
    label: "Subscriptions",
    color: "hsl(var(--chart-2))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-3))",
  },
  media: {
    label: "Media",
    color: "hsl(var(--chart-5))",
  },
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalCelebrities: 0,
    activeCelebrities: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalMedia: 0,
    totalViews: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Chart data
  const platformData: ChartData[] = [
    { name: "Celebrities", value: stats.totalCelebrities },
    { name: "Active", value: stats.activeCelebrities },
    { name: "Subscriptions", value: stats.activeSubscriptions },
  ];

  const contentData: ChartData[] = [
    { name: "Media", value: stats.totalMedia },
    { name: "Views", value: Math.floor(stats.totalViews / 100) },
  ];

  const revenueData: ChartData[] = [
    { name: "Verified", value: Math.floor(stats.totalRevenue / 1000) },
    { name: "Pending", value: stats.pendingPayments },
    { name: "Total Subs", value: stats.totalSubscriptions },
  ];

  useEffect(() => {
    console.log('AnalyticsDashboard mounted - fetching data...');
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

      const totalMedia = media?.length || 0;
      const totalViews = 0; // Reset since we removed videos

      setStats({
        totalCelebrities,
        activeCelebrities,
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue,
        pendingPayments,
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">System Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Comprehensive overview of your platform's performance
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Top Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={contentData}>
                <defs>
                  <linearGradient id="colorContent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-4))" 
                  fillOpacity={1} 
                  fill="url(#colorContent)" 
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats and Calendar */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Content Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-chart-5/10">
                  <ImageIcon className="h-5 w-5 text-chart-5" />
                </div>
                <span className="text-sm font-medium">Total Media</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalMedia}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-chart-1/10">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                </div>
                <span className="text-sm font-medium">Total Views</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center overflow-x-auto">
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
      <Card className="bg-gradient-to-br from-muted/30 to-muted/10">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-chart-5/20">
              <div className="h-2 w-2 bg-chart-5 rounded-full mt-2 shadow-lg shadow-chart-5/50"></div>
              <div>
                <p className="text-sm font-medium">Platform Activity</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeCelebrities} celebrities are currently active with {stats.activeSubscriptions} valid subscriptions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-chart-4/20">
              <div className="h-2 w-2 bg-chart-4 rounded-full mt-2 shadow-lg shadow-chart-4/50"></div>
              <div>
                <p className="text-sm font-medium">Content Library</p>
                <p className="text-xs text-muted-foreground">
                  Platform has {stats.totalMedia} media items
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-chart-3/20">
              <div className="h-2 w-2 bg-chart-3 rounded-full mt-2 shadow-lg shadow-chart-3/50"></div>
              <div>
                <p className="text-sm font-medium">Payment Status</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingPayments} payments pending verification worth approximately KES {(stats.pendingPayments * 2000).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-card/50 backdrop-blur-sm rounded-lg border border-chart-1/20">
              <div className="h-2 w-2 bg-chart-1 rounded-full mt-2 shadow-lg shadow-chart-1/50"></div>
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
