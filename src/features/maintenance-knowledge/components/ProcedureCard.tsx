import { Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import { Card, CardContent } from '../../../app/components/ui/card';
import type { MaintenanceProcedure } from '../types';

interface ProcedureCardProps {
  procedure: MaintenanceProcedure;
}

export function ProcedureCard({ procedure }: ProcedureCardProps) {
  return (
    <Card className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                {procedure.code}
              </Badge>
              {procedure.relevance > 80 && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  {procedure.relevance}% match
                </Badge>
              )}
            </div>
            <h4 className="text-sm font-medium text-white mb-1">{procedure.title}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Version {procedure.version}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {procedure.updated}
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-8 w-8 p-0">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
