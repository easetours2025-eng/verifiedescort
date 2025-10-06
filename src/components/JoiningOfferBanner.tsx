import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Gift, 
  Clock, 
  Copy, 
  CheckCircle,
  Smartphone,
  Star,
  Crown,
  Zap
} from 'lucide-react';
import offerBanner from '@/assets/offer-banner.png';

interface JoiningOfferBannerProps {
  onSelectOffer: (tier: 'basic' | 'premium') => void;
  isNewCelebrity?: boolean;
}

const JoiningOfferBanner = ({ onSelectOffer, isNewCelebrity = true }: JoiningOfferBannerProps) => {
  const [timeLeft, setTimeLeft] = useState(30 * 24 * 60 * 60); // 30 days in seconds
  const [tillCopied, setTillCopied] = useState(false);
  const { toast } = useToast();

  // Encrypted/encoded till number - simple base64 encoding for display
  const encodedTill = btoa('8980316');
  const actualTill = '8980316';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeLeft = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const mins = Math.floor((seconds % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${mins}m`;
  };

  const copyTillNumber = async () => {
    try {
      await navigator.clipboard.writeText(actualTill);
      setTillCopied(true);
      toast({
        title: "Till Number Copied!",
        description: "M-Pesa Till Number copied to clipboard. Paste it in your M-Pesa app.",
      });
      
      setTimeout(() => setTillCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the till number: 8980316",
        variant: "destructive",
      });
    }
  };

  if (!isNewCelebrity) return null;

  return (
    <Card className="border-2 border-gradient-to-r from-primary to-accent bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary to-accent text-white">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                🎉 Special Joining Offer!
              </CardTitle>
              <p className="text-sm text-muted-foreground">Limited time for new celebrities</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeLeft(timeLeft)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* FREE 5-Day Offer - Priority Section */}
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">🆓 FREE 5-Day Visibility!</h3>
                <p className="text-xs text-green-600">No payment required - Start immediately!</p>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-bounce">
                FREE
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white/50 p-3 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">What you get instantly:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Profile visible to all users immediately</li>
                  <li>✅ No payment or verification required</li>
                  <li>✅ Full 5 days to test the platform</li>
                  <li>✅ All basic features included</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-medium text-center">
                  🚀 Complete your profile setup and you'll be visible to users right away!
                </p>
                <p className="text-xs text-green-600 text-center mt-1">
                  Perfect for testing the platform before committing to a paid plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="text-sm font-medium text-muted-foreground bg-background px-3">OR Choose Paid Plan</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        {/* Special Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Offer */}
          <Card className="border-blue-200 bg-blue-50/50 hover:shadow-md transition-all cursor-pointer" onClick={() => onSelectOffer('basic')}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-800">Basic Plan</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg line-through text-muted-foreground">KSH 2,000</span>
                  <Badge className="bg-green-500 text-white">-25% OFF</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">KSH 1,500</div>
                <p className="text-sm text-muted-foreground">First month only</p>
              </div>
            </CardContent>
          </Card>

          {/* Premium Offer */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-md transition-all cursor-pointer border-2" onClick={() => onSelectOffer('premium')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Premium Plan</h4>
                </div>
                <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
                  BEST DEAL
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg line-through text-muted-foreground">KSH 2,500</span>
                  <Badge className="bg-green-500 text-white">-30% OFF</Badge>
                </div>
                <div className="text-2xl font-bold text-orange-600">KSH 1,750</div>
                <p className="text-sm text-muted-foreground">First month only</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* M-Pesa Payment Instructions */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">M-Pesa Payment</h4>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-medium">
                Pay via M-Pesa Buy Goods and Services:
              </p>
              
              {/* Secure Till Number Display */}
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">M-Pesa Till Number:</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-lg font-bold text-green-800 bg-green-100 px-2 py-1 rounded">
                        {actualTill}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyTillNumber}
                        className="h-8 w-8 p-0 border-green-300 hover:bg-green-100"
                      >
                        {tillCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-green-600 space-y-1">
                <p>• Open M-Pesa → Lipa na M-Pesa → Buy Goods & Services</p>
                <p>• Enter Till Number: <span className="font-bold">{actualTill}</span> (tap copy icon above)</p>
                <p>• Enter your offer amount and complete payment</p>
                <p>• Copy the M-Pesa confirmation code to complete registration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offer Benefits */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-primary" />
            What You Get:
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✨ Instant profile visibility</li>
            <li>🚀 Priority listing for 30 days</li>
            <li>💬 Direct fan messaging</li>
            <li>📱 Mobile-optimized dashboard</li>
            <li>🎯 Booking management system</li>
          </ul>
        </div>

        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">
            🔥 This offer expires in {formatTimeLeft(timeLeft)}! 
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            After offer period, regular pricing applies
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JoiningOfferBanner;