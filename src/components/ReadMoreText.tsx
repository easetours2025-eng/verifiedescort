import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ReadMoreTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ReadMoreText: React.FC<ReadMoreTextProps> = ({ 
  text, 
  maxLength = 150, 
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.slice(0, maxLength) + "..." 
    : text;

  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-primary hover:text-primary/80 font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Read Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Read More
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default ReadMoreText;