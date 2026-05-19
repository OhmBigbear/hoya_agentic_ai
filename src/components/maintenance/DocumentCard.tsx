import { FileText } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent } from '../../app/components/ui/card';
import type { MaintenanceKbSearchResult } from '../../types/maintenanceKb';

interface DocumentCardProps {
  document: MaintenanceKbSearchResult;
}

const documentTypeLabels: Record<MaintenanceKbSearchResult['document_type'], string> = {
  history: 'History',
  lesson: 'Lesson',
  manual: 'Manual',
  sop: 'SOP',
  troubleshooting: 'Troubleshooting',
};

export function DocumentCard({ document }: DocumentCardProps) {
  const matchTone = document.match_score >= 85 ? 'text-green-300' : document.match_score >= 70 ? 'text-amber-300' : 'text-slate-300';

  return (
    <Card className="border-white/10 bg-[#141b2e] transition-colors hover:border-cyan-500/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="mt-1 rounded-md bg-cyan-500/15 p-2 text-cyan-300">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-cyan-300">{document.kb_id}</span>
                <Badge className="border-white/10 bg-white/5 text-slate-300">
                  {documentTypeLabels[document.document_type]}
                </Badge>
                <Badge className={document.source_origin === 'uploaded' ? 'border-green-500/30 bg-green-500/15 text-green-100' : 'border-blue-500/30 bg-blue-500/15 text-blue-100'}>
                  {document.source_origin === 'uploaded' ? 'Uploaded KB' : 'Seeded KB'}
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-white">{document.title}</h4>
              {document.summary || document.excerpt ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">{document.summary ?? document.excerpt}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{document.version}</span>
                <span>Updated {document.updated_at}</span>
                <span>{document.source_ref}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={`text-sm font-semibold ${matchTone}`}>{document.match_score}%</div>
            <div className="text-[11px] uppercase text-slate-500">match</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
