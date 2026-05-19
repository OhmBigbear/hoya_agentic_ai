import { ExternalLink } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
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
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>
                    {source.kb_id}
                    {source.version ? ` - ${source.version}` : ''}
                    {source.section ? ` - ${source.section}` : ''}
                    {source.page ? ` - p.${source.page}` : ''}
                  </span>
                  <Badge className={source.source_origin === 'uploaded' ? 'border-green-500/30 bg-green-500/15 text-green-100' : 'border-blue-500/30 bg-blue-500/15 text-blue-100'}>
                    {source.source_origin === 'uploaded' ? 'Uploaded KB' : 'Seeded KB'}
                  </Badge>
                  {source.relevance_score !== undefined ? <span>{source.relevance_score}% score</span> : null}
                </div>
                {source.excerpt ? <div className="mt-2 text-xs leading-5 text-slate-300">{source.excerpt}</div> : null}
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
