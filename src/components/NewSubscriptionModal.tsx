import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Check, Copy, Crown, Gem, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPackage {
  id: string;
  tier_name: string;
  duration_type: string;
  price: number;
  features: any;
  display_order: number;
}

interface NewSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrityId: string;
  onSubmit: (tier: string, duration: string, mpesaCode: string, phoneNumber: string) => Promise<void>;
}

const TILL_NUMBER = "5196042";

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

export function NewSubscriptionModal({
  open,
  onOpenChange,
  celebrityId,
  onSubmit,
}: NewSubscriptionModalProps) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("1_month");

  useEffect(() => {
    if (open) {
      fetchPackages();
    }
  }, [open]);

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
      toast.error("Failed to load subscription packages");
    }
  };

  const getPackagesByDuration = (duration: string) => {
    return packages.filter((pkg) => pkg.duration_type === duration);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !mpesaCode.trim() || !phoneNumber.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        selectedPackage.tier_name,
        selectedPackage.duration_type,
        mpesaCode.trim(),
        phoneNumber.trim()
      );
      setMpesaCode("");
      setPhoneNumber("");
      setSelectedPackage(null);
      onOpenChange(false);
      toast.success("Subscription request submitted successfully!");
    } catch (error) {
      console.error("Error submitting subscription:", error);
      toast.error("Failed to submit subscription");
    } finally {
      setSubmitting(false);
    }
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
      return `Save Ksh ${savings}!`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl">Choose Your Subscription Plan</DialogTitle>
          <DialogDescription className="text-lg">
            Select a plan that fits your needs. Better prices, more features than competitors!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedDuration} onValueChange={setSelectedDuration} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1_month">1 Month - Best Value</TabsTrigger>
            <TabsTrigger value="2_weeks">2 Weeks</TabsTrigger>
            <TabsTrigger value="1_week">1 Week</TabsTrigger>
          </TabsList>

          {["1_month", "2_weeks", "1_week"].map((duration) => (
            <TabsContent key={duration} value={duration} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                          tierColors[pkg.tier_name as keyof typeof tierColors]
                        } flex items-center justify-center text-white mb-2`}
                      >
                        {tierIcons[pkg.tier_name as keyof typeof tierIcons]}
                      </div>
                      <CardTitle className="text-xl">
                        {tierLabels[pkg.tier_name as keyof typeof tierLabels]}
                      </CardTitle>
                      <CardDescription>{getDurationLabel(pkg.duration_type)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-3xl font-bold">
                          Ksh {pkg.price.toLocaleString()}
                        </div>
                        {getSavingsText(pkg.tier_name, pkg.duration_type) && (
                          <Badge variant="secondary" className="mt-2">
                            {getSavingsText(pkg.tier_name, pkg.duration_type)}
                          </Badge>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
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
          <div className="space-y-4 border-t pt-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Payment Instructions</h3>
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
                <li>Enter amount: Ksh {selectedPackage.price}</li>
                <li>Complete the transaction and note your M-Pesa code</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mpesa-code">M-Pesa Transaction Code *</Label>
                <Input
                  id="mpesa-code"
                  placeholder="e.g., QGH7KLM9NP"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., 0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !mpesaCode.trim() || !phoneNumber.trim()}
              className="w-full"
              size="lg"
            >
              {submitting ? "Submitting..." : "Submit Payment for Verification"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
