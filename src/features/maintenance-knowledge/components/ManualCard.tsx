import { Download } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import { Card, CardContent } from '../../../app/components/ui/card';
import type { MachineManual } from '../types';

interface ManualCardProps {
  manual: MachineManual;
}

export function ManualCard({ manual }: ManualCardProps) {
  return (
    <Card className="bg-[#141b2e] border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
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
  );
}
