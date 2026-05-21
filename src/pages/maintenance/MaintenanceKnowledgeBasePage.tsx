import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AssistantPanel } from '../../components/maintenance/AssistantPanel';
import { DocumentManagementPanel } from '../../components/maintenance/DocumentManagementPanel';
import { DocumentResultList } from '../../components/maintenance/DocumentResultList';
import { FilterPanel } from '../../components/maintenance/FilterPanel';
import { normalizeDocumentLifecycle } from '../../components/maintenance/documentLifecycle';
import {
  askMaintenanceKbAssistant,
  getDocumentDiagnostics,
  getMaintenanceKbContext,
  listDocuments,
  processDocument,
  searchMaintenanceKbDocuments,
  uploadDocument,
} from '../../services/maintenanceKbApi';
import type {
  DiagnosticsResponse,
  DocumentManifest,
  IngestResponse,
  MaintenanceKbChatResponse,
  MaintenanceKbContext,
  MaintenanceKbDocumentMetadata,
  MaintenanceKbRelatedHistoryItem,
  MaintenanceKbSearchRequest,
  MaintenanceKbSearchResult,
  UploadResponse,
} from '../../types/maintenanceKb';

interface MaintenanceKnowledgeBasePageProps {
  sidebarCollapsed?: boolean;
}

const relatedHistory: MaintenanceKbRelatedHistoryItem[] = [
  {
    id: 'MWO-2401-032',
    title: 'Spindle bearing noise',
    date: '2026-01-10',
    machine: 'CURVE-GEN-3B',
    summary: 'Bearing noise corrected after replacement and vibration validation. Root cause noted as contamination and elevated motor mount vibration.',
    source_ref: 'MWO-2401-032 repair log',
  },
  {
    id: 'MWO-2401-018',
    title: 'Scheduled PM',
    date: '2026-01-05',
    machine: 'CURVE-GEN-3B',
    summary: 'Preventive maintenance completed with spindle inspection, lubrication check, and alignment verification.',
    source_ref: 'MWO-2401-018 PM checklist',
  },
];

export function MaintenanceKnowledgeBasePage({
  sidebarCollapsed = false,
}: MaintenanceKnowledgeBasePageProps) {
  const [context, setContext] = useState<MaintenanceKbContext | null>(null);
  const [filters, setFilters] = useState<MaintenanceKbSearchRequest>({});
  const [documents, setDocuments] = useState<MaintenanceKbSearchResult[]>([]);
  const [documentManifests, setDocumentManifests] = useState<DocumentManifest[]>([]);
  const [question, setQuestion] = useState('How should we replace the CURVE-GEN-3B spindle bearing?');
  const [assistantResponse, setAssistantResponse] = useState<MaintenanceKbChatResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isDiagnosticsLoading, setIsDiagnosticsLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [traceId, setTraceId] = useState<string | undefined>();
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadContext() {
      setIsContextLoading(true);
      setContextError(null);
      try {
        const response = await getMaintenanceKbContext();
        if (!isMounted) {
          return;
        }
        setContext(response);
        setFilters(response.selected);
        setTraceId(response.trace_id);
      } catch (error) {
        if (isMounted) {
          setContext(null);
          setContextError(error instanceof Error ? error.message : 'Unable to load maintenance knowledge context.');
        }
      } finally {
        if (isMounted) {
          setIsContextLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshDocuments = async () => {
    setIsDocumentsLoading(true);
    setDocumentError(null);
    try {
      const response = await listDocuments(filters);
      setDocumentManifests(response);
    } catch (error) {
      setDocumentManifests([]);
      setDocumentError(error instanceof Error ? error.message : 'Unable to load uploaded maintenance documents.');
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  useEffect(() => {
    if (!context) {
      return;
    }

    void refreshDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const contextForPanel = useMemo(() => context ?? undefined, [context]);
  const selectedDocuments = useMemo(
    () => selectedDocumentIds
      .map((documentId) => documentManifests.find((document) => document.document_id === documentId))
      .filter((document): document is DocumentManifest => Boolean(document)),
    [documentManifests, selectedDocumentIds],
  );
  const groundedFilters = useMemo(
    () => withRetrievalGrounding(filters, selectedDocumentIds, selectedDocuments),
    [filters, selectedDocumentIds, selectedDocuments],
  );
  const selectedDocumentRequiresOcr = shouldTreatDiagnosticsAsOcrRequired(diagnostics);

  useEffect(() => {
    if (!context) {
      return;
    }

    let isMounted = true;

    async function loadDocuments() {
      setIsSearchLoading(true);
      setSearchError(null);
      try {
        const response = await searchMaintenanceKbDocuments(groundedFilters);
        if (isMounted) {
          setDocuments(response.items);
        }
      } catch (error) {
        if (isMounted) {
          setDocuments([]);
          setSearchError(error instanceof Error ? error.message : 'Unable to load maintenance documents.');
        }
      } finally {
        if (isMounted) {
          setIsSearchLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      isMounted = false;
    };
  }, [context, groundedFilters]);

  useEffect(() => {
    if (!uploadNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setUploadNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [uploadNotice]);

  const handleSendQuestion = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setIsAssistantLoading(true);
    setAssistantError(null);
    try {
      const response = await askMaintenanceKbAssistant({
        question: trimmedQuestion,
        context: groundedFilters,
        conversation_id: conversationId,
        trace_id: traceId,
      });
      setAssistantResponse(response);
      setConversationId(response.conversation_id ?? conversationId);
      setTraceId(response.trace_id ?? traceId);
    } catch (error) {
      setAssistantResponse(null);
      setAssistantError(error instanceof Error ? error.message : 'Unable to get assistant response.');
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const handleSelectSuggestedQuestion = (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    setAssistantError(null);
  };

  const handleUpload = async (file: File, metadata: MaintenanceKbDocumentMetadata) => {
    setIsUploading(true);
    try {
      const response = await uploadDocument(file, metadata);
      setUploadResult(response);
      setUploadNotice({
        tone: 'success',
        message: 'Document uploaded. Process it before asking questions from this document.',
      });
      await refreshDocuments();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload maintenance document.';
      setUploadResult(null);
      setUploadNotice({
        tone: 'error',
        message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleIngest = async (documentId: string) => {
    if (diagnostics?.document_id === documentId && shouldTreatDiagnosticsAsOcrRequired(diagnostics)) {
      setIngestError('Processing is disabled for this document because OCR is required before indexing.');
      return;
    }

    setIsIngesting(true);
    setIngestError(null);
    try {
      const response = await processDocument(documentId);
      setIngestResult(response);
      await refreshDocuments();
    } catch (error) {
      setIngestResult(null);
      setIngestError(error instanceof Error ? error.message : 'Unable to process maintenance document.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDiagnostics = async (documentId: string) => {
    setSelectedDocumentIds([documentId]);
    setIsDiagnosticsLoading(true);
    setDiagnosticsError(null);
    try {
      const response = await getDocumentDiagnostics(documentId);
      setDiagnostics(response);
    } catch (error) {
      setDiagnostics(null);
      setDiagnosticsError(error instanceof Error ? error.message : 'Diagnostics unavailable for this document.');
    } finally {
      setIsDiagnosticsLoading(false);
    }
  };

  const handleFiltersChange = (nextFilters: MaintenanceKbSearchRequest) => {
    const changedContext = hasRetrievalContextChanged(filters, nextFilters);
    setFilters(nextFilters);
    if (changedContext) {
      clearSelectedDocuments();
    }
  };

  const clearSelectedDocuments = () => {
    setSelectedDocumentIds([]);
    setDiagnostics(null);
    setDiagnosticsError(null);
  };

  return (
    <main
      className="fixed bottom-0 right-0 top-16 overflow-hidden bg-[#0a0f1e] transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      {uploadNotice ? <UploadNotice tone={uploadNotice.tone} message={uploadNotice.message} /> : null}
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-white/10 p-6 pb-4">
          <div className="mb-4">
            <h2 className="mb-1 text-2xl font-semibold text-white">Maintenance Knowledge Base</h2>
            <p className="text-sm text-slate-400">
              AI-powered knowledge hub for maintenance procedures, manuals, and historical insights
            </p>
          </div>

          {isContextLoading || !context ? (
            <div className="rounded-md border border-white/10 bg-[#141b2e] p-4 text-sm text-slate-300">
              Loading maintenance knowledge context...
            </div>
          ) : (
            <FilterPanel context={context} filters={filters} onFiltersChange={handleFiltersChange} />
          )}
        </div>

        {!isContextLoading && !context ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="rounded-md border border-red-500/25 bg-red-500/10 p-4 text-red-100">
              <AlertTriangle className="mb-2 h-5 w-5" />
              {contextError ?? 'Unable to load maintenance knowledge context.'}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <section className="flex min-h-0 flex-1 flex-col border-r border-white/10">
              <DocumentManagementPanel
                documents={documentManifests}
                diagnostics={diagnostics}
                ingestResult={ingestResult}
                uploadResult={uploadResult}
                isLoadingDocuments={isDocumentsLoading}
                isUploading={isUploading}
                isIngesting={isIngesting}
                isLoadingDiagnostics={isDiagnosticsLoading}
                documentError={documentError}
                ingestError={ingestError}
                diagnosticsError={diagnosticsError}
                onUpload={handleUpload}
                onIngest={handleIngest}
                onDiagnostics={handleDiagnostics}
                onRefresh={refreshDocuments}
                searchFilters={filters}
                onSearchFiltersChange={handleFiltersChange}
                selectedDocumentIds={selectedDocumentIds}
                onClearSelectedDocuments={clearSelectedDocuments}
              />
              <DocumentResultList
                documents={documents}
                isLoading={isContextLoading || isSearchLoading}
                error={searchError}
                selectedDocumentRequiresOcr={selectedDocumentRequiresOcr}
                selectedDocuments={selectedDocuments}
              />
            </section>
            <AssistantPanel
              context={contextForPanel}
              filters={filters}
              response={assistantResponse}
              question={question}
              isLoading={isAssistantLoading}
              error={assistantError}
              relatedHistory={assistantResponse?.related_history ?? relatedHistory}
              selectedDocumentRequiresOcr={selectedDocumentRequiresOcr}
              selectedDocuments={selectedDocuments}
              onQuestionChange={setQuestion}
              onSendQuestion={handleSendQuestion}
              onSelectQuestion={handleSelectSuggestedQuestion}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function shouldTreatDiagnosticsAsOcrRequired(diagnostics: DiagnosticsResponse | null): boolean {
  return normalizeDocumentLifecycle(diagnostics).requiresOcr;
}

function withRetrievalGrounding(
  filters: MaintenanceKbSearchRequest,
  selectedDocumentIds: string[],
  selectedDocuments: DocumentManifest[],
): MaintenanceKbSearchRequest {
  if (!selectedDocumentIds.length) {
    const {
      retrieval_scope: _retrievalScope,
      document_ids: _documentIds,
      document_types: _documentTypes,
      prefer_selected_documents: _preferSelectedDocuments,
      ...baseFilters
    } = filters;
    return {
      ...baseFilters,
      retrieval_scope: 'auto',
    };
  }

  return {
    ...filters,
    retrieval_scope: 'selected_documents',
    document_ids: selectedDocumentIds,
    document_types: selectedDocuments.length ? Array.from(new Set(selectedDocuments.map((document) => document.document_type))) : undefined,
    prefer_selected_documents: true,
  };
}

function hasRetrievalContextChanged(current: MaintenanceKbSearchRequest, next: MaintenanceKbSearchRequest): boolean {
  return (
    current.line !== next.line
    || current.production_line !== next.production_line
    || current.station !== next.station
    || current.machine !== next.machine
    || current.failure_type !== next.failure_type
    || current.document_type !== next.document_type
  );
}

function UploadNotice({ tone, message }: { tone: 'success' | 'error'; message: string }) {
  const isError = tone === 'error';

  return (
    <div className="pointer-events-none absolute right-6 top-6 z-30 w-[min(420px,calc(100%-3rem))]">
      <div
        className={`flex gap-2 rounded-md border p-3 text-sm shadow-xl shadow-black/30 ${
          isError ? 'border-red-500/25 bg-[#2a1520] text-red-100' : 'border-green-500/25 bg-[#10251e] text-green-100'
        }`}
        role="status"
        aria-live="polite"
      >
        {isError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
}
