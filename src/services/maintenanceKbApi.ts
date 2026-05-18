import type {
  MaintenanceKbChatRequest,
  MaintenanceKbChatResponse,
  MaintenanceKbConfidenceLabel,
  MaintenanceKbContext,
  MaintenanceKbDocumentType,
  MaintenanceKbRelatedHistoryItem,
  MaintenanceKbSearchRequest,
  MaintenanceKbSearchResponse,
  MaintenanceKbSearchResult,
  MaintenanceKbSimilarCaseItem,
  MaintenanceKbSourceReference,
  MaintenanceKbSuggestedQuestion,
} from '../types/maintenanceKb';

const DEFAULT_API_BASE_URL = 'http://localhost:8100';
const REQUEST_TIMEOUT_MS = 12_000;
const MAINTENANCE_KB_ENDPOINTS = {
  context: '/api/maintenance/kb/context',
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
};

type ChatApiRequest = {
  message: string;
  context: SearchApiRequest['filters'];
  conversation_id?: string;
  trace_id?: string;
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

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
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
      throw new Error('Maintenance KB backend request timed out. Please retry or enable mock fallback for local development.');
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

  const detail = parseErrorDetail(body);
  return `Maintenance KB backend request failed (${status} ${statusText})${detail ? `: ${detail}` : ''}`;
}

function parseErrorDetail(body: string): string {
  if (!body) {
    return '';
  }

  try {
    const parsed = JSON.parse(body) as { detail?: unknown; message?: unknown; error?: unknown };
    const detail = parsed.detail ?? parsed.message ?? parsed.error;
    return typeof detail === 'string' ? detail : body;
  } catch {
    return body;
  }
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
  return {
    query: request.query,
    filters: toBackendFilters(request),
    top_k: request.top_k ?? request.limit ?? 20,
  };
}

export function toMaintenanceKbChatApiRequest(request: MaintenanceKbChatRequest): ChatApiRequest {
  return {
    message: request.message ?? request.question,
    context: toBackendFilters(request.context),
    conversation_id: request.conversation_id,
    trace_id: request.trace_id,
  };
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

function normalizeDocument(item: Partial<MaintenanceKbSearchResult>): MaintenanceKbSearchResult {
  return {
    kb_id: String(item.kb_id ?? ''),
    title: String(item.title ?? 'Untitled maintenance document'),
    match_score: normalizeScore(item.match_score),
    document_type: (item.document_type ?? 'manual') as Exclude<MaintenanceKbDocumentType, 'all'>,
    version: String(item.version ?? 'n/a'),
    updated_at: String(item.updated_at ?? 'n/a'),
    source_ref: String(item.source_ref ?? 'Source reference unavailable'),
    summary: item.summary,
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
    sources: response.sources ?? [],
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

  const response = await requestJson<MaintenanceKbSearchResponse>(MAINTENANCE_KB_ENDPOINTS.search, {
    method: 'POST',
    body: JSON.stringify(toMaintenanceKbSearchApiRequest(request)),
  });

  return {
    ...response,
    items: (response.items ?? []).map(normalizeDocument),
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
