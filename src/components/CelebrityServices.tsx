import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Briefcase
} from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

interface CelebrityServicesProps {
  celebrityId: string;
  services: Service[];
  onServicesUpdate: () => void;
  isEditable?: boolean;
}

const CelebrityServices: React.FC<CelebrityServicesProps> = ({ 
  celebrityId, 
  services, 
  onServicesUpdate, 
  isEditable = false 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    duration_minutes: 60,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      duration_minutes: 60,
    });
    setShowAddForm(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service_name.trim()) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('celebrity_services')
          .update({
            service_name: formData.service_name,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
          })
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        // Create new service
        const { error } = await supabase
          .from('celebrity_services')
          .insert({
            celebrity_id: celebrityId,
            service_name: formData.service_name,
            description: formData.description || null,
            duration_minutes: formData.duration_minutes,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service added successfully",
        });
      }

      resetForm();
      onServicesUpdate();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
    });
    setEditingService(service);
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('celebrity_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      onServicesUpdate();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('celebrity_services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service ${service.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      onServicesUpdate();
    } catch (error: any) {
      console.error('Error updating service status:', error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Services Offered</span>
          </CardTitle>
          {isEditable && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              size="sm"
              className="bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {showAddForm && isEditable && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Service Name *</label>
                    <Input
                      value={formData.service_name}
                      onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                      placeholder="e.g., Personal Meet & Greet"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Duration (minutes)</span>
                  </label>
                  <Input
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this service includes..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        {services.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
            <p className="text-muted-foreground">
              {isEditable 
                ? "Add your first service to let clients know what you offer"
                : "This celebrity hasn't added any services yet"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <Card key={service.id} className={`relative ${!service.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{service.service_name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                    {!service.is_active && (
                      <Badge variant="secondary" className="ml-2">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                  {/* Internal duration info for editing mode only, not displayed publicly */}
                  {isEditable && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                  )}

                    {isEditable && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleServiceStatus(service)}
                        >
                          {service.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CelebrityServices;