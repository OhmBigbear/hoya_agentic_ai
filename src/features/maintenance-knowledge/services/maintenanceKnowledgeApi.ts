import {
  historicalRecords,
  lessonsLearned,
  machineManuals,
  maintenanceProcedures,
  sampleChatMessages,
} from '../data/mockMaintenanceKnowledge';
import type {
  MaintenanceChatResponseDto,
  MaintenanceDocumentSummaryDto,
  MaintenanceSuggestedQuestionDto,
} from '../dto';
import type {
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../types';

const suggestedQuestions: MaintenanceSuggestedQuestionDto[] = [
  'Show maintenance history for this machine',
  'What are common failure modes?',
  'Recommended preventive maintenance schedule?',
];

export async function getMaintenanceProcedures(): Promise<MaintenanceDocumentSummaryDto<MaintenanceProcedure>[]> {
  return maintenanceProcedures;
}

export async function getMachineManuals(): Promise<MaintenanceDocumentSummaryDto<MachineManual>[]> {
  return machineManuals;
}

export async function getHistoricalRecords(): Promise<MaintenanceDocumentSummaryDto<HistoricalMaintenanceRecord>[]> {
  return historicalRecords;
}

export async function getLessonsLearned(): Promise<MaintenanceDocumentSummaryDto<LessonLearned>[]> {
  return lessonsLearned;
}

export async function getSuggestedQuestions(): Promise<MaintenanceSuggestedQuestionDto[]> {
  return suggestedQuestions;
}

export async function getInitialChatMessages(): Promise<MaintenanceChatResponseDto['messages']> {
  const response: MaintenanceChatResponseDto = {
    messages: sampleChatMessages,
  };

  return response.messages;
}
