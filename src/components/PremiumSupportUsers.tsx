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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Premium Support Users</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Users with at least 2 premium support features (Email Support, Social Media Promotion, or Priority Support)
          </p>
        </div>
        <Button onClick={fetchPremiumSupportUsers} variant="outline" size="sm" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <HeadphonesIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Premium Support Subscribers ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HeadphonesIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found with premium support features</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead className="hidden md:table-cell">Expires</TableHead>
                    <TableHead className="hidden lg:table-cell">Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Profile Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.stage_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs">
                          {getTierLabel(user.subscription_tier)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{getDurationLabel(user.duration_type)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {new Date(user.subscription_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Share2 className="h-3 w-3 mr-1" />
                            Social
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <HeadphonesIcon className="h-3 w-3 mr-1" />
                            Priority
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <Link to={`/celebrity/${user.id}`} target="_blank">
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(user.id)}
                            className="h-8 w-8 p-0"
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
