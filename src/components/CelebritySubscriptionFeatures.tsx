import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Crown, 
  Gem, 
  Sparkles, 
  Star, 
  Check, 
  X, 
  Upload, 
  BarChart3, 
  Shield, 
  Megaphone, 
  HeadphonesIcon,
  TrendingUp,
  Calendar,
  ArrowUpCircle
} from "lucide-react";
import { getTierFeatures, getBadgeInfo, getSupportType, getRemainingUploads } from "@/lib/subscription-features";
import { toast } from "sonner";

interface CelebritySubscriptionFeaturesProps {
  celebrityId: string;
  onUpgrade?: () => void;
}

export default function CelebritySubscriptionFeatures({ 
  celebrityId,
  onUpgrade 
}: CelebritySubscriptionFeaturesProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionData();
  }, [celebrityId]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);

      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from("celebrity_subscriptions")
        .select("*")
        .eq("celebrity_id", celebrityId)
        .eq("is_active", true)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subData);

      // Fetch media count
      const { count, error: countError } = await supabase
        .from("celebrity_media")
        .select("*", { count: 'exact', head: true })
        .eq("celebrity_id", celebrityId);

      if (countError) throw countError;
      setMediaCount(count || 0);

    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscription details...</div>;
  }

  const tier = subscription?.subscription_tier || null;
  const features = getTierFeatures(tier);
  const badgeInfo = getBadgeInfo(tier);
  const supportType = getSupportType(tier);
  const remainingUploads = getRemainingUploads(mediaCount, tier);

  const tierIcons = {
    vip_elite: <Crown className="w-8 h-8 text-yellow-500" />,
    prime_plus: <Gem className="w-8 h-8 text-purple-500" />,
    basic_pro: <Sparkles className="w-8 h-8 text-blue-500" />,
    starter: <Star className="w-8 h-8 text-green-500" />,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    if (!subscription?.subscription_end) return 0;
    const now = new Date();
    const end = new Date(subscription.subscription_end);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  const uploadProgress = features.media_upload_limit === -1 
    ? 100 
    : (mediaCount / features.media_upload_limit) * 100;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${badgeInfo?.color}`}>
                {tierIcons[features.badge_type as keyof typeof tierIcons]}
              </div>
              <div>
                <CardTitle className="text-2xl">{badgeInfo?.label || 'Free Plan'}</CardTitle>
                <CardDescription>Your current subscription plan</CardDescription>
              </div>
            </div>
            {onUpgrade && tier && (
              <Button onClick={onUpgrade} className="gap-2">
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscription && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{formatDate(subscription.subscription_start)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">{formatDate(subscription.subscription_end)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Days Remaining</p>
                  <p className="font-medium text-primary">{daysRemaining} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Media Upload Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <span className="font-medium">Media Uploads</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {features.media_upload_limit === -1 
                  ? `${mediaCount} (Unlimited)` 
                  : `${mediaCount} / ${features.media_upload_limit}`}
              </span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            {remainingUploads !== -1 && (
              <p className="text-sm text-muted-foreground">
                {remainingUploads} uploads remaining
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Analytics */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <CardTitle className="text-lg">Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FeatureItem 
                enabled={features.has_advanced_analytics}
                label="Advanced Analytics"
              />
              <FeatureItem 
                enabled={features.has_analytics_dashboard}
                label="Analytics Dashboard"
              />
              <FeatureItem 
                enabled={features.has_basic_analytics}
                label="Basic Analytics"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Features */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <CardTitle className="text-lg">Profile Features</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FeatureItem 
                enabled={features.has_profile_verification}
                label="Profile Verification Badge"
              />
              <FeatureItem 
                enabled={features.has_search_optimization}
                label="Search Optimization"
              />
              <FeatureItem 
                enabled={features.has_quality_traffic_optimization}
                label="Quality Traffic Optimization"
              />
              <FeatureItem 
                enabled={features.has_featured_category}
                label="Featured in Category"
              />
              <div className="pt-2">
                <Badge variant="secondary">
                  Homepage: {features.homepage_position.charAt(0).toUpperCase() + features.homepage_position.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketing */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              <CardTitle className="text-lg">Marketing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FeatureItem 
                enabled={features.has_marketing_campaigns}
                label="Direct Marketing Campaigns"
              />
              <FeatureItem 
                enabled={features.has_social_media_promotion}
                label="Social Media Promotion"
              />
              {features.profile_boost_per_week > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Profile boost: {features.profile_boost_per_week === -1 ? 'Unlimited' : `${features.profile_boost_per_week}x per week`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-5 h-5" />
              <CardTitle className="text-lg">Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FeatureItem 
                enabled={features.has_priority_support_24_7}
                label="Priority Support (24/7)"
              />
              <FeatureItem 
                enabled={features.has_priority_support_business}
                label="Priority Support (Business Hours)"
              />
              <FeatureItem 
                enabled={features.has_email_support}
                label="Email Support"
              />
              <div className="pt-2">
                <Badge variant="outline">{supportType}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!subscription && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Star className="w-12 h-12 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">No Active Subscription</h3>
                <p className="text-muted-foreground">
                  Subscribe to unlock premium features and grow your profile visibility
                </p>
              </div>
              {onUpgrade && (
                <Button onClick={onUpgrade} size="lg" className="gap-2">
                  <ArrowUpCircle className="w-4 h-4" />
                  View Subscription Plans
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50" />
      )}
      <span className={enabled ? "" : "text-muted-foreground/50"}>{label}</span>
    </div>
  );
}
