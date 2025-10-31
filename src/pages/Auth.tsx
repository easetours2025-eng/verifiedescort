import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Star, Crown, Sparkles, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stageName, setStageName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState<number>(18);
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { login, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await login(email, password);
    
    if (error) {
      toast({
        title: "Login Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !stageName || !phoneNumber || age < 18) {
      toast({
        title: "Error",
        description: age < 18 ? "You must be 18 or older to register" : "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(?:\+254|254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
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
          data: {
            stage_name: stageName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create celebrity profile
        const { error: profileError } = await supabase
          .from('celebrity_profiles')
          .insert({
            user_id: authData.user.id,
            stage_name: stageName,
            phone_number: phoneNumber,
            email: email,
            age: age,
            is_verified: false,
          });

        if (profileError) throw profileError;

        setRegisteredEmail(email);
        setShowVerificationModal(true);
        
        toast({
          title: "Registration Successful!",
          description: "Please complete your profile in the dashboard.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Crown className="h-12 w-12 text-primary" />
              <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Celebrity Connect
          </h1>
          <p className="text-muted-foreground">
            Join the exclusive platform for celebrity meetups
          </p>
        </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-5 w-5 text-accent" />
              <CardTitle className="text-2xl text-center">Get Started</CardTitle>
              <Star className="h-5 w-5 text-accent" />
            </div>
            <CardDescription className="text-center">
              Login to your account or register as a new celebrity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-celebrity"
                    disabled={loading}
                  >
                    {loading ? "Logging In..." : "Login"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-stage-name">Stage Name</Label>
                    <Input
                      id="register-stage-name"
                      type="text"
                      placeholder="Your celebrity name"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-age">Age</Label>
                    <Input
                      id="register-age"
                      type="number"
                      min="18"
                      max="100"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Must be 18 or older</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="e.g., 0712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Kenyan phone number (required for M-Pesa)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:shadow-lg"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Register as Celebrity"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Email Verification Modal */}
        <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Account Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-base">
                Your celebrity account has been created successfully.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Check Your Email</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  We've sent a verification email to:
                </p>
                <div className="bg-white rounded p-2 border border-blue-200">
                  <p className="font-mono text-sm text-blue-800">{registeredEmail}</p>
                </div>
                <p className="text-blue-700 text-sm">
                  Please click the verification link in your email to activate your account and start using the platform.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-xs">
                  <strong>Note:</strong> Check your spam folder if you don't see the email within a few minutes.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowVerificationModal(false)}
                className="flex-1"
                variant="outline"
              >
                I'll Check Later
              </Button>
              <Button 
                onClick={() => {
                  setShowVerificationModal(false);
                  navigate('/dashboard');
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;