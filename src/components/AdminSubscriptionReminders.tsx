import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Send, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderLog {
  id: string;
  celebrity_id: string;
  subscription_id: string;
  reminder_type: '3_days' | '1_day' | 'expiry_day';
  phone_number: string;
  message_sent: string;
  sent_at: string;
  twilio_message_sid: string | null;
  status: 'sent' | 'delivered' | 'failed' | 'undelivered';
  celebrity_profiles?: {
    stage_name: string;
  };
}

const AdminSubscriptionReminders = () => {
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReminderLogs();
  }, []);

  const fetchReminderLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_reminder_logs')
        .select(`
          *,
          celebrity_profiles!inner(stage_name)
        `)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReminderLogs((data || []) as ReminderLog[]);
    } catch (error) {
      console.error('Error fetching reminder logs:', error);
      toast({
        title: "Error",
        description: "Failed to load reminder logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRemindersNow = async () => {
    setSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-subscription-reminders');

      if (error) throw error;

      toast({
        title: "Reminders Sent",
        description: data.message || "Reminders have been sent successfully",
      });

      // Refresh logs
      await fetchReminderLogs();
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send reminders. Check function logs.",
        variant: "destructive",
      });
    } finally {
      setSendingReminders(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReminderLogs();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Reminder logs have been updated",
    });
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case '3_days': return '3 Days Before';
      case '1_day': return '1 Day Before';
      case 'expiry_day': return 'Expiry Day';
      default: return type;
    }
  };

  const getReminderTypeBadge = (type: string) => {
    switch (type) {
      case '3_days': 
        return <Badge variant="outline" className="bg-blue-50">3 Days</Badge>;
      case '1_day': 
        return <Badge variant="outline" className="bg-orange-50">1 Day</Badge>;
      case 'expiry_day': 
        return <Badge variant="destructive">Expiry Day</Badge>;
      default: 
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> {status}</Badge>;
      case 'failed':
      case 'undelivered':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: reminderLogs.length,
    sent: reminderLogs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
    failed: reminderLogs.filter(l => l.status === 'failed' || l.status === 'undelivered').length,
    today: reminderLogs.filter(l => 
      new Date(l.sent_at).toDateString() === new Date().toDateString()
    ).length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscription Reminders</h2>
          <p className="text-muted-foreground">
            Automated WhatsApp notifications sent at 3 days, 1 day, and on expiry
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSendRemindersNow}
            disabled={sendingReminders}
            variant="default"
          >
            {sendingReminders ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reminders Now
              </>
            )}
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Delivered successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Failed to deliver</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Sent today</p>
          </CardContent>
        </Card>
      </div>

      {/* Reminder Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Schedule</CardTitle>
          <CardDescription>Reminders are sent automatically every day at 9:00 AM</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">3 Days Before</Badge>
              <span className="text-sm text-muted-foreground">Friendly reminder to renew</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-50">1 Day Before</Badge>
              <span className="text-sm text-muted-foreground">Urgent renewal reminder</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Expiry Day</Badge>
              <span className="text-sm text-muted-foreground">Final notice before profile removal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder History</CardTitle>
          <CardDescription>Recent WhatsApp reminders sent to celebrities</CardDescription>
        </CardHeader>
        <CardContent>
          {reminderLogs.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No reminders sent yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Reminders will be sent automatically at 9 AM daily
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Celebrity</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Reminder Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Message SID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminderLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="font-medium">
                          {log.celebrity_profiles?.stage_name || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.phone_number}
                        </span>
                      </TableCell>
                      <TableCell>{getReminderTypeBadge(log.reminder_type)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground">
                          {log.twilio_message_sid ? 
                            log.twilio_message_sid.substring(0, 12) + '...' : 
                            'N/A'
                          }
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
    </div>
  );
};

export default AdminSubscriptionReminders;