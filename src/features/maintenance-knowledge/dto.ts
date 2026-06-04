import type {
  ChatMessage,
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from './types';

export interface MaintenanceKnowledgeFilterDto {
  machineId?: string;
  documentType?: string;
  query?: string;
}

export interface MaintenanceChatRequestDto {
  message: string;
  context?: MaintenanceKnowledgeFilterDto;
  conversation?: ChatMessage[];
}

export interface MaintenanceChatResponseDto {
  messages: ChatMessage[];
  suggestedQuestions?: MaintenanceSuggestedQuestionDto[];
}

type MaintenanceDocumentSummary =
  | MachineManual
  | MaintenanceProcedure
  | HistoricalMaintenanceRecord
  | LessonLearned;

export type MaintenanceDocumentSummaryDto<TDocument = MaintenanceDocumentSummary> = TDocument;

export type MaintenanceSuggestedQuestionDto = string;

export type KBDocumentType = 'manual' | 'sop' | 'history' | 'lesson' | 'knowledge' | 'other';

export interface KBDocumentSearchRequestDto {
  query?: string;
  machineId?: string;
  assetId?: string;
  lineId?: string;
  stationId?: string;
  documentTypes?: KBDocumentType[];
  failureType?: string;
  symptom?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface KBDocumentSearchResponseDto {
  documents: KBDocumentSummaryDto[];
  total: number;
  limit: number;
  offset: number;
  trace: KBTraceMetadataDto;
}

export interface KBDocumentSummaryDto {
  documentId: string;
  type: KBDocumentType;
  title: string;
  machineId?: string;
  machineName?: string;
  code?: string;
  version?: string;
  updatedAt?: string;
  category?: string;
  pageCount?: number;
  author?: string;
  technician?: string;
  jobId?: string;
  issue?: string;
  summary?: string;
  relevanceScore?: number;
  uri?: string;
}

export interface KBChatRequestDto {
  message: string;
  sessionId?: string;
  conversationId?: string;
  context?: KBContextRequestDto;
  conversation?: KBChatHistoryMessageDto[];
}

export interface KBChatHistoryMessageDto {
  messageId?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface KBChatResponseDto {
  conversationId: string;
  message: KBChatMessageDto;
  suggestedQuestions?: MaintenanceSuggestedQuestionDto[];
  trace: KBTraceMetadataDto;
}

export interface KBChatMessageDto {
  messageId: string;
  role: 'assistant';
  content: string;
  createdAt: string;
  confidence?: number;
  sources: KBSourceCitationDto[];
}

export interface KBContextRequestDto {
  machineId?: string;
  assetId?: string;
  lineId?: string;
  stationId?: string;
  documentTypes?: KBDocumentType[];
  failureType?: string;
  symptom?: string;
}

export interface KBContextResponseDto {
  selected?: KBContextRequestDto;
  machines: KBContextOptionDto[];
  lines: KBContextOptionDto[];
  stations: KBContextOptionDto[];
  failureTypes: KBContextOptionDto[];
  documentTypes: KBContextOptionDto[];
  suggestedQuestions?: MaintenanceSuggestedQuestionDto[];
  trace: KBTraceMetadataDto;
}

export interface KBContextOptionDto {
  id: string;
  label: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface KBFeedbackRequestDto {
  conversationId?: string;
  messageId: string;
  rating: 'up' | 'down';
  reason?: string;
  comment?: string;
  sourceRatings?: KBSourceFeedbackDto[];
  traceId?: string;
}

export interface KBSourceFeedbackDto {
  sourceId: string;
  rating: 'useful' | 'not_useful' | 'incorrect';
  comment?: string;
}

export interface KBFeedbackResponseDto {
  accepted: boolean;
  feedbackId: string;
  trace: KBTraceMetadataDto;
}

export interface KBSourceCitationDto {
  sourceId: string;
  documentId: string;
  chunkId?: string;
  type: KBDocumentType;
  title: string;
  section?: string;
  page?: number;
  version?: string;
  updatedAt?: string;
  date?: string;
  snippet?: string;
  uri?: string;
  relevanceScore?: number;
}

export interface KBTraceMetadataDto {
  traceId: string;
  spanId?: string;
  runId?: string;
  latencyMs?: number;
  retrievalCount?: number;
  model?: string;
  tools?: string[];
}
