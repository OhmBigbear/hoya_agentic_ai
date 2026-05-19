import { AlertTriangle, CheckCircle2, FileUp, Loader2, RefreshCcw, Search, Stethoscope, UploadCloud } from 'lucide-react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
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
  MaintenanceKbDocumentMetadata,
  MaintenanceKbSearchRequest,
  UploadResponse,
} from '../../types/maintenanceKb';

const supportedExtensions = ['pdf', 'txt', 'docx', 'csv', 'xlsx'];

const defaultMetadata: MaintenanceKbDocumentMetadata = {
  title: '',
  document_type: 'troubleshooting',
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
  uploadError?: string | null;
  ingestError?: string | null;
  diagnosticsError?: string | null;
  onUpload: (file: File, metadata: MaintenanceKbDocumentMetadata) => Promise<void>;
  onIngest: (documentId: string) => Promise<void>;
  onDiagnostics: (documentId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSearchFiltersChange: (filters: MaintenanceKbSearchRequest) => void;
  searchFilters: MaintenanceKbSearchRequest;
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
  uploadError,
  ingestError,
  diagnosticsError,
  onUpload,
  onIngest,
  onDiagnostics,
  onRefresh,
  onSearchFiltersChange,
  searchFilters,
}: DocumentManagementPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<MaintenanceKbDocumentMetadata>(defaultMetadata);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedDocumentTitle = useMemo(() => {
    const id = diagnostics?.document_id ?? ingestResult?.document_id ?? uploadResult?.document_id;
    return documents.find((document) => document.document_id === id)?.title ?? id;
  }, [diagnostics?.document_id, documents, ingestResult?.document_id, uploadResult?.document_id]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setValidationError(null);

    if (nextFile && !metadata.title) {
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
      setValidationError('Unsupported file type. Upload PDF, TXT, DOCX, CSV, or XLSX files.');
      return;
    }

    if (!metadata.title.trim()) {
      setValidationError('Enter a title before uploading.');
      return;
    }

    setValidationError(null);
    await onUpload(file, metadata);
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
              options={['troubleshooting', 'manual', 'sop', 'history', 'lesson']}
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
          <StatusMessage message={validationError ?? uploadError} tone="error" />
          {uploadResult ? (
            <StatusMessage message={`Uploaded document ${uploadResult.document_id}${uploadResult.trace_id ? ` • trace ${uploadResult.trace_id}` : ''}`} tone="success" />
          ) : null}
          <Button type="submit" disabled={isUploading} className="mt-3 bg-[#00d4ff] text-[#0a0f1e] hover:bg-[#00b8e6]">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </form>

        <div className="min-h-0 rounded-md border border-white/10 bg-[#141b2e] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Document Status</h3>
              <p className="text-xs text-slate-400">Uploaded manifests, ingestion actions, and UAT diagnostics</p>
            </div>
            <Button type="button" variant="outline" onClick={() => void onRefresh()} disabled={isLoadingDocuments} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
              {isLoadingDocuments ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

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

          <StatusMessage message={documentError ?? ingestError ?? diagnosticsError} tone="error" />
          {documents.length === 0 && !isLoadingDocuments && !documentError ? (
            <div className="rounded-md border border-dashed border-white/10 bg-[#101827] p-4 text-sm text-slate-400">No uploaded documents are available yet.</div>
          ) : (
            <div className="max-h-[270px] space-y-2 overflow-auto pr-1">
              {documents.map((document) => (
                <DocumentRow
                  key={document.document_id}
                  document={document}
                  isIngesting={isIngesting}
                  isLoadingDiagnostics={isLoadingDiagnostics}
                  onIngest={onIngest}
                  onDiagnostics={onDiagnostics}
                />
              ))}
            </div>
          )}

          {ingestResult ? <IngestSteps result={ingestResult} /> : null}
          {diagnostics ? <DiagnosticsBlock diagnostics={diagnostics} title={selectedDocumentTitle} /> : null}
        </div>
      </div>
    </section>
  );
}

function DocumentRow({
  document,
  isIngesting,
  isLoadingDiagnostics,
  onIngest,
  onDiagnostics,
}: {
  document: DocumentManifest;
  isIngesting: boolean;
  isLoadingDiagnostics: boolean;
  onIngest: (documentId: string) => Promise<void>;
  onDiagnostics: (documentId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-[#101827] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{document.title}</span>
            <OriginBadge origin={document.source_origin} />
            <Badge className="border-white/10 bg-white/5 text-slate-300">{document.status}</Badge>
          </div>
          <div className="text-xs text-slate-400">{document.filename}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{document.document_type}</span>
            {document.machine ? <span>{document.machine}</span> : null}
            {document.version ? <span>{document.version}</span> : null}
            {document.uploaded_at ? <span>Uploaded {document.uploaded_at}</span> : null}
          </div>
          {document.warnings?.length ? <div className="mt-2 text-xs text-amber-200">{document.warnings.join(', ')}</div> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" onClick={() => void onIngest(document.document_id)} disabled={isIngesting} className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30">
            {isIngesting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
            Ingest
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void onDiagnostics(document.document_id)} disabled={isLoadingDiagnostics} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
            {isLoadingDiagnostics ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="mr-2 h-3.5 w-3.5" />}
            Diagnostics
          </Button>
        </div>
      </div>
    </div>
  );
}

function IngestSteps({ result }: { result: IngestResponse }) {
  return (
    <div className="mt-3 rounded-md border border-cyan-500/20 bg-cyan-500/10 p-3">
      <div className="mb-2 text-xs font-semibold uppercase text-cyan-100">Ingest Steps</div>
      <div className="grid gap-2 sm:grid-cols-4">
        {result.steps.map((step) => (
          <div key={step.step} className="rounded border border-white/10 bg-[#101827] p-2">
            <div className="text-xs font-medium text-white">{step.step}</div>
            <div className="text-xs text-cyan-200">{step.status}</div>
          </div>
        ))}
      </div>
      {result.trace_id ? <div className="mt-2 text-xs text-slate-400">Trace: {result.trace_id}</div> : null}
    </div>
  );
}

function DiagnosticsBlock({ diagnostics, title }: { diagnostics: DiagnosticsResponse; title?: string }) {
  const checks = [
    ['manifest', diagnostics.manifest_status],
    ['file_exists', formatBoolean(diagnostics.file_exists)],
    ['parsed_exists', formatBoolean(diagnostics.parsed_exists)],
    ['chunks_exists', formatBoolean(diagnostics.chunks_exists)],
    ['indexed', formatBoolean(diagnostics.indexed)],
    ['active', formatBoolean(diagnostics.active)],
    ['vector_count', diagnostics.vector_count],
    ['source_origin', diagnostics.source_origin],
    ['checksum', diagnostics.checksum],
    ['trace_id', diagnostics.trace_id],
  ];

  return (
    <div className="mt-3 rounded-md border border-white/10 bg-[#101827] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-300">
        <Search className="h-3.5 w-3.5" />
        Diagnostics {title ? `• ${title}` : ''}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {checks.map(([label, value]) => (
          value === undefined || value === '' ? null : (
            <div key={String(label)} className="text-xs">
              <span className="text-slate-500">{label}:</span> <span className="text-slate-200">{String(value)}</span>
            </div>
          )
        ))}
      </div>
      {diagnostics.warnings?.length ? <div className="mt-2 text-xs text-amber-200">Warnings: {diagnostics.warnings.join(', ')}</div> : null}
      {diagnostics.indexing_metadata && Object.keys(diagnostics.indexing_metadata).length ? (
        <pre className="mt-2 max-h-24 overflow-auto rounded border border-white/10 bg-black/20 p-2 text-[11px] text-slate-300">
          {JSON.stringify(diagnostics.indexing_metadata, null, 2)}
        </pre>
      ) : null}
    </div>
  );
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
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OriginBadge({ origin }: { origin?: string }) {
  const isUploaded = origin === 'uploaded';
  return (
    <Badge className={isUploaded ? 'border-green-500/30 bg-green-500/15 text-green-100' : 'border-blue-500/30 bg-blue-500/15 text-blue-100'}>
      {isUploaded ? 'Uploaded KB' : 'Seeded KB'}
    </Badge>
  );
}

function StatusMessage({ message, tone }: { message?: string | null; tone: 'error' | 'success' }) {
  if (!message) {
    return null;
  }

  return (
    <div className={`mt-3 flex gap-2 rounded-md border p-2 text-xs ${tone === 'error' ? 'border-red-500/25 bg-red-500/10 text-red-100' : 'border-green-500/25 bg-green-500/10 text-green-100'}`}>
      {tone === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

function formatBoolean(value: boolean | undefined): string | undefined {
  return value === undefined ? undefined : value ? 'yes' : 'no';
}
