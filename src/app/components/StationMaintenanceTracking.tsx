import { MaintenanceWorkorderTrackingPage } from '../../pages/maintenance/MaintenanceWorkorderTrackingPage';

interface StationMaintenanceTrackingProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function StationMaintenanceTracking({ sidebarCollapsed }: StationMaintenanceTrackingProps) {
  return <MaintenanceWorkorderTrackingPage sidebarCollapsed={sidebarCollapsed} />;
}
