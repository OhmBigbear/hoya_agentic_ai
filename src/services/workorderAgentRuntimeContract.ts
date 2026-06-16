export const WORKORDER_RUNTIME_REQUEST_PAYLOAD_VERSION = '1.0';
export const WORKORDER_RUNTIME_RESPONSE_PAYLOAD_VERSION = '2.0';

export interface WorkorderRuntimeRequestInput {
  query?: string;
  question?: string;
  session_id?: string;
  surface_id: string;
  request_source: string;
  workorder_no?: string;
  selected_workorder_id?: string;
  selected_machine_id?: string;
  machine_id?: string;
  context?: WorkorderRuntimeRequestContext;
  context_metadata?: Record<string, unknown>;
  client_trace_id?: string;
  payload_version?: string;
}

export interface WorkorderRuntimeRequestContext extends Record<string, unknown> {
  create_approval_request?: boolean;
  require_human_approval?: boolean;
}

export interface WorkorderRuntimeRequestEnvelope {
  query: string;
  session_id?: string;
  surface_id: string;
  request_source: string;
  workorder_no?: string;
  context: WorkorderRuntimeRequestContext;
}

export interface WorkorderRuntimeTraceMetadata {
  trace_id?: string;
  agent_id?: string;
  run_id?: string;
  payload_version?: string;
}

export interface WorkorderRuntimeResponseEnvelope {
  payload_version: string;
  trace_metadata: WorkorderRuntimeTraceMetadata;
  summary?: unknown;
  narrative?: unknown;
  widgets: unknown[];
  readonly_actions: unknown[];
  diagnostics: unknown[];
  approval?: WorkorderRuntimeApprovalMetadata;
}

export interface WorkorderRuntimeApprovalMetadata {
  approval_required?: boolean;
  approval_type?: 'maintenance_rca' | string;
  approval_id?: string;
  task_id?: string;
  approval_status?: string;
  approval_reason?: string;
  approval_review_route?: string;
  governance?: unknown;
  safety?: unknown;
}

export interface WorkorderRuntimeErrorEnvelope {
  error_code: string;
  message: string;
  retryable: boolean;
  trace_id?: string;
  details?: unknown;
}

export interface WorkorderRuntimeContractDiagnostics {
  endpoint_mode?: 'full_url' | 'base_url_path' | 'disabled';
  endpoint_url?: string;
  endpoint_path?: string;
  timeout_ms?: number;
  request_url?: string;
  request_payload?: string;
  request_source?: string;
  client_trace_id?: string;
  runtime_trace_id?: string;
  payload_version?: string;
  error_code?: string;
  response_status?: number;
  http_status?: number;
  response_body?: string;
}

export interface ParsedWorkorderRuntimeResponse {
  ok: boolean;
  payload: unknown;
  diagnostics: WorkorderRuntimeContractDiagnostics;
  session_id?: string;
  reason?: string;
}

export function buildWorkorderRuntimeRequest(
  input: WorkorderRuntimeRequestInput,
  createTraceId: () => string = defaultClientTraceId,
): WorkorderRuntimeRequestEnvelope {
  const selectedWorkorderId = optionalText(input.selected_workorder_id);
  const selectedMachineId = optionalText(input.selected_machine_id ?? input.machine_id);
  const workorderNo = optionalText(input.workorder_no) ?? selectedWorkorderId;
  const context = {
    ...(input.context ?? input.context_metadata ?? {}),
  };
  if (selectedWorkorderId || selectedMachineId) {
    const workspaceState = getRecord(context.workspace_state);
    context.workspace_state = {
      ...(workspaceState ?? {}),
      ...(selectedWorkorderId ? { selected_workorder_id: selectedWorkorderId } : {}),
      ...(selectedMachineId ? { selected_machine_id: selectedMachineId } : {}),
    };
  }

  const request: WorkorderRuntimeRequestEnvelope = {
    query: requiredText(input.query ?? input.question),
    surface_id: requiredText(input.surface_id),
    request_source: requiredText(input.request_source),
    context,
  };
  const sessionId = optionalText(input.session_id);
  if (sessionId) {
    request.session_id = sessionId;
  }
  if (workorderNo) {
    request.workorder_no = workorderNo;
  }

  void createTraceId;
  return {
    ...request,
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

  const workspacePayload = getRecord(record.workspace_payload);
  const canonicalRecord = workspacePayload ?? record;
  const traceMetadata = getRecord(record.trace_metadata)
    ?? getRecord(record.trace)
    ?? getRecord(canonicalRecord.trace_metadata)
    ?? getRecord(canonicalRecord.trace);
  const payloadVersion = normalizeRuntimePayloadVersion(
    optionalText(canonicalRecord.payload_version)
      ?? optionalText(record.payload_version)
      ?? optionalText(traceMetadata?.payload_version),
  );
  const traceId = optionalText(record.trace_id)
    ?? optionalText(canonicalRecord.trace_id)
    ?? optionalText(traceMetadata?.trace_id);
  const sessionId = optionalText(record.session_id);

  const nextDiagnostics: WorkorderRuntimeContractDiagnostics = {
    ...diagnostics,
    runtime_trace_id: traceId ?? diagnostics.runtime_trace_id,
    payload_version: payloadVersion ?? diagnostics.payload_version,
  };

  const hasRuntimeResponseEnvelope = Boolean(
    payloadVersion
    && (traceMetadata || traceId)
    && (
      Array.isArray(record.widgets)
      || Array.isArray(record.readonly_actions)
      || record.summary
      || record.narrative
      || Array.isArray(record.diagnostics)
    )
  );
  const hasWorkspacePayloadEnvelope = Boolean(
    workspacePayload
    && isSupportedWorkspacePayloadVersion(payloadVersion)
    && optionalText(workspacePayload.payload_type) === 'workorder_insight'
    && optionalText(workspacePayload.intent) === 'workorder_insight'
    && (
      workspacePayload.summary
      || workspacePayload.narrative
      || Array.isArray(workspacePayload.recommendations)
      || Array.isArray(workspacePayload.evidence)
      || Array.isArray(workspacePayload.kpi_cards)
      || Array.isArray(workspacePayload.charts)
      || workspacePayload.debug
    )
  );

  if (!hasRuntimeResponseEnvelope && !hasWorkspacePayloadEnvelope) {
    return invalidRuntimeResponse('Runtime response did not match the Workorder Agent payload envelope', nextDiagnostics);
  }

  return {
    ok: true,
    payload,
    diagnostics: nextDiagnostics,
    session_id: sessionId,
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
      endpoint_mode: diagnostics.endpoint_mode,
      endpoint_url: diagnostics.endpoint_url,
      endpoint_path: diagnostics.endpoint_path,
      timeout_ms: diagnostics.timeout_ms,
      request_source: diagnostics.request_source,
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

function normalizeRuntimePayloadVersion(value: string | undefined): string | undefined {
  if (value === 'v1') {
    return '1.0';
  }
  return value;
}

function isSupportedWorkspacePayloadVersion(value: string | undefined): boolean {
  return value === '1.0';
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
