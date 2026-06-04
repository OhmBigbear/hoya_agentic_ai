import { Clock } from 'lucide-react';
import type { MaintenanceKbRelatedHistoryItem, MaintenanceKbSearchResult, MaintenanceKbSimilarCaseItem } from '../../types/maintenanceKb';

interface RelatedHistoryPanelProps {
  history: MaintenanceKbRelatedHistoryItem[];
  relatedDocuments: MaintenanceKbSearchResult[];
  similarCases?: MaintenanceKbSimilarCaseItem[];
}

export function RelatedHistoryPanel({ history, relatedDocuments, similarCases = [] }: RelatedHistoryPanelProps) {
  if (history.length === 0 && relatedDocuments.length === 0 && similarCases.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">Related History / Documents</h4>
      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="rounded-md border border-white/10 bg-[#101827] p-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>{item.date}</span>
              <span>{item.machine}</span>
            </div>
            <div className="text-sm font-medium text-white">{item.title}</div>
            <p className="mt-1 text-xs leading-5 text-slate-400">{item.summary}</p>
          </div>
        ))}
        {relatedDocuments.map((document) => (
          <div key={document.kb_id} className="rounded-md border border-white/10 bg-[#101827] p-3">
            <div className="text-xs font-semibold text-cyan-300">{document.kb_id}</div>
            <div className="mt-1 text-sm font-medium text-white">{document.title}</div>
            <div className="mt-1 text-xs text-slate-500">{document.summary ?? document.excerpt ?? document.source_ref}</div>
          </div>
        ))}
        {similarCases.map((item) => (
          <div key={item.id} className="rounded-md border border-white/10 bg-[#101827] p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {item.date ? <span>{item.date}</span> : null}
              {item.machine ? <span>{item.machine}</span> : null}
              {typeof item.confidence === 'number' ? <span>{item.confidence}% similar</span> : null}
            </div>
            <div className="text-sm font-medium text-white">{item.title}</div>
            {item.summary ? <p className="mt-1 text-xs leading-5 text-slate-400">{item.summary}</p> : null}
            {item.source_ref ? <div className="mt-1 text-xs text-slate-500">{item.source_ref}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
