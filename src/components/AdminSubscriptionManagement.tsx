import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2, Crown, Gem, Sparkles, Star, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface SubscriptionPackage {
  id: string;
  tier_name: string;
  duration_type: string;
  price: number;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const tierIcons = {
  vip_elite: <Crown className="w-6 h-6" />,
  prime_plus: <Gem className="w-6 h-6" />,
  basic_pro: <Sparkles className="w-6 h-6" />,
  starter: <Star className="w-6 h-6" />,
};

const tierColors = {
  vip_elite: "from-yellow-500 to-amber-600",
  prime_plus: "from-purple-500 to-indigo-600",
  basic_pro: "from-blue-500 to-cyan-600",
  starter: "from-green-500 to-emerald-600",
};

const tierLabels = {
  vip_elite: "VIP Elite",
  prime_plus: "Prime Plus",
  basic_pro: "Basic Pro",
  starter: "Starter",
};

const defaultFeatures = {
  vip_elite: [
    "Top homepage spotlight & featured placement",
    "VIP Elite badge with gold styling",
    "Direct marketing campaigns to premium clients",
    "Priority customer support (24/7)",
    "Unlimited media uploads",
    "Advanced analytics dashboard",
    "Profile verification badge",
    "Social media promotion",
    "Featured in newsletter"
  ],
  prime_plus: [
    "Prominent homepage listing",
    "Prime Plus badge",
    "Quality traffic optimization",
    "Priority support (business hours)",
    "Profile promotion on social media",
    "10 premium media uploads",
    "Analytics dashboard",
    "Featured in category"
  ],
  basic_pro: [
    "Standard profile listing",
    "Basic Pro badge",
    "Search optimization",
    "Email support",
    "5 premium media uploads",
    "Basic analytics",
    "Profile boost once/week"
  ],
  starter: [
    "Basic profile listing",
    "Starter badge",
    "Standard visibility",
    "Email support",
    "3 media uploads",
    "Easy setup & onboarding"
  ]
};

export default function AdminSubscriptionManagement() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tier_name: "starter",
    duration_type: "1_month",
    price: 0,
    features: [] as string[],
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .order("duration_type", { ascending: false })
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const parsedData = (data || []).map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) 
          ? pkg.features.map(f => String(f))
          : []
      }));
      
      setPackages(parsedData);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Failed to load subscription packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from("subscription_packages")
          .update({
            tier_name: formData.tier_name,
            duration_type: formData.duration_type,
            price: formData.price,
            features: formData.features,
            is_active: formData.is_active,
            display_order: formData.display_order,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast.success("Package updated successfully");
      } else {
        const { error } = await supabase
          .from("subscription_packages")
          .insert({
            tier_name: formData.tier_name,
            duration_type: formData.duration_type,
            price: formData.price,
            features: formData.features,
            is_active: formData.is_active,
            display_order: formData.display_order
          });

        if (error) throw error;
        toast.success("Package created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Failed to save package");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subscription_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Package deleted successfully");
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package");
    }
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    setFormData({
      tier_name: pkg.tier_name,
      duration_type: pkg.duration_type,
      price: pkg.price,
      features: pkg.features,
      is_active: pkg.is_active,
      display_order: pkg.display_order
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      tier_name: "starter",
      duration_type: "1_month",
      price: 0,
      features: [],
      is_active: true,
      display_order: 0
    });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ""]
    });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const loadDefaultFeatures = () => {
    setFormData({
      ...formData,
      features: defaultFeatures[formData.tier_name as keyof typeof defaultFeatures] || []
    });
  };

  const getPackagesByDuration = (duration: string) => {
    return packages.filter(pkg => pkg.duration_type === duration);
  };

  const togglePackageStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("subscription_packages")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Package ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPackages();
    } catch (error) {
      console.error("Error toggling package status:", error);
      toast.error("Failed to update package status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">Manage subscription packages and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Edit Package" : "Create New Package"}
              </DialogTitle>
              <DialogDescription>
                Configure subscription package details and features
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tier</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.tier_name}
                    onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                  >
                    <option value="starter">Starter</option>
                    <option value="basic_pro">Basic Pro</option>
                    <option value="prime_plus">Prime Plus</option>
                    <option value="vip_elite">VIP Elite</option>
                  </select>
                </div>
                <div>
                  <Label>Duration</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={formData.duration_type}
                    onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                  >
                    <option value="1_week">1 Week</option>
                    <option value="2_weeks">2 Weeks</option>
                    <option value="1_month">1 Month</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (KSH)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadDefaultFeatures}
                  >
                    Load Default Features
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature description"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingPackage ? "Update" : "Create"} Package
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading packages...</div>
      ) : (
        <Tabs defaultValue="1_month" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1_month">1 Month Packages</TabsTrigger>
            <TabsTrigger value="2_weeks">2 Weeks Packages</TabsTrigger>
            <TabsTrigger value="1_week">1 Week Packages</TabsTrigger>
          </TabsList>

          {["1_month", "2_weeks", "1_week"].map((duration) => (
            <TabsContent key={duration} value={duration}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {getPackagesByDuration(duration).map((pkg) => (
                  <Card key={pkg.id} className="relative">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                          tierColors[pkg.tier_name as keyof typeof tierColors]
                        } flex items-center justify-center text-white mb-2`}
                      >
                        {tierIcons[pkg.tier_name as keyof typeof tierIcons]}
                      </div>
                      <CardTitle className="flex items-center justify-between">
                        {tierLabels[pkg.tier_name as keyof typeof tierLabels]}
                        <Badge variant={pkg.is_active ? "default" : "secondary"}>
                          {pkg.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Display Order: {pkg.display_order}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-4">
                        KSH {pkg.price.toLocaleString()}
                      </div>
                      <ul className="space-y-2 mb-4">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          className="flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePackageStatus(pkg.id, pkg.is_active)}
                        >
                          {pkg.is_active ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Package?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                subscription package.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(pkg.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
