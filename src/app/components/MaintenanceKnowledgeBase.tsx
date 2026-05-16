import { Button } from './ui/button';
import {
  FileText,
  Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { KnowledgeContextFilters } from '../../features/maintenance-knowledge/components/KnowledgeContextFilters';
import { MaintenanceCopilotPanel } from '../../features/maintenance-knowledge/components/MaintenanceCopilotPanel';
import { KnowledgeResourceTabs } from '../../features/maintenance-knowledge/components/KnowledgeResourceTabs';
import {
  getHistoricalRecords,
  getLessonsLearned,
  getMachineManuals,
  getMaintenanceProcedures,
} from '../../features/maintenance-knowledge/services/maintenanceKnowledgeApi';
import { useMaintenanceCopilot } from '../../features/maintenance-knowledge/hooks/useMaintenanceCopilot';
import { useMaintenanceKnowledgeFilters } from '../../features/maintenance-knowledge/hooks/useMaintenanceKnowledgeFilters';
import type {
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../../features/maintenance-knowledge/types';

interface MaintenanceKnowledgeBaseProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function MaintenanceKnowledgeBase({ sidebarCollapsed, onNavigate }: MaintenanceKnowledgeBaseProps) {
  const {
    selectedMachine,
    selectedDocType,
    setSelectedMachine,
    setSelectedDocType,
  } = useMaintenanceKnowledgeFilters();
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    handleSuggestedQuestionSelect,
  } = useMaintenanceCopilot();
  const [maintenanceProcedures, setMaintenanceProcedures] = useState<MaintenanceProcedure[]>([]);
  const [machineManuals, setMachineManuals] = useState<MachineManual[]>([]);
  const [historicalRecords, setHistoricalRecords] = useState<HistoricalMaintenanceRecord[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<LessonLearned[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMaintenanceKnowledge() {
      const [
        procedures,
        manuals,
        records,
        lessons,
      ] = await Promise.all([
        getMaintenanceProcedures(),
        getMachineManuals(),
        getHistoricalRecords(),
        getLessonsLearned(),
      ]);

      if (!isMounted) {
        return;
      }

      setMaintenanceProcedures(procedures);
      setMachineManuals(manuals);
      setHistoricalRecords(records);
      setLessonsLearned(lessons);
    }

    void loadMaintenanceKnowledge();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Maintenance Knowledge Base</h2>
              <p className="text-sm text-slate-400">
                AI-powered knowledge hub for maintenance procedures, manuals, and historical insights
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                <FileText className="w-4 h-4 mr-1" />
                Upload Document
              </Button>
            </div>
          </div>

          <KnowledgeContextFilters
            selectedMachine={selectedMachine}
            onSelectedMachineChange={setSelectedMachine}
            selectedDocType={selectedDocType}
            onSelectedDocTypeChange={setSelectedDocType}
          />
        </div>

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          <KnowledgeResourceTabs
            maintenanceProcedures={maintenanceProcedures}
            machineManuals={machineManuals}
            historicalRecords={historicalRecords}
            lessonsLearned={lessonsLearned}
          />

          <MaintenanceCopilotPanel
            selectedMachine={selectedMachine}
            messages={messages}
            inputMessage={inputMessage}
            onInputMessageChange={setInputMessage}
            onSendMessage={handleSendMessage}
            onSuggestedQuestionSelect={handleSuggestedQuestionSelect}
          />
        </div>
      </div>
    </main>
  );
}
