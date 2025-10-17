import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface GenderSelectProps {
  value: string[];
  onChange: (genders: string[]) => void;
  className?: string;
}

const PREDEFINED_GENDERS = [
  'Male',
  'Female',
  'Bisexual',
  'Lesbian',
  'Gay',
  'Sugar Mummies',
  'Ben10'
];

export const GenderSelect: React.FC<GenderSelectProps> = ({ value, onChange, className }) => {
  const [customGender, setCustomGender] = useState('');

  const toggleGender = (gender: string) => {
    const lowerGender = gender.toLowerCase();
    const currentLower = value.map(g => g.toLowerCase());
    
    if (currentLower.includes(lowerGender)) {
      onChange(value.filter(g => g.toLowerCase() !== lowerGender));
    } else {
      onChange([...value, gender]);
    }
  };

  const addCustomGender = () => {
    if (customGender.trim()) {
      const lowerCustom = customGender.trim().toLowerCase();
      const currentLower = value.map(g => g.toLowerCase());
      
      if (!currentLower.includes(lowerCustom)) {
        onChange([...value, customGender.trim()]);
      }
      setCustomGender('');
    }
  };

  const removeGender = (gender: string) => {
    onChange(value.filter(g => g.toLowerCase() !== gender.toLowerCase()));
  };

  const isSelected = (gender: string) => {
    return value.some(g => g.toLowerCase() === gender.toLowerCase());
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">Gender (Select all that apply)</Label>
      
      {/* Predefined gender options */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PREDEFINED_GENDERS.map(gender => (
          <Badge
            key={gender}
            variant={isSelected(gender) ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => toggleGender(gender)}
          >
            {gender}
            {isSelected(gender) && <X className="ml-1 h-3 w-3" />}
          </Badge>
        ))}
      </div>

      {/* Custom gender input */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Add custom gender..."
          value={customGender}
          onChange={(e) => setCustomGender(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomGender();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustomGender}
          disabled={!customGender.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected genders display */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Selected ({value.length}):</p>
          <div className="flex flex-wrap gap-1">
            {value.map(gender => (
              <Badge
                key={gender}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => removeGender(gender)}
              >
                {gender}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
