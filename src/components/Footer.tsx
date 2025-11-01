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
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            aria-label="Contact support on WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
