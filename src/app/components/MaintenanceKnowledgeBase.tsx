import { MaintenanceKnowledgeBasePage } from '../../pages/maintenance/MaintenanceKnowledgeBasePage';

interface MaintenanceKnowledgeBaseProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function MaintenanceKnowledgeBase({ sidebarCollapsed, onNavigate }: MaintenanceKnowledgeBaseProps) {
  void onNavigate;

  return <MaintenanceKnowledgeBasePage sidebarCollapsed={sidebarCollapsed} />;
}
