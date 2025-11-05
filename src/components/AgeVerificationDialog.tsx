import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface AgeVerificationDialogProps {
  isOpen: boolean;
  onAgree: () => void;
  onDecline: () => void;
}

const AgeVerificationDialog = ({ isOpen, onAgree, onDecline }: AgeVerificationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <DialogTitle className="text-3xl font-bold text-foreground">
              Tryst
            </DialogTitle>
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center text-foreground">
              This website contains adult content
            </h2>
            
            <div className="text-sm text-foreground space-y-2">
              <p>
                By continuing to use Tryst, you agree you're{' '}
                <span className="font-semibold">over the age of 18</span> and have{' '}
                <span className="font-semibold">read and agreed</span> to our{' '}
                <a href="#" className="text-primary hover:underline">
                  terms
                </a>
                .
              </p>
              
              <p>
                <span className="font-semibold">Parents/guardians</span>, you can learn more about
                online safety in the{' '}
                <a href="#" className="text-primary hover:underline">
                  Assembly Four parents guide
                </a>{' '}
                to adult content.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={onAgree}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                Agree and close
              </Button>
              <Button 
                onClick={onDecline}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Decline
              </Button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationDialog;
