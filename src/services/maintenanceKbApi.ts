import type {
  MaintenanceKbChatRequest,
  MaintenanceKbChatResponse,
  MaintenanceKbContext,
  MaintenanceKbSearchRequest,
  MaintenanceKbSearchResponse,
  MaintenanceKbSearchResult,
  MaintenanceKbSourceReference,
  MaintenanceKbSuggestedQuestion,
} from '../types/maintenanceKb';

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

const suggestedQuestions: MaintenanceKbSuggestedQuestion[] = [
  {
    id: 'history',
    label: 'Show maintenance history',
    question: 'Show maintenance history',
  },
  {
    id: 'failure-modes',
    label: 'Common failure modes',
    question: 'Common failure modes',
  },
  {
    id: 'pm-schedule',
    label: 'PM schedule',
    question: 'PM schedule',
  },
];

const mockDelay = 180;

function waitForMockLatency(): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, mockDelay);
  });
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

export async function getMaintenanceKbContext(): Promise<MaintenanceKbContext> {
  await waitForMockLatency();
  return mockContext;
}

export async function searchMaintenanceKbDocuments(
  request: MaintenanceKbSearchRequest,
): Promise<MaintenanceKbSearchResponse> {
  await waitForMockLatency();

  if (request.query === '__error__') {
    throw new Error('Unable to load maintenance knowledge documents.');
  }

  const limit = request.limit ?? 20;
  const items = mockDocuments
    .filter((document) => matchesDocumentType(document, request))
    .filter((document) => matchesQuery(document, request))
    .slice(0, limit);

  return { items };
}

export async function askMaintenanceKbAssistant(
  request: MaintenanceKbChatRequest,
): Promise<MaintenanceKbChatResponse> {
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
  };
}
