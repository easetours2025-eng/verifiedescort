import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BioGeneratorProps {
  onBioGenerated?: (bio: string) => void;
}

const AIBioGenerator: React.FC<BioGeneratorProps> = ({ onBioGenerated }) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    location: '',
    age: '',
    gender: '',
    interests: '',
    achievements: '',
    style: 'professional',
  });
  
  const [generatedBio, setGeneratedBio] = useState('');

  const handleGenerate = async () => {
    if (!formData.stageName) {
      toast({
        title: "Stage name required",
        description: "Please enter at least your stage name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Generating bio with data:', formData);
      
      const { data, error } = await supabase.functions.invoke('ai-bio-generator', {
        body: formData
      });

      if (error) throw error;

      if (data.success && data.bio) {
        setGeneratedBio(data.bio);
        onBioGenerated?.(data.bio);
        
        toast({
          title: "Bio generated!",
          description: "Your AI-generated bio is ready",
        });
      } else {
        throw new Error(data.error || 'Failed to generate bio');
      }

    } catch (error) {
      console.error('Bio generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate bio",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedBio);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Bio copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy bio",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Bio Generator</h2>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Let AI craft a compelling bio for you. Fill in your details and we'll create something amazing!
      </p>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stageName">Stage Name *</Label>
            <Input
              id="stageName"
              value={formData.stageName}
              onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
              placeholder="Your stage name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="realName">Real Name</Label>
            <Input
              id="realName"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              placeholder="Your real name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Nairobi, Kenya"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Your age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              placeholder="e.g., Male, Female, Non-binary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Writing Style</Label>
            <Select
              value={formData.style}
              onValueChange={(value) => setFormData({ ...formData, style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="creative">Creative & Artistic</SelectItem>
                <SelectItem value="inspiring">Inspiring & Motivational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Interests & Specialties</Label>
          <Input
            id="interests"
            value={formData.interests}
            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            placeholder="e.g., Music, Acting, Sports, Comedy"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="achievements">Key Achievements</Label>
          <Textarea
            id="achievements"
            value={formData.achievements}
            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
            placeholder="List your notable achievements, awards, or highlights"
            rows={3}
          />
        </div>
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating || !formData.stageName}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Bio
          </>
        )}
      </Button>

      {generatedBio && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label>Generated Bio</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {generatedBio}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Feel free to edit and customize this bio to make it truly yours!
          </p>
        </div>
      )}
    </Card>
  );
};

export default AIBioGenerator;
