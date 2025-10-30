import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PayPalPaymentProps {
  celebrityName: string;
}

const PayPalPayment = ({ celebrityName }: PayPalPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const paypalEmail = 'rashidjuma198@gmail.com';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paypalEmail);
      setCopied(true);
      toast({
        title: "PayPal Email Copied",
        description: "PayPal payment email has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-blue-600" />
          International Payment via PayPal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-blue-100">
          <p className="text-sm text-muted-foreground mb-3">
            You're viewing a profile from outside East Africa. Please use PayPal for international payments.
          </p>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Payment Method</p>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                PayPal International
              </Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Steps to Pay:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the button below to copy our PayPal email</li>
                <li>Go to PayPal and send payment</li>
                <li>Contact {celebrityName} with your payment confirmation</li>
              </ol>
            </div>
          </div>
        </div>

        <Button
          onClick={copyToClipboard}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Email Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-5 w-5" />
              Copy PayPal Email
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          After payment, please contact the celebrity directly to confirm your booking
        </p>
      </CardContent>
    </Card>
  );
};

export default PayPalPayment;