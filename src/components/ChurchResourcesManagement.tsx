import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface Church {
  id: string;
  name: string;
}

interface ChurchResource {
  id: string;
  church_id: string;
  resource_name: string;
  resource_type: string;
  quantity: number;
  condition: string;
  description?: string;
  acquired_date?: string;
  value?: number;
  churches?: Church;
}

const ChurchResourcesManagement = () => {
  const [resources, setResources] = useState<ChurchResource[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [churchFilter, setChurchFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ChurchResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    church_id: '',
    resource_name: '',
    resource_type: '',
    quantity: 1,
    condition: 'good',
    description: '',
    acquired_date: '',
    value: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resourcesData, churchesData] = await Promise.all([
        supabase.from('church_resources').select('*, churches(id, name)').order('created_at', { ascending: false }),
        supabase.from('churches').select('id, name').order('name')
      ]);

      if (resourcesData.error) throw resourcesData.error;
      if (churchesData.error) throw churchesData.error;

      setResources(resourcesData.data || []);
      setChurches(churchesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load church resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSubmit = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null
      };

      if (editingResource) {
        const { error } = await supabase
          .from('church_resources')
          .update(dataToSubmit)
          .eq('id', editingResource.id);

        if (error) throw error;
        toast({ title: "Success", description: "Resource updated successfully" });
      } else {
        const { error } = await supabase
          .from('church_resources')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({ title: "Success", description: "Resource added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (resource: ChurchResource) => {
    setEditingResource(resource);
    setFormData({
      church_id: resource.church_id,
      resource_name: resource.resource_name,
      resource_type: resource.resource_type,
      quantity: resource.quantity,
      condition: resource.condition,
      description: resource.description || '',
      acquired_date: resource.acquired_date || '',
      value: resource.value?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('church_resources')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast({ title: "Success", description: "Resource deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      church_id: '',
      resource_name: '',
      resource_type: '',
      quantity: 1,
      condition: 'good',
      description: '',
      acquired_date: '',
      value: ''
    });
    setEditingResource(null);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.resource_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.resource_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChurch = churchFilter === 'all' || resource.church_id === churchFilter;

    return matchesSearch && matchesChurch;
  });

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, any> = {
      excellent: 'default',
      good: 'secondary',
      fair: 'outline',
      poor: 'destructive'
    };
    return variants[condition] || 'secondary';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Church Resources Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={churchFilter} onValueChange={setChurchFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by church" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Churches</SelectItem>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="church_id">Church *</Label>
                      <Select
                        value={formData.church_id}
                        onValueChange={(value) => setFormData({ ...formData, church_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select church" />
                        </SelectTrigger>
                        <SelectContent>
                          {churches.map((church) => (
                            <SelectItem key={church.id} value={church.id}>
                              {church.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resource_name">Resource Name *</Label>
                      <Input
                        id="resource_name"
                        value={formData.resource_name}
                        onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resource_type">Resource Type *</Label>
                      <Select
                        value={formData.resource_type}
                        onValueChange={(value) => setFormData({ ...formData, resource_type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instrument">Musical Instrument</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="books">Books/Materials</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acquired_date">Acquired Date</Label>
                      <Input
                        id="acquired_date"
                        type="date"
                        value={formData.acquired_date}
                        onChange={(e) => setFormData({ ...formData, acquired_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Value (KES)</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingResource ? 'Update' : 'Add'} Resource
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource Name</TableHead>
                  <TableHead>Church</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No resources found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.resource_name}</TableCell>
                      <TableCell>{resource.churches?.name || '-'}</TableCell>
                      <TableCell className="capitalize">{resource.resource_type.replace('_', ' ')}</TableCell>
                      <TableCell>{resource.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={getConditionBadge(resource.condition) as any}>
                          {resource.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {resource.value ? `KES ${resource.value.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(resource.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChurchResourcesManagement;
