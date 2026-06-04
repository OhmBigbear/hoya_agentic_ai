import { useState } from 'react';
import { SignIn } from './components/SignIn';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MainContent } from './components/MainContent';
import { ProductionPerformance } from './components/ProductionPerformance';
import { WorkorderTracking } from './components/WorkorderTracking';
import { StationAnalysis } from './components/StationAnalysis';
import { ShiftOperatorAnalysis } from './components/ShiftOperatorAnalysis';
import { ScrapAnalysis } from './components/ScrapAnalysis';
import { StationMaintenanceTracking } from './components/StationMaintenanceTracking';
import { StationMaintenanceAnalysis } from './components/StationMaintenanceAnalysis';
import { MaintenanceKnowledgeBase } from './components/MaintenanceKnowledgeBase';
import { MaintenanceCostSpareParts } from './components/MaintenanceCostSpareParts';
import { EngineeringSandbox } from './components/EngineeringSandbox';
import { AgentsConfiguration } from './components/AgentsConfiguration';
import { RawDataExplorer } from './components/RawDataExplorer';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/maintenance/workorders') {
      return '/maintenance/workorders';
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash;
    }

    return '#overview';
  });

  const handleSignIn = () => {
    setIsAuthenticated(true);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  // Show Sign-In page if not authenticated
  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  // Render the appropriate page based on activePage
  const renderPage = () => {
    switch (activePage) {
      case '#production-performance':
        return <ProductionPerformance sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#workorder-tracking':
        return <WorkorderTracking sidebarCollapsed={sidebarCollapsed} />;
      case '#station-analysis':
        return <StationAnalysis sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#shift-operator-analysis':
        return <ShiftOperatorAnalysis sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#scrap-analysis':
        return <ScrapAnalysis sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#station-maintenance-tracking':
      case '/maintenance/workorders':
        return <StationMaintenanceTracking sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#station-maintenance-analysis':
        return <StationMaintenanceAnalysis sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#maintenance-cost-spare-parts':
        return <MaintenanceCostSpareParts sidebarCollapsed={sidebarCollapsed} />;
      case '#maintenance-kb':
        return <MaintenanceKnowledgeBase sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#engineering-sandbox':
        return <EngineeringSandbox sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#agents-config':
        return <AgentsConfiguration sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#raw-data-explorer':
        return <RawDataExplorer sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
      case '#overview':
      default:
        return <MainContent sidebarCollapsed={sidebarCollapsed} onNavigate={handleNavigate} />;
    }
  };

  // Show main application shell after sign-in
  return (
    <div className="size-full bg-[#0a0f1e]">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={toggleSidebar}
        activePage={activePage}
        onNavigate={handleNavigate}
      />
      <Header sidebarCollapsed={sidebarCollapsed} />
      {renderPage()}
    </div>
  );
}
