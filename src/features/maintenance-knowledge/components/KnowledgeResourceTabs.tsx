import { BookOpen, FileText, History, Lightbulb } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import type {
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../types';
import { HistoricalRecordCard } from './HistoricalRecordCard';
import { LessonLearnedCard } from './LessonLearnedCard';
import { ManualCard } from './ManualCard';
import { ProcedureCard } from './ProcedureCard';

interface KnowledgeResourceTabsProps {
  maintenanceProcedures: MaintenanceProcedure[];
  machineManuals: MachineManual[];
  historicalRecords: HistoricalMaintenanceRecord[];
  lessonsLearned: LessonLearned[];
}

export function KnowledgeResourceTabs({
  maintenanceProcedures,
  machineManuals,
  historicalRecords,
  lessonsLearned,
}: KnowledgeResourceTabsProps) {
  return (
    <div className="w-96 border-r border-white/10 bg-[#0a0f1e] overflow-auto">
      <Tabs defaultValue="procedures" className="h-full flex flex-col">
        <div className="border-b border-white/10 px-4 pt-4">
          <TabsList className="grid w-full grid-cols-4 bg-[#141b2e]">
            <TabsTrigger value="procedures" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
              <FileText className="w-3 h-3 mr-1" />
              SOPs
            </TabsTrigger>
            <TabsTrigger value="manuals" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
              <BookOpen className="w-3 h-3 mr-1" />
              Manuals
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
              <History className="w-3 h-3 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="lessons" className="text-xs data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
              <Lightbulb className="w-3 h-3 mr-1" />
              Lessons
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Maintenance Procedures */}
        <TabsContent value="procedures" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {maintenanceProcedures.map((proc) => (
              <ProcedureCard key={proc.id} procedure={proc} />
            ))}
          </div>
        </TabsContent>

        {/* Machine Manuals */}
        <TabsContent value="manuals" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {machineManuals.map((manual) => (
              <ManualCard key={manual.id} manual={manual} />
            ))}
          </div>
        </TabsContent>

        {/* Historical Records */}
        <TabsContent value="history" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {historicalRecords.map((record) => (
              <HistoricalRecordCard key={record.id} record={record} />
            ))}
          </div>
        </TabsContent>

        {/* Lessons Learned */}
        <TabsContent value="lessons" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {lessonsLearned.map((lesson) => (
              <LessonLearnedCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
