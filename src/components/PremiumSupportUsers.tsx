import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HeadphonesIcon, Mail, Share2, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PremiumUser {
  id: string;
  stage_name: string;
  email: string;
  subscription_tier: string;
  duration_type: string;
  subscription_end: string;
  is_active: boolean;
  features: string[];
}

const PremiumSupportUsers = () => {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPremiumSupportUsers = async () => {
    try {
      setLoading(true);
      
      // Required features - check for any premium support features
      const supportFeatures = [
        "Email Support",
        "email support",
        "Social Media Promotion",
        "social media promotion",
        "Profile promotion on social media",
        "Priority Support",
        "priority support",
        "Priority customer support"
      ];

      // Fetch active subscriptions with celebrity and package data
      const { data: subscriptions, error } = await supabase
        .from('celebrity_subscriptions')
        .select(`
          id,
          celebrity_id,
          subscription_tier,
          duration_type,
          subscription_end,
          is_active,
          celebrity_profiles!inner (
            id,
            stage_name,
            email
          )
        `)
        .eq('is_active', true)
        .gte('subscription_end', new Date().toISOString());

      if (error) throw error;

      // Fetch subscription packages to check features
      const { data: packages, error: packagesError } = await supabase
        .from('subscription_packages')
        .select('tier_name, duration_type, features')
        .eq('is_active', true);

      if (packagesError) throw packagesError;

      // Filter users whose subscription includes all required features
      const premiumUsers: PremiumUser[] = [];

      subscriptions?.forEach((sub: any) => {
        const matchingPackage = packages?.find(
          pkg => pkg.tier_name === sub.subscription_tier && 
                 pkg.duration_type === sub.duration_type
        );

        if (matchingPackage) {
          const features = Array.isArray(matchingPackage.features) 
            ? (matchingPackage.features as string[])
            : [];
          
          // Check if has at least 2 premium support features
          const matchCount = supportFeatures.filter(required => 
            features.some((feature: string) => 
              feature.toLowerCase().includes(required.toLowerCase())
            )
          ).length;
          
          const hasAllFeatures = matchCount >= 2;

          if (hasAllFeatures) {
            premiumUsers.push({
              id: sub.celebrity_id,
              stage_name: sub.celebrity_profiles.stage_name,
              email: sub.celebrity_profiles.email,
              subscription_tier: sub.subscription_tier,
              duration_type: sub.duration_type,
              subscription_end: sub.subscription_end,
              is_active: sub.is_active,
              features: features
            });
          }
        }
      });

      setUsers(premiumUsers);
    } catch (error: any) {
      console.error('Error fetching premium support users:', error);
      toast.error("Failed to load premium support users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumSupportUsers();

    // Setup realtime subscription
    const channel = supabase
      .channel('premium-support-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'celebrity_subscriptions'
        },
        () => {
          fetchPremiumSupportUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      vip_elite: "VIP Elite",
      prime_plus: "Prime Plus",
      basic_pro: "Basic Pro",
      starter: "Starter"
    };
    return labels[tier] || tier;
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      "1_month": "1 Month",
      "3_months": "3 Months",
      "6_months": "6 Months",
      "1_year": "1 Year"
    };
    return labels[duration] || duration;
  };

  const handleCopyLink = (userId: string) => {
    const link = `${window.location.origin}/celebrity/${userId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Premium Support Users</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Users with at least 2 premium support features
          </p>
        </div>
        <Button onClick={fetchPremiumSupportUsers} variant="outline" size="default" className="w-full">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HeadphonesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Premium Support ({users.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HeadphonesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No users found with premium support features</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm min-w-[100px]">Name</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell min-w-[150px]">Email</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[80px]">Tier</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell min-w-[80px]">Duration</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell min-w-[90px]">Expires</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell min-w-[120px]">Features</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[70px]">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[80px]">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">{user.stage_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm p-2 sm:p-4 max-w-[200px] truncate">{user.email}</TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Badge variant="default" className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs">
                          {getTierLabel(user.subscription_tier)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm p-2 sm:p-4">{getDurationLabel(user.duration_type)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm p-2 sm:p-4">
                        {new Date(user.subscription_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            <Share2 className="h-3 w-3 mr-1" />
                            Social
                          </Badge>
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            <HeadphonesIcon className="h-3 w-3 mr-1" />
                            Priority
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <Badge variant="default" className="bg-green-100 text-green-800 text-[10px] sm:text-xs">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Link to={`/celebrity/${user.id}`} target="_blank">
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(user.id)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
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
    </div>
  );
};

export default PremiumSupportUsers;
