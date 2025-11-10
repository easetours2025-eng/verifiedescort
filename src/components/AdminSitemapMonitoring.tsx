import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, Globe, Database, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

interface SitemapCache {
  id: number;
  sitemap_xml: string;
  created_at: string;
}

interface SearchEnginePing {
  id: number;
  last_ping_at: string | null;
  ping_count: number;
}

interface SitemapLog {
  id: number;
  action: string;
  trigger_reason: string | null;
  celebrity_id: string | null;
  created_at: string;
}

const AdminSitemapMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sitemapCache, setSitemapCache] = useState<SitemapCache | null>(null);
  const [searchEnginePing, setSearchEnginePing] = useState<SearchEnginePing | null>(null);
  const [sitemapLogs, setSitemapLogs] = useState<SitemapLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sitemap cache
      const { data: cacheData, error: cacheError } = await supabase
        .from('sitemap_cache')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (cacheError && cacheError.code !== 'PGRST116') {
        console.error('Error fetching sitemap cache:', cacheError);
      } else {
        setSitemapCache(cacheData);
      }

      // Fetch search engine ping status
      const { data: pingData, error: pingError } = await supabase
        .from('search_engine_pings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (pingError && pingError.code !== 'PGRST116') {
        console.error('Error fetching search engine pings:', pingError);
      } else {
        setSearchEnginePing(pingData);
      }

      // Fetch recent sitemap logs (last 50)
      const { data: logsData, error: logsError } = await supabase
        .from('sitemap_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Error fetching sitemap logs:', logsError);
      } else {
        setSitemapLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error fetching sitemap data:', error);
      toast({
        title: "Error",
        description: "Failed to load sitemap monitoring data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Sitemap monitoring data has been updated.",
    });
  };

  const triggerManualPing = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('ping-search-engines');

      if (error) throw error;

      toast({
        title: "Search Engines Pinged",
        description: "Google and Bing have been notified of sitemap updates.",
      });

      // Refresh data after ping
      await fetchData();
    } catch (error) {
      console.error('Error pinging search engines:', error);
      toast({
        title: "Error",
        description: "Failed to ping search engines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'cache_invalidated':
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Cache Cleared</Badge>;
      case 'ping_failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Ping Failed</Badge>;
      case 'ping_success':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Ping Success</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getCacheStatus = () => {
    if (!sitemapCache) {
      return { status: 'No Cache', variant: 'secondary' as const, icon: <Database className="h-4 w-4" /> };
    }

    const cacheAge = new Date().getTime() - new Date(sitemapCache.created_at).getTime();
    const oneHour = 60 * 60 * 1000;

    if (cacheAge < oneHour) {
      return { status: 'Fresh', variant: 'default' as const, icon: <CheckCircle className="h-4 w-4" /> };
    } else {
      return { status: 'Stale', variant: 'outline' as const, icon: <Clock className="h-4 w-4" /> };
    }
  };

  const getPingStatus = () => {
    if (!searchEnginePing || !searchEnginePing.last_ping_at) {
      return { status: 'Never Pinged', variant: 'secondary' as const, icon: <Globe className="h-4 w-4" /> };
    }

    const pingAge = new Date().getTime() - new Date(searchEnginePing.last_ping_at).getTime();
    const oneHour = 60 * 60 * 1000;

    if (pingAge < oneHour) {
      return { status: 'Recently Pinged', variant: 'default' as const, icon: <CheckCircle className="h-4 w-4" /> };
    } else {
      return { status: 'Ping Outdated', variant: 'outline' as const, icon: <Clock className="h-4 w-4" /> };
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const cacheStatus = getCacheStatus();
  const pingStatus = getPingStatus();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sitemap Health Monitor</h2>
          <p className="text-muted-foreground">
            Monitor sitemap cache, search engine notifications, and system logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={triggerManualPing}
            disabled={refreshing}
            variant="outline"
          >
            <Globe className="h-4 w-4 mr-2" />
            Ping Search Engines
          </Button>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cache Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sitemap Cache
            </CardTitle>
            <CardDescription>XML sitemap cache status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={cacheStatus.variant} className="gap-1">
                {cacheStatus.icon}
                {cacheStatus.status}
              </Badge>
              {sitemapCache && (
                <div className="text-sm text-muted-foreground">
                  <p>Last updated: {formatDistanceToNow(new Date(sitemapCache.created_at), { addSuffix: true })}</p>
                  <p className="mt-1">Size: {(sitemapCache.sitemap_xml.length / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Engine Ping Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Search Engine Pings
            </CardTitle>
            <CardDescription>Google & Bing notification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={pingStatus.variant} className="gap-1">
                {pingStatus.icon}
                {pingStatus.status}
              </Badge>
              {searchEnginePing && (
                <div className="text-sm text-muted-foreground">
                  {searchEnginePing.last_ping_at ? (
                    <p>Last ping: {formatDistanceToNow(new Date(searchEnginePing.last_ping_at), { addSuffix: true })}</p>
                  ) : (
                    <p>Last ping: Never</p>
                  )}
                  <p className="mt-1">Total pings: {searchEnginePing.ping_count}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest sitemap operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{sitemapLogs.length}</div>
              <p className="text-sm text-muted-foreground">
                {sitemapLogs.length > 0 
                  ? `Last activity: ${formatDistanceToNow(new Date(sitemapLogs[0].created_at), { addSuffix: true })}`
                  : 'No activity recorded'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sitemap Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sitemap Activity Logs</CardTitle>
          <CardDescription>
            Recent sitemap cache invalidations and search engine notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sitemapLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sitemap activity logs found</p>
              <p className="text-sm mt-2">Logs will appear when celebrity profiles are updated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Trigger Reason</TableHead>
                    <TableHead>Celebrity ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitemapLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{log.trigger_reason || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.celebrity_id ? log.celebrity_id.substring(0, 8) + '...' : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sitemap URL Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sitemap Configuration</CardTitle>
          <CardDescription>Current sitemap URL and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sitemap URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                  https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/sitemap
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/sitemap');
                    toast({ title: "Copied to clipboard" });
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Robots.txt URL</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                  /robots.txt
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/robots.txt', '_blank')}
                >
                  View
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Cache duration: 1 hour</p>
              <p>• Ping rate limit: Maximum once per hour</p>
              <p>• Auto-invalidation: Triggered on celebrity profile changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSitemapMonitoring;
