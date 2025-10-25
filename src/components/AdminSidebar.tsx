import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Video,
  Settings,
  ChevronRight,
  BarChart3,
  Package,
  HeadphonesIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ activeTab, onTabChange, isOpen = true, onClose }: AdminSidebarProps) => {
  const [isDashboardOpen, setIsDashboardOpen] = React.useState(true);

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'celebrities', label: 'Celebrities', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Package },
    { id: 'premium-support', label: 'Premium Support', icon: HeadphonesIcon },
    { id: 'videos', label: 'Videos', icon: Video },
  ];

  const handleNavClick = (id: string) => {
    onTabChange(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-sidebar border-r border-border h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo and Close Button */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground italic">RoyalEscorts Staff</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 px-3">
              MAIN NAVIGATION
            </p>
            
            <Collapsible open={isDashboardOpen} onOpenChange={setIsDashboardOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboards</span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isDashboardOpen && "rotate-90"
                )} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-1 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex items-center gap-2 w-full pl-9 pr-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Settings */}
          <div>
            <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
    </>
  );
};

export default AdminSidebar;
