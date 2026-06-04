import { MaintenanceWorkorderTrackingPage } from '../../pages/maintenance/MaintenanceWorkorderTrackingPage';
import type { ComponentProps } from 'react';

interface StationMaintenanceTrackingProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
  services?: ComponentProps<typeof MaintenanceWorkorderTrackingPage>['services'];
}

export function StationMaintenanceTracking({ sidebarCollapsed, services }: StationMaintenanceTrackingProps) {
  return <MaintenanceWorkorderTrackingPage sidebarCollapsed={sidebarCollapsed} services={services} />;
}
