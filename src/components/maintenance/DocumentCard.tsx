import { FileText } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent } from '../../app/components/ui/card';
import type { MaintenanceKbSearchResult } from '../../types/maintenanceKb';

interface DocumentCardProps {
  document: MaintenanceKbSearchResult;
}

const documentTypeLabels: Record<MaintenanceKbSearchResult['document_type'], string> = {
  maintenance: 'Maintenance Document',
  history: 'Maintenance Document',
  lesson: 'Knowledge Document',
  manual: 'Maintenance Document',
  sop: 'Maintenance Document',
  troubleshooting: 'Maintenance Document',
  knowledge: 'Knowledge Document',
  other: 'Other Document',
};
const ocrRequiredMessage = 'No reliable text layer found. OCR is required before this document can be indexed.';

export function DocumentCard({ document }: DocumentCardProps) {
  const requiresOcr = shouldShowOcrRequired(document);

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
                <OriginBadge origin={document.source_origin} />
                {requiresOcr ? (
                  <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-100">OCR Required</Badge>
                ) : null}
              </div>
              <h4 className="text-sm font-semibold text-white">{document.title}</h4>
              {requiresOcr ? (
                <p className="mt-2 text-xs leading-5 text-amber-200">{ocrRequiredMessage}</p>
              ) : null}
              {document.summary || document.excerpt ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">{document.summary ?? document.excerpt}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{document.version}</span>
                <span>Updated {document.updated_at}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function shouldShowOcrRequired(document: MaintenanceKbSearchResult): boolean {
  const metadata = document.metadata ?? {};
  const finalStatus = document.final_status ?? getMetadataString(metadata, 'final_status');
  const processingStatus = document.processing_status ?? getMetadataString(metadata, 'processing_status');
  const ocrStatus = document.ocr_status ?? getMetadataString(metadata, 'ocr_status');

  if (
    isSuccessfulFinalStatus(finalStatus)
    || isSuccessfulLifecycleStatus(processingStatus)
    || indicatesNativeTextOrOcrSuccess(ocrStatus)
  ) {
    return false;
  }

  return document.requires_ocr === true;
}

function getMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function isSuccessfulLifecycleStatus(status: string | undefined): boolean {
  return status ? /^(parsed|chunked|indexed|ready|active|ocr_completed|completed|success)$/i.test(status) : false;
}

function isSuccessfulFinalStatus(status: string | undefined): boolean {
  return status ? /^(parsed|chunked|indexed|ready|active|completed|success)$/i.test(status) : false;
}

function indicatesNativeTextOrOcrSuccess(status: string | undefined): boolean {
  return status ? /^(native_text|native_text_success|skipped|ocr_skipped|completed|ocr_completed|success)$/i.test(status) : false;
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
