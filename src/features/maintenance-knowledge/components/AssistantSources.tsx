import { BookOpen } from 'lucide-react';
import { Badge } from '../../../app/components/ui/badge';
import type { ChatSource } from '../types';

interface AssistantSourcesProps {
  sources: ChatSource[];
}

export function AssistantSources({ sources }: AssistantSourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-3 h-3 text-slate-400" />
        <span className="text-xs font-medium text-slate-400">Sources Referenced:</span>
      </div>
      <div className="space-y-2">
        {sources.map((source, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 flex-shrink-0">
              {source.type}
            </Badge>
            <span className="text-slate-400">
              {source.title}
              {source.section && ` - ${source.section}`}
              {source.version && ` (${source.version})`}
              {source.date && ` - ${source.date}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
