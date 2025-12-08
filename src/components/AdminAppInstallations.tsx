import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Smartphone, Tablet, Monitor, Search, Download } from 'lucide-react';
import { format } from 'date-fns';

interface AppInstallation {
  id: string;
  user_ip: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  screen_width: number | null;
  screen_height: number | null;
  platform: string | null;
  language: string | null;
  timezone: string | null;
  is_mobile: boolean | null;
  is_tablet: boolean | null;
  installed_at: string;
  referral_code: string | null;
  device_fingerprint: string | null;
  user_latitude: number | null;
  user_longitude: number | null;
  user_city: string | null;
  user_region: string | null;
  user_country_name: string | null;
  location_permission_granted: boolean | null;
}

export const AdminAppInstallations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: installations, isLoading } = useQuery({
    queryKey: ['app-installations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_installations')
        .select('*')
        .order('installed_at', { ascending: false });

      if (error) throw error;
      return data as AppInstallation[];
    },
  });

  const filteredInstallations = installations?.filter((install) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      install.user_ip?.toLowerCase().includes(searchLower) ||
      install.device_type?.toLowerCase().includes(searchLower) ||
      install.browser_name?.toLowerCase().includes(searchLower) ||
      install.os_name?.toLowerCase().includes(searchLower) ||
      install.platform?.toLowerCase().includes(searchLower) ||
      install.device_fingerprint?.toLowerCase().includes(searchLower)
    );
  });

  const getDeviceIcon = (install: AppInstallation) => {
    if (install.is_tablet) return <Tablet className="h-4 w-4" />;
    if (install.is_mobile) return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const stats = {
    total: installations?.length || 0,
    mobile: installations?.filter(i => i.is_mobile && !i.is_tablet).length || 0,
    tablet: installations?.filter(i => i.is_tablet).length || 0,
    desktop: installations?.filter(i => !i.is_mobile && !i.is_tablet).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">App Installations</h2>
          <p className="text-muted-foreground">Track users who installed the PWA</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Installs</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mobile</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              {stats.mobile}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tablet</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Tablet className="h-5 w-5 text-purple-500" />
              {stats.tablet}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Desktop</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Monitor className="h-5 w-5 text-green-500" />
              {stats.desktop}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by IP, device, browser, OS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Installations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Records</CardTitle>
          <CardDescription>
            Detailed information about each app installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredInstallations?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No installations found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Screen</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Installed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallations?.map((install) => (
                    <TableRow key={install.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(install)}
                          <span className="capitalize">{install.device_type || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                          {install.device_fingerprint || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {install.user_city || install.user_region ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{install.user_city || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              {[install.user_region, install.user_country_name].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <Badge variant={install.location_permission_granted ? "secondary" : "outline"} className="text-xs">
                            {install.location_permission_granted ? 'No data' : 'Denied'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {install.user_ip || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        {install.browser_name ? (
                          <span>{install.browser_name} {install.browser_version}</span>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {install.os_name ? (
                          <span>{install.os_name} {install.os_version}</span>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {install.screen_width && install.screen_height ? (
                          <span className="text-xs">
                            {install.screen_width}×{install.screen_height}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {install.platform || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {install.referral_code ? (
                          <Badge variant="secondary">{install.referral_code}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(install.installed_at), 'MMM d, yyyy HH:mm')}
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
};