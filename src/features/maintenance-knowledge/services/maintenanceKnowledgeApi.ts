import { agenticCoreClient } from '../../../shared/api/agenticCoreClient';
import { API_ENDPOINTS } from '../../../shared/api/endpoints';
import { APP_MODE } from '../../../shared/config/env';
import {
  historicalRecords,
  lessonsLearned,
  machineManuals,
  maintenanceProcedures,
  sampleChatMessages,
} from '../data/mockMaintenanceKnowledge';
import type {
  KBChatRequestDto,
  KBChatResponseDto,
  KBContextRequestDto,
  KBContextResponseDto,
  KBDocumentSearchRequestDto,
  KBDocumentSearchResponseDto,
  KBDocumentSummaryDto,
  KBFeedbackRequestDto,
  KBFeedbackResponseDto,
  KBSourceCitationDto,
  KBTraceMetadataDto,
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

const DEFAULT_SEARCH_LIMIT = 25;

function createTraceMetadata(operation: string, retrievalCount = 0): KBTraceMetadataDto {
  return {
    traceId: `mock-trace-kb-${operation}`,
    spanId: `mock-span-kb-${operation}`,
    runId: `mock-run-kb-${operation}`,
    latencyMs: 0,
    retrievalCount,
    model: 'mock-maintenance-kb',
    tools: ['mock-maintenance-knowledge'],
  };
}

function normalizeMachineId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function matchesQuery(document: KBDocumentSummaryDto, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const searchableText = [
    document.title,
    document.machineName,
    document.code,
    document.version,
    document.category,
    document.author,
    document.technician,
    document.jobId,
    document.issue,
    document.summary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function matchesMachine(document: KBDocumentSummaryDto, machineId?: string): boolean {
  if (!machineId) {
    return true;
  }

  return document.machineId === machineId;
}

function getMockDocumentSummaries(): KBDocumentSummaryDto[] {
  const manualSummaries: KBDocumentSummaryDto[] = machineManuals.map((manual) => ({
    documentId: `manual-${manual.id}`,
    type: 'manual',
    title: manual.title,
    machineId: normalizeMachineId(manual.title.replace(/(?: Service Manual| Safety Guidelines| Complete Manual| Operator Guide)$/i, '')),
    machineName: manual.title.split(' ')[0],
    version: manual.version,
    updatedAt: manual.updated,
    category: manual.category,
    pageCount: manual.pages,
    relevanceScore: 90,
    uri: `/kb/documents/manual-${manual.id}`,
  }));

  const procedureSummaries: KBDocumentSummaryDto[] = maintenanceProcedures.map((procedure) => ({
    documentId: `sop-${procedure.id}`,
    type: 'sop',
    title: procedure.title,
    code: procedure.code,
    version: procedure.version,
    updatedAt: procedure.updated,
    category: 'SOP',
    relevanceScore: procedure.relevance,
    uri: `/kb/documents/sop-${procedure.id}`,
  }));

  const historySummaries: KBDocumentSummaryDto[] = historicalRecords.map((record) => ({
    documentId: `history-${record.id}`,
    type: 'history',
    title: record.issue,
    machineId: normalizeMachineId(record.machine),
    machineName: record.machine,
    updatedAt: record.date,
    category: 'Maintenance History',
    technician: record.technician,
    jobId: record.jobId,
    issue: record.issue,
    summary: `${record.issue} repaired by ${record.technician} in ${record.duration}.`,
    relevanceScore: 80,
    uri: `/kb/documents/history-${record.id}`,
  }));

  const lessonSummaries: KBDocumentSummaryDto[] = lessonsLearned.map((lesson) => ({
    documentId: `lesson-${lesson.id}`,
    type: 'lesson',
    title: lesson.title,
    updatedAt: lesson.date,
    category: lesson.category,
    author: lesson.author,
    summary: lesson.summary,
    relevanceScore: 75,
    uri: `/kb/documents/lesson-${lesson.id}`,
  }));

  return [
    ...procedureSummaries,
    ...manualSummaries,
    ...historySummaries,
    ...lessonSummaries,
  ];
}

function getMockSourceCitations(): KBSourceCitationDto[] {
  return [
    {
      sourceId: 'source-manual-1-ch-7-2',
      documentId: 'manual-1',
      chunkId: 'manual-1-chunk-7-2',
      type: 'manual',
      title: 'CURVE-GEN-3B Service Manual',
      section: 'Ch. 7.2',
      page: 114,
      version: 'v4.2',
      updatedAt: '2025-11-15',
      relevanceScore: 0.94,
      uri: '/kb/documents/manual-1',
    },
    {
      sourceId: 'source-sop-1-bearing-replacement',
      documentId: 'sop-1',
      chunkId: 'sop-1-chunk-bearing-replacement',
      type: 'sop',
      title: 'KB-MNT-045: Bearing Replacement',
      version: 'v2.3',
      updatedAt: '2026-01-08',
      relevanceScore: 0.91,
      uri: '/kb/documents/sop-1',
    },
    {
      sourceId: 'source-history-1-repair-log',
      documentId: 'history-1',
      chunkId: 'history-1-chunk-summary',
      type: 'history',
      title: 'MWO-2401-032 Repair Log',
      date: '2026-01-10',
      relevanceScore: 0.86,
      uri: '/kb/documents/history-1',
    },
  ];
}

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

export async function searchKnowledgeDocuments(
  request: KBDocumentSearchRequestDto,
): Promise<KBDocumentSearchResponseDto> {
  if (APP_MODE !== 'mock') {
    return agenticCoreClient.get<KBDocumentSearchResponseDto>(API_ENDPOINTS.KB_DOCUMENTS, request);
  }

  const offset = Math.max(request.offset ?? 0, 0);
  const limit = Math.max(request.limit ?? DEFAULT_SEARCH_LIMIT, 1);
  const documentTypes = request.documentTypes ?? [];
  const documents = getMockDocumentSummaries()
    .filter((document) => documentTypes.length === 0 || documentTypes.includes(document.type))
    .filter((document) => matchesMachine(document, request.machineId))
    .filter((document) => matchesQuery(document, request.query));
  const pagedDocuments = documents.slice(offset, offset + limit);

  return {
    documents: pagedDocuments,
    total: documents.length,
    limit,
    offset,
    trace: createTraceMetadata('documents', pagedDocuments.length),
  };
}

export async function sendMaintenanceChatMessage(request: KBChatRequestDto): Promise<KBChatResponseDto> {
  if (APP_MODE !== 'mock') {
    return agenticCoreClient.post<KBChatResponseDto>(API_ENDPOINTS.KB_CHAT, request);
  }

  const conversationId = request.conversationId ?? 'mock-conversation-maintenance-kb';
  const normalizedMessage = request.message.trim().toLowerCase();
  const isSafetyQuestion = normalizedMessage.includes('safety') || normalizedMessage.includes('warning');
  const sourceMessage = isSafetyQuestion ? sampleChatMessages[3] : sampleChatMessages[1];

  return {
    conversationId,
    message: {
      messageId: `mock-message-${request.conversation?.length ?? 0}-assistant`,
      role: 'assistant',
      content: sourceMessage?.content ?? 'No mock maintenance knowledge response is available for this request.',
      createdAt: '2026-01-15T11:25:00.000Z',
      confidence: sourceMessage?.confidence,
      sources: getMockSourceCitations(),
    },
    suggestedQuestions,
    trace: createTraceMetadata('chat', getMockSourceCitations().length),
  };
}

export async function getMaintenanceKnowledgeContext(
  request: KBContextRequestDto = {},
): Promise<KBContextResponseDto> {
  if (APP_MODE !== 'mock') {
    return agenticCoreClient.get<KBContextResponseDto>(API_ENDPOINTS.KB_CONTEXT, request);
  }

  return {
    selected: request,
    machines: [
      { id: 'curve-gen-3b', label: 'CURVE-GEN-3B', metadata: { stationId: 'curve-gen' } },
      { id: 'polishing-7a', label: 'POLISHING-7A', metadata: { stationId: 'polishing' } },
      { id: 'laser-engr-2c', label: 'LASER-ENGR-2C', metadata: { stationId: 'laser-engr' } },
    ],
    lines: [
      { id: 'rx1-surfacing', label: 'Rx1 Surfacing' },
      { id: 'rx2-coating', label: 'Rx2 Coating' },
    ],
    stations: [
      { id: 'curve-gen', label: 'CURVE GENERATING' },
      { id: 'polishing', label: 'POLISHING' },
      { id: 'laser-engr', label: 'LASER ENGRAVING' },
    ],
    failureTypes: [
      { id: 'all', label: 'All Types' },
      { id: 'mechanical', label: 'Mechanical' },
      { id: 'electrical', label: 'Electrical' },
      { id: 'software', label: 'Software' },
    ],
    documentTypes: [
      { id: 'manual', label: 'Manuals' },
      { id: 'sop', label: 'SOPs' },
      { id: 'history', label: 'History' },
      { id: 'lesson', label: 'Best Practices' },
    ],
    suggestedQuestions,
    trace: createTraceMetadata('context'),
  };
}

export async function submitMaintenanceFeedback(
  request: KBFeedbackRequestDto,
): Promise<KBFeedbackResponseDto> {
  if (APP_MODE !== 'mock') {
    return agenticCoreClient.post<KBFeedbackResponseDto>(API_ENDPOINTS.KB_FEEDBACK, request);
  }

  return {
    accepted: true,
    feedbackId: `mock-feedback-${request.messageId}-${request.rating}`,
    trace: createTraceMetadata('feedback'),
  };
}
