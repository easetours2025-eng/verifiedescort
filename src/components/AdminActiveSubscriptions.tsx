import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Gem, Sparkles, Star, Search, Calendar, CheckCircle, XCircle, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";

interface Subscription {
  id: string;
  celebrity_id: string;
  subscription_tier: string;
  duration_type: string;
  amount_paid: number;
  is_active: boolean;
  subscription_start: string;
  subscription_end: string;
  celebrity?: {
    stage_name: string;
    email: string;
  };
}

const tierIcons = {
  vip_elite: <Crown className="w-5 h-5 text-yellow-500" />,
  prime_plus: <Gem className="w-5 h-5 text-purple-500" />,
  basic_pro: <Sparkles className="w-5 h-5 text-blue-500" />,
  starter: <Star className="w-5 h-5 text-green-500" />,
};

const tierLabels = {
  vip_elite: "VIP Elite",
  prime_plus: "Prime Plus",
  basic_pro: "Basic Pro",
  starter: "Starter",
};

export default function AdminActiveSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    subscription_end: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("celebrity_subscriptions")
        .select(`
          *,
          celebrity:celebrity_profiles(stage_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setEditForm({
      subscription_end: subscription.subscription_end ? new Date(subscription.subscription_end).toISOString().split('T')[0] : "",
      is_active: subscription.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return;

    try {
      const { error } = await supabase
        .from("celebrity_subscriptions")
        .update({
          subscription_end: new Date(editForm.subscription_end).toISOString(),
          is_active: editForm.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSubscription.id);

      if (error) throw error;

      toast.success("Subscription updated successfully");
      setIsEditDialogOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const handleToggleStatus = async (subscription: Subscription) => {
    try {
      const { error } = await supabase
        .from("celebrity_subscriptions")
        .update({
          is_active: !subscription.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success(`Subscription ${!subscription.is_active ? 'activated' : 'deactivated'}`);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error toggling subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      const { error } = await supabase
        .from("celebrity_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Subscription deleted successfully");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to delete subscription");
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const query = searchQuery.toLowerCase();
    return (
      sub.celebrity?.stage_name?.toLowerCase().includes(query) ||
      sub.celebrity?.email?.toLowerCase().includes(query) ||
      sub.subscription_tier.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.is_active).length,
    expired: subscriptions.filter(s => s.subscription_end && isExpired(s.subscription_end)).length,
    revenue: subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0),
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Active Subscriptions</h2>
          <p className="text-muted-foreground">Manage celebrity subscription status and features</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by celebrity name, email, or tier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Celebrity</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => {
                const daysRemaining = subscription.subscription_end ? getDaysRemaining(subscription.subscription_end) : 0;
                const expired = subscription.subscription_end ? isExpired(subscription.subscription_end) : false;

                return (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.celebrity?.stage_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{subscription.celebrity?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tierIcons[subscription.subscription_tier as keyof typeof tierIcons]}
                        <span>{tierLabels[subscription.subscription_tier as keyof typeof tierLabels]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subscription.duration_type === '1_week' && '1 Week'}
                        {subscription.duration_type === '2_weeks' && '2 Weeks'}
                        {subscription.duration_type === '1_month' && '1 Month'}
                      </Badge>
                    </TableCell>
                    <TableCell>KSH {subscription.amount_paid?.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4" />
                        {subscription.subscription_start ? formatDate(subscription.subscription_start) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4" />
                          {subscription.subscription_end ? formatDate(subscription.subscription_end) : 'N/A'}
                        </div>
                        {!expired && daysRemaining > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {daysRemaining} days left
                          </Badge>
                        )}
                        {expired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.is_active ? "default" : "secondary"}>
                        {subscription.is_active ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subscription)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={subscription.is_active ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(subscription)}
                        >
                          {subscription.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Subscription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the subscription.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSubscription(subscription.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No subscriptions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {editingSubscription?.celebrity?.stage_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={editForm.subscription_end}
                onChange={(e) => setEditForm({ ...editForm, subscription_end: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateSubscription} className="flex-1">
                Update Subscription
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
