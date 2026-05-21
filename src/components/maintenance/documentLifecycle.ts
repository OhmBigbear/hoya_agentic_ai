import type {
  DiagnosticsResponse,
  DocumentManifest,
  MaintenanceKbDocumentStatus,
  MaintenanceKbSearchResult,
} from '../../types/maintenanceKb';

export const ocrRequiredMessage = 'No reliable text layer found. OCR is required before this document can be indexed.';

const processingStatusLabels: Record<string, string> = {
  uploaded: 'Uploaded',
  pending: 'Waiting to process',
  queued: 'Waiting to process',
  parsing: 'Reading document',
  ocr_processing: 'Reading document',
  parsed: 'Parsed',
  ocr_completed: 'Parsed',
  chunking: 'Preparing knowledge',
  chunked: 'Ready for Indexing',
  embedding: 'Building search index',
  indexed: 'Ready for AI Search',
  ready: 'Ready for AI Search',
  active: 'Ready for AI Search',
  failed: 'Processing Failed',
  ocr_required: 'OCR Required',
};

type LifecycleSource = Partial<DocumentManifest & DiagnosticsResponse & MaintenanceKbSearchResult> & {
  retrieval_status?: MaintenanceKbDocumentStatus;
  chunk_status?: MaintenanceKbDocumentStatus;
  embedding_status?: MaintenanceKbDocumentStatus;
  metadata?: Record<string, unknown>;
  warnings?: unknown[];
};

export interface NormalizedLifecycle {
  effectiveStatus?: MaintenanceKbDocumentStatus;
  statusLabel: string;
  isRetrievalReady: boolean;
  requiresOcr: boolean;
  isFailed: boolean;
  visibleWarnings: string[];
  stages: Array<{ label: string; completed: boolean }>;
}

export function normalizeDocumentLifecycle(
  primary: LifecycleSource | null | undefined,
  secondary?: LifecycleSource | null,
): NormalizedLifecycle {
  const sources = [secondary, primary].filter(Boolean) as LifecycleSource[];
  const statuses = getLifecycleStatuses(sources);
  const isRetrievalReady = sources.some(hasIndexedRetrievalSignal);

  const effectiveStatus = getEffectiveStatus(statuses, isRetrievalReady);
  const isFailed = !isRetrievalReady && statuses.some((status) => /^failed$/i.test(status));
  const hasOcrSuccess = statuses.some((status) => /^(ocr_completed|native_text|native_text_success|skipped|ocr_skipped)$/i.test(status));
  const requiresOcr = !isRetrievalReady
    && !hasOcrSuccess
    && (sources.some((source) => source.requires_ocr === true)
      || statuses.some((status) => /^ocr_required$/i.test(status))
      || sources.some((source) => hasOcrRequiredWarning(source.warnings)));
  const visibleWarnings = filterVisibleWarnings(
    sources.flatMap((source) => source.warnings ?? []),
    isRetrievalReady,
  );

  return {
    effectiveStatus,
    statusLabel: getProcessingStatusLabel(effectiveStatus),
    isRetrievalReady,
    requiresOcr,
    isFailed,
    visibleWarnings,
    stages: getLifecycleStages(sources, statuses, isRetrievalReady),
  };
}

export function getProcessingStatusLabel(status: string | undefined): string {
  return status ? processingStatusLabels[status] ?? status : '-';
}

export function filterVisibleWarnings(warnings: unknown[] | undefined, isRetrievalReady: boolean): string[] {
  if (!warnings?.length) {
    return [];
  }

  const userSafeWarnings = warnings.filter((warning): warning is string => !isPlaceholderWarning(warning));

  return isRetrievalReady ? userSafeWarnings.filter((warning) => !hasTransientProcessingWarning(warning)) : userSafeWarnings;
}

export function isRetrievalReadyLifecycle(source: LifecycleSource | null | undefined): boolean {
  return normalizeDocumentLifecycle(source).isRetrievalReady;
}

