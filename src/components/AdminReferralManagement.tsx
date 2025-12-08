import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Copy, Users, Link2, RefreshCw, Eye, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { format } from 'date-fns';

interface Marketer {
  id: string;
  name: string;
  email: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  total_referrals?: number;
}

interface ReferredUser {
  id: string;
  user_email: string;
  joined_at: string;
  celebrity_profile_id?: string;
  celebrity_profile?: {
    stage_name: string;
  };
}

const AdminReferralManagement = () => {
  const [marketers, setMarketers] = useState<Marketer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [creating, setCreating] = useState(false);

  const baseUrl = window.location.origin;

  useEffect(() => {
    fetchMarketers();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('referral-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketers' }, () => fetchMarketers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referred_users' }, () => {
        fetchMarketers();
        if (selectedMarketer) {
          fetchReferredUsers(selectedMarketer.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMarketers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_marketer_referral_stats');

      if (error) throw error;

      const formattedData = (data || []).map((m: any) => ({
        id: m.marketer_id,
        name: m.marketer_name,
        email: m.marketer_email,
        referral_code: m.referral_code,
        is_active: m.is_active,
        created_at: m.created_at,
        total_referrals: Number(m.total_referrals) || 0
      }));

      setMarketers(formattedData);
    } catch (error: any) {
      console.error('Error fetching marketers:', error);
      toast({
        title: "Error",
        description: "Failed to load marketers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferredUsers = async (marketerId: string) => {
    try {
      setLoadingReferrals(true);
      const { data, error } = await supabase
        .from('referred_users')
        .select(`
          id,
          user_email,
          joined_at,
          celebrity_profile_id,
          celebrity_profiles:celebrity_profile_id (
            stage_name
          )
        `)
        .eq('marketer_id', marketerId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((r: any) => ({
        id: r.id,
        user_email: r.user_email,
        joined_at: r.joined_at,
        celebrity_profile_id: r.celebrity_profile_id,
        celebrity_profile: r.celebrity_profiles
      }));

      setReferredUsers(formatted);
    } catch (error: any) {
      console.error('Error fetching referred users:', error);
      toast({
        title: "Error",
        description: "Failed to load referred users",
        variant: "destructive"
      });
    } finally {
      setLoadingReferrals(false);
    }
  };

  const generateReferralCode = async (name: string): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_referral_code', { marketer_name: name });
    if (error) throw error;
    return data as string;
  };

  const handleCreateMarketer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      
      const referralCode = await generateReferralCode(formData.name);
      
      const { error } = await supabase
        .from('marketers')
        .insert({
          name: formData.name,
          email: formData.email,
          referral_code: referralCode
        });

      if (error) throw error;

      toast({
        title: "Marketer Created",
        description: `Referral code: ${referralCode}`,
      });

      setFormData({ name: '', email: '' });
      setIsAddDialogOpen(false);
      fetchMarketers();
    } catch (error: any) {
      console.error('Error creating marketer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create marketer",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const copyReferralLink = (referralCode: string) => {
    const link = `${baseUrl}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const toggleMarketerStatus = async (marketer: Marketer) => {
    try {
      const { error } = await supabase
        .from('marketers')
        .update({ is_active: !marketer.is_active })
        .eq('id', marketer.id);

      if (error) throw error;

      toast({
        title: marketer.is_active ? "Marketer Deactivated" : "Marketer Activated",
        description: `${marketer.name} has been ${marketer.is_active ? 'deactivated' : 'activated'}`,
      });

      fetchMarketers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update marketer status",
        variant: "destructive"
      });
    }
  };

  const deleteMarketer = async (marketer: Marketer) => {
    if (!confirm(`Are you sure you want to delete ${marketer.name}? This will also remove all referral records.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('marketers')
        .delete()
        .eq('id', marketer.id);

      if (error) throw error;

      toast({
        title: "Marketer Deleted",
        description: `${marketer.name} has been removed`,
      });

      fetchMarketers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete marketer",
        variant: "destructive"
      });
    }
  };

  const viewReferrals = (marketer: Marketer) => {
    setSelectedMarketer(marketer);
    fetchReferredUsers(marketer.id);
    setIsViewDialogOpen(true);
  };

  const filteredMarketers = marketers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReferrals = marketers.reduce((sum, m) => sum + (m.total_referrals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marketers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketers.length}</div>
            <p className="text-xs text-muted-foreground">
              {marketers.filter(m => m.is_active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              Users referred
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {marketers.length > 0 && marketers[0].total_referrals 
                ? marketers[0].name 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {marketers.length > 0 && marketers[0].total_referrals 
                ? `${marketers[0].total_referrals} referrals` 
                : 'No referrals yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Referral Marketing</CardTitle>
              <CardDescription>Manage your marketing team and track referrals</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchMarketers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Marketer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Marketer</DialogTitle>
                    <DialogDescription>
                      Create a new marketer with an auto-generated referral code
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMarketer} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g., john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Marketer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search marketers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMarketers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No marketers found matching your search' : 'No marketers yet. Add your first marketer to get started.'}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead className="text-center">Referrals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMarketers.map((marketer) => (
                    <TableRow key={marketer.id}>
                      <TableCell className="font-medium">{marketer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{marketer.email}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{marketer.referral_code}</code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={marketer.total_referrals ? "default" : "secondary"}>
                          {marketer.total_referrals || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={marketer.is_active ? "default" : "secondary"}>
                          {marketer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(marketer.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyReferralLink(marketer.referral_code)}
                            title="Copy referral link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewReferrals(marketer)}
                            title="View referrals"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMarketerStatus(marketer)}
                            title={marketer.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {marketer.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMarketer(marketer)}
                            title="Delete marketer"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Referrals Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Referrals by {selectedMarketer?.name}
            </DialogTitle>
            <DialogDescription>
              Referral code: <code className="bg-muted px-2 py-1 rounded">{selectedMarketer?.referral_code}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {loadingReferrals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : referredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users referred yet
              </div>
            ) : (
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Email</TableHead>
                      <TableHead>Stage Name</TableHead>
                      <TableHead>Joined At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.user_email}</TableCell>
                        <TableCell>
                          {user.celebrity_profile?.stage_name || (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.joined_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReferralManagement;
