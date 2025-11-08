import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Search } from 'lucide-react';

interface HeroSectionProps {
  user: any;
  celebrityCount: number;
}

const HeroSection = ({ user, celebrityCount }: HeroSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_52%/0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(45_93%_58%/0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in">
          {/* Crown Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-primary to-accent p-4 sm:p-6 rounded-2xl shadow-[var(--shadow-celebrity)]">
                <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent leading-tight">
              Royal Escorts Kenya
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Connect with verified celebrities for exclusive meetings, photo sessions, and personal interactions
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Button 
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-[var(--shadow-celebrity)] transition-all duration-300 hover-scale text-base sm:text-lg px-6 sm:px-8"
            >
              <Search className="mr-2 h-5 w-5" />
              Browse Celebrities
            </Button>
            {!user && (
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-primary hover:bg-primary/5 text-base sm:text-lg px-6 sm:px-8 hover-scale"
              >
                Join as Celebrity
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 max-w-2xl mx-auto">
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {celebrityCount}+
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Verified Celebrities</div>
            </div>
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center space-y-1 sm:space-y-2">
              <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Secure</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