function getLifecycleStatuses(sources: LifecycleSource[]): string[] {
  return sources.flatMap((source) => [
    source.final_status,
    source.retrieval_status,
    source.processing_status,
    source.embedding_status,
    source.chunk_status,
    source.ocr_status,
    source.status,
    source.manifest_status,
    getMetadataString(source.metadata, 'final_status'),
    getMetadataString(source.metadata, 'retrieval_status'),
    getMetadataString(source.metadata, 'processing_status'),
    getMetadataString(source.metadata, 'embedding_status'),
    getMetadataString(source.metadata, 'chunk_status'),
    getMetadataString(source.metadata, 'ocr_status'),
  ]).filter((status): status is string => Boolean(status));
}

function getEffectiveStatus(statuses: string[], isRetrievalReady: boolean): MaintenanceKbDocumentStatus | undefined {
  if (isRetrievalReady) {
    return 'indexed';
  }

  const failedStatus = statuses.find((status) => /^failed$/i.test(status));
  if (failedStatus) {
    return failedStatus as MaintenanceKbDocumentStatus;
  }

  const ocrRequiredStatus = statuses.find((status) => /^ocr_required$/i.test(status));
  if (ocrRequiredStatus) {
    return ocrRequiredStatus as MaintenanceKbDocumentStatus;
  }

  const canonicalProgressStatus = statuses.find((status) => /^(chunked|parsed|uploaded|queued|pending|parsing|ocr_processing|chunking|embedding|ocr_completed)$/i.test(status));
  return (canonicalProgressStatus ?? statuses.find(Boolean)) as MaintenanceKbDocumentStatus | undefined;
}

function hasIndexedRetrievalSignal(source: LifecycleSource): boolean {
  const retrievalStatuses = [
    source.final_status,
    source.retrieval_status,
    source.processing_status,
    source.embedding_status,
    source.status,
    source.manifest_status,
    getMetadataString(source.metadata, 'final_status'),
    getMetadataString(source.metadata, 'retrieval_status'),
    getMetadataString(source.metadata, 'processing_status'),
    getMetadataString(source.metadata, 'embedding_status'),
    getMetadataString(source.metadata, 'status'),
    getMetadataString(source.metadata, 'manifest_status'),
  ];

  return source.indexed === true
    || source.active === true
    || retrievalStatuses.some((status) => status ? /^(indexed|ready|active|completed|success)$/i.test(status) : false);
}

function getLifecycleStages(
  sources: LifecycleSource[],
  statuses: string[],
  isRetrievalReady: boolean,
): Array<{ label: string; completed: boolean }> {
  const hasStatus = (pattern: RegExp) => statuses.some((status) => pattern.test(status));
  const hasFlag = (key: keyof LifecycleSource) => sources.some((source) => source[key] === true);
  const readDocument = isRetrievalReady
    || hasStatus(/^(parsed|chunked|indexed|ready|active|ocr_completed|completed|success)$/i)
    || hasFlag('parsed_exists')
    || hasFlag('parsed_artifact_exists');
  const preparedForIndex = isRetrievalReady
    || hasStatus(/^(chunked|indexed|ready|active|completed|success)$/i)
    || hasFlag('chunks_exists')
    || hasFlag('chunk_artifact_exists');
  const builtSearchIndex = isRetrievalReady || hasFlag('indexed') || hasFlag('active');

  return [
    { label: 'Read document', completed: readDocument },
    { label: 'Prepare knowledge', completed: preparedForIndex },
    { label: 'Build search index', completed: builtSearchIndex },
    { label: 'Ready to ask', completed: isRetrievalReady },
  ];
}

function hasOcrRequiredWarning(warnings: unknown[] | undefined): boolean {
  return warnings?.some((warning) => typeof warning === 'string' && /ocr|text layer|extractable text/i.test(warning)) ?? false;
}

function hasTransientProcessingWarning(warning: string): boolean {
  return /ocr|required|retry|transient|processing|pending|fail|failed|error|could not read|text layer|extractable text/i.test(warning);
}

function isPlaceholderWarning(warning: unknown): boolean {
  return typeof warning !== 'string' || warning.trim() === '' || warning.trim() === '-';
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : undefined;
}
