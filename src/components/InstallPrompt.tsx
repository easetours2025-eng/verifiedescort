import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { X, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InstallPrompt = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { toast } = useToast();
  const [showBanner, setShowBanner] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if user has dismissed the install banner
    const dismissed = localStorage.getItem('installBannerDismissed');
    
    // Show install banner only if app is installable and user hasn't dismissed it
    if (isInstallable && !dismissed) {
      // Delay showing banner by 2 seconds for better UX
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and waiting
                setWaitingWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Check if there's already a waiting service worker
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      toast({
        title: "App installed!",
        description: "You can now access Royal Escorts from your home screen.",
      });
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Show update prompt for installed users
  if (showUpdatePrompt && (isInstalled || !isInstallable)) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg border-t border-primary/20 animate-in slide-in-from-bottom duration-300">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <RefreshCw className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">New update available!</p>
              <p className="text-xs opacity-90">Refresh to get the latest features and improvements.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleRefresh}
              size="sm"
              variant="secondary"
              className="flex-shrink-0"
            >
              Refresh Now
            </Button>
            <Button
              onClick={() => setShowUpdatePrompt(false)}
              size="sm"
              variant="ghost"
              className="flex-shrink-0 hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show install banner for non-installed users
  if (!showBanner || !isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg border-t border-primary/20 animate-in slide-in-from-bottom duration-300">
      <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Download className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Install Royal Escorts</p>
            <p className="text-xs opacity-90">Get the full app experience on your device</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleInstallClick}
            size="sm"
            variant="secondary"
            className="flex-shrink-0"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="flex-shrink-0 hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
