import { FileText } from 'lucide-react';
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
                  <Badge className="border-white/10 bg-white/5 text-slate-300">{getDocumentTypeLabel(source.document_type)}</Badge>
                  {source.filename ? <span>{source.filename}</span> : null}
                  {source.page ? <span>Page {source.page}</span> : null}
                  {source.section ? <span>{source.section}</span> : null}
                  {source.score ?? source.relevance_score ? <span>{source.score ?? source.relevance_score}% score</span> : null}
                  {source.confidence_label ? <span>{getConfidenceLabel(source.confidence_label)} confidence</span> : null}
                  <OriginBadge origin={source.source_origin} />
                </div>
                {source.excerpt ? <div className="mt-2 text-xs leading-5 text-slate-300">{source.excerpt}</div> : null}
              </div>
              <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    maintenance: 'Maintenance Document',
    knowledge: 'Knowledge Document',
    other: 'Other Document',
    manual: 'Maintenance Document',
    sop: 'Maintenance Document',
    troubleshooting: 'Maintenance Document',
    history: 'Maintenance Document',
    lesson: 'Knowledge Document',
  };
  return labels[documentType] ?? documentType;
}

function getConfidenceLabel(label: string): string {
  return label.replace('_', ' ');
}

function OriginBadge({ origin }: { origin?: string }) {
  if (origin === 'uploaded') {
    return <Badge className="border-green-500/30 bg-green-500/15 text-green-100">Uploaded KB</Badge>;
  }

  if (origin === 'seeded') {
    return <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-100">Seeded KB</Badge>;
  }

  return <Badge className="border-white/10 bg-white/5 text-slate-300">Maintenance KB</Badge>;
}
