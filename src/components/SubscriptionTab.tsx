import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Smartphone,
  Eye,
  EyeOff,
  Crown,
  Gem,
  Sparkles,
  Star,
  Check,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CelebritySubscriptionFeatures from './CelebritySubscriptionFeatures';
import { toast as sonnerToast } from 'sonner';

interface CelebrityProfile {
  id: string;
  stage_name: string;
}

interface SubscriptionStatus {
  is_active: boolean;
  subscription_end?: string;
  subscription_start?: string;
}

interface SubscriptionTabProps {
  profile: CelebrityProfile | null;
  subscriptionStatus: SubscriptionStatus | null;
  onOpenPaymentModal: () => void;
}

interface SubscriptionPackage {
  id: string;
  tier_name: string;
  duration_type: string;
  price: number;
  features: any;
  display_order: number;
}

const TILL_NUMBER = "8980316";

const tierIcons = {
  vip_elite: <Crown className="w-6 h-6" />,
  prime_plus: <Gem className="w-6 h-6" />,
  basic_pro: <Sparkles className="w-6 h-6" />,
  starter: <Star className="w-6 h-6" />,
};

const tierColors = {
  vip_elite: "from-yellow-500 to-amber-600",
  prime_plus: "from-purple-500 to-indigo-600",
  basic_pro: "from-blue-500 to-cyan-600",
  starter: "from-green-500 to-emerald-600",
};

const tierLabels = {
  vip_elite: "VIP Elite",
  prime_plus: "Prime Plus",
  basic_pro: "Basic Pro",
  starter: "Starter",
};

