import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(true);
  const [checkingAdmins, setCheckingAdmins] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // For development - skip machine access and admin checks
    setHasAdmins(true);
    setCheckingAdmins(false);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
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
    try {
      // For development - simple check
      if (email === 'admin@admin.com' && password === 'admin123') {
        // Store admin session in localStorage
        localStorage.setItem('admin_session', JSON.stringify({
          email: email,
          id: 'dev-admin-id',
          loginTime: new Date().toISOString()
        }));

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in as admin.",
        });
        navigate('/admin');
      } else {
        throw new Error('Invalid credentials. Use admin@admin.com / admin123 for development.');
      }
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
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
    try {
      // For development - allow any signup
      localStorage.setItem('admin_session', JSON.stringify({
        email: email,
        id: 'dev-admin-id',
        loginTime: new Date().toISOString()
      }));

      toast({
        title: "Admin account created!",
        description: "You are now signed in as admin.",
      });
      navigate('/admin');
    } catch (error: any) {
      toast({
        title: "Sign Up Error", 
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-muted-foreground">
            Development Mode - Use admin@admin.com / admin123
          </p>
        </div>

        <Card className="shadow-xl border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <CardTitle className="text-2xl text-center">
                {hasAdmins ? 'Admin Sign In' : 'Create First Admin'}
              </CardTitle>
            </div>
            <CardDescription className="text-center">
              {hasAdmins 
                ? 'Enter your admin credentials to continue' 
                : 'Set up the first administrator account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasAdmins ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary-glow"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Create admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent to-accent/80"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Admin Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-sm"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;