import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cn } from './ui/utils';
import { LayoutDashboard, Users, FileCheck, Calendar, Settings, PhilippinePeso, Building, ClipboardList, CreditCard, Wrench, UserCog, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog.jsx';
import { Button } from './ui/button.jsx';

// Menu configurations by role
const adminMenuItems = {
  management: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'User Profiles', path: '/admin/users' },
    { icon: Building, label: 'Commercial Space', path: '/admin/commercial-space' },
    { icon: PhilippinePeso, label: 'Financials', path: '/admin/financial' },
    { icon: FileCheck, label: 'Compliance', path: '/admin/compliance' },
    { icon: Calendar, label: 'Scheduling', path: '/admin/schedule' },
    { icon: Settings, label: 'Operations', path: '/admin/operations' },
  ],
  system: [
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ]
};

const staffMenuItems = {
  management: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
    { icon: UserCog, label: 'My Profile', path: '/staff/profile' },
    { icon: PhilippinePeso, label: 'Financial', path: '/staff/financial' },
    { icon: Building, label: 'Commercial Space', path: '/staff/commercial-space' },
    { icon: FileCheck, label: 'Compliance', path: '/staff/compliance' },
    { icon: Calendar, label: 'Schedule', path: '/staff/schedule' },
    { icon: ClipboardList, label: 'Operations', path: '/staff/operations' },
  ],
  system: [
    { icon: Settings, label: 'Settings', path: '/staff/settings' },
  ]
};

const tenantMenuItems = {
  management: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/tenant' },
    { icon: UserCog, label: 'My Profile', path: '/tenant/profile' },
    { icon: Building, label: 'Commercial Space', path: '/tenant/commercial-space' },
    { icon: FileCheck, label: 'Documents', path: '/tenant/compliance' },
    { icon: CreditCard, label: 'Payments', path: '/tenant/payments' },
    { icon: Calendar, label: 'Appointments', path: '/tenant/appointments' },
    { icon: Wrench, label: 'Maintenance', path: '/tenant/maintenance' },
  ],
  system: [
    { icon: Settings, label: 'Settings', path: '/tenant/settings' },
  ]
};

const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'admin': return 'bg-[#2E3192]/10 text-[#2E3192]';
    case 'staff': return 'bg-[#F9E81B]/30 text-[#2E3192]';
    case 'tenant': return 'bg-[#ED1C24]/10 text-[#ED1C24]';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsLogoutModalOpen(false);
  };

  const menuItems = role === 'admin'
    ? adminMenuItems
    : role === 'staff'
    ? staffMenuItems
    : tenantMenuItems;

  // Renders static menu section with always visible arrows
  const renderStaticMenuSection = (items, sectionTitle) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-1">
        {sectionTitle && (
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-[#2E3192]/60 uppercase tracking-wider">
              {sectionTitle}
            </h3>
          </div>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#F9E81B]/30 text-[#2E3192] border-l-4 border-[#2E3192]'
                  : 'text-gray-700 hover:bg-[#F9E81B]/10 hover:text-[#2E3192]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5", isActive ? "text-[#2E3192]" : "text-gray-500")} />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <ChevronRight 
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#2E3192]" : "text-gray-400"
                )}
              />
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 hidden md:flex flex-col overflow-y-auto">
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Static sections with always visible arrows */}
          {renderStaticMenuSection(menuItems.management, 'Management')}
          {renderStaticMenuSection(menuItems.system, 'System')}
        </div>

        {/* User profile - entire section clickable */}
        {user && (
          <div 
            className="border-t border-gray-200 p-4 cursor-pointer hover:bg-[#F9E81B]/10 transition-colors duration-200"
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-[#F9E81B] flex-shrink-0">
                <AvatarImage src={user.avatar} alt={user.firstName} />
                <AvatarFallback className="bg-[#2E3192] text-white text-xs">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-[#2E3192] truncate">
                  {user.firstName} {user.lastName}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full w-fit mt-0.5 font-medium capitalize',
                  getRoleBadgeColor(user.role)
                )}>
                  {user.role}
                </span>
              </div>

              {/* Logout icon - visual indicator only */}
              <LogOut className="h-4 w-4 text-[#ED1C24]" />
            </div>
          </div>
        )}
      </aside>

      {/* Logout modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#2E3192]">Confirm Logout</DialogTitle>
            <DialogDescription className="text-base pt-2 text-gray-600">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto bg-[#ED1C24] hover:bg-[#c41920] text-white"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}