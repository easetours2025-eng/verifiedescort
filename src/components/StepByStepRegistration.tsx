import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { GenderSelect } from '@/components/GenderSelect';
import { CountrySelect } from '@/components/CountrySelect';
import MediaUpload from '@/components/MediaUpload';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

interface StepByStepRegistrationProps {
  email: string;
  password: string;
  stageName: string;
  phoneNumber: string;
  age: number;
}

const StepByStepRegistration = ({ 
  email, 
  password, 
  stageName, 
  phoneNumber, 
  age 
}: StepByStepRegistrationProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [celebrityId, setCelebrityId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile data
  const [profileData, setProfileData] = useState({
    realName: '',
    bio: '',
    location: '',
    country: '',
    gender: [] as string[],
    basePrice: '0',
    hourlyRate: '',
    profilePicturePath: '',
  });

  // Services data
  const [services, setServices] = useState<Array<{
    serviceName: string;
    description: string;
    price: string;
    durationMinutes: string;
  }>>([{ serviceName: '', description: '', price: '0', durationMinutes: '60' }]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleAddService = () => {
    setServices([...services, { serviceName: '', description: '', price: '0', durationMinutes: '60' }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const handleProfileSubmit = async () => {
    if (!profileData.country) {
      toast({
        title: "Error",
        description: "Please select your country",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { stage_name: stageName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        setUserId(authData.user.id);

        // Create celebrity profile
        const { data: profileResult, error: profileError } = await supabase
          .from('celebrity_profiles')
          .insert({
            user_id: authData.user.id,
            stage_name: stageName,
            real_name: profileData.realName || null,
            email,
            phone_number: phoneNumber,
            bio: profileData.bio || null,
            location: profileData.location || null,
            country: profileData.country,
            gender: profileData.gender.length > 0 ? profileData.gender : null,
            age,
            base_price: parseFloat(profileData.basePrice) || 0,
            hourly_rate: profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : null,
            profile_picture_path: profileData.profilePicturePath || null,
            is_verified: false,
            is_available: true,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        
        if (profileResult) {
          setCelebrityId(profileResult.id);
        }

        toast({
          title: "Profile Created",
          description: "Your profile has been created successfully",
        });
        setCurrentStep(2);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServicesSubmit = async () => {
    if (!celebrityId) {
      toast({
        title: "Error",
        description: "Profile not created yet",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty services
    const validServices = services.filter(s => s.serviceName.trim() !== '');
    
    if (validServices.length === 0) {
      setCurrentStep(3);
      return;
    }

    setLoading(true);
    try {
      const servicesToInsert = validServices.map(service => ({
        celebrity_id: celebrityId,
        service_name: service.serviceName,
        description: service.description || null,
        price: parseFloat(service.price) || 0,
        duration_minutes: parseInt(service.durationMinutes) || 60,
        is_active: true,
      }));

      const { error } = await supabase
        .from('celebrity_services')
        .insert(servicesToInsert);

      if (error) throw error;

      toast({
        title: "Services Added",
        description: "Your services have been added successfully",
      });
      setCurrentStep(3);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploadComplete = () => {
    toast({
      title: "Media Uploaded",
      description: "Your media has been uploaded successfully",
    });
    setCurrentStep(4);
  };

  const handleFinalSubmit = () => {
    toast({
      title: "Registration Complete",
      description: "Welcome! Redirecting to your dashboard...",
    });
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {celebrityId && (
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <ProfilePictureUpload
                    profileId={celebrityId}
                    currentImagePath={profileData.profilePicturePath}
                    onUpload={(path) => setProfileData({ ...profileData, profilePicturePath: path })}
                    initials={stageName.substring(0, 2).toUpperCase()}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="realName">Real Name (Optional)</Label>
                <Input
                  id="realName"
                  value={profileData.realName}
                  onChange={(e) => setProfileData({ ...profileData, realName: e.target.value })}
                  placeholder="Your real name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">City/Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  placeholder="e.g., Nairobi, Kenya"
                />
              </div>

              <div className="space-y-2">
                <CountrySelect
                  value={profileData.country}
                  onChange={(country) => setProfileData({ ...profileData, country })}
                />
              </div>

              <div className="space-y-2">
                <GenderSelect
                  value={profileData.gender}
                  onChange={(genders) => setProfileData({ ...profileData, gender: genders })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={profileData.basePrice}
                    onChange={(e) => setProfileData({ ...profileData, basePrice: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={profileData.hourlyRate}
                    onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleProfileSubmit}
              disabled={loading || !profileData.country}
              className="w-full"
            >
              {loading ? "Creating Profile..." : "Continue to Services"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Add the services you offer. You can skip this step and add services later.
            </p>

            {services.map((service, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Service {index + 1}</h4>
                    {services.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveService(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={service.serviceName}
                      onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                      placeholder="e.g., Meet & Greet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      placeholder="Describe this service..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={service.durationMinutes}
                        onChange={(e) => handleServiceChange(index, 'durationMinutes', e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={handleAddService}
              className="w-full"
            >
              Add Another Service
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleServicesSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Saving..." : "Continue to Media"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Upload photos and videos to your profile. You can skip this step and add media later.
            </p>

            {celebrityId && (
              <MediaUpload
                celebrityId={celebrityId}
                onUpload={handleMediaUploadComplete}
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="flex-1"
              >
                Skip to Subscription
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">Profile Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your profile has been created. To appear on the homepage and be visible to clients, you need an active subscription.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-center">Choose Your Subscription</h4>
              <div className="bg-muted p-6 rounded-lg text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  To subscribe and appear on the homepage, please visit your dashboard and complete the payment process.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleFinalSubmit}
                className="flex-1"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}
            </CardDescription>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>Profile</span>
              <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>Services</span>
              <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>Media</span>
              <span className={currentStep >= 4 ? 'text-primary font-medium' : ''}>Subscription</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
};

export default StepByStepRegistration;
