import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Phone, TrendingUp, Users, Filter, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

interface CallClick {
  id: string;
  celebrity_id: string;
  clicked_at: string;
  user_id?: string;
  user_ip?: string;
  user_agent?: string;
  device_type?: string;
  browser_name?: string;
  os_name?: string;
  platform?: string;
  is_mobile?: boolean;
  screen_width?: number;
  screen_height?: number;
  device_fingerprint?: string;
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

const AdminCallAnalytics = () => {
  const [clicks, setClicks] = useState<CallClick[]>([]);
  const [celebrityStats, setCelebrityStats] = useState<CelebrityClickStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyClickStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedCelebrity, setSelectedCelebrity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [celebrities, setCelebrities] = useState<{ id: string; stage_name: string }[]>([]);
  
  // Pagination states for individual clicks
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchCallAnalytics();
    setupRealtimeSubscription();
  }, [dateFilter, selectedCelebrity]);

  const fetchCallAnalytics = async () => {
    try {
      setLoading(true);

      // Build query with filters
      let query = supabase
        .from('call_clicks')
        .select('*');
      
      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = startOfDay(now);
            break;
          case 'week':
            startDate = subDays(now, 7);
            break;
          case 'month':
            startDate = subDays(now, 30);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('clicked_at', startDate.toISOString());
      }
      
      // Apply celebrity filter
      if (selectedCelebrity !== 'all') {
        query = query.eq('celebrity_id', selectedCelebrity);
      }
      
      const { data: clicksData, error: clicksError } = await query.order('clicked_at', { ascending: false });

      if (clicksError) {
        console.error('Error fetching call clicks:', clicksError);
        throw clicksError;
      }

      // Fetch celebrity profiles separately
      const { data: celebritiesData, error: celebritiesError } = await supabase
        .from('celebrity_profiles')
        .select('id, stage_name, profile_picture_path');

      if (celebritiesError) {
        console.error('Error fetching celebrity profiles:', celebritiesError);
      }
      
      // Store celebrities for filter dropdown
      setCelebrities(celebritiesData?.map(c => ({ id: c.id, stage_name: c.stage_name })) || []);

      // Join clicks with celebrity data manually
      const processedClicks = (clicksData || []).map(click => {
        const celebrity = celebritiesData?.find(c => c.id === click.celebrity_id);
        return {
          ...click,
          celebrity: celebrity || { stage_name: 'Unknown', profile_picture_path: null }
        };
      });

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
      console.error('Error fetching call analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('call-clicks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_clicks'
        },
        () => {
          fetchCallAnalytics();
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

  // Filter clicks by search query
  const filteredClicks = clicks.filter(click => {
    const matchesSearch = click.celebrity?.stage_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         click.celebrity_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredClicks.length / itemsPerPage);
  const paginatedClicks = filteredClicks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setDateFilter('all');
    setSelectedCelebrity('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = dateFilter !== 'all' || selectedCelebrity !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Celebrity</label>
              <Select value={selectedCelebrity} onValueChange={setSelectedCelebrity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Celebrities</SelectItem>
                  {celebrities.map((celeb) => (
                    <SelectItem key={celeb.id} value={celeb.id}>
                      {celeb.stage_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by celebrity name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">
                Showing {filteredClicks.length} of {clicks.length} clicks
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Call Clicks</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground">Receiving calls</p>
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
            <p className="text-xs text-muted-foreground">Recent calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Clicks Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Call Clicks Over Time (Last 30 Days)</CardTitle>
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
          <CardTitle>Top 10 Celebrities by Call Clicks</CardTitle>
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
          <CardTitle>Celebrity Call Click Statistics</CardTitle>
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

      {/* Individual Click Records */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Call Click Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Celebrity</TableHead>
                  <TableHead>Click Date & Time</TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>User IP</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser/OS</TableHead>
                  <TableHead>Screen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClicks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No clicks found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClicks.map((click) => (
                    <TableRow key={click.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(click.celebrity?.profile_picture_path)} />
                            <AvatarFallback>
                              {click.celebrity?.stage_name.substring(0, 2).toUpperCase() || 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{click.celebrity?.stage_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(click.clicked_at), 'MMM dd, yyyy')}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(click.clicked_at), 'hh:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                          {click.device_fingerprint || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {click.user_ip || <span className="text-muted-foreground">N/A</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant={click.is_mobile ? "default" : "secondary"} className="w-fit text-xs">
                            {click.device_type || 'Unknown'}
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {click.platform || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{click.browser_name || 'N/A'}</span>
                          <span className="text-xs text-muted-foreground">
                            {click.os_name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {click.screen_width && click.screen_height ? (
                          <span className="text-xs font-mono">
                            {click.screen_width}×{click.screen_height}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredClicks.length)} of {filteredClicks.length} clicks
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCallAnalytics;
