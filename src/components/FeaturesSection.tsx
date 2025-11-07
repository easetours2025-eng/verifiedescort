import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, Trophy, Sparkles } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Star,
      title: 'Verified Profiles',
      description: 'All celebrities are verified for your safety and peace of mind'
    },
    {
      icon: Heart,
      title: 'Premium Experience',
      description: 'Exclusive meetings and personalized interactions'
    },
    {
      icon: Trophy,
      title: 'Top Celebrities',
      description: "Connect with Kenya's most exclusive personalities"
    },
    {
      icon: Sparkles,
      title: 'AI Smart Search',
      description: 'Find your perfect match with intelligent search'
    }
  ];

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover-scale hover:shadow-lg"
              >
                <CardContent className="p-4 sm:p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
