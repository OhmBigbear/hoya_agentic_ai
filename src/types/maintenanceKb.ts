export type MaintenanceKbDocumentType =
  | 'all'
  | 'maintenance'
  | 'manual'
  | 'sop'
  | 'history'
  | 'lesson'
  | 'troubleshooting'
  | 'knowledge'
  | 'other';

export type MaintenanceKbConfidenceLabel = 'high' | 'medium' | 'low' | 'no_evidence';
export type MaintenanceKbSourceOrigin = 'seeded' | 'uploaded' | string;
export type MaintenanceKbDocumentStatus =
  | 'uploaded'
  | 'queued'
  | 'ocr_processing'
  | 'ocr_completed'
  | 'chunking'
  | 'pending'
  | 'parsing'
  | 'parsed'
  | 'chunked'
  | 'embedding'
  | 'ready'
  | 'indexed'
  | 'active'
  | 'failed'
  | string;

export interface MaintenanceKbOption {
  id: string;
  label: string;
}

export interface MaintenanceKbContext extends MaintenanceKbAdditiveResponseFields {
  production_lines: MaintenanceKbOption[];
  stations: MaintenanceKbOption[];
  machines: MaintenanceKbOption[];
  failure_types: MaintenanceKbOption[];
  document_types: Array<MaintenanceKbOption & { id: MaintenanceKbDocumentType }>;
  selected: {
    production_line: string;
    station: string;
    machine: string;
    failure_type: string;
    document_type: MaintenanceKbDocumentType;
  };
}

export interface MaintenanceKbSearchRequest {
  line?: string;
  production_line?: string;
  station?: string;
  machine?: string;
  failure_type?: string;
  document_type?: MaintenanceKbDocumentType;
  query?: string;
  limit?: number;
  top_k?: number;
}

export interface MaintenanceKbSourceReference {
  source_id: string;
  kb_id: string;
  title: string;
  document_type: Exclude<MaintenanceKbDocumentType, 'all'>;
  version?: string;
  section?: string;
  page?: number;
  updated_at?: string;
  source_ref: string;
  excerpt?: string;
  source_origin?: MaintenanceKbSourceOrigin;
  relevance_score?: number;
  score?: number;
  confidence_label?: MaintenanceKbConfidenceLabel;
}

export interface MaintenanceKbSearchResult {
  kb_id: string;
  title: string;
  match_score: number;
  document_type: Exclude<MaintenanceKbDocumentType, 'all'>;
  version: string;
  updated_at: string;
  source_ref: string;
  summary?: string;
  excerpt?: string;
  source_origin?: MaintenanceKbSourceOrigin;
  requires_ocr?: boolean;
  metadata?: MaintenanceKbMetadata;
}

export interface MaintenanceKbChatRequest {
  question: string;
  message?: string;
  context: MaintenanceKbSearchRequest;
  conversation_id?: string;
  trace_id?: string;
}

export interface MaintenanceKbSuggestedQuestion {
  id: string;
  label: string;
  question: string;
}

export interface MaintenanceKbRelatedHistoryItem {
  id: string;
  title: string;
  date: string;
  machine: string;
  summary: string;
  source_ref: string;
}

export interface MaintenanceKbSimilarCaseItem {
  id: string;
  title: string;
  date?: string;
  machine?: string;
  summary?: string;
  source_ref?: string;
  confidence?: number;
}

export type MaintenanceKbMetadata = Record<string, unknown>;

export interface MaintenanceKbAdditiveResponseFields {
  trace_id?: string;
  conversation_id?: string;
  retrieval_metadata?: MaintenanceKbMetadata;
  audit_metadata?: MaintenanceKbMetadata;
  related_history?: MaintenanceKbRelatedHistoryItem[];
  similar_cases?: MaintenanceKbSimilarCaseItem[];
  safety_critical?: boolean;
  safety_category?: string;
  governance_flags?: string[];
  evidence_required?: boolean;
  evidence_satisfied?: boolean;
  restricted_guidance?: boolean;
  official_source_required?: boolean;
}

export interface MaintenanceKbSearchResponse extends MaintenanceKbAdditiveResponseFields {
  items: MaintenanceKbSearchResult[];
}

export interface MaintenanceKbChatResponse extends MaintenanceKbAdditiveResponseFields {
  answer: string;
  confidence: number;
  confidence_label: MaintenanceKbConfidenceLabel;
  sources: MaintenanceKbSourceReference[];
  related_documents: MaintenanceKbSearchResult[];
  suggested_questions: MaintenanceKbSuggestedQuestion[];
  warnings: string[];
}

export interface MaintenanceKbDocumentMetadata {
  title: string;
  document_type: Exclude<MaintenanceKbDocumentType, 'all'>;
  line: string;
  station: string;
  machine: string;
  failure_type?: string;
  knowledge_category?: string;
  criticality: string;
  language: string;
  version?: string;
  owner?: string;
  effective_date?: string;
  tags?: string[];
}

export interface DocumentManifest {
  document_id: string;
  title: string;
  filename: string;
  status: MaintenanceKbDocumentStatus;
  document_type: Exclude<MaintenanceKbDocumentType, 'all'>;
  line?: string;
  station?: string;
  machine?: string;
  failure_type?: string;
  knowledge_category?: string;
  criticality?: string;
  language?: string;
  version?: string;
  owner?: string;
  effective_date?: string;
  uploaded_at?: string;
  updated_at?: string;
  source_origin?: MaintenanceKbSourceOrigin;
  checksum?: string;
  requires_ocr?: boolean;
  warnings?: string[];
  metadata?: MaintenanceKbMetadata;
}

export interface UploadResponse {
  document_id: string;
  manifest?: DocumentManifest;
  status?: MaintenanceKbDocumentStatus;
  warnings?: string[];
  trace_id?: string;
}

export interface IngestStepStatus {
  step: 'parse' | 'chunk' | 'index' | 'activate' | string;
  status: MaintenanceKbDocumentStatus;
  message?: string;
  warnings?: string[];
}

export interface IngestResponse {
  document_id: string;
  status: MaintenanceKbDocumentStatus;
  steps: IngestStepStatus[];
  manifest?: DocumentManifest;
  warnings?: string[];
  trace_id?: string;
}

export interface DiagnosticsResponse {
  document_id: string;
  status?: MaintenanceKbDocumentStatus;
  manifest_status?: MaintenanceKbDocumentStatus;
  requires_ocr?: boolean;
  last_error?: string;
  file_exists?: boolean;
  parsed_artifact_exists?: boolean;
  chunk_artifact_exists?: boolean;
  parsed_exists?: boolean;
  chunks_exists?: boolean;
  indexed?: boolean;
  active?: boolean;
  checksum?: string;
  vector_count?: number;
  source_origin?: MaintenanceKbSourceOrigin;
  trace_id?: string;
  warnings?: string[];
  indexing_metadata?: MaintenanceKbMetadata;
  manifest?: DocumentManifest;
}