const SubscriptionTab = ({ profile, subscriptionStatus, onOpenPaymentModal }: SubscriptionTabProps) => {
  const [isNewCelebrity, setIsNewCelebrity] = useState(false);
  const [specialOfferStatus, setSpecialOfferStatus] = useState<{
    isActive: boolean;
    daysLeft: number;
    registeredAt?: string;
  } | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("1_month");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setIsNewCelebrity(true);
      checkSpecialOfferStatus();
      fetchPackages();
    }
  }, [profile]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      const parsedData = (data || []).map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features : []
      }));
      setPackages(parsedData);
    } catch (error) {
      console.error("Error fetching packages:", error);
      sonnerToast.error("Failed to load subscription packages");
    }
  };

  const checkSpecialOfferStatus = async () => {
    if (!profile?.id) return;

    try {
      const { data: fullProfile, error } = await supabase
        .from('celebrity_profiles')
        .select('special_offer_registered_at, is_special_offer_active, created_at')
        .eq('id', profile.id)
        .single();

      if (error || !fullProfile) return;

      const now = new Date();
      const offerStartDate = new Date('2025-01-27T00:00:00Z');
      const offerEndDate = new Date('2025-02-01T23:59:59Z');
      
      const registeredAt = fullProfile.special_offer_registered_at 
        ? new Date(fullProfile.special_offer_registered_at)
        : new Date(fullProfile.created_at);

      const registeredDuringOffer = fullProfile.special_offer_registered_at && 
        registeredAt >= offerStartDate && registeredAt <= offerEndDate;

      if (registeredDuringOffer) {
        const offerExpiryDate = new Date(registeredAt.getTime() + (5 * 24 * 60 * 60 * 1000));
        const timeLeft = offerExpiryDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

        setSpecialOfferStatus({
          isActive: timeLeft > 0,
          daysLeft,
          registeredAt: fullProfile.special_offer_registered_at
        });
      }
    } catch (error) {
      console.error('Error checking special offer status:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sonnerToast.success("Copied to clipboard!");
    } catch (err) {
      sonnerToast.error("Failed to copy");
    }
  };

  const getPackagesByDuration = (duration: string) => {
    return packages.filter((pkg) => pkg.duration_type === duration);
  };

  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case "1_week":
        return "1 Week";
      case "2_weeks":
        return "2 Weeks";
      case "1_month":
        return "1 Month";
      default:
        return duration;
    }
  };

  const getSavingsText = (tier: string, duration: string) => {
    const competitorPrices: Record<string, Record<string, number>> = {
      vip_elite: { "1_week": 1250, "2_weeks": 2500, "1_month": 5000 },
      prime_plus: { "1_week": 1000, "2_weeks": 2000, "1_month": 4000 },
      basic_pro: { "1_week": 750, "2_weeks": 1500, "1_month": 3000 },
      starter: { "1_week": 500, "2_weeks": 1000, "1_month": 2000 },
    };

    const pkg = packages.find((p) => p.tier_name === tier && p.duration_type === duration);
    if (!pkg) return null;

    const competitorPrice = competitorPrices[tier]?.[duration];
    if (!competitorPrice) return null;

    const savings = competitorPrice - pkg.price;
    if (savings > 0) {
      return `Save KSH ${savings}!`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !mpesaCode.trim() || !phoneNumber.trim()) {
      sonnerToast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('payment-verification', {
        body: {
          celebrityId: profile?.id,
          phoneNumber: phoneNumber.trim(),
          mpesaCode: mpesaCode.trim(),
          amount: selectedPackage.price,
          expectedAmount: selectedPackage.price,
          tier: selectedPackage.tier_name,
          duration: selectedPackage.duration_type,
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit payment verification');
      }

      setMpesaCode("");
      setPhoneNumber("");
      setSelectedPackage(null);
      
      sonnerToast.success(
        `Subscription request submitted! Expected amount: KSH ${selectedPackage.price.toLocaleString()}`,
        {
          description: "Your payment will be verified by admin. You'll be notified about the status."
        }
      );

      if (data.warning) {
        toast({
          title: data.payment_status === 'underpaid' ? "Payment Insufficient" : "Payment Received",
          description: data.warning,
          variant: data.payment_status === 'underpaid' ? 'destructive' : 'default',
        });
      } else {
        toast({
          title: "Payment Verification Submitted",
          description: `Your ${selectedPackage.tier_name} plan payment verification has been submitted. An admin will review it shortly.`,
        });
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      sonnerToast.error(error.message || "Failed to submit payment verification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTierSubmission = async (tier: 'basic' | 'premium', mpesaCode: string, phoneNumber: string, isOffer: boolean = false) => {
    try {
      // Calculate offer pricing
      const offerAmount = isOffer 
        ? (tier === 'premium' ? 1750 : 1500)
        : (tier === 'premium' ? 2500 : 2000);

      const { data, error } = await supabase.functions.invoke('payment-verification', {
        body: {
          celebrityId: profile?.id,
          phoneNumber,
          mpesaCode,
          amount: offerAmount,
          tier
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message || 'Failed to submit payment verification');
      }

      toast({
        title: "Payment Verification Submitted",
        description: `Your ${tier} plan payment verification has been submitted${isOffer ? ' (Special Offer)' : ''}. An admin will review it shortly.`,
      });
    } catch (error: any) {
      console.error('Payment submission error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit payment verification",
        variant: "destructive",
      });
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = subscriptionStatus?.subscription_end 
    ? new Date(subscriptionStatus.subscription_end) < new Date()
    : true;

  const getStatusIcon = () => {
    if (specialOfferStatus?.isActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (subscriptionStatus?.is_active && !isExpired) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isExpired) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (specialOfferStatus?.isActive) return "Free Active";
    if (subscriptionStatus?.is_active && !isExpired) return "Active";
    if (isExpired) return "Expired";
    return "Inactive";
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" => {
    if (specialOfferStatus?.isActive) return "default";
    if (subscriptionStatus?.is_active && !isExpired) return "default";
    if (isExpired) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Special 5-Day Offer Status */}
      {specialOfferStatus && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800">🎉 5-Day Free Visibility Active!</h3>
                {specialOfferStatus.isActive ? (
                  <p className="text-sm text-green-700">
                    Your profile is publicly visible for free! {specialOfferStatus.daysLeft} day{specialOfferStatus.daysLeft !== 1 ? 's' : ''} remaining in your free period.
                  </p>
                ) : (
                  <p className="text-sm text-green-700">
                    Your 5-day free visibility period has ended. Subscribe to continue being visible to users.
                  </p>
                )}
              </div>
              <Badge className="bg-green-500 text-white">
                {specialOfferStatus.isActive ? 'ACTIVE' : 'EXPIRED'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Listing Card */}
      <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Featured Listing</span>
          </CardTitle>
          <CardDescription>
            Appear at the top of search results for 1 week - Only KSH 500!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Get Maximum Visibility!
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Featured profiles appear at the very top of the homepage and search results, giving you maximum exposure to potential clients for an entire week.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Top Position</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>7 Days Duration</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>More Bookings</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>KSH 500 Only</span>
            </div>
          </div>

          <Button 
            onClick={onOpenPaymentModal}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold"
          >
            <Star className="h-4 w-4 mr-2" />
            Request Featured Listing
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            After payment verification, your profile will be featured for 1 week
          </p>
        </CardContent>
      </Card>

      {/* Subscription Status Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span>Subscription Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-semibold">Profile Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  Monthly subscription to appear in search results
                </p>
              </div>
            </div>
            <Badge variant={getStatusVariant()} className="flex items-center space-x-1">
              <span>{getStatusText()}</span>
            </Badge>
          </div>

          {subscriptionStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionStatus.subscription_start && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(subscriptionStatus.subscription_start)}
                  </p>
                </div>
              )}
              {subscriptionStatus.subscription_end && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isExpired ? "Expired" : "Valid Until"}
                  </p>
                  <p className={`text-sm ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                    {formatDate(subscriptionStatus.subscription_end)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            {(subscriptionStatus?.is_active && !isExpired) || specialOfferStatus?.isActive ? (
              <Eye className="h-4 w-4 text-blue-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-500" />
            )}
            <p className="text-sm">
              {specialOfferStatus?.isActive 
                ? "Your profile is visible via 5-day free offer!"
                : (subscriptionStatus?.is_active && !isExpired)
                  ? "Your profile is visible to users browsing celebrities"
                  : "Your profile is hidden from public view. Subscribe to become visible or wait for special offers."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-accent" />
            <span>Choose Your Subscription Plan</span>
          </CardTitle>
          <CardDescription>
            Select a plan that fits your needs. Better prices, more features than competitors!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={selectedDuration} onValueChange={setSelectedDuration} className="w-full">
            <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
              <TabsTrigger 
                value="1_month" 
                className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3 h-auto whitespace-normal leading-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">1 Month - Best Value</span>
                <span className="sm:hidden">1 Month<br/><span className="text-[10px]">Best Value</span></span>
              </TabsTrigger>
              <TabsTrigger 
                value="2_weeks" 
                className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                2 Weeks
              </TabsTrigger>
              <TabsTrigger 
                value="1_week" 
                className="text-xs sm:text-sm py-2 sm:py-2.5 px-1 sm:px-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                1 Week
              </TabsTrigger>
            </TabsList>

            {["1_month", "2_weeks", "1_week"].map((duration) => (
              <TabsContent key={duration} value={duration} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {getPackagesByDuration(duration).map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedPackage?.id === pkg.id
                          ? "ring-2 ring-primary scale-105"
                          : "hover:scale-102"
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <CardHeader className="pb-3 sm:pb-6">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${
                            tierColors[pkg.tier_name as keyof typeof tierColors]
                          } flex items-center justify-center text-white mb-2`}
                        >
                          <div className="w-5 h-5 sm:w-6 sm:h-6">
                            {tierIcons[pkg.tier_name as keyof typeof tierIcons]}
                          </div>
                        </div>
                        <CardTitle className="text-lg sm:text-xl">
                          {tierLabels[pkg.tier_name as keyof typeof tierLabels]}
                        </CardTitle>
                        <CardDescription className="text-sm">{getDurationLabel(pkg.duration_type)}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3 sm:pb-6">
                        <div className="mb-3 sm:mb-4">
                          <div className="text-2xl sm:text-3xl font-bold">
                            KSH {pkg.price.toLocaleString()}
                          </div>
                          {getSavingsText(pkg.tier_name, pkg.duration_type) && (
                            <Badge variant="secondary" className="mt-1.5 sm:mt-2 text-xs">
                              {getSavingsText(pkg.tier_name, pkg.duration_type)}
                            </Badge>
                          )}
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2">
                          {pkg.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-3 sm:pt-6">
                        <Button
                          className="w-full h-9 sm:h-10 text-sm sm:text-base"
                          variant={selectedPackage?.id === pkg.id ? "default" : "outline"}
                        >
                          {selectedPackage?.id === pkg.id ? "Selected" : "Select Plan"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {selectedPackage && (
            <div className="space-y-3 sm:space-y-4 border-t pt-4 sm:pt-6">
              <div className="bg-muted p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Payment Instructions</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Go to M-Pesa on your phone</li>
                  <li>Select "Lipa na M-Pesa" then "Buy Goods and Services"</li>
                  <li>
                    Enter Till Number:{" "}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1"
                      onClick={() => copyToClipboard(TILL_NUMBER)}
                    >
                      <span className="font-bold">{TILL_NUMBER}</span>
                      <Copy className="w-3 h-3 ml-1" />
                    </Button>
                  </li>
                  <li>
                    Enter amount:{" "}
                    <span className="font-bold text-primary">
                      KSH {selectedPackage.price.toLocaleString()}
                    </span>
                  </li>
                  <li>Complete the transaction and note your M-Pesa code</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="mpesa-code" className="text-sm">M-Pesa Transaction Code *</Label>
                  <Input
                    id="mpesa-code"
                    placeholder="e.g., QGH7KLM9NP"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    className="mt-1 h-10 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g., 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 h-10 text-sm"
                  />
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm font-semibold text-center">
                  Total Amount to Pay: <span className="text-lg sm:text-xl text-primary">KSH {selectedPackage.price.toLocaleString()}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-1">
                  {selectedPackage.duration_type === "1_week" && "Valid for 1 Week"}
                  {selectedPackage.duration_type === "2_weeks" && "Valid for 2 Weeks"}
                  {selectedPackage.duration_type === "1_month" && "Valid for 1 Month"}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !mpesaCode.trim() || !phoneNumber.trim()}
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
              >
                {submitting ? "Submitting..." : (
                  <>
                    <span className="hidden sm:inline">Submit Payment of KSH {selectedPackage.price.toLocaleString()}</span>
                    <span className="sm:hidden">Submit KSH {selectedPackage.price.toLocaleString()}</span>
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ If you pay less than the required amount, your subscription will be disabled. If you pay more, the extra will be credited to your account.
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Button 
              onClick={() => navigate('/faq')}
              variant="outline"
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
            >
              Need Help? View FAQ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Features */}
      {profile && (
        <div className="mt-6">
          <CelebritySubscriptionFeatures
            celebrityId={profile.id}
            onUpgrade={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default SubscriptionTab;