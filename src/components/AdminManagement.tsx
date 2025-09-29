import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldPlus } from 'lucide-react';

interface AdminManagementProps {
  onAdminCreated: () => void;
}

const AdminManagement = ({ onAdminCreated }: AdminManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    is_super_admin: false
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      is_super_admin: false
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use the admin-auth edge function to create a new admin
      const response = await fetch(`https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/admin-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          email: formData.email,
          password: formData.password,
          is_super_admin: formData.is_super_admin
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: "Success",
        description: "Admin account created successfully",
      });

      resetForm();
      setIsOpen(false);
      onAdminCreated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <ShieldPlus className="h-4 w-4" />
          <span>Add Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Create New Admin</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin_email">Email *</Label>
            <Input
              id="admin_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin_password">Password *</Label>
            <Input
              id="admin_password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_super_admin}
              onCheckedChange={(checked) => setFormData({ ...formData, is_super_admin: checked })}
            />
            <Label>Super Admin</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Admin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminManagement;