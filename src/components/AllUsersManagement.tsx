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
  CreditCard,
  LayoutGrid,
  Table as TableIcon,
  CheckSquare,
  Square,
  Trash,
  CheckCircle2,
  XCircle,
  MessageCircle
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
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

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const bulkVerify = async () => {
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        await toggleUserVerification(userId, true);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedUsers(new Set());
    toast({
      title: "Bulk Verification Complete",
      description: `${successCount} users verified${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
    fetchUsers();
  };

  const bulkUnverify = async () => {
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      try {
        await toggleUserVerification(userId, false);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedUsers(new Set());
    toast({
      title: "Bulk Unverification Complete",
      description: `${successCount} users unverified${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
    fetchUsers();
  };

  const bulkDelete = async () => {
    const userIds = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
      const user = users.find(u => u.id === userId);
      try {
        await deleteUser(user?.user_id || userId, user?.email || '');
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedUsers(new Set());
    toast({
      title: "Bulk Deletion Complete",
      description: `${successCount} users deleted${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
    fetchUsers();
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

  const sendWhatsAppReminder = (phone?: string, stageName?: string) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This user doesn't have a phone number on file.",
        variant: "destructive"
      });
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    
    // Create message with link to site
    const message = `Hi${stageName ? ' ' + stageName : ''}! Complete your registration at ${window.location.origin}`;
    
    // Create WhatsApp link
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
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
        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" size="sm" className="flex-1 sm:flex-none">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Verify Selected Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to verify {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}? 
                        This will make them visible on the platform.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={bulkVerify}>
                        Verify Users
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <XCircle className="h-4 w-4 mr-2" />
                      Unverify All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unverify Selected Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unverify {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}? 
                        This will hide them from the platform.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={bulkUnverify}>
                        Unverify Users
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}? 
                        This action cannot be undone and will permanently delete their accounts and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={bulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Users
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Tabs */}
        <div className="flex flex-col gap-2 mb-4 sm:mb-6 border-b pb-2">
          <div className="flex gap-2 mb-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="flex items-center space-x-2 flex-1"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Cards</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center space-x-2 flex-1"
            >
              <TableIcon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Table</span>
            </Button>
          </div>
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
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="p-3">
                    <div className="flex items-start gap-3 mb-3">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        className="mt-1"
                      />
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
                      {!user.is_verified && user.phone && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => sendWhatsAppReminder(user.phone, user.stage_name)}
                          title="Send WhatsApp reminder"
                        >
                          <MessageCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
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
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Subscription</TableHead>
                      <TableHead className="hidden lg:table-cell">Dates</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar 
                              className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleProfilePictureClick(user)}
                            >
                              <AvatarImage 
                                src={getProfileImageUrl(user.profile_picture_path)} 
                                alt={user.stage_name || 'User'}
                              />
                              <AvatarFallback>
                                {(user.stage_name || user.real_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium text-sm truncate">{user.stage_name || 'No stage name'}</p>
                              {user.real_name && (
                                <p className="text-xs text-muted-foreground truncate">{user.real_name}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {user.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="text-sm truncate max-w-[200px]">{user.email}</span>
                              </div>
                            )}
                            {user.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="text-sm">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={user.is_verified ? "default" : "secondary"} className="text-xs">
                                {user.is_verified ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                                {user.is_verified ? "Verified" : "Pending"}
                              </Badge>
                              <Switch
                                checked={user.is_verified || false}
                                onCheckedChange={(checked) => toggleUserVerification(user.user_id || user.id, checked)}
                                title={user.is_verified ? "Unverify user" : "Verify user"}
                              />
                            </div>
                            <Badge variant={user.is_available ? "outline" : "destructive"} className="text-xs">
                              {user.is_available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={getSubscriptionVariant(user.subscription_tier)} className="text-xs">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {getSubscriptionLabel(user.subscription_tier)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
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
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {!user.is_verified && user.phone && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => sendWhatsAppReminder(user.phone, user.stage_name)}
                                title="Send WhatsApp reminder"
                              >
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
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
                              title="Edit profile"
                            >
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Delete user">
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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