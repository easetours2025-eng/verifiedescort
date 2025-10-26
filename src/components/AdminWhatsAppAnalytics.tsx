import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageCircle, TrendingUp, Users } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface WhatsAppClick {
  id: string;
  celebrity_id: string;
  clicked_at: string;
  celebrity?: {
    stage_name: string;
    profile_picture_path?: string;
  };
}

interface CelebrityClickStats {
  celebrity_id: string;
  stage_name: string;
  profile_picture_path?: string;
  total_clicks: number;
  recent_clicks: number;
}

interface DailyClickStats {
  date: string;
  clicks: number;
}

const AdminWhatsAppAnalytics = () => {
  const [clicks, setClicks] = useState<WhatsAppClick[]>([]);
  const [celebrityStats, setCelebrityStats] = useState<CelebrityClickStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyClickStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    fetchWhatsAppAnalytics();
    setupRealtimeSubscription();
  }, []);

  const fetchWhatsAppAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all WhatsApp clicks with celebrity info
      const { data: clicksData, error: clicksError } = await supabase
        .from('whatsapp_clicks')
        .select(`
          *,
          celebrity:celebrity_id (
            stage_name,
            profile_picture_path
          )
        `)
        .order('clicked_at', { ascending: false });

      if (clicksError) throw clicksError;

      const processedClicks = (clicksData || []).map(click => ({
        ...click,
        celebrity: Array.isArray(click.celebrity) ? click.celebrity[0] : click.celebrity
      }));

      setClicks(processedClicks);
      setTotalClicks(processedClicks.length);

      // Calculate celebrity-wise statistics
      const statsMap = new Map<string, CelebrityClickStats>();
      
      processedClicks.forEach(click => {
        const celebId = click.celebrity_id;
        const existing = statsMap.get(celebId);
        
        if (existing) {
          existing.total_clicks++;
          // Count clicks in last 7 days
          const clickDate = new Date(click.clicked_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (clickDate >= weekAgo) {
            existing.recent_clicks++;
          }
        } else {
          const clickDate = new Date(click.clicked_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          statsMap.set(celebId, {
            celebrity_id: celebId,
            stage_name: click.celebrity?.stage_name || 'Unknown',
            profile_picture_path: click.celebrity?.profile_picture_path,
            total_clicks: 1,
            recent_clicks: clickDate >= weekAgo ? 1 : 0
          });
        }
      });

      const sortedStats = Array.from(statsMap.values())
        .sort((a, b) => b.total_clicks - a.total_clicks);
      
      setCelebrityStats(sortedStats);

      // Calculate daily statistics for the last 30 days
      const dailyMap = new Map<string, number>();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      processedClicks.forEach(click => {
        const clickDate = new Date(click.clicked_at);
        if (clickDate >= thirtyDaysAgo) {
          const dateKey = format(clickDate, 'yyyy-MM-dd');
          dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
        }
      });

      const dailyStatsArray: DailyClickStats[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = format(date, 'yyyy-MM-dd');
        dailyStatsArray.push({
          date: format(date, 'MMM dd'),
          clicks: dailyMap.get(dateKey) || 0
        });
      }

      setDailyStats(dailyStatsArray);

    } catch (error) {
      console.error('Error fetching WhatsApp analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('whatsapp-clicks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_clicks'
        },
        () => {
          fetchWhatsAppAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getAvatarUrl = (path?: string) => {
    if (!path) return undefined;
    return `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${path}`;
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
            <CardTitle className="text-sm font-medium">Total WhatsApp Clicks</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Celebrities</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{celebrityStats.length}</div>
            <p className="text-xs text-muted-foreground">Receiving clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {celebrityStats.reduce((sum, stat) => sum + stat.recent_clicks, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Recent clicks</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Clicks Chart */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Clicks Over Time (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Celebrity Rankings Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Celebrities by WhatsApp Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={celebrityStats.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage_name" type="category" width={120} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="total_clicks" 
                fill="hsl(var(--primary))" 
                name="Total Clicks"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Celebrity Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Celebrity WhatsApp Click Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Celebrity</TableHead>
                <TableHead>Total Clicks</TableHead>
                <TableHead>Last 7 Days</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {celebrityStats.map((stat) => (
                <TableRow key={stat.celebrity_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getAvatarUrl(stat.profile_picture_path)} />
                        <AvatarFallback>
                          {stat.stage_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{stat.stage_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{stat.total_clicks}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stat.recent_clicks > 0 ? "default" : "outline"}>
                      {stat.recent_clicks}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {stat.recent_clicks > 0 ? (
                      <span className="text-green-600 text-sm">Active</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Inactive</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWhatsAppAnalytics;
