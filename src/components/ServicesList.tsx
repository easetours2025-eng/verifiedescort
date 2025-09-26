import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

interface ServicesListProps {
  services: Service[];
  isEditable: boolean;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onToggleStatus: (service: Service) => void;
}

const ServicesList: React.FC<ServicesListProps> = ({ 
  services, 
  isEditable, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}) => {
  const [showAllServices, setShowAllServices] = useState(false);
  const SERVICES_TO_SHOW = 5;
  
  const activeServices = services.filter(service => service.is_active);
  const inactiveServices = services.filter(service => !service.is_active);
  
  const displayedServices = showAllServices 
    ? activeServices 
    : activeServices.slice(0, SERVICES_TO_SHOW);
  
  const hasMoreServices = activeServices.length > SERVICES_TO_SHOW;

  if (isEditable) {
    // Editable view - show all services in cards
    return (
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

              <div className="flex items-center justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(service)}
                >
                  {service.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(service)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(service.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Public view - bullet points with read more
  return (
    <div className="space-y-3">
      {displayedServices.map((service, index) => (
        <div key={service.id} className="flex items-start space-x-3">
          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{service.service_name}</h4>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
            )}
          </div>
        </div>
      ))}
      
      {hasMoreServices && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllServices(!showAllServices)}
          className="flex items-center space-x-1 text-primary hover:text-primary/80 px-0"
        >
          {showAllServices ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span className="text-xs">Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span className="text-xs">+{activeServices.length - SERVICES_TO_SHOW} More Services</span>
            </>
          )}
        </Button>
      )}
      
      {inactiveServices.length > 0 && isEditable && (
        <div className="mt-4 pt-4 border-t border-muted">
          <p className="text-sm text-muted-foreground mb-2">Inactive Services:</p>
          <div className="space-y-2">
            {inactiveServices.map((service) => (
              <div key={service.id} className="flex items-center space-x-2 opacity-60">
                <CheckCircle className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{service.service_name}</span>
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesList;