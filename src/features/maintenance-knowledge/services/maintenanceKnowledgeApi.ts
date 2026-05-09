import {
  historicalRecords,
  lessonsLearned,
  machineManuals,
  maintenanceProcedures,
  sampleChatMessages,
} from '../data/mockMaintenanceKnowledge';
import type {
  ChatMessage,
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../types';

const suggestedQuestions = [
  'Show maintenance history for this machine',
  'What are common failure modes?',
  'Recommended preventive maintenance schedule?',
];

export async function getMaintenanceProcedures(): Promise<MaintenanceProcedure[]> {
  return maintenanceProcedures;
}

export async function getMachineManuals(): Promise<MachineManual[]> {
  return machineManuals;
}

export async function getHistoricalRecords(): Promise<HistoricalMaintenanceRecord[]> {
  return historicalRecords;
}

export async function getLessonsLearned(): Promise<LessonLearned[]> {
  return lessonsLearned;
}

export async function getSuggestedQuestions(): Promise<string[]> {
  return suggestedQuestions;
}

export async function getInitialChatMessages(): Promise<ChatMessage[]> {
  return sampleChatMessages;
}
