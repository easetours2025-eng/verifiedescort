import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus, Globe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, className }) => {
  const [customCountry, setCustomCountry] = useState('');
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('available_countries')
        .select('country_name')
        .order('country_name');

      if (error) throw error;
      setAvailableCountries(data?.map(c => c.country_name) || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = (country: string) => {
    onChange(country);
  };

  const addCustomCountry = () => {
    if (customCountry.trim()) {
      onChange(customCountry.trim());
      setCustomCountry('');
      // Refresh countries list to include the new one
      setTimeout(fetchCountries, 500);
    }
  };

  const clearSelection = () => {
    onChange('');
  };

  const isSelected = (country: string) => {
    return value.toLowerCase() === country.toLowerCase();
  };

  if (loading) {
    return (
      <div className={className}>
        <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Country of Origin
        </Label>
        <p className="text-sm text-muted-foreground">Loading countries...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Country of Origin
      </Label>
      
      {/* Predefined country options */}
      <div className="flex flex-wrap gap-2 mb-3">
        {availableCountries.map(country => (
          <Badge
            key={country}
            variant={isSelected(country) ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => selectCountry(country)}
          >
            {country}
            {isSelected(country) && <X className="ml-1 h-3 w-3" onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }} />}
          </Badge>
        ))}
      </div>

      {/* Custom country input */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Add your country..."
          value={customCountry}
          onChange={(e) => setCustomCountry(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomCountry();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustomCountry}
          disabled={!customCountry.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected country display */}
      {value && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Selected:</p>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={clearSelection}
          >
            {value}
            <X className="ml-1 h-3 w-3" />
          </Badge>
        </div>
      )}
    </div>
  );
};