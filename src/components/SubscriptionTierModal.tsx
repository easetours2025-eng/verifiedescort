import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Check, Crown, Star, Zap } from 'lucide-react';

interface SubscriptionTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrityId: string;
  onSubmit: (tier: 'basic' | 'premium', mpesaCode: string, phoneNumber: string) => void;
}

const SubscriptionTierModal = ({ open, onOpenChange, celebrityId, onSubmit }: SubscriptionTierModalProps) => {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('basic');
  const [mpesaCode, setMpesaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const plans = {
    basic: {
      name: 'Basic Plan',
      price: 2000,
      duration: '30 days',
      features: [
        'Profile visibility to public',
        'Basic messaging with fans',
        'Media gallery uploads',
        'Profile verification badge',
        'Standard support'
      ],
      icon: <Star className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    premium: {
      name: 'Premium Plan',
      price: 2500,
      duration: '30 days',
      features: [
        'Priority profile placement (FIFO)',
        'Enhanced messaging features',
        'Unlimited media uploads',
        'Premium verification badge',
        'Advanced analytics',
        'Priority customer support',
        'Featured in premium section'
      ],
      icon: <Crown className="h-6 w-6" />,
      color: 'bg-gradient-to-br from-yellow-400 to-orange-500'
    }
  };

  const handleSubmit = async () => {
    if (!mpesaCode || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide both M-Pesa code and phone number",
        variant: "destructive",
      });
      return;
    }

    // Validate M-Pesa code format (basic validation)
    if (mpesaCode.length < 8) {
      toast({
        title: "Invalid M-Pesa Code",
        description: "Please enter a valid M-Pesa transaction code",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(?:\+254|254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(selectedTier, mpesaCode, phoneNumber);
      // Reset form
      setMpesaCode('');
      setPhoneNumber('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span>Choose Your Subscription Plan</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(plans).map(([key, plan]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedTier === key
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTier(key as 'basic' | 'premium')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full text-white ${plan.color}`}>
                        {plan.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.duration}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        KSh {plan.price.toLocaleString()}
                      </div>
                      {key === 'premium' && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Instructions */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-green-700">
              <div className="space-y-2">
                <p className="font-semibold">
                  Pay KSh {plans[selectedTier].price.toLocaleString()} via M-Pesa:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to M-Pesa menu on your phone</li>
                  <li>Select "Lipa na M-Pesa"</li>
                  <li>Select "Buy Goods and Services"</li>
                  <li>Enter Till Number: <span className="font-bold">123456</span></li>
                  <li>Enter Amount: <span className="font-bold">KSh {plans[selectedTier].price}</span></li>
                  <li>Enter your M-Pesa PIN</li>
                  <li>Copy the M-Pesa confirmation code and paste below</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mpesa-code">M-Pesa Confirmation Code *</Label>
              <Input
                id="mpesa-code"
                placeholder="e.g., QH12ABC34D"
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter the code you received from M-Pesa
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number *</Label>
              <Input
                id="phone-number"
                placeholder="e.g., 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Phone number used for M-Pesa payment
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-semibold">{plans[selectedTier].name}</span> - 
              <span className="font-bold text-primary"> KSh {plans[selectedTier].price.toLocaleString()}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !mpesaCode || !phoneNumber}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {submitting ? 'Submitting...' : 'Submit Payment Verification'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionTierModal;