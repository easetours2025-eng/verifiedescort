import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft } from 'lucide-react';

interface NavigationHeaderProps {
  showBackButton?: boolean;
}

const NavigationHeader = ({ showBackButton = true }: NavigationHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
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
          <span className="font-bold text-base sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline">
            Royal Escorts
          </span>
        </button>

        {/* Back Button */}
        {showBackButton && !isHomePage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-1.5 hover:bg-accent/10"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationHeader;