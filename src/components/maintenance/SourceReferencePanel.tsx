import { ExternalLink } from 'lucide-react';
import type { MaintenanceKbSourceReference } from '../../types/maintenanceKb';

interface SourceReferencePanelProps {
  sources: MaintenanceKbSourceReference[];
}

export function SourceReferencePanel({ sources }: SourceReferencePanelProps) {
  if (sources.length === 0) {
    return (
      <div className="rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-100">
        No evidence found for the current question and filters.
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">Source References</h4>
      <div className="space-y-2">
        {sources.map((source) => (
          <div key={source.source_id} className="rounded-md border border-white/10 bg-[#101827] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">{source.title}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {source.kb_id}
                  {source.version ? ` - ${source.version}` : ''}
                  {source.section ? ` - ${source.section}` : ''}
                  {source.page ? ` - p.${source.page}` : ''}
                </div>
                <div className="mt-2 text-xs text-slate-500">{source.source_ref}</div>
              </div>
              <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
