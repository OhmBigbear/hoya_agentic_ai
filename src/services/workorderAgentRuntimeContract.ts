export const WORKORDER_RUNTIME_REQUEST_PAYLOAD_VERSION = '1.0';
export const WORKORDER_RUNTIME_RESPONSE_PAYLOAD_VERSION = '2.0';

export interface WorkorderRuntimeRequestInput {
  query?: string;
  question?: string;
  surface_id: string;
  request_source: string;
  selected_workorder_id?: string;
  selected_machine_id?: string;
  machine_id?: string;
  context?: Record<string, unknown>;
  context_metadata?: Record<string, unknown>;
  client_trace_id?: string;
  payload_version?: string;
}

export interface WorkorderRuntimeRequestEnvelope {
  query: string;
  surface_id: string;
  request_source: string;
  selected_workorder_id?: string;
  selected_machine_id?: string;
  context: Record<string, unknown>;
  client_trace_id: string;
  payload_version: string;
}

export interface WorkorderRuntimeTraceMetadata {
  trace_id?: string;
  agent_id?: string;
  run_id?: string;
}

export interface WorkorderRuntimeResponseEnvelope {
  payload_version: string;
  trace_metadata: WorkorderRuntimeTraceMetadata;
  summary?: unknown;
  widgets: unknown[];
  readonly_actions: unknown[];
  diagnostics: unknown[];
}

export interface WorkorderRuntimeErrorEnvelope {
  error_code: string;
  message: string;
  retryable: boolean;
  trace_id?: string;
  details?: unknown;
}

export interface WorkorderRuntimeContractDiagnostics {
  endpoint_url?: string;
  endpoint_path?: string;
  client_trace_id?: string;
  runtime_trace_id?: string;
  payload_version?: string;
  error_code?: string;
}

export interface ParsedWorkorderRuntimeResponse {
  ok: boolean;
  payload: unknown;
  diagnostics: WorkorderRuntimeContractDiagnostics;
  reason?: string;
}

export function buildWorkorderRuntimeRequest(
  input: WorkorderRuntimeRequestInput,
  createTraceId: () => string = defaultClientTraceId,
): WorkorderRuntimeRequestEnvelope {
  return {
    query: requiredText(input.query ?? input.question),
    surface_id: requiredText(input.surface_id),
    request_source: requiredText(input.request_source),
    selected_workorder_id: optionalText(input.selected_workorder_id),
    selected_machine_id: optionalText(input.selected_machine_id ?? input.machine_id),
    context: input.context ?? input.context_metadata ?? {},
    client_trace_id: optionalText(input.client_trace_id) ?? createTraceId(),
    payload_version: optionalText(input.payload_version) ?? WORKORDER_RUNTIME_REQUEST_PAYLOAD_VERSION,
  };
}

export function parseWorkorderRuntimeResponse(
  payload: unknown,
  diagnostics: WorkorderRuntimeContractDiagnostics = {},
): ParsedWorkorderRuntimeResponse {
  const record = getRecord(payload);
  if (!record) {
    return invalidRuntimeResponse('Runtime response was not a JSON object', diagnostics);
  }

  const traceMetadata = getRecord(record.trace_metadata);
  const payloadVersion = optionalText(record.payload_version) ?? optionalText(traceMetadata?.payload_version);
  const traceId = optionalText(traceMetadata?.trace_id);

  const nextDiagnostics: WorkorderRuntimeContractDiagnostics = {
    ...diagnostics,
    runtime_trace_id: traceId ?? diagnostics.runtime_trace_id,
    payload_version: payloadVersion ?? diagnostics.payload_version,
  };

  const hasCanonicalPayload = Boolean(
    payloadVersion
    && traceMetadata
    && (Array.isArray(record.widgets) || Array.isArray(record.readonly_actions) || record.summary || Array.isArray(record.diagnostics))
  );

  if (!hasCanonicalPayload) {
    return invalidRuntimeResponse('Runtime response did not match the Workorder Agent payload envelope', nextDiagnostics);
  }

  return {
    ok: true,
    payload,
    diagnostics: nextDiagnostics,
  };
}

export function parseWorkorderRuntimeError(
  payload: unknown,
  fallbackMessage = 'Workorder Agent runtime request failed',
): WorkorderRuntimeErrorEnvelope {
  const record = getRecord(payload);
  const error = getRecord(record?.error) ?? record;
  const traceMetadata = getRecord(record?.trace_metadata);
  const traceId = optionalText(error?.trace_id) ?? optionalText(record?.trace_id) ?? optionalText(traceMetadata?.trace_id);
  const details = error?.details ?? record?.details;

  return {
    error_code: optionalText(error?.error_code) ?? optionalText(error?.code) ?? 'runtime_error',
    message: optionalText(error?.message) ?? optionalText(record?.message) ?? fallbackMessage,
    retryable: typeof error?.retryable === 'boolean' ? error.retryable : false,
    trace_id: traceId,
    details,
  };
}

export function buildWorkorderRuntimeDiagnosticPayload(
  code: string,
  message: string,
  severity: 'info' | 'warning' | 'error',
  diagnostics: WorkorderRuntimeContractDiagnostics = {},
): unknown {
  return {
    payload_version: diagnostics.payload_version ?? WORKORDER_RUNTIME_RESPONSE_PAYLOAD_VERSION,
    payload_type: 'workorder_agent_response',
    intent: 'workorder_insight',
    error: {
      code,
      message,
    },
    diagnostics: [{
      code,
      message,
      severity,
      section: 'runtime_fetch',
      details: diagnostics,
    }],
    trace_metadata: {
      trace_id: diagnostics.runtime_trace_id,
      payload_version: diagnostics.payload_version ?? WORKORDER_RUNTIME_RESPONSE_PAYLOAD_VERSION,
    },
    request_context: {
      endpoint_url: diagnostics.endpoint_url,
      endpoint_path: diagnostics.endpoint_path,
      client_trace_id: diagnostics.client_trace_id,
      error_code: diagnostics.error_code,
    },
  };
}

function invalidRuntimeResponse(
  reason: string,
  diagnostics: WorkorderRuntimeContractDiagnostics,
): ParsedWorkorderRuntimeResponse {
  const code = 'runtime_invalid_response';
  return {
    ok: false,
    reason,
    payload: buildWorkorderRuntimeDiagnosticPayload(code, reason, 'error', { ...diagnostics, error_code: code }),
    diagnostics: { ...diagnostics, error_code: code },
  };
}

function requiredText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function defaultClientTraceId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  return `hoya-ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
