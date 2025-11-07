import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Download, Smartphone, Zap, Wifi, Home, Share2, CheckCircle2 } from 'lucide-react';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useToast } from '@/hooks/use-toast';

const Install = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const { toast } = useToast();
  const [platform, setPlatform] = React.useState<'ios' | 'android' | 'desktop'>('desktop');

  React.useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      toast({
        title: "App Installing",
        description: "Royal Escorts is being added to your device",
      });
    } else if (!isInstallable) {
      toast({
        title: "Installation Info",
        description: platform === 'ios' 
          ? "On iOS, use Safari's share button and select 'Add to Home Screen'" 
          : "Follow the platform-specific instructions below",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader showNavigation />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-3xl shadow-lg">
              <Crown className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Install Royal Escorts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant access to verified celebrities. Install our app for the best experience.
          </p>
        </div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="max-w-2xl mx-auto mb-8 border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-6">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">App Already Installed</h3>
                <p className="text-sm text-muted-foreground">You're using the Royal Escorts app</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto mb-8">
            <Button 
              onClick={handleInstallClick}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary-glow text-lg py-6"
            >
              <Download className="mr-2 h-5 w-5" />
              {isInstallable ? 'Install App Now' : 'Get Install Instructions'}
            </Button>
          </div>
        )}

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Instant loading with optimized performance
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Wifi className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Works Offline</h3>
                <p className="text-sm text-muted-foreground">
                  Browse cached profiles without internet
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Home Screen</h3>
                <p className="text-sm text-muted-foreground">
                  Quick access like a native app
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Full Screen</h3>
                <p className="text-sm text-muted-foreground">
                  Immersive app-like experience
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Instructions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* iOS Instructions */}
          <Card className={platform === 'ios' ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                iOS (iPhone/iPad)
              </CardTitle>
              <CardDescription>Install using Safari browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Open in Safari</p>
                  <p className="text-sm text-muted-foreground">
                    Visit this page in Safari browser (required for iOS)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1 flex items-center gap-1">
                    Tap <Share2 className="h-4 w-4 inline" /> Share
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tap the share icon at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Add to Home Screen</p>
                  <p className="text-sm text-muted-foreground">
                    Scroll and select "Add to Home Screen"
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Tap "Add" to install the app
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card className={platform === 'android' ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Android
              </CardTitle>
              <CardDescription>Install using Chrome browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Open in Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    Visit this page in Chrome browser (recommended)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Tap Menu</p>
                  <p className="text-sm text-muted-foreground">
                    Tap the three dots (⋮) in the top right corner
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Install App</p>
                  <p className="text-sm text-muted-foreground">
                    Select "Install app" or "Add to Home screen"
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Confirm</p>
                  <p className="text-sm text-muted-foreground">
                    Tap "Install" to add the app
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Instructions */}
          <Card className={platform === 'desktop' ? 'border-primary shadow-lg' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Desktop
              </CardTitle>
              <CardDescription>Install on Windows/Mac/Linux</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium mb-1">Use Chrome/Edge</p>
                  <p className="text-sm text-muted-foreground">
                    Visit this page in Chrome or Edge browser
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium mb-1">Click Install Icon</p>
                  <p className="text-sm text-muted-foreground">
                    Look for the install icon (⊕) in the address bar
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium mb-1">Or Click Button</p>
                  <p className="text-sm text-muted-foreground">
                    Click the "Install App Now" button above
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium mb-1">Confirm Install</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Install" in the popup dialog
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Install;
