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

export interface MaintenanceKbContext {
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
  production_line?: string;
  station?: string;
  machine?: string;
  failure_type?: string;
  document_type?: MaintenanceKbDocumentType;
  query?: string;
  limit?: number;
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

export interface MaintenanceKbSearchResponse {
  items: MaintenanceKbSearchResult[];
}

export interface MaintenanceKbChatRequest {
  question: string;
  context: MaintenanceKbSearchRequest;
  conversation_id?: string;
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

export interface MaintenanceKbChatResponse {
  answer: string;
  confidence: number;
  confidence_label: MaintenanceKbConfidenceLabel;
  sources: MaintenanceKbSourceReference[];
  related_documents: MaintenanceKbSearchResult[];
  suggested_questions: MaintenanceKbSuggestedQuestion[];
  warnings: string[];
}
