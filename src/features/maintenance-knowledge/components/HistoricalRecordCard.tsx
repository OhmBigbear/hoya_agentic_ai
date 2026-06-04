import { Calendar, Clock } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import { Card, CardContent } from '../../../app/components/ui/card';
import type { HistoricalMaintenanceRecord } from '../types';

interface HistoricalRecordCardProps {
  record: HistoricalMaintenanceRecord;
}

export function HistoricalRecordCard({ record }: HistoricalRecordCardProps) {
  return (
    <Card className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
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
  );
}
