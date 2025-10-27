import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MessageCircle, TrendingUp, Users, CalendarIcon, Filter, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [allClicks, setAllClicks] = useState<WhatsAppClick[]>([]);
  const [celebrityStats, setCelebrityStats] = useState<CelebrityClickStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyClickStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [allCelebrities, setAllCelebrities] = useState<{ id: string; stage_name: string }[]>([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedCelebrity, setSelectedCelebrity] = useState<string>('all');

  useEffect(() => {
    fetchWhatsAppAnalytics();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allClicks, dateRange, startDate, endDate, selectedCelebrity]);

  const handleDateRangeChange = (range: '7days' | '30days' | '90days' | 'all' | 'custom') => {
    setDateRange(range);
    const now = new Date();
    
    switch (range) {
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case '90days':
        setStartDate(subDays(now, 90));
        setEndDate(now);
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      // custom: user will set dates manually
    }
  };

  const applyFilters = () => {
    let filtered = [...allClicks];

    // Filter by date range
    if (startDate && endDate) {
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);
      filtered = filtered.filter(click => {
        const clickDate = new Date(click.clicked_at);
        return clickDate >= start && clickDate <= end;
      });
    }

    // Filter by celebrity
    if (selectedCelebrity !== 'all') {
      filtered = filtered.filter(click => click.celebrity_id === selectedCelebrity);
    }

    setClicks(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (filteredClicks: WhatsAppClick[]) => {
    setTotalClicks(filteredClicks.length);

    // Calculate celebrity-wise statistics
    const statsMap = new Map<string, CelebrityClickStats>();
    
    filteredClicks.forEach(click => {
      const celebId = click.celebrity_id;
      const existing = statsMap.get(celebId);
      
      if (existing) {
        existing.total_clicks++;
        // Count clicks in last 7 days
        const clickDate = new Date(click.clicked_at);
        const weekAgo = subDays(new Date(), 7);
        if (clickDate >= weekAgo) {
          existing.recent_clicks++;
        }
      } else {
        const clickDate = new Date(click.clicked_at);
        const weekAgo = subDays(new Date(), 7);
        
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

    // Calculate daily statistics
    const dailyMap = new Map<string, number>();
    const daysToShow = dateRange === 'all' ? 90 : dateRange === '90days' ? 90 : dateRange === '30days' ? 30 : 7;
    const startDate = subDays(new Date(), daysToShow);

    filteredClicks.forEach(click => {
      const clickDate = new Date(click.clicked_at);
      if (clickDate >= startDate) {
        const dateKey = format(clickDate, 'yyyy-MM-dd');
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
      }
    });

    const dailyStatsArray: DailyClickStats[] = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dailyStatsArray.push({
        date: format(date, 'MMM dd'),
        clicks: dailyMap.get(dateKey) || 0
      });
    }

    setDailyStats(dailyStatsArray);
  };

  const fetchWhatsAppAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all WhatsApp clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('whatsapp_clicks')
        .select('*')
        .order('clicked_at', { ascending: false });

      if (clicksError) {
        console.error('Error fetching WhatsApp clicks:', clicksError);
        throw clicksError;
      }

      // Fetch celebrity profiles separately
      const { data: celebritiesData, error: celebritiesError } = await supabase
        .from('celebrity_profiles')
        .select('id, stage_name, profile_picture_path');

      if (celebritiesError) {
        console.error('Error fetching celebrity profiles:', celebritiesError);
      }

      // Store all celebrities for filter dropdown
      setAllCelebrities(celebritiesData || []);

      // Join clicks with celebrity data manually
      const processedClicks = (clicksData || []).map(click => {
        const celebrity = celebritiesData?.find(c => c.id === click.celebrity_id);
        return {
          ...click,
          celebrity: celebrity || { stage_name: 'Unknown', profile_picture_path: null }
        };
      });

      setAllClicks(processedClicks);
      setClicks(processedClicks);

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
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Quick Date Range Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={dateRange === '7days' ? 'default' : 'outline'}
                  onClick={() => handleDateRangeChange('7days')}
                >
                  7 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === '30days' ? 'default' : 'outline'}
                  onClick={() => handleDateRangeChange('30days')}
                >
                  30 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === '90days' ? 'default' : 'outline'}
                  onClick={() => handleDateRangeChange('90days')}
                >
                  90 Days
                </Button>
                <Button
                  size="sm"
                  variant={dateRange === 'all' ? 'default' : 'outline'}
                  onClick={() => handleDateRangeChange('all')}
                >
                  All Time
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                    onClick={() => setDateRange('custom')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setDateRange('custom');
                    }}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                    onClick={() => setDateRange('custom')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setDateRange('custom');
                    }}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Celebrity Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Celebrity</label>
              <Select value={selectedCelebrity} onValueChange={setSelectedCelebrity}>
                <SelectTrigger>
                  <SelectValue placeholder="All Celebrities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Celebrities</SelectItem>
                  {allCelebrities.map((celeb) => (
                    <SelectItem key={celeb.id} value={celeb.id}>
                      {celeb.stage_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Summary */}
          <div className="mt-4 flex flex-wrap gap-2">
            {dateRange === 'custom' && startDate && endDate && (
              <Badge variant="secondary" className="gap-1">
                {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleDateRangeChange('30days')}
                />
              </Badge>
            )}
            {selectedCelebrity !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                {allCelebrities.find(c => c.id === selectedCelebrity)?.stage_name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCelebrity('all')}
                />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

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
            <CardTitle className="text-sm font-medium">
              {dateRange === '7days' ? 'Last 7 Days' : 
               dateRange === '30days' ? 'Last 30 Days' : 
               dateRange === '90days' ? 'Last 90 Days' : 
               dateRange === 'custom' && startDate && endDate ? 'Selected Period' : 
               'Recent Period'}
            </CardTitle>
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
          <CardTitle>
            WhatsApp Clicks Over Time 
            {dateRange === '7days' && ' (Last 7 Days)'}
            {dateRange === '30days' && ' (Last 30 Days)'}
            {dateRange === '90days' && ' (Last 90 Days)'}
            {dateRange === 'all' && ' (All Time)'}
            {dateRange === 'custom' && startDate && endDate && ` (${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')})`}
          </CardTitle>
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
                <TableHead>Recent Activity</TableHead>
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
