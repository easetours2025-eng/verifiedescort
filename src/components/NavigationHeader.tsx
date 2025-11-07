import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Video, LogOut, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface NavigationHeaderProps {
  showBackButton?: boolean;
  sticky?: boolean;
  showNavigation?: boolean;
}

const NavigationHeader = ({ showBackButton = true, sticky = false, showNavigation = false }: NavigationHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { user, signOut } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  const goHome = () => {
    navigate('/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else {
      navigate('/install');
    }
  };

  return (
    <div className={`${sticky ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm`}>
      <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={goHome}
          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity group"
          aria-label="Go to homepage"
        >
          <div className="bg-gradient-to-r from-primary to-accent p-1.5 sm:p-2 rounded-lg group-hover:scale-105 transition-transform shadow-sm">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
        </button>

        {/* Navigation Buttons */}
        {showNavigation && (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/faq')}
              className="hover:bg-accent/10"
            >
              FAQ
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/videos')}
              className="hover:bg-accent/10 flex items-center gap-1.5"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </Button>
            {!isInstalled && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleInstallClick}
                className="hover:bg-accent/10 flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            )}
            {user && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="hover:bg-accent/10"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="hover:bg-accent/10 flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            )}
            {!user && (
              <Button 
                onClick={() => navigate('/auth')}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                Join
              </Button>
            )}
          </div>
        )}

        {/* Back Button - Only shown when showBackButton is true and not on homepage */}
        {showBackButton && !isHomePage && !showNavigation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 hover:bg-accent/10"
            aria-label="Go back"
          >
            <span className="hidden sm:inline text-sm">Back</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationHeader;