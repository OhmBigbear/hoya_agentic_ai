import { AlertTriangle, CheckCircle2, FileUp, Loader2, RefreshCcw, Search, Stethoscope, UploadCloud } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../app/components/ui/dialog';
import { Input } from '../../app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';
import type {
  DiagnosticsResponse,
  DocumentManifest,
  IngestResponse,
  MaintenanceKbDocumentStatus,
  MaintenanceKbDocumentMetadata,
  MaintenanceKbSearchRequest,
  UploadResponse,
} from '../../types/maintenanceKb';

const supportedExtensions = ['pdf', 'txt', 'docx', 'csv', 'xlsx'];
const supportedUploadDocumentTypes: Array<MaintenanceKbDocumentMetadata['document_type']> = ['maintenance', 'knowledge', 'other'];
const ocrRequiredMessage = 'No reliable text layer found. OCR is required before this document can be indexed.';
const documentProcessingMessage = 'Processing document. This may take a few minutes for scanned PDFs.';
const documentTypeLabels: Record<string, string> = {
  maintenance: 'Maintenance Document',
  knowledge: 'Knowledge Document',
  other: 'Other Document',
  manual: 'Maintenance Document',
  sop: 'Maintenance Document',
  troubleshooting: 'Maintenance Document',
  history: 'Maintenance Document',
  lesson: 'Knowledge Document',
};
const processingStatusLabels: Record<string, string> = {
  uploaded: 'Uploaded',
  pending: 'Waiting to process',
  queued: 'Waiting to process',
  parsing: 'Reading document',
  ocr_processing: 'Reading document',
  parsed: 'Parsed',
  ocr_completed: 'Parsed',
  chunking: 'Preparing knowledge',
  chunked: 'Ready for Indexing',
  embedding: 'Building search index',
  indexed: 'Ready for AI Search',
  ready: 'Ready for AI Search',
  active: 'Ready for AI Search',
  failed: 'Processing Failed',
};

const defaultMetadata: MaintenanceKbDocumentMetadata = {
  title: '',
  document_type: 'maintenance',
  line: 'rx1-surfacing',
  station: 'curve-generating',
  machine: 'curve-gen-3b',
  failure_type: '',
  knowledge_category: '',
  criticality: 'medium',
  language: 'en',
  version: '',
  owner: '',
  effective_date: '',
  tags: [],
};

interface DocumentManagementPanelProps {
  documents: DocumentManifest[];
  diagnostics: DiagnosticsResponse | null;
  ingestResult: IngestResponse | null;
  uploadResult: UploadResponse | null;
  isLoadingDocuments: boolean;
  isUploading: boolean;
  isIngesting: boolean;
  isLoadingDiagnostics: boolean;
  documentError?: string | null;
  ingestError?: string | null;
  diagnosticsError?: string | null;
  onUpload: (file: File, metadata: MaintenanceKbDocumentMetadata) => Promise<void>;
  onIngest: (documentId: string) => Promise<void>;
  onDiagnostics: (documentId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSearchFiltersChange: (filters: MaintenanceKbSearchRequest) => void;
  searchFilters: MaintenanceKbSearchRequest;
  selectedDocumentIds?: string[];
  onClearSelectedDocuments?: () => void;
}

export function DocumentManagementPanel({
  documents,
  diagnostics,
  ingestResult,
  uploadResult,
  isLoadingDocuments,
  isUploading,
  isIngesting,
  isLoadingDiagnostics,
  documentError,
  ingestError,
  diagnosticsError,
  onUpload,
  onIngest,
  onDiagnostics,
  onRefresh,
  onSearchFiltersChange,
  searchFilters,
  selectedDocumentIds = [],
  onClearSelectedDocuments,
}: DocumentManagementPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MaintenanceKbDocumentMetadata>(defaultMetadata);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(Boolean(diagnostics));

  const selectedDocument = useMemo(() => {
    const id = diagnostics?.document_id ?? ingestResult?.document_id ?? uploadResult?.document_id;
    return documents.find((document) => document.document_id === id);
  }, [diagnostics?.document_id, documents, ingestResult?.document_id, uploadResult?.document_id]);

  const selectedDocumentTitle = selectedDocument?.title ?? diagnostics?.manifest?.title ?? diagnostics?.document_id;
  const selectedDocumentFilename = selectedDocument?.filename ?? diagnostics?.manifest?.filename;

  useEffect(() => {
    if (diagnostics) {
      setIsDiagnosticsOpen(true);
    }
  }, [diagnostics]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setValidationError(null);

    if (nextFile && !metadata.title.trim()) {
      setMetadata((current) => ({
        ...current,
        title: nextFile.name.replace(/\.[^.]+$/, ''),
      }));
    }
  };

  const handleMetadataChange = (key: keyof MaintenanceKbDocumentMetadata, value: string) => {
    setMetadata((current) => ({
      ...current,
      [key]: key === 'tags' ? value.split(',').map((tag) => tag.trim()).filter(Boolean) : value,
    }));
  };

  const submitUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setValidationError('Select a PDF, TXT, DOCX, CSV, or XLSX file before uploading.');
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedExtensions.includes(extension)) {
      setValidationError('This file type is not supported yet.');
      return;
    }

    if (!metadata.title.trim()) {
      setValidationError('Enter a title before uploading.');
      return;
    }

    if (!metadata.document_type.trim()) {
      setValidationError('Select a document type before uploading.');
      return;
    }

    setValidationError(null);
    await onUpload(file, applyContextDefaults(metadata, searchFilters));
  };

  return (
    <section className="border-b border-white/10 bg-[#0a0f1e]">
      <div className="grid gap-4 p-5 xl:grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.1fr)]">
        <form onSubmit={submitUpload} className="rounded-md border border-white/10 bg-[#141b2e] p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileUp className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-semibold text-white">Upload Document</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase text-slate-400">File</label>
              <Input type="file" accept=".pdf,.txt,.docx,.csv,.xlsx" onChange={handleFileChange} className="border-white/10 bg-[#1e293b] text-slate-200" />
            </div>
            <Field label="Title" value={metadata.title} onChange={(value) => handleMetadataChange('title', value)} />
            <SelectField
              label="Document Type"
              value={metadata.document_type}
              options={supportedUploadDocumentTypes}
              onChange={(value) => handleMetadataChange('document_type', value)}
            />
            <Field label="Line" value={metadata.line} onChange={(value) => handleMetadataChange('line', value)} />
            <Field label="Station" value={metadata.station} onChange={(value) => handleMetadataChange('station', value)} />
            <Field label="Machine" value={metadata.machine} onChange={(value) => handleMetadataChange('machine', value)} />
            <Field label="Failure Type" value={metadata.failure_type ?? ''} onChange={(value) => handleMetadataChange('failure_type', value)} />
            <Field label="Knowledge Category" value={metadata.knowledge_category ?? ''} onChange={(value) => handleMetadataChange('knowledge_category', value)} />
            <SelectField
              label="Criticality"
              value={metadata.criticality}
              options={['low', 'medium', 'high', 'critical']}
              onChange={(value) => handleMetadataChange('criticality', value)}
            />
            <Field label="Language" value={metadata.language} onChange={(value) => handleMetadataChange('language', value)} />
            <Field label="Version" value={metadata.version ?? ''} onChange={(value) => handleMetadataChange('version', value)} />
            <Field label="Owner" value={metadata.owner ?? ''} onChange={(value) => handleMetadataChange('owner', value)} />
            <Field label="Effective Date" type="date" value={metadata.effective_date ?? ''} onChange={(value) => handleMetadataChange('effective_date', value)} />
            <div className="sm:col-span-2">
              <Field label="Tags" value={(metadata.tags ?? []).join(', ')} onChange={(value) => handleMetadataChange('tags', value)} placeholder="bearing, spindle, loto" />
            </div>
          </div>
          <StatusMessage message={validationError} tone="error" />
          <Button type="submit" disabled={isUploading} className="mt-3 bg-[#00d4ff] text-[#0a0f1e] hover:bg-[#00b8e6]">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </form>

        <div className="flex min-h-0 flex-col rounded-md border border-white/10 bg-[#141b2e] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Document Status</h3>
              <p className="text-xs text-slate-400">Uploaded documents and processing status</p>
            </div>
            <Button type="button" variant="outline" onClick={() => void onRefresh()} disabled={isLoadingDocuments} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
              {isLoadingDocuments ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
          {selectedDocumentIds.length ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/10 p-2 text-xs text-cyan-100">
              <span>AI is focusing on {formatFocusedDocuments(documents, selectedDocumentIds)}.</span>
              {onClearSelectedDocuments ? (
                <Button type="button" size="sm" variant="outline" onClick={onClearSelectedDocuments} className="h-7 border-white/10 bg-white/5 px-2 text-xs text-slate-200 hover:bg-white/10">
                  Clear Focus
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mb-3 grid gap-3 md:grid-cols-[1fr_96px]">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Search Query</label>
              <Input
                value={searchFilters.query ?? ''}
                onChange={(event) => onSearchFiltersChange({ ...searchFilters, query: event.target.value })}
                placeholder="Search uploaded and seeded evidence..."
                className="border-white/10 bg-[#1e293b] text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Top K</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={searchFilters.top_k ?? searchFilters.limit ?? 10}
                onChange={(event) => onSearchFiltersChange({ ...searchFilters, top_k: Number(event.target.value) || 10 })}
                className="border-white/10 bg-[#1e293b] text-white"
              />
            </div>
          </div>

          {isIngesting ? <StatusMessage message={documentProcessingMessage} tone="info" /> : null}
          <StatusMessage message={documentError ?? ingestError ?? diagnosticsError} tone="error" />
          <div className="min-h-0">
            {documents.length === 0 && !isLoadingDocuments && !documentError ? (
              <div className="rounded-md border border-dashed border-white/10 bg-[#101827] p-4 text-sm text-slate-400">No uploaded documents are available yet.</div>
            ) : (
              <div className="min-h-[300px] max-h-[42vh] space-y-2 overflow-auto pr-1">
                {documents.map((document) => (
                  <DocumentRow
                    key={document.document_id}
                    document={document}
                    isSelected={selectedDocumentIds.includes(document.document_id)}
                    diagnostics={diagnostics?.document_id === document.document_id ? diagnostics : null}
                    isIngesting={isIngesting}
                    isLoadingDiagnostics={isLoadingDiagnostics}
                    onIngest={onIngest}
                    onDiagnostics={onDiagnostics}
                  />
                ))}
              </div>
            )}
          </div>

          {ingestResult ? <ProcessingStatus result={ingestResult} /> : null}
        </div>
      </div>

      <Dialog open={isDiagnosticsOpen && Boolean(diagnostics)} onOpenChange={setIsDiagnosticsOpen}>
        <DialogContent className="grid max-h-[min(86vh,760px)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-white/10 bg-[#101827] p-0 text-slate-200 shadow-2xl shadow-black/40 sm:max-w-3xl">
          <DialogHeader className="border-b border-white/10 px-5 py-4 pr-12">
            <DialogTitle className="text-white">Document Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDocumentTitle ?? 'Selected document'}
              {selectedDocumentFilename ? <span className="block text-xs text-slate-500">{selectedDocumentFilename}</span> : null}
            </DialogDescription>
          </DialogHeader>
          {diagnostics ? (
            <DiagnosticsBlock diagnostics={diagnostics} title={selectedDocumentTitle} filename={selectedDocumentFilename} />
          ) : null}
          <DialogFooter className="border-t border-white/10 px-5 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function contextValue(value: string | undefined): string | undefined {
  return value && value !== 'all' ? value : undefined;
}

function applyContextDefaults(
  metadata: MaintenanceKbDocumentMetadata,
  searchFilters: MaintenanceKbSearchRequest,
): MaintenanceKbDocumentMetadata {
  return {
    ...metadata,
    line: metadata.line.trim() || contextValue(searchFilters.line) || contextValue(searchFilters.production_line) || '',
    station: metadata.station.trim() || contextValue(searchFilters.station) || '',
    machine: metadata.machine.trim() || contextValue(searchFilters.machine) || '',
    failure_type: metadata.failure_type?.trim() || contextValue(searchFilters.failure_type),
    document_type: (metadata.document_type.trim() || contextValue(searchFilters.document_type) || metadata.document_type) as MaintenanceKbDocumentMetadata['document_type'],
  };
}

function DocumentRow({
  document,
  isSelected,
  diagnostics,
  isIngesting,
  isLoadingDiagnostics,
  onIngest,
  onDiagnostics,
}: {
  document: DocumentManifest;
  isSelected: boolean;
  diagnostics: DiagnosticsResponse | null;
  isIngesting: boolean;
  isLoadingDiagnostics: boolean;
  onIngest: (documentId: string) => Promise<void>;
  onDiagnostics: (documentId: string) => Promise<void>;
}) {
  const effectiveStatus = getEffectiveDocumentStatus(document, diagnostics);
  const hasLifecycleSuccess = isSuccessfulLifecycleStatus(effectiveStatus);
  const requiresOcr = !hasLifecycleSuccess && shouldShowOcrRequired(document, diagnostics);
  const statusLabel = getProcessingStatusLabel(effectiveStatus);
  const visibleWarnings = filterVisibleWarnings(document.warnings, hasLifecycleSuccess);

  return (
    <div className={`rounded-md border p-3 ${isSelected ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-white/10 bg-[#101827]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{document.title}</span>
            <OriginBadge origin={document.source_origin} fallbackOrigin="uploaded" />
            {isSelected ? <Badge className="border-cyan-500/30 bg-cyan-500/15 text-cyan-100">Focused</Badge> : null}
            {requiresOcr ? <OcrRequiredBadge /> : null}
            <Badge className={requiresOcr ? 'border-amber-500/30 bg-amber-500/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-300'}>
              {statusLabel}
            </Badge>
          </div>
          <div className="text-xs text-slate-400">{document.filename}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{getDocumentTypeLabel(document.document_type)}</span>
            {document.machine ? <span>{document.machine}</span> : null}
            {document.version ? <span>{document.version}</span> : null}
            {document.uploaded_at ? <span>Uploaded {document.uploaded_at}</span> : null}
          </div>
          {visibleWarnings.length ? (
            <div className="mt-2 text-xs text-amber-200">{visibleWarnings.map(toUserFriendlyProcessingMessage).join(', ')}</div>
          ) : null}
          {requiresOcr ? (
            <div className="mt-2 flex gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-100">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{ocrRequiredMessage} Processing is disabled until OCR creates a reliable text layer for this document.</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" onClick={() => void onIngest(document.document_id)} disabled={isIngesting || requiresOcr} title={requiresOcr ? 'OCR is required before processing can run.' : undefined} className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50">
            {isIngesting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
            Process Document
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void onDiagnostics(document.document_id)} disabled={isLoadingDiagnostics} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
            {isLoadingDiagnostics ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="mr-2 h-3.5 w-3.5" />}
            Details
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProcessingStatus({ result }: { result: IngestResponse }) {
  return (
    <div className="mt-3 rounded-md border border-cyan-500/20 bg-cyan-500/10 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-cyan-100">Processing Status</div>
      <div className="grid gap-2 sm:grid-cols-4">
        {result.steps.map((step) => (
          <div key={step.step} className="rounded border border-white/10 bg-[#101827] p-2">
            <div className="text-xs font-medium text-white">{getStepLabel(step.step)}</div>
            <div className="text-xs text-cyan-200">{getProcessingStatusLabel(step.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosticsBlock({
  diagnostics,
  title,
  filename,
}: {
  diagnostics: DiagnosticsResponse;
  title?: string;
  filename?: string;
}) {
  const effectiveStatus = getEffectiveDiagnosticsStatus(diagnostics);
  const hasLifecycleSuccess = isSuccessfulLifecycleStatus(effectiveStatus);
  const requiresOcr = !hasLifecycleSuccess && diagnostics.requires_ocr === true && !indicatesNativeTextOrOcrSuccess(diagnostics.ocr_status);
  const visibleWarnings = filterVisibleWarnings(diagnostics.warnings, hasLifecycleSuccess);
  const checks = [
    ['Status', getProcessingStatusLabel(effectiveStatus)],
    ['Parsed', formatBoolean(diagnostics.parsed_exists ?? diagnostics.parsed_artifact_exists)],
    ['Ready for Indexing', formatBoolean(diagnostics.chunks_exists ?? diagnostics.chunk_artifact_exists)],
    ['Ready for AI Search', formatBoolean(diagnostics.active ?? diagnostics.indexed)],
  ];

  return (
    <div className="min-h-0 overflow-y-auto px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Search className="h-4 w-4 text-cyan-300" />
        <span className="text-sm font-semibold text-white">{title ?? diagnostics.document_id}</span>
        {filename ? <span className="text-xs text-slate-500">{filename}</span> : null}
        {effectiveStatus ? (
          <Badge className="border-white/10 bg-white/5 text-slate-300">{getProcessingStatusLabel(effectiveStatus)}</Badge>
        ) : null}
        {requiresOcr ? <OcrRequiredBadge /> : null}
      </div>
      {requiresOcr ? (
        <div className="mb-3 flex gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-xs text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{ocrRequiredMessage}</span>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {checks.map(([label, value]) => (
          <div key={String(label)} className="min-w-0 rounded-md border border-white/10 bg-[#141b2e] p-2 text-xs">
            <div className="mb-1 text-[11px] font-medium uppercase text-slate-500">{label}</div>
            <div className="break-words text-slate-200">{value === undefined || value === '' ? '-' : String(value)}</div>
          </div>
        ))}
      </div>
      {diagnostics.last_error && !hasLifecycleSuccess ? (
        <div className="mt-3 rounded-md border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-100">
          <div className="mb-1 font-semibold uppercase text-red-200">Processing message</div>
          <div className="break-words">{toUserFriendlyProcessingMessage(diagnostics.last_error)}</div>
        </div>
      ) : null}
      <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-100">
        <div className="mb-1 font-semibold uppercase text-amber-200">Warnings</div>
        {visibleWarnings.length ? (
          <ul className="space-y-1">
            {visibleWarnings.map((warning) => (
              <li key={warning} className="break-words">{toUserFriendlyProcessingMessage(warning)}</li>
            ))}
          </ul>
        ) : (
          <div>-</div>
        )}
      </div>
    </div>
  );
}

function OcrRequiredBadge() {
  return <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-100">OCR Required</Badge>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-slate-400">{label}</label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="border-white/10 bg-[#1e293b] text-white placeholder:text-slate-500" />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase text-slate-400">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-white/10 bg-[#1e293b] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#1e293b]">
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-white">
              {getDocumentTypeLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OriginBadge({ origin, fallbackOrigin }: { origin?: string; fallbackOrigin?: string }) {
  const effectiveOrigin = origin ?? fallbackOrigin;

  if (effectiveOrigin === 'uploaded') {
    return <Badge className="border-green-500/30 bg-green-500/15 text-green-100">Uploaded KB</Badge>;
  }

  if (effectiveOrigin === 'seeded') {
    return <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-100">Seeded KB</Badge>;
  }

  return <Badge className="border-white/10 bg-white/5 text-slate-300">Maintenance KB</Badge>;
}

function formatFocusedDocuments(documents: DocumentManifest[], selectedDocumentIds: string[]): string {
  if (selectedDocumentIds.length === 1) {
    return documents.find((document) => document.document_id === selectedDocumentIds[0])?.title ?? 'the selected document';
  }

  return `${selectedDocumentIds.length} selected documents`;
}

function hasOcrRequiredWarning(warnings: string[] | undefined): boolean {
  return warnings?.some((warning) => /ocr|text layer|extractable text/i.test(warning)) ?? false;
}

function hasProcessingWarning(warning: string): boolean {
  return /ocr|required|fail|failed|error|could not read|text layer|extractable text/i.test(warning);
}

function filterVisibleWarnings(warnings: string[] | undefined, hasLifecycleSuccess: boolean): string[] {
  if (!warnings?.length) {
    return [];
  }

  return hasLifecycleSuccess ? warnings.filter((warning) => !hasProcessingWarning(warning)) : warnings;
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

function getEffectiveStatus(...statuses: Array<string | undefined>): MaintenanceKbDocumentStatus | undefined {
  const successfulStatus = statuses.find(isSuccessfulLifecycleStatus);
  return (successfulStatus ?? statuses.find(Boolean)) as MaintenanceKbDocumentStatus | undefined;
}

function getEffectiveDocumentStatus(document: DocumentManifest, diagnostics: DiagnosticsResponse | null): MaintenanceKbDocumentStatus | undefined {
  return getEffectiveStatus(
    diagnostics?.final_status,
    document.final_status,
    diagnostics?.processing_status,
    document.processing_status,
    diagnostics?.status,
    diagnostics?.manifest_status,
    document.status,
  );
}

function getEffectiveDiagnosticsStatus(diagnostics: DiagnosticsResponse): MaintenanceKbDocumentStatus | undefined {
  return getEffectiveStatus(
    diagnostics.final_status,
    diagnostics.processing_status,
    diagnostics.status,
    diagnostics.manifest_status,
  );
}

function shouldShowOcrRequired(document: DocumentManifest, diagnostics: DiagnosticsResponse | null): boolean {
  const ocrStatus = diagnostics?.ocr_status ?? document.ocr_status;
  const hasTextSuccess = indicatesNativeTextOrOcrSuccess(ocrStatus)
    || isSuccessfulFinalStatus(diagnostics?.final_status)
    || isSuccessfulFinalStatus(document.final_status)
    || isSuccessfulLifecycleStatus(diagnostics?.processing_status)
    || isSuccessfulLifecycleStatus(document.processing_status);

  if (hasTextSuccess) {
    return false;
  }

  return document.requires_ocr === true || diagnostics?.requires_ocr === true || hasOcrRequiredWarning(document.warnings);
}

function StatusMessage({ message, tone }: { message?: string | null; tone: 'error' | 'success' | 'info' }) {
  if (!message) {
    return null;
  }

  const toneClassName = tone === 'error'
    ? 'border-red-500/25 bg-red-500/10 text-red-100'
    : tone === 'success'
      ? 'border-green-500/25 bg-green-500/10 text-green-100'
      : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100';
  const Icon = tone === 'error' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Loader2;

  return (
    <div className={`mt-3 flex gap-2 rounded-md border p-2 text-xs ${toneClassName}`}>
      <Icon className={`h-4 w-4 shrink-0 ${tone === 'info' ? 'animate-spin' : ''}`} />
      <span>{message}</span>
    </div>
  );
}

function formatBoolean(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'yes' : 'no';
}

function getDocumentTypeLabel(documentType: string): string {
  return documentTypeLabels[documentType] ?? documentType;
}

function getProcessingStatusLabel(status: string | undefined): string {
  return status ? processingStatusLabels[status] ?? status : '-';
}

function getStepLabel(step: string): string {
  const stepLabels: Record<string, string> = {
    parse: 'Read document',
    ocr: 'Read document',
    chunk: 'Prepare knowledge',
    index: 'Build search index',
    activate: 'Ready to ask',
  };
  return stepLabels[step] ?? step;
}

function toUserFriendlyProcessingMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (/unsupported.*file|file.*unsupported|unsupported_file|unsupported file type/.test(normalized)) {
    return 'This file type is not supported yet.';
  }

  if (/ocr.*fail|ocr_failed|ocr required|could not read|extract.*text|text layer/.test(normalized)) {
    return 'We could not read the document text.';
  }

  if (/chunk.*fail|chunking_failed|prepare.*search|prepare.*document/.test(normalized)) {
    return 'We could not prepare this document for search.';
  }

  if (/index.*fail|indexing_failed|searchable index|embedding.*fail/.test(normalized)) {
    return 'We could not build the searchable index.';
  }

  return message;
}
