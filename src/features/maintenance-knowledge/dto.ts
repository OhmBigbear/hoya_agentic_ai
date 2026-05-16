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
