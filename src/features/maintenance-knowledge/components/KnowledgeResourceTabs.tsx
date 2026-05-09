import { BookOpen, Calendar, Clock, Download, ExternalLink, FileText, History, Lightbulb } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import { Card, CardContent } from '../../../app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import type {
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../types';

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
              <Card key={proc.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                          {proc.code}
                        </Badge>
                        {proc.relevance > 80 && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            {proc.relevance}% match
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1">{proc.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Version {proc.version}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {proc.updated}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Machine Manuals */}
        <TabsContent value="manuals" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {machineManuals.map((manual) => (
              <Card key={manual.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs mb-2">
                        {manual.category}
                      </Badge>
                      <h4 className="text-sm font-medium text-white mb-1">{manual.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>v{manual.version}</span>
                        <span>•</span>
                        <span>{manual.pages} pages</span>
                        <span>•</span>
                        <span>{manual.updated}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Historical Records */}
        <TabsContent value="history" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {historicalRecords.map((record) => (
              <Card key={record.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-cyan-400">{record.jobId}</span>
                        <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">
                          {record.machine}
                        </Badge>
                      </div>
                      <p className="text-sm text-white mb-2">{record.issue}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.duration}
                        </span>
                        <span>•</span>
                        <span>{record.technician}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Lessons Learned */}
        <TabsContent value="lessons" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-3">
            {lessonsLearned.map((lesson) => (
              <Card key={lesson.id} className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs mb-2">
                        {lesson.category}
                      </Badge>
                      <h4 className="text-sm font-medium text-white mb-2">{lesson.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">{lesson.summary}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{lesson.author}</span>
                        <span>•</span>
                        <span>{lesson.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
