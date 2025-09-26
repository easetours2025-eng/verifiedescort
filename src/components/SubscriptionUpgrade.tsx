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
  CreditCard
} from 'lucide-react';

interface SubscriptionUpgradeProps {
  celebrityId: string;
  currentSubscription: {
    subscription_tier: string;
    amount_paid: number;
    subscription_end: string;
  } | null;
  onUpgradeSubmit: () => void;
}

const SubscriptionUpgrade = ({ celebrityId, currentSubscription, onUpgradeSubmit }: SubscriptionUpgradeProps) => {
  const [mpesaCode, setMpesaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const plans = {
    basic: {
      name: 'Basic Plan',
      price: 2000,
      features: [
        'Profile visibility',
        'Basic messaging',
        'Media uploads',
        'Verification badge'
      ]
    },
    premium: {
      name: 'Premium Plan',
      price: 2500,
      features: [
        'Priority placement',
        'Enhanced messaging',
        'Unlimited uploads',
        'Premium badge',
        'Advanced analytics'
      ]
    }
  };

  // Calculate remaining days and upgrade cost
  const calculateUpgrade = () => {
    if (!currentSubscription) return null;

    const currentTier = currentSubscription.subscription_tier as 'basic' | 'premium';
    const targetTier = currentTier === 'basic' ? 'premium' : 'basic';
    
    // Can only upgrade from basic to premium
    if (currentTier !== 'basic') return null;

    const endDate = new Date(currentSubscription.subscription_end);
    const now = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate prorated cost
    const dailyRate = plans.basic.price / 30;
    const refundAmount = dailyRate * remainingDays;
    const upgradeCost = plans.premium.price - refundAmount;

    return {
      currentTier,
      targetTier,
      remainingDays,
      refundAmount,
      upgradeCost: Math.max(0, upgradeCost)
    };
  };

  const upgradeInfo = calculateUpgrade();

  const handleSubmit = async () => {
    if (!mpesaCode || !phoneNumber || !upgradeInfo) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('payment_verification')
        .insert({
          celebrity_id: celebrityId,
          phone_number: phoneNumber,
          mpesa_code: mpesaCode,
          amount: upgradeInfo.upgradeCost,
          is_verified: false,
        });

      if (error) throw error;

      toast({
        title: "Upgrade Request Submitted",
        description: "Your premium upgrade request has been submitted for verification.",
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

  if (!currentSubscription || currentSubscription.subscription_tier !== 'basic') {
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
          <span>Upgrade to Premium</span>
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
            Save Money
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upgrade Calculation */}
        <div className="bg-white/70 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
            <Calculator className="h-4 w-4" />
            <span>Upgrade Cost Calculation</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Current Plan (Basic)</span>
              <span>KSh {plans.basic.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Premium Plan</span>
              <span>KSh {plans.premium.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Remaining Days Credit ({upgradeInfo.remainingDays} days)</span>
              <span>-KSh {upgradeInfo.refundAmount.toFixed(0)}</span>
            </div>
            <hr className="border-muted" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Upgrade Cost</span>
              <span className="text-primary">KSh {upgradeInfo.upgradeCost.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Premium Features */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2">Premium Benefits</h4>
          <ul className="space-y-1">
            {plans.premium.features.slice(4).map((feature, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm text-orange-700">
                <Crown className="h-3 w-3" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-800">M-Pesa Payment</span>
            </div>
            <p className="text-sm text-green-700 mb-2">
              Pay only <span className="font-bold">KSh {upgradeInfo.upgradeCost.toFixed(0)}</span> to upgrade to Premium
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-green-600">
              <li>Send KSh {upgradeInfo.upgradeCost.toFixed(0)} to Till: <span className="font-bold">123456</span></li>
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
            {submitting ? 'Processing Upgrade...' : 'Submit Premium Upgrade'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionUpgrade;