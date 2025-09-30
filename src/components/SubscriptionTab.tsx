import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import SubscriptionTierModal from './SubscriptionTierModal';
import JoiningOfferBanner from './JoiningOfferBanner';

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

const SubscriptionTab = ({ profile, subscriptionStatus, onOpenPaymentModal }: SubscriptionTabProps) => {
  const [showTierModal, setShowTierModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedOfferTier, setSelectedOfferTier] = useState<'basic' | 'premium'>('basic');
  const [isNewCelebrity, setIsNewCelebrity] = useState(false);
  const [specialOfferStatus, setSpecialOfferStatus] = useState<{
    isActive: boolean;
    daysLeft: number;
    registeredAt?: string;
  } | null>(null);
  const { toast } = useToast();

  // Check if celebrity is new (created within last 30 days)
  useEffect(() => {
    if (profile) {
      setIsNewCelebrity(true);
      checkSpecialOfferStatus();
    }
  }, [profile]);

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

  const handleTierSubmission = async (tier: 'basic' | 'premium', mpesaCode: string, phoneNumber: string, isOffer: boolean = false) => {
    try {
      // Calculate offer pricing
      const offerAmount = isOffer 
        ? (tier === 'premium' ? 1750 : 1500)
        : (tier === 'premium' ? 2500 : 2000);

      const { error } = await supabase
        .from('payment_verification')
        .insert({
          celebrity_id: profile?.id,
          phone_number: phoneNumber,
          mpesa_code: mpesaCode,
          amount: offerAmount,
          is_verified: false,
        });

      if (error) throw error;

      toast({
        title: "Payment Verification Submitted",
        description: `Your ${tier} plan payment verification has been submitted${isOffer ? ' (Special Offer)' : ''}. An admin will review it shortly.`,
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit payment verification",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleOfferSelection = (tier: 'basic' | 'premium') => {
    setSelectedOfferTier(tier);
    setShowOfferModal(true);
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

      {/* Special Joining Offer Banner */}
      {isNewCelebrity && !subscriptionStatus?.is_active && (
        <JoiningOfferBanner 
          onSelectOffer={handleOfferSelection}
          isNewCelebrity={isNewCelebrity}
        />
      )}
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

      {/* Payment Instructions Card */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-accent" />
            <span>Choose Your Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Plan */}
            <div className="bg-muted p-4 rounded-lg border">
              <h4 className="font-semibold mb-2 text-blue-600">Basic Plan</h4>
              <div className="text-2xl font-bold mb-2">KSh 2,000</div>
              <p className="text-sm text-muted-foreground mb-3">per month</p>
              <ul className="text-sm space-y-1">
                <li>• Profile visibility</li>
                <li>• Basic messaging</li>
                <li>• Media uploads</li>
                <li>• Verification badge</li>
              </ul>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-orange-600">Premium Plan</h4>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  Popular
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-2">KSh 2,500</div>
              <p className="text-sm text-muted-foreground mb-3">per month</p>
              <ul className="text-sm space-y-1">
                <li>• Priority placement (FIFO)</li>
                <li>• Enhanced messaging</li>
                <li>• Unlimited uploads</li>
                <li>• Premium badge</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Benefits of Subscription:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Your profile appears in public celebrity listings</li>
              <li>• Users can find and message you directly</li>
              <li>• Access to booking and meeting requests</li>
              <li>• Increased visibility and earning potential</li>
            </ul>
          </div>

          <Button 
            onClick={() => setShowTierModal(true)}
            className="w-full bg-gradient-to-r from-primary to-accent"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Choose Subscription Plan
          </Button>
        </CardContent>
      </Card>

      <SubscriptionTierModal
        open={showTierModal}
        onOpenChange={setShowTierModal}
        celebrityId={profile?.id || ''}
        onSubmit={(tier, mpesaCode, phoneNumber) => handleTierSubmission(tier, mpesaCode, phoneNumber, false)}
      />

      {/* Special Offer Modal */}
      <SubscriptionTierModal
        open={showOfferModal}
        onOpenChange={setShowOfferModal}
        celebrityId={profile?.id || ''}
        onSubmit={(tier, mpesaCode, phoneNumber) => handleTierSubmission(tier, mpesaCode, phoneNumber, true)}
        isSpecialOffer={true}
        preselectedTier={selectedOfferTier}
      />
    </div>
  );
};

export default SubscriptionTab;