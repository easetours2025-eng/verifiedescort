import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';

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
    if (subscriptionStatus?.is_active && !isExpired) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isExpired) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (subscriptionStatus?.is_active && !isExpired) return "Active";
    if (isExpired) return "Expired";
    return "Inactive";
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" => {
    if (subscriptionStatus?.is_active && !isExpired) return "default";
    if (isExpired) return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-6">
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
            {subscriptionStatus?.is_active && !isExpired ? (
              <Eye className="h-4 w-4 text-blue-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-gray-500" />
            )}
            <p className="text-sm">
              {subscriptionStatus?.is_active && !isExpired
                ? "Your profile is visible to users browsing celebrities"
                : "Your profile is hidden from public view. Subscribe to become visible."
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
            <span>M-Pesa Payment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Monthly Subscription - KSH 1,000</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Paybill:</span> 2727278
              </div>
              <div>
                <span className="font-medium">Account:</span> {profile?.stage_name || 'Celebrity Name'}
              </div>
              <div>
                <span className="font-medium">Amount:</span> KSH 1,000
              </div>
              <div>
                <span className="font-medium">Frequency:</span> Monthly
              </div>
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
            onClick={onOpenPaymentModal}
            className="w-full bg-gradient-to-r from-primary to-accent"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionTab;