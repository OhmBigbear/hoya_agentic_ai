import type {
  DiagnosticsResponse,
  DocumentManifest,
  IngestResponse,
  MaintenanceKbChatRequest,
  MaintenanceKbChatResponse,
  MaintenanceKbConfidenceLabel,
  MaintenanceKbContext,
  MaintenanceKbDocumentType,
  MaintenanceKbDocumentMetadata,
  MaintenanceKbRelatedHistoryItem,
  MaintenanceKbSearchRequest,
  MaintenanceKbSearchResponse,
  MaintenanceKbSearchResult,
  MaintenanceKbSimilarCaseItem,
  MaintenanceKbSourceReference,
  MaintenanceKbSuggestedQuestion,
  UploadResponse,
} from '../types/maintenanceKb';

const DEFAULT_API_BASE_URL = 'http://localhost:8100';
const REQUEST_TIMEOUT_MS = 12_000;
export const DOCUMENT_PROCESS_TIMEOUT_MS = 240_000;
export const DOCUMENT_PROCESS_TIMEOUT_MESSAGE = 'Document processing is taking longer than expected. Please refresh the document status in a moment.';
const MAINTENANCE_KB_ENDPOINTS = {
  context: '/api/maintenance/kb/context',
  documents: '/api/maintenance/kb/documents',
  upload: '/api/maintenance/kb/documents/upload',
  search: '/api/maintenance/kb/search',
  chat: '/api/maintenance/kb/chat',
} as const;

const mockContext: MaintenanceKbContext = {
  production_lines: [
    { id: 'rx1-surfacing', label: 'Rx1 Surfacing' },
    { id: 'rx2-coating', label: 'Rx2 Coating' },
  ],
  stations: [
    { id: 'curve-generating', label: 'CURVE GENERATING' },
    { id: 'polishing', label: 'POLISHING' },
    { id: 'laser-engraving', label: 'LASER ENGRAVING' },
  ],
  machines: [
    { id: 'curve-gen-3b', label: 'CURVE-GEN-3B' },
    { id: 'polishing-7a', label: 'POLISHING-7A' },
    { id: 'laser-engr-2c', label: 'LASER-ENGR-2C' },
  ],
  failure_types: [
    { id: 'all', label: 'All Types' },
    { id: 'mechanical', label: 'Mechanical' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'hydraulic', label: 'Hydraulic' },
  ],
  document_types: [
    { id: 'all', label: 'All Documents' },
    { id: 'maintenance', label: 'Maintenance Document' },
    { id: 'knowledge', label: 'Knowledge Document' },
    { id: 'other', label: 'Other Document' },
    { id: 'sop', label: 'SOPs' },
    { id: 'manual', label: 'Manuals' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'history', label: 'Maintenance History' },
    { id: 'lesson', label: 'Lessons Learned' },
  ],
  selected: {
    production_line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    failure_type: 'mechanical',
    document_type: 'all',
  },
  trace_id: 'mock-trace-context',
};

const mockDocuments: MaintenanceKbSearchResult[] = [
  {
    kb_id: 'KB-MNT-045',
    title: 'Precision Bearing Replacement Protocol',
    match_score: 98,
    document_type: 'sop',
    version: 'v2.3',
    updated_at: '2026-01-08',
    source_ref: 'SOP KB-MNT-045, steps 1-5',
    summary: 'Clean-room bearing replacement sequence, alignment checks, and spindle runout verification.',
  },
  {
    kb_id: 'KB-MNT-012',
    title: 'Spindle Alignment Procedure',
    match_score: 85,
    document_type: 'sop',
    version: 'v1.9',
    updated_at: '2025-12-15',
    source_ref: 'SOP KB-MNT-012, alignment tolerance table',
    summary: 'Dial indicator setup and acceptable spindle alignment tolerances for curve generation equipment.',
  },
  {
    kb_id: 'KB-MNT-078',
    title: 'Vibration Analysis & Diagnosis',
    match_score: 72,
    document_type: 'troubleshooting',
    version: 'v3.1',
    updated_at: '2025-12-01',
    source_ref: 'Troubleshooting guide KB-MNT-078, vibration bands',
    summary: 'Diagnostic path for bearing noise, motor mount imbalance, and elevated spindle vibration.',
  },
  {
    kb_id: 'KB-MNT-156',
    title: 'Hydraulic System Troubleshooting',
    match_score: 45,
    document_type: 'manual',
    version: 'v2.0',
    updated_at: '2025-11-20',
    source_ref: 'Manual KB-MNT-156, hydraulic pressure checks',
    summary: 'Hydraulic pressure checks and actuator symptoms for surfacing stations.',
  },
];

const sourceReferences: MaintenanceKbSourceReference[] = [
  {
    source_id: 'src-kb-mnt-045-step-4',
    kb_id: 'KB-MNT-045',
    title: 'Precision Bearing Replacement Protocol',
    document_type: 'sop',
    version: 'v2.3',
    section: 'Installation and Verification',
    page: 8,
    updated_at: '2026-01-08',
    source_ref: 'SOP KB-MNT-045, step 4.2 and 5.1',
    relevance_score: 0.96,
  },
  {
    source_id: 'src-kb-mnt-078-vibration',
    kb_id: 'KB-MNT-078',
    title: 'Vibration Analysis & Diagnosis',
    document_type: 'troubleshooting',
    version: 'v3.1',
    section: 'Spindle vibration diagnosis',
    page: 14,
    updated_at: '2025-12-01',
    source_ref: 'Troubleshooting guide KB-MNT-078, vibration threshold chart',
    relevance_score: 0.9,
  },
];

const relatedHistory: MaintenanceKbRelatedHistoryItem[] = [
  {
    id: 'MWO-2401-032',
    title: 'Spindle bearing noise',
    date: '2026-01-10',
    machine: 'CURVE-GEN-3B',
    summary: 'Bearing noise corrected after replacement and vibration validation.',
    source_ref: 'MWO-2401-032 repair log',
  },
];

const suggestedQuestions: MaintenanceKbSuggestedQuestion[] = [
  { id: 'history', label: 'Show maintenance history', question: 'Show maintenance history' },
  { id: 'failure-modes', label: 'Common failure modes', question: 'Common failure modes' },
  { id: 'pm-schedule', label: 'PM schedule', question: 'PM schedule' },
];

const mockDelay = 180;
const uploadDocumentTypes = new Set(['maintenance', 'knowledge', 'other']);

type SearchApiRequest = {
  query?: string;
  filters: {
    line?: string;
    station?: string;
    machine?: string;
    failure_type?: string;
    document_type?: MaintenanceKbDocumentType;
  };
  top_k: number;
  retrieval_scope?: MaintenanceKbSearchRequest['retrieval_scope'];
  document_ids?: string[];
  document_types?: Array<Exclude<MaintenanceKbDocumentType, 'all'>>;
  prefer_selected_documents?: boolean;
  min_confidence?: number;
  max_sources?: number;
};

type ChatApiRequest = {
  message: string;
  context: SearchApiRequest['filters'];
  conversation_id?: string;
  trace_id?: string;
  retrieval_scope?: MaintenanceKbSearchRequest['retrieval_scope'];
  document_ids?: string[];
  document_types?: Array<Exclude<MaintenanceKbDocumentType, 'all'>>;
  prefer_selected_documents?: boolean;
  min_confidence?: number;
  max_sources?: number;
};

type QueryParams = Record<string, string | number | boolean | undefined>;
type RequestJsonOptions = {
  timeoutMs?: number;
  timeoutMessage?: string;
};

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_AGENTIC_CORE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

function shouldUseMockFallback(): boolean {
  return import.meta.env.VITE_MAINTENANCE_KB_USE_MOCK === 'true';
}

function waitForMockLatency(): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, mockDelay);
  });
}

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(`${getApiBaseUrl()}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function requestJson<T>(path: string, init?: RequestInit, params?: QueryParams, options: RequestJsonOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const isFormData = init?.body instanceof FormData;

  try {
    const response = await fetch(buildUrl(path, params), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(formatHttpError(response.status, response.statusText, body));
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(options.timeoutMessage ?? 'Maintenance KB backend request timed out. Please retry or enable mock fallback for local development.');
    }

    if (error instanceof TypeError) {
      throw new Error('Maintenance KB backend is unavailable. Check VITE_AGENTIC_CORE_API_BASE_URL or enable VITE_MAINTENANCE_KB_USE_MOCK=true for local development.');
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function formatHttpError(status: number, statusText: string, body: string): string {
  if (status === 503) {
    return 'Maintenance KB backend returned 503. The safe backend error state is active; please retry after the service is healthy.';
  }

  const parsed = parseErrorBody(body);
  const detail = formatMaintenanceKbError(parsed ?? body, statusText);
  if (body) {
    console.debug('Maintenance KB backend error detail', parsed ?? body);
  }

  return `Maintenance KB backend request failed (${status} ${statusText})${detail ? `: ${detail}` : ''}`;
}

function parseErrorBody(body: string): unknown {
  if (!body) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export function formatMaintenanceKbError(error: unknown, fallback = 'Request failed'): string {
  const message = extractMaintenanceKbErrorMessage(error);
  const friendly = toUserFriendlyError(error, message);

  if (friendly && friendly !== '[object Object]') {
    return friendly;
  }

  return fallback;
}

function extractMaintenanceKbErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return cleanErrorMessage(error.message);
  }

  if (typeof error === 'string') {
    const parsed = parseErrorBody(error);
    if (parsed !== error) {
      return extractMaintenanceKbErrorMessage(parsed);
    }

    return cleanErrorMessage(error);
  }

  const record = getRecord(error);
  if (!Object.keys(record).length) {
    return undefined;
  }

  return (
    getNestedString(record.detail, 'message') ??
    getNestedString(record.error, 'message') ??
    getString(record, 'message') ??
    getString(record, 'detail') ??
    getString(record, 'error')
  );
}

function getNestedString(value: unknown, key: string): string | undefined {
  const record = getRecord(value);
  return Object.keys(record).length ? getString(record, key) : undefined;
}

function cleanErrorMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim();
  if (!trimmed || trimmed === '[object Object]') {
    return undefined;
  }

  return trimmed;
}

function toUserFriendlyError(error: unknown, message: string | undefined): string | undefined {
  const normalized = [
    message,
    ...collectErrorMarkers(error),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/unsupported.*file|file.*unsupported|unsupported_file|unsupported file type/.test(normalized)) {
    return 'This file type is not supported yet.';
  }

  if (/\bocr\b|ocr.*fail|ocr_failed|ocr required|could not read|extract.*text|text layer/.test(normalized)) {
    return 'We could not read the document text.';
  }

  if (/\bchunking\b|chunk.*fail|chunking_failed|prepare.*search|prepare.*document/.test(normalized)) {
    return 'We could not prepare this document for search.';
  }

  if (/\bindexing\b|index.*fail|indexing_failed|searchable index|embedding.*fail/.test(normalized)) {
    return 'We could not build the searchable index.';
  }

  return message;
}

function collectErrorMarkers(error: unknown): string[] {
  if (typeof error === 'string') {
    const parsed = parseErrorBody(error);
    return parsed === error ? [] : collectErrorMarkers(parsed);
  }

  const record = getRecord(error);
  if (!Object.keys(record).length) {
    return [];
  }

  return [
    getString(record, 'stage'),
    getString(record, 'error_code'),
    getString(record, 'code'),
    ...collectErrorMarkers(record.detail),
    ...collectErrorMarkers(record.error),
  ].filter((value): value is string => Boolean(value));
}

function toBackendFilters(request: MaintenanceKbSearchRequest): SearchApiRequest['filters'] {
  return {
    line: request.line ?? request.production_line,
    station: request.station,
    machine: request.machine,
    failure_type: request.failure_type === 'all' ? undefined : request.failure_type,
    document_type: request.document_type === 'all' ? undefined : request.document_type,
  };
}

export function toMaintenanceKbSearchApiRequest(request: MaintenanceKbSearchRequest): SearchApiRequest {
  const grounding = toRetrievalGrounding(request);

  return omitUndefined({
    query: request.query,
    filters: toBackendFilters(request),
    top_k: request.top_k ?? request.limit ?? 20,
    ...grounding,
  }) as SearchApiRequest;
}

export function toMaintenanceKbChatApiRequest(request: MaintenanceKbChatRequest): ChatApiRequest {
  const grounding = toRetrievalGrounding(request.context);

  return omitUndefined({
    message: request.message ?? request.question,
    context: toBackendFilters(request.context),
    conversation_id: request.conversation_id,
    trace_id: request.trace_id,
    ...grounding,
  }) as ChatApiRequest;
}

function toRetrievalGrounding(request: MaintenanceKbSearchRequest): Pick<SearchApiRequest, 'retrieval_scope' | 'document_ids' | 'document_types' | 'prefer_selected_documents' | 'min_confidence' | 'max_sources'> {
  const documentIds = request.document_ids?.filter(Boolean);
  const explicitScope = request.retrieval_scope;
  const retrievalScope = explicitScope ?? (documentIds?.length ? 'selected_documents' : undefined);

  return {
    retrieval_scope: retrievalScope && retrievalScope !== 'auto' ? retrievalScope : explicitScope,
    document_ids: documentIds?.length ? documentIds : undefined,
    document_types: request.document_types?.length ? request.document_types : undefined,
    prefer_selected_documents: documentIds?.length ? request.prefer_selected_documents ?? true : request.prefer_selected_documents,
    min_confidence: request.min_confidence,
    max_sources: request.max_sources,
  };
}

function omitUndefined<T extends Record<string, unknown>>(record: T): Partial<T> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function matchesDocumentType(document: MaintenanceKbSearchResult, request: MaintenanceKbSearchRequest): boolean {
  return !request.document_type || request.document_type === 'all' || document.document_type === request.document_type;
}

function matchesQuery(document: MaintenanceKbSearchResult, request: MaintenanceKbSearchRequest): boolean {
  if (!request.query?.trim()) {
    return true;
  }

  const query = request.query.toLowerCase();
  return [document.kb_id, document.title, document.summary, document.source_ref]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function normalizeScore(score: unknown): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return score > 0 && score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function getString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return undefined;
}

function getNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
}

function getBoolean(record: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

function normalizeDocument(item: Partial<MaintenanceKbSearchResult> & Record<string, unknown>): MaintenanceKbSearchResult {
  const metadata = getRecord(item.metadata);

  return {
    kb_id: String(item.kb_id ?? item.document_id ?? item.source_id ?? ''),
    title: String(item.title ?? metadata.title ?? 'Untitled maintenance document'),
    match_score: normalizeScore(item.match_score ?? item.score ?? item.relevance_score),
    document_type: (item.document_type ?? metadata.document_type ?? 'maintenance') as Exclude<MaintenanceKbDocumentType, 'all'>,
    version: String(item.version ?? metadata.version ?? 'n/a'),
    updated_at: String(item.updated_at ?? item.uploaded_at ?? 'n/a'),
    source_ref: String(item.source_ref ?? item.source ?? item.filename ?? 'Source reference unavailable'),
    summary: typeof item.summary === 'string' ? item.summary : undefined,
    excerpt: typeof item.excerpt === 'string' ? item.excerpt : undefined,
    source_origin: getString(item, 'source_origin') ?? getString(metadata, 'source_origin'),
    requires_ocr: getBoolean(item, 'requires_ocr') ?? getBoolean(metadata, 'requires_ocr'),
    final_status: getString(item, 'final_status') ?? getString(metadata, 'final_status'),
    processing_status: getString(item, 'processing_status') ?? getString(metadata, 'processing_status'),
    ocr_status: getString(item, 'ocr_status') ?? getString(metadata, 'ocr_status'),
    metadata,
  };
}

function normalizeSource(source: Partial<MaintenanceKbSourceReference> & Record<string, unknown>, index: number): MaintenanceKbSourceReference {
  const metadata = getRecord(source.metadata);
  const kbId = String(source.kb_id ?? source.document_id ?? source.source_id ?? `source-${index + 1}`);
  const score = source.relevance_score ?? source.score ?? source.match_score ?? source.confidence ?? metadata.score ?? metadata.confidence;
  const filename = getString(source, 'filename', 'file_name') ?? getString(metadata, 'filename', 'file_name');

  return {
    source_id: String(source.source_id ?? `${kbId}-${index + 1}`),
    kb_id: kbId,
    title: String(source.title ?? metadata.title ?? filename ?? 'Untitled source'),
    filename,
    document_type: (source.document_type ?? source.type ?? metadata.document_type ?? metadata.type ?? 'maintenance') as Exclude<MaintenanceKbDocumentType, 'all'>,
    version: source.version ? String(source.version) : undefined,
    section: getString(source, 'section') ?? getString(metadata, 'section'),
    page: typeof source.page === 'number' ? source.page : getNumber(metadata, 'page'),
    updated_at: source.updated_at ? String(source.updated_at) : undefined,
    source_ref: String(source.source_ref ?? source.reference ?? metadata.source_ref ?? metadata.reference ?? filename ?? 'Source reference unavailable'),
    excerpt: typeof source.excerpt === 'string' ? source.excerpt : undefined,
    source_origin: getString(source, 'source_origin') ?? getString(metadata, 'source_origin'),
    relevance_score: score === undefined ? undefined : normalizeScore(score),
    score: score === undefined ? undefined : normalizeScore(score),
    confidence_label: (source.confidence_label ?? metadata.confidence_label) as MaintenanceKbConfidenceLabel | undefined,
  };
}

function normalizeManifest(item: unknown): DocumentManifest {
  const record = getRecord(item);
  const metadata = getRecord(record.metadata);

  return {
    document_id: String(record.document_id ?? record.id ?? metadata.document_id ?? ''),
    title: String(record.title ?? metadata.title ?? record.filename ?? 'Untitled maintenance document'),
    filename: String(record.filename ?? record.file_name ?? metadata.filename ?? 'Unknown file'),
    status: String(record.status ?? record.manifest_status ?? 'uploaded'),
    document_type: (record.document_type ?? metadata.document_type ?? 'maintenance') as Exclude<MaintenanceKbDocumentType, 'all'>,
    line: getString(record, 'line', 'production_line') ?? getString(metadata, 'line', 'production_line'),
    station: getString(record, 'station') ?? getString(metadata, 'station'),
    machine: getString(record, 'machine') ?? getString(metadata, 'machine'),
    failure_type: getString(record, 'failure_type') ?? getString(metadata, 'failure_type'),
    knowledge_category: getString(record, 'knowledge_category') ?? getString(metadata, 'knowledge_category'),
    criticality: getString(record, 'criticality') ?? getString(metadata, 'criticality'),
    language: getString(record, 'language') ?? getString(metadata, 'language'),
    version: getString(record, 'version') ?? getString(metadata, 'version'),
    owner: getString(record, 'owner') ?? getString(metadata, 'owner'),
    effective_date: getString(record, 'effective_date') ?? getString(metadata, 'effective_date'),
    uploaded_at: getString(record, 'uploaded_at', 'created_at'),
    updated_at: getString(record, 'updated_at'),
    source_origin: getString(record, 'source_origin') ?? getString(metadata, 'source_origin') ?? 'uploaded',
    checksum: getString(record, 'checksum'),
    requires_ocr: getBoolean(record, 'requires_ocr') ?? getBoolean(metadata, 'requires_ocr'),
    final_status: getString(record, 'final_status') ?? getString(metadata, 'final_status'),
    processing_status: getString(record, 'processing_status') ?? getString(metadata, 'processing_status'),
    ocr_status: getString(record, 'ocr_status') ?? getString(metadata, 'ocr_status'),
    warnings: toStringArray(record.warnings),
    metadata,
  };
}

function normalizeUploadResponse(response: unknown): UploadResponse {
  const record = getRecord(response);
  const manifest = record.manifest ? normalizeManifest(record.manifest) : undefined;

  return {
    document_id: String(record.document_id ?? manifest?.document_id ?? record.id ?? ''),
    manifest,
    status: getString(record, 'status'),
    warnings: toStringArray(record.warnings),
    trace_id: getString(record, 'trace_id'),
  };
}

function normalizeIngestResponse(response: unknown, documentId: string): IngestResponse {
  const record = getRecord(response);
  const rawSteps = Array.isArray(record.steps) ? record.steps : ['parse', 'chunk', 'index', 'activate'].map((step) => ({
    step,
    status: record.status ?? 'completed',
  }));

  return {
    document_id: String(record.document_id ?? documentId),
    status: String(record.status ?? record.processing_state ?? record.state ?? 'active'),
    steps: rawSteps.map((item) => {
      const stepRecord = getRecord(item);
      return {
        step: String(stepRecord.step ?? stepRecord.name ?? 'step'),
        status: String(stepRecord.status ?? 'completed'),
        message: getString(stepRecord, 'message'),
        warnings: toStringArray(stepRecord.warnings),
      };
    }),
    manifest: record.manifest ? normalizeManifest(record.manifest) : undefined,
    warnings: toStringArray(record.warnings),
    trace_id: getString(record, 'trace_id'),
  };
}

function normalizeDiagnosticsResponse(response: unknown, documentId: string): DiagnosticsResponse {
  const record = getRecord(response);

  return {
    document_id: String(record.document_id ?? documentId),
    status: getString(record, 'status'),
    manifest_status: getString(record, 'manifest_status', 'status'),
    final_status: getString(record, 'final_status'),
    processing_status: getString(record, 'processing_status'),
    ocr_status: getString(record, 'ocr_status'),
    requires_ocr: getBoolean(record, 'requires_ocr'),
    last_error: getString(record, 'last_error', 'error'),
    file_exists: typeof record.file_exists === 'boolean' ? record.file_exists : undefined,
    parsed_artifact_exists: typeof record.parsed_artifact_exists === 'boolean' ? record.parsed_artifact_exists : undefined,
    chunk_artifact_exists: typeof record.chunk_artifact_exists === 'boolean' ? record.chunk_artifact_exists : undefined,
    parsed_exists: typeof record.parsed_exists === 'boolean' ? record.parsed_exists : undefined,
    chunks_exists: typeof record.chunks_exists === 'boolean' ? record.chunks_exists : undefined,
    indexed: typeof record.indexed === 'boolean' ? record.indexed : undefined,
    active: typeof record.active === 'boolean' ? record.active : undefined,
    checksum: getString(record, 'checksum'),
    vector_count: getNumber(record, 'vector_count'),
    source_origin: getString(record, 'source_origin'),
    trace_id: getString(record, 'trace_id'),
    warnings: toStringArray(record.warnings),
    indexing_metadata: getRecord(record.indexing_metadata),
    manifest: record.manifest ? normalizeManifest(record.manifest) : undefined,
  };
}

function normalizeSuggestedQuestion(question: MaintenanceKbSuggestedQuestion | string, index: number): MaintenanceKbSuggestedQuestion {
  if (typeof question === 'string') {
    return {
      id: `suggested-${index}`,
      label: question,
      question,
    };
  }

  return question;
}

function normalizeChatResponse(response: Partial<MaintenanceKbChatResponse>): MaintenanceKbChatResponse {
  return {
    answer: String(response.answer ?? ''),
    confidence: normalizeScore(response.confidence),
    confidence_label: (response.confidence_label ?? 'no_evidence') as MaintenanceKbConfidenceLabel,
    sources: (response.sources ?? []).map(normalizeSource),
    related_documents: (response.related_documents ?? []).map(normalizeDocument),
    suggested_questions: (response.suggested_questions ?? []).map(normalizeSuggestedQuestion),
    warnings: response.warnings ?? [],
    trace_id: response.trace_id,
    conversation_id: response.conversation_id,
    retrieval_metadata: response.retrieval_metadata,
    audit_metadata: response.audit_metadata,
    related_history: response.related_history,
    similar_cases: response.similar_cases as MaintenanceKbSimilarCaseItem[] | undefined,
    safety_critical: response.safety_critical,
    safety_category: response.safety_category,
    governance_flags: response.governance_flags,
    evidence_required: response.evidence_required,
    evidence_satisfied: response.evidence_satisfied,
    restricted_guidance: response.restricted_guidance,
    official_source_required: response.official_source_required,
  };
}

export async function getMaintenanceKbContext(): Promise<MaintenanceKbContext> {
  if (shouldUseMockFallback()) {
    await waitForMockLatency();
    return mockContext;
  }

  return requestJson<MaintenanceKbContext>(MAINTENANCE_KB_ENDPOINTS.context, { method: 'GET' });
}

type NormalizedUploadMetadata = Partial<MaintenanceKbDocumentMetadata> & Pick<MaintenanceKbDocumentMetadata, 'title' | 'document_type'>;

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanTags(value: unknown): string[] | undefined {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];
  const tags = rawTags
    .map((tag) => cleanString(tag))
    .filter((tag): tag is string => Boolean(tag));

  return tags.length ? tags : undefined;
}

export function normalizeMaintenanceKbUploadMetadata(metadata: MaintenanceKbDocumentMetadata): NormalizedUploadMetadata {
  const normalized = {
    title: cleanString(metadata.title),
    document_type: cleanString(metadata.document_type) as MaintenanceKbDocumentMetadata['document_type'] | undefined,
    line: cleanString(metadata.line),
    station: cleanString(metadata.station),
    machine: cleanString(metadata.machine),
    failure_type: cleanString(metadata.failure_type),
    knowledge_category: cleanString(metadata.knowledge_category),
    criticality: cleanString(metadata.criticality),
    language: cleanString(metadata.language),
    version: cleanString(metadata.version),
    owner: cleanString(metadata.owner),
    effective_date: cleanString(metadata.effective_date),
    tags: cleanTags(metadata.tags),
  };

  if (!normalized.title) {
    throw new Error('Enter a title before uploading.');
  }

  if (!normalized.document_type) {
    throw new Error('Select a document type before uploading.');
  }

  if (!uploadDocumentTypes.has(normalized.document_type)) {
    throw new Error('Select Maintenance Document, Knowledge Document, or Other Document before uploading.');
  }

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined),
  ) as NormalizedUploadMetadata;
}

export async function uploadDocument(file: File, metadata: MaintenanceKbDocumentMetadata): Promise<UploadResponse> {
  if (!file) {
    throw new Error('Select a file before uploading.');
  }

  const normalizedMetadata = normalizeMaintenanceKbUploadMetadata(metadata);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(normalizedMetadata));
  Object.entries(normalizedMetadata).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, Array.isArray(value) ? value.join(',') : String(value));
    }
  });

  const response = await requestJson<unknown>(MAINTENANCE_KB_ENDPOINTS.upload, {
    method: 'POST',
    body: formData,
  });

  return normalizeUploadResponse(response);
}

export async function listDocuments(filters: Partial<MaintenanceKbSearchRequest> = {}): Promise<DocumentManifest[]> {
  const response = await requestJson<unknown>(MAINTENANCE_KB_ENDPOINTS.documents, { method: 'GET' }, {
    line: filters.line ?? filters.production_line,
    station: filters.station,
    machine: filters.machine,
    failure_type: filters.failure_type === 'all' ? undefined : filters.failure_type,
    document_type: filters.document_type === 'all' ? undefined : filters.document_type,
  });

  const records = Array.isArray(response)
    ? response
    : Array.isArray(getRecord(response).items)
      ? getRecord(response).items
      : Array.isArray(getRecord(response).documents)
        ? getRecord(response).documents
        : [];

  return records.map(normalizeManifest);
}

export async function getDocument(documentId: string): Promise<DocumentManifest> {
  const response = await requestJson<unknown>(`${MAINTENANCE_KB_ENDPOINTS.documents}/${encodeURIComponent(documentId)}`, {
    method: 'GET',
  });
  return normalizeManifest(response);
}

export async function ingestDocument(documentId: string): Promise<IngestResponse> {
  return processDocument(documentId);
}

export async function processDocument(documentId: string): Promise<IngestResponse> {
  const response = await requestJson<unknown>(`${MAINTENANCE_KB_ENDPOINTS.documents}/${encodeURIComponent(documentId)}/process`, {
    method: 'POST',
  }, undefined, {
    timeoutMs: DOCUMENT_PROCESS_TIMEOUT_MS,
    timeoutMessage: DOCUMENT_PROCESS_TIMEOUT_MESSAGE,
  });
  return normalizeIngestResponse(response, documentId);
}

export async function getDocumentDiagnostics(documentId: string): Promise<DiagnosticsResponse> {
  const response = await requestJson<unknown>(`${MAINTENANCE_KB_ENDPOINTS.documents}/${encodeURIComponent(documentId)}/diagnostics`, {
    method: 'GET',
  });
  return normalizeDiagnosticsResponse(response, documentId);
}

export async function searchMaintenanceKbDocuments(
  request: MaintenanceKbSearchRequest,
): Promise<MaintenanceKbSearchResponse> {
  if (shouldUseMockFallback()) {
    await waitForMockLatency();

    if (request.query === '__error__') {
      throw new Error('Unable to load maintenance knowledge documents.');
    }

    const limit = request.limit ?? request.top_k ?? 20;
    const items = mockDocuments
      .filter((document) => matchesDocumentType(document, request))
      .filter((document) => matchesQuery(document, request))
      .slice(0, limit);

    return {
      items,
      trace_id: 'mock-trace-search',
      retrieval_metadata: { mode: 'mock', returned: items.length, top_k: limit },
    };
  }

  const response = await requestJson<MaintenanceKbSearchResponse & { results?: MaintenanceKbSearchResult[]; documents?: MaintenanceKbSearchResult[] }>(MAINTENANCE_KB_ENDPOINTS.search, {
    method: 'POST',
    body: JSON.stringify(toMaintenanceKbSearchApiRequest(request)),
  });
  const items = response.items ?? response.results ?? response.documents ?? [];

  return {
    ...response,
    items: items.map(normalizeDocument),
  };
}

export async function askMaintenanceKbAssistant(
  request: MaintenanceKbChatRequest,
): Promise<MaintenanceKbChatResponse> {
  if (shouldUseMockFallback()) {
    await waitForMockLatency();

    const normalizedQuestion = request.question.trim().toLowerCase();

    if (normalizedQuestion.includes('__error__')) {
      throw new Error('Assistant service is temporarily unavailable.');
    }

    if (normalizedQuestion.includes('unknown') || normalizedQuestion.includes('no evidence')) {
      return {
        answer: 'No grounded maintenance evidence was found for this question in the current Rx1 Surfacing context.',
        confidence: 0,
        confidence_label: 'no_evidence',
        sources: [],
        related_documents: [],
        suggested_questions: suggestedQuestions,
        warnings: ['No evidence found for the selected machine and filters.'],
        trace_id: 'mock-trace-chat-no-evidence',
        conversation_id: request.conversation_id ?? 'mock-conversation-maintenance-kb',
        evidence_required: true,
        evidence_satisfied: false,
        restricted_guidance: true,
        official_source_required: true,
      };
    }

    if (normalizedQuestion.includes('common failure')) {
      return {
        answer:
          'Common CURVE-GEN-3B mechanical failure modes are bearing contamination, spindle misalignment, motor mount vibration, and coolant ingress near the bearing housing. The strongest evidence points to contamination control and post-install vibration verification before returning the spindle to production speed.',
        confidence: 62,
        confidence_label: 'low',
        sources: [sourceReferences[1]],
        related_documents: mockDocuments.slice(1, 3),
        suggested_questions: suggestedQuestions,
        warnings: ['Low confidence: supporting evidence is broad and should be verified against the machine condition.'],
        trace_id: 'mock-trace-chat-low-confidence',
        conversation_id: request.conversation_id ?? 'mock-conversation-maintenance-kb',
        retrieval_metadata: { mode: 'mock', sources: 1 },
        related_history: relatedHistory,
        similar_cases: [{ id: 'CASE-17', title: 'Recurring spindle vibration', machine: 'CURVE-GEN-3B', confidence: 74 }],
      };
    }

    return {
      answer:
        'For CURVE-GEN-3B bearing replacement, follow KB-MNT-045: isolate energy, let the spindle cool below 40C, remove the bearing with the approved puller, and protect the shaft surface from scoring. Before installing the new bearing, clean the housing and use lint-free contamination controls. After installation, verify spindle alignment and run a staged vibration check, starting at low speed and confirming vibration at operating speed before release.',
      confidence: 94,
      confidence_label: 'high',
      sources: sourceReferences,
      related_documents: mockDocuments.slice(0, 3),
      suggested_questions: suggestedQuestions,
      warnings: [],
      trace_id: 'mock-trace-chat',
      conversation_id: request.conversation_id ?? 'mock-conversation-maintenance-kb',
      retrieval_metadata: { mode: 'mock', sources: sourceReferences.length },
      audit_metadata: { backend: 'mock' },
      related_history: relatedHistory,
      evidence_required: true,
      evidence_satisfied: true,
    };
  }

  const response = await requestJson<MaintenanceKbChatResponse>(MAINTENANCE_KB_ENDPOINTS.chat, {
    method: 'POST',
    body: JSON.stringify(toMaintenanceKbChatApiRequest(request)),
  });

  return normalizeChatResponse(response);
}
