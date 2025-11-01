import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  RefreshCw,
  CreditCard
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import ImageModal from '@/components/ImageModal';
import CelebrityProfileEditor from '@/components/CelebrityProfileEditor';
import { NewSubscriptionModal } from '@/components/NewSubscriptionModal';

interface User {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  stage_name?: string;
  real_name?: string;
  is_verified?: boolean;
  is_available?: boolean;
  user_id?: string;
  profile_picture_path?: string;
  subscription_tier?: string;
  subscription_end?: string;
}

const AllUsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [subscriptionUserId, setSubscriptionUserId] = useState<string | null>(null);
  const { toast } = useToast();

  console.log('AllUsersManagement: Responsive version loaded');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get admin email from Supabase auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.email) {
        throw new Error("Admin session expired. Please sign in again.");
      }
      
      // Call admin-data edge function to get all users
      const response = await fetch(`https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/admin-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTY3NTksImV4cCI6MjA3MTI5Mjc1OX0.Guwh9JOeCCYUsqQfVANA-Kiqwl9yi_jGv92ZARqxl1w`,
        },
        body: JSON.stringify({
          action: 'get_all_users',
          adminEmail: session.user.email
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      setUsers(result.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string, email: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error("Admin session expired. Please sign in again.");
      }
      
      const response = await fetch(`https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/admin-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTY3NTksImV4cCI6MjA3MTI5Mjc1OX0.Guwh9JOeCCYUsqQfVANA-Kiqwl9yi_jGv92ZARqxl1w`,
        },
        body: JSON.stringify({
          action: 'delete_user',
          userId,
          adminEmail: session.user.email
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "User Deleted",
        description: `User ${email} has been deleted successfully.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const toggleUserVerification = async (userId: string, isVerified: boolean) => {
    try {
      // Optimistically update the UI
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.user_id === userId || u.id === userId 
            ? { ...u, is_verified: isVerified } 
            : u
        )
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error("Admin session expired. Please sign in again.");
      }
      
      const response = await fetch(`https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/admin-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwanFjcmhvYWJsc2xsa2dvbmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTY3NTksImV4cCI6MjA3MTI5Mjc1OX0.Guwh9JOeCCYUsqQfVANA-Kiqwl9yi_jGv92ZARqxl1w`,
        },
        body: JSON.stringify({
          action: 'toggle_user_verification',
          userId,
          isVerified,
          adminEmail: session.user.email
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        // Revert optimistic update on error
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.user_id === userId || u.id === userId 
              ? { ...u, is_verified: !isVerified } 
              : u
          )
        );
        throw new Error(result.message);
      }

      toast({
        title: isVerified ? "User Verified" : "User Unverified",
        description: `User verification status updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user verification.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.real_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'verified' && user.is_verified) ||
      (filterStatus === 'pending' && !user.is_verified);
    
    return matchesSearch && matchesFilter;
  });

  const verifiedCount = users.filter(u => u.is_verified).length;
  const pendingCount = users.filter(u => !u.is_verified).length;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionLabel = (tier?: string) => {
    if (!tier) return 'No Subscription';
    const labels: Record<string, string> = {
      vip_elite: 'VIP Elite',
      prime_plus: 'Prime Plus',
      basic_pro: 'Basic Pro',
      starter: 'Starter',
    };
    return labels[tier] || tier;
  };

  const getSubscriptionVariant = (tier?: string): "default" | "secondary" | "destructive" | "outline" => {
    if (!tier) return 'secondary';
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      vip_elite: 'default',
      prime_plus: 'default',
      basic_pro: 'outline',
      starter: 'outline',
    };
    return variants[tier] || 'secondary';
  };

  const getProfileImageUrl = (profilePicturePath?: string) => {
    if (!profilePicturePath) return undefined;
    if (profilePicturePath.startsWith('http')) return profilePicturePath;
    return `https://kpjqcrhoablsllkgonbl.supabase.co/storage/v1/object/public/celebrity-photos/${profilePicturePath}`;
  };

  const handleProfilePictureClick = (user: User) => {
    const imageUrl = getProfileImageUrl(user.profile_picture_path);
    if (imageUrl) {
      setSelectedImage({ 
        url: imageUrl, 
        title: user.stage_name || user.real_name || 'Profile Picture' 
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>All Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-base sm:text-lg lg:text-xl">User Management ({users.length})</span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={fetchUsers} variant="outline" size="default" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {/* Filter Tabs */}
        <div className="flex flex-col gap-2 mb-4 sm:mb-6 border-b pb-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'ghost'}
            size="default"
            onClick={() => setFilterStatus('all')}
            className="flex items-center justify-center space-x-2 w-full"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs sm:text-sm">All Users ({users.length})</span>
          </Button>
          <Button
            variant={filterStatus === 'verified' ? 'default' : 'ghost'}
            size="default"
            onClick={() => setFilterStatus('verified')}
            className="flex items-center justify-center space-x-2 w-full"
          >
            <UserCheck className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Verified ({verifiedCount})</span>
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'ghost'}
            size="default"
            onClick={() => setFilterStatus('pending')}
            className="flex items-center justify-center space-x-2 w-full"
          >
            <UserX className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Pending ({pendingCount})</span>
          </Button>
        </div>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-3">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar 
                      className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                      onClick={() => handleProfilePictureClick(user)}
                    >
                      <AvatarImage 
                        src={getProfileImageUrl(user.profile_picture_path)} 
                        alt={user.stage_name || 'User'}
                      />
                      <AvatarFallback className="text-sm">
                        {(user.stage_name || user.real_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.stage_name || 'No stage name'}</p>
                      {user.real_name && (
                        <p className="text-xs text-muted-foreground truncate">{user.real_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span>Created: {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={user.is_verified ? "default" : "secondary"} className="text-xs">
                        {user.is_verified ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                        {user.is_verified ? "Verified" : "Pending"}
                      </Badge>
                      <Badge variant={getSubscriptionVariant(user.subscription_tier)} className="text-xs">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {getSubscriptionLabel(user.subscription_tier)}
                      </Badge>
                      <Switch
                        checked={user.is_verified || false}
                        onCheckedChange={(checked) => toggleUserVerification(user.user_id || user.id, checked)}
                        title={user.is_verified ? "Unverify user" : "Verify user"}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSubscriptionUserId(user.id)}
                        title="Manage subscription"
                      >
                        <CreditCard className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingUserId(user.id)}
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete user "{user.stage_name || user.email}"? 
                              This will permanently delete their account and all associated data. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(user.user_id || user.id, user.email || '')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">User</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm hidden md:table-cell">Contact</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Status</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm hidden lg:table-cell">Dates</th>
                    <th className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Avatar 
                            className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                            onClick={() => handleProfilePictureClick(user)}
                          >
                            <AvatarImage 
                              src={getProfileImageUrl(user.profile_picture_path)} 
                              alt={user.stage_name || 'User'}
                            />
                            <AvatarFallback className="text-xs">
                              {(user.stage_name || user.real_name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-medium text-xs sm:text-sm truncate">{user.stage_name || 'No stage name'}</p>
                            {user.real_name && (
                              <p className="text-xs text-muted-foreground truncate">{user.real_name}</p>
                            )}
                            <p className="text-xs text-muted-foreground font-mono truncate md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="text-xs sm:text-sm truncate max-w-[200px]">{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="text-xs sm:text-sm">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                       <td className="p-2 sm:p-3">
                        <div className="space-y-1 sm:space-y-2">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <Badge variant={user.is_verified ? "default" : "secondary"} className="text-xs">
                              {user.is_verified ? <UserCheck className="h-3 w-3 sm:mr-1" /> : <UserX className="h-3 w-3 sm:mr-1" />}
                              <span className="hidden sm:inline">{user.is_verified ? "Verified" : "Pending"}</span>
                            </Badge>
                            <Switch
                              checked={user.is_verified || false}
                              onCheckedChange={(checked) => toggleUserVerification(user.user_id || user.id, checked)}
                              title={user.is_verified ? "Unverify user" : "Verify user"}
                              className="scale-75 sm:scale-100"
                            />
                          </div>
                          <Badge variant={user.is_available ? "outline" : "destructive"} className="text-xs hidden sm:inline-flex">
                            {user.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 hidden lg:table-cell">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Created: {formatDate(user.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Last: {formatDate(user.last_sign_in_at)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingUserId(user.id)}
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete user "{user.stage_name || user.email}"? 
                                  This will permanently delete their account and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(user.user_id || user.id, user.email || '')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Image Modal */}
        <ImageModal
          imageUrl={selectedImage?.url || ''}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={selectedImage?.title}
        />

        {/* Celebrity Profile Editor */}
        {editingUserId && (
          <CelebrityProfileEditor
            open={!!editingUserId}
            onOpenChange={(open) => {
              if (!open) setEditingUserId(null);
            }}
            celebrityId={editingUserId}
            onSave={() => {
              fetchUsers();
              setEditingUserId(null);
            }}
          />
        )}

        {/* Subscription Management Modal */}
        {subscriptionUserId && (
          <NewSubscriptionModal
            open={!!subscriptionUserId}
            onOpenChange={(open) => {
              if (!open) setSubscriptionUserId(null);
            }}
            celebrityId={subscriptionUserId}
            onSubmit={async (tier: string, duration: string, mpesaCode: string, phoneNumber: string, expectedAmount: number) => {
              try {
                // Convert local phone format to international format
                const formatPhoneNumber = (phone: string): string => {
                  const cleaned = phone.trim().replace(/\s+/g, '');
                  if (cleaned.startsWith('0')) return '+254' + cleaned.substring(1);
                  if (cleaned.startsWith('254')) return '+' + cleaned;
                  if (cleaned.startsWith('+')) return cleaned;
                  return '+254' + cleaned;
                };

                const { data, error } = await supabase.functions.invoke('payment-verification', {
                  body: {
                    celebrityId: subscriptionUserId,
                    phoneNumber: formatPhoneNumber(phoneNumber),
                    mpesaCode: mpesaCode.trim().toUpperCase(),
                    amount: expectedAmount,
                    expectedAmount: expectedAmount,
                    tier: tier,
                    duration: duration,
                    paymentType: 'subscription'
                  }
                });

                if (error) throw error;

                if (!data.success) {
                  throw new Error(data.message || 'Failed to submit payment verification');
                }

                if (data.warning) {
                  toast({
                    title: data.payment_status === 'underpaid' ? "Payment Insufficient" : "Payment Received",
                    description: data.warning,
                    variant: data.payment_status === 'underpaid' ? 'destructive' : 'default',
                  });
                } else {
                  toast({
                    title: "Payment Verification Submitted",
                    description: `The ${tier} plan payment verification has been submitted successfully.`,
                  });
                }

                fetchUsers();
              } catch (error: any) {
                console.error('Payment submission error:', error);
                toast({
                  title: "Payment Submission Failed",
                  description: error.message || "Failed to submit payment verification",
                  variant: "destructive"
                });
                throw error;
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AllUsersManagement;