export type MaintenanceKbDocumentType =
  | 'all'
  | 'manual'
  | 'sop'
  | 'history'
  | 'lesson'
  | 'troubleshooting';

export type MaintenanceKbConfidenceLabel = 'high' | 'medium' | 'low' | 'no_evidence';

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
  relevance_score?: number;
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
