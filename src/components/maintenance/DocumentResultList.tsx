import { AlertTriangle, Loader2, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MaintenanceKbSearchResult } from '../../types/maintenanceKb';
import { DocumentCard } from './DocumentCard';

interface DocumentResultListProps {
  documents: MaintenanceKbSearchResult[];
  isLoading: boolean;
  error?: string | null;
  selectedDocumentRequiresOcr?: boolean;
}

export function DocumentResultList({ documents, isLoading, error, selectedDocumentRequiresOcr = false }: DocumentResultListProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-r border-white/10 bg-[#0a0f1e]">
      <div className="shrink-0 border-b border-white/10 p-5">
        <h3 className="text-lg font-semibold text-white">Document Results</h3>
        <p className="text-xs text-slate-400">Ranked manuals, SOPs, troubleshooting guides, and history records</p>
        {selectedDocumentRequiresOcr ? (
          <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-100">
            Selected document is not searchable yet because OCR is required.
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {isLoading ? (
          <StateMessage icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Loading search" description="Retrieving maintenance knowledge for the selected context." />
        ) : error ? (
          <StateMessage icon={<AlertTriangle className="h-5 w-5" />} title="Error state" description={error} />
        ) : documents.length === 0 ? (
          <StateMessage icon={<SearchX className="h-5 w-5" />} title="Empty search result" description="No matching maintenance documents were found for the selected filters." />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentCard key={document.kb_id} document={document} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StateMessage({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed border-white/10 bg-[#101827] p-6 text-center">
      <div>
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300">
          {icon}
        </div>
        <div className="font-medium text-white">{title}</div>
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}
