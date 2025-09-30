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
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ServicesList from './ServicesList';

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
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
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
            duration_minutes: 60, // Default duration for internal tracking only
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
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Services Offered</span>
          </CardTitle>
          {isEditable && (
            <Button 
              onClick={() => setShowAddForm(true)} 
              size="sm"
              className="bg-gradient-to-r from-primary to-accent w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Add Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 space-y-3 sm:space-y-4">
        {/* Add/Edit Form */}
        {showAddForm && isEditable && (
            <Card className="border-2 border-primary/20 p-3 sm:p-4">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Name *</label>
                      <Input
                        value={formData.service_name}
                        onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                        placeholder="e.g., Personal Meet & Greet, Photoshoot, Performance"
                        required
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what this service includes..."
                        rows={3}
                        className="text-sm sm:text-base resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Services will be displayed as bullet points. If you have many services, a "read more" option will be shown.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto text-sm sm:text-base">
                      {saving ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm} className="w-full sm:w-auto text-sm sm:text-base">
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
          <ServicesList 
            services={services}
            isEditable={isEditable}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={toggleServiceStatus}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CelebrityServices;