import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle, Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeOfferDialogProps {
  celebrityId: string;
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeOfferDialog = ({ celebrityId, isOpen, onClose }: WelcomeOfferDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <Gift className="h-16 w-16 text-primary relative z-10" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            🎉 Welcome Gift Activated! 🎉
          </DialogTitle>
          <DialogDescription className="text-center space-y-4 pt-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-lg font-semibold text-foreground mb-2">
                You've received a <span className="text-primary">FREE 1-Week</span> subscription!
              </p>
              <Badge variant="default" className="text-base px-4 py-2">
                VIP Elite • KES 1,150
              </Badge>
            </div>

            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>Full Access:</strong> Enjoy all VIP Elite features for 7 days
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>Get Discovered:</strong> Your profile is now visible to all users
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>No Payment Needed:</strong> This is completely free - no need to subscribe yet!
                </p>
              </div>
            </div>

            <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
              <p className="text-sm text-foreground">
                💡 <strong>Tip:</strong> Browse our platform, connect with fans, and explore all features. You can upgrade or extend your subscription anytime!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button onClick={onClose} size="lg" className="w-full sm:w-auto">
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeOfferDialog;
