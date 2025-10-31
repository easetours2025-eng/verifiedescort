import React from 'react';
import { MessageCircle } from 'lucide-react';

const Footer = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/254102544817', '_blank');
  };

  return (
    <footer className="bg-card border-t border-border py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Support:</span>
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-1 text-primary hover:underline transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>+254 102544817</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
