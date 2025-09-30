import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Smartphone,
  X 
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  phone_number: string;
  mpesa_code: string;
  amount: number;
  payment_date: string;
  is_verified: boolean;
  expires_at: string;
}

interface PaymentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celebrityId: string;
}

const PaymentVerificationModal = ({ open, onOpenChange, celebrityId }: PaymentVerificationModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchPaymentRecords();
    }
  }, [open, user, celebrityId]);

  const fetchPaymentRecords = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_verification')
        .select('*')
        .eq('celebrity_id', celebrityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRecords(data || []);
    } catch (error) {
      console.error('Error fetching payment records:', error);
      toast({
        title: "Error",
        description: "Failed to load payment records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPaymentVerification = async () => {
    if (!phoneNumber.trim() || !mpesaCode.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('payment_verification')
        .insert({
          celebrity_id: celebrityId,
          phone_number: phoneNumber.trim(),
          mpesa_code: mpesaCode.trim().toUpperCase(),
          amount: 10
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentRecords(prev => [data, ...prev]);
      setPhoneNumber('');
      setMpesaCode('');

      toast({
        title: "Payment Submitted",
        description: "Your payment verification has been submitted for admin review",
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment verification",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (record: PaymentRecord) => {
    if (record.is_verified) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (new Date(record.expires_at) < new Date()) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (record: PaymentRecord) => {
    if (record.is_verified) return "Verified";
    if (new Date(record.expires_at) < new Date()) return "Expired";
    return "Pending";
  };

  const getStatusVariant = (record: PaymentRecord): "default" | "secondary" | "destructive" => {
    if (record.is_verified) return "default";
    if (new Date(record.expires_at) < new Date()) return "destructive";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Monthly Subscription Payment</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Payment Instructions */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                <span>M-Pesa Payment Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Details:</h4>
                <ul className="space-y-1 text-sm">
                  <li><strong>Amount:</strong> KSH 1,000 (≈ $10)</li>
                  <li><strong>Paybill Number:</strong> 2727278</li>
                  <li><strong>Account Number:</strong> Your celebrity profile name</li>
                  <li><strong>Description:</strong> Monthly subscription</li>
                </ul>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to M-Pesa on your phone</li>
                  <li>Select "Lipa na M-Pesa"</li>
                  <li>Select "Pay Bill"</li>
                  <li>Enter Business Number: <strong>2727278</strong></li>
                  <li>Enter Account Number: Your celebrity name</li>
                  <li>Enter Amount: <strong>1000</strong></li>
                  <li>Enter your M-Pesa PIN</li>
                  <li>Copy the M-Pesa code and submit below</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Payment Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Payment Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="254XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">M-Pesa Transaction Code</Label>
                  <Input
                    id="code"
                    placeholder="QGX7XXXXXX"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <Button
                onClick={submitPaymentVerification}
                disabled={!phoneNumber.trim() || !mpesaCode.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit for Verification"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : paymentRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(record)}
                        <div>
                          <p className="font-medium">{record.mpesa_code}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.phone_number} • KSH {record.amount * 100}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusVariant(record)}>
                          {getStatusText(record)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(record.payment_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentVerificationModal;