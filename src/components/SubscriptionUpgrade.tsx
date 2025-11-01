// Update SubscriptionUpgrade to use credit balance and prorated calculations
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowUp, 
  Crown, 
  Star, 
  Check, 
  Calculator,
  CreditCard,
  Wallet
} from 'lucide-react';

interface SubscriptionUpgradeProps {
  celebrityId: string;
  currentSubscription: {
    subscription_tier: string;
    duration_type: string;
    amount_paid: number;
    subscription_end: string;
    subscription_start: string;
  } | null;
  creditBalance: number;
  onUpgradeSubmit: () => void;
}

const SubscriptionUpgrade = ({ 
  celebrityId, 
  currentSubscription, 
  creditBalance,
  onUpgradeSubmit 
}: SubscriptionUpgradeProps) => {
  const [mpesaCode, setMpesaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpgradePackages();
  }, [currentSubscription]);

  const fetchUpgradePackages = async () => {
    if (!currentSubscription) return;

    try {
      // Fetch packages that are higher tier than current
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      // Filter packages better than current tier
      const currentPrice = currentSubscription.amount_paid;
      const upgrades = data?.filter(pkg => 
        pkg.price > currentPrice || 
        (pkg.tier_name !== currentSubscription.subscription_tier)
      ) || [];

      setPackages(upgrades);
      if (upgrades.length > 0) {
        setSelectedPackage(upgrades[0]);
      }
    } catch (error) {
      console.error('Error fetching upgrade packages:', error);
    }
  };

  // Calculate prorated upgrade cost
  const calculateUpgrade = () => {
    if (!currentSubscription || !selectedPackage) return null;

    const endDate = new Date(currentSubscription.subscription_end);
    const startDate = new Date(currentSubscription.subscription_start);
    const now = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate prorated refund from current subscription
    const dailyRate = currentSubscription.amount_paid / totalDays;
    const refundAmount = dailyRate * remainingDays;
    
    // Calculate upgrade cost minus refund and credit balance
    const upgradeCost = Math.max(0, selectedPackage.price - refundAmount - creditBalance);

    return {
      targetTier: selectedPackage.tier_name,
      targetPrice: selectedPackage.price,
      remainingDays,
      refundAmount,
      creditBalance,
      totalDeduction: refundAmount + creditBalance,
      upgradeCost
    };
  };

  const upgradeInfo = calculateUpgrade();

  const handleSubmit = async () => {
    if (!upgradeInfo || !selectedPackage) return;
    
    // If payment is required, validate payment fields
    if (upgradeInfo.upgradeCost > 0 && (!mpesaCode || !phoneNumber)) {
      toast({
        title: "Missing Information",
        description: "Please enter M-Pesa code and phone number",
        variant: "destructive",
      });
      return;
    }

    // Convert local phone format to international format
    const formatPhoneNumber = (phone: string): string => {
      const cleaned = phone.trim().replace(/\s+/g, '');
      if (cleaned.startsWith('0')) return '+254' + cleaned.substring(1);
      if (cleaned.startsWith('254')) return '+' + cleaned;
      if (cleaned.startsWith('+')) return cleaned;
      return '+254' + cleaned;
    };

    setSubmitting(true);
    try {
      // For credit-covered upgrades, create a payment record with zero amount
      const paymentData = upgradeInfo.upgradeCost === 0 ? {
        celebrityId,
        phoneNumber: phoneNumber || 'CREDIT_UPGRADE',
        mpesaCode: mpesaCode || 'CREDIT_COVERED',
        amount: 0,
        expectedAmount: 0,
        tier: selectedPackage.tier_name,
        duration: selectedPackage.duration_type,
      } : {
        celebrityId,
        phoneNumber: formatPhoneNumber(phoneNumber),
        mpesaCode,
        amount: upgradeInfo.upgradeCost,
        expectedAmount: upgradeInfo.upgradeCost,
        tier: selectedPackage.tier_name,
        duration: selectedPackage.duration_type,
      };

      const { data, error } = await supabase.functions.invoke('payment-verification', {
        body: paymentData
      });

      if (error) throw error;

      toast({
        title: upgradeInfo.upgradeCost === 0 ? "Upgrade Applied!" : "Upgrade Request Submitted",
        description: upgradeInfo.upgradeCost === 0 
          ? "Your subscription has been upgraded successfully." 
          : (data.warning || "Your upgrade request has been submitted for verification."),
      });

      setMpesaCode('');
      setPhoneNumber('');
      onUpgradeSubmit();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit upgrade request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentSubscription || packages.length === 0) {
    return null;
  }

  if (!upgradeInfo) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-600">
          <ArrowUp className="h-5 w-5" />
          <span>Upgrade Subscription</span>
          {creditBalance > 0 && (
            <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white">
              <Wallet className="h-3 w-3 mr-1" />
              KSH {creditBalance} Credit
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Package Selection */}
        <div className="space-y-2">
          <Label>Select Upgrade Package</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedPackage?.id || ''}
            onChange={(e) => {
              const pkg = packages.find(p => p.id === e.target.value);
              setSelectedPackage(pkg);
            }}
          >
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.tier_name} - {pkg.duration_type} - KSH {pkg.price}
              </option>
            ))}
          </select>
        </div>

        {/* Upgrade Calculation */}
        <div className="bg-white/70 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
            <Calculator className="h-4 w-4" />
            <span>Upgrade Cost Calculation</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>New Package Price</span>
              <span>KSH {upgradeInfo.targetPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Remaining Days Credit ({upgradeInfo.remainingDays} days)</span>
              <span>-KSH {upgradeInfo.refundAmount.toFixed(0)}</span>
            </div>
            {creditBalance > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Account Credit Balance</span>
                <span>-KSH {creditBalance.toFixed(0)}</span>
              </div>
            )}
            <hr className="border-muted" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Amount to Pay</span>
              <span className="text-primary">KSH {upgradeInfo.upgradeCost.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {upgradeInfo.upgradeCost > 0 ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-800">M-Pesa Payment</span>
              </div>
              <p className="text-sm text-green-700 mb-2">
                Pay only <span className="font-bold">KSH {upgradeInfo.upgradeCost.toFixed(0)}</span> to upgrade
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-green-600">
                <li>Send KSH {upgradeInfo.upgradeCost.toFixed(0)} to Till: <span className="font-bold">5196042</span></li>
                <li>Copy the M-Pesa confirmation code</li>
                <li>Enter the code and phone number below</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upgrade-mpesa">M-Pesa Code *</Label>
                <Input
                  id="upgrade-mpesa"
                  placeholder="e.g., QH12ABC34D"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upgrade-phone">Phone Number *</Label>
                <Input
                  id="upgrade-phone"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !mpesaCode || !phoneNumber}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              {submitting ? 'Processing Upgrade...' : 'Submit Upgrade Payment'}
            </Button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">Your credit covers the upgrade!</p>
            <p className="text-sm text-green-600 mt-1">
              No payment needed. Click below to apply your upgrade.
            </p>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-4 bg-gradient-to-r from-green-400 to-emerald-500"
            >
              {submitting ? 'Processing...' : 'Apply Upgrade with Credits'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionUpgrade;