import {
  WORKORDER_AGENT_RUNTIME_BASE_URL,
  WORKORDER_AGENT_RUNTIME_ENDPOINT_URL,
  WORKORDER_AGENT_RUNTIME_PATH,
  WORKORDER_AGENT_RUNTIME_TIMEOUT_MS,
} from '../shared/config/env';

export type WorkorderAgentRuntimeSource = 'runtime' | 'fallback';
export type WorkorderAgentRuntimeStatus = 'success' | 'disabled' | 'timeout' | 'error';

export interface WorkorderAgentRuntimeRequest {
  question: string;
  selected_workorder_id?: string;
  machine_id?: string;
  surface_id: string;
  request_source: string;
  context_metadata?: Record<string, unknown>;
}

export interface WorkorderAgentRuntimeSuccess {
  status: 'success';
  source: 'runtime';
  payload: unknown;
  requestedAt: string;
  completedAt: string;
}

export interface WorkorderAgentRuntimeFailure {
  status: Exclude<WorkorderAgentRuntimeStatus, 'success'>;
  source: 'fallback';
  errorReason: string;
  requestedAt: string;
  completedAt: string;
  payload: unknown;
}

export type WorkorderAgentRuntimeResult = WorkorderAgentRuntimeSuccess | WorkorderAgentRuntimeFailure;

export interface WorkorderAgentRuntimeClientOptions {
  baseUrl?: string;
  endpointUrl?: string;
  path?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => string;
}

export async function requestWorkorderAgentRuntime(
  request: WorkorderAgentRuntimeRequest,
  options: WorkorderAgentRuntimeClientOptions = {},
): Promise<WorkorderAgentRuntimeResult> {
  const now = options.now ?? (() => new Date().toISOString());
  const requestedAt = now();
  const endpoint = buildWorkorderAgentRuntimeUrl(options.baseUrl, options.path, options.endpointUrl);

  if (!endpoint) {
    const completedAt = now();
    return runtimeFailure('disabled', 'Workorder Agent runtime endpoint is not configured', request, requestedAt, completedAt);
  }

  const timeoutMs = normalizeTimeoutMs(options.timeoutMs ?? WORKORDER_AGENT_RUNTIME_TIMEOUT_MS);
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(normalizeRuntimeRequest(request)),
      signal: controller.signal,
    });
    const payload = await parseRuntimeJsonResponse(response);
    const completedAt = now();

    if (!response.ok) {
      return runtimeFailure(
        'error',
        getRuntimeErrorReason(payload) ?? `Workorder Agent runtime request failed with ${response.status} ${response.statusText}`,
        request,
        requestedAt,
        completedAt,
      );
    }

    return {
      status: 'success',
      source: 'runtime',
      payload,
      requestedAt,
      completedAt,
    };
  } catch (error) {
    const completedAt = now();
    if (isAbortError(error)) {
      return runtimeFailure('timeout', `Workorder Agent runtime request timed out after ${timeoutMs} ms`, request, requestedAt, completedAt);
    }
    return runtimeFailure('error', error instanceof Error ? error.message : 'Workorder Agent runtime request failed', request, requestedAt, completedAt);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function buildWorkorderAgentRuntimeUrl(
  baseUrl = WORKORDER_AGENT_RUNTIME_BASE_URL,
  path = WORKORDER_AGENT_RUNTIME_PATH,
  endpointUrl = WORKORDER_AGENT_RUNTIME_ENDPOINT_URL,
): string | null {
  const trimmedEndpointUrl = endpointUrl.trim();
  if (trimmedEndpointUrl) {
    return trimmedEndpointUrl;
  }

  const trimmedBaseUrl = baseUrl.trim();
  if (!trimmedBaseUrl) {
    return null;
  }

  const normalizedBase = trimmedBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.trim() ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeRuntimeRequest(request: WorkorderAgentRuntimeRequest): WorkorderAgentRuntimeRequest {
  return {
    question: request.question.trim(),
    selected_workorder_id: optionalText(request.selected_workorder_id),
    machine_id: optionalText(request.machine_id),
    surface_id: request.surface_id.trim(),
    request_source: request.request_source.trim(),
    context_metadata: request.context_metadata ?? {},
  };
}

async function parseRuntimeJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
}

function runtimeFailure(
  status: WorkorderAgentRuntimeFailure['status'],
  errorReason: string,
  request: WorkorderAgentRuntimeRequest,
  requestedAt: string,
  completedAt: string,
): WorkorderAgentRuntimeFailure {
  return {
    status,
    source: 'fallback',
    errorReason,
    requestedAt,
    completedAt,
    payload: {
      payload_type: 'workorder_agent_response',
      intent: 'workorder_insight',
      error: {
        code: `runtime_${status}`,
        message: errorReason,
      },
      diagnostics: [{
        code: `runtime_${status}`,
        message: errorReason,
        severity: status === 'disabled' ? 'info' : 'error',
        section: 'runtime_fetch',
      }],
      trace_metadata: {
        payload_version: 'unknown',
      },
      request_context: {
        surface_id: request.surface_id,
        request_source: request.request_source,
      },
    },
  };
}

function getRuntimeErrorReason(payload: unknown): string | undefined {
  const record = getRecord(payload);
  const error = getRecord(record?.error);
  return optionalText(error?.message) ?? optionalText(record?.message) ?? optionalText(record?.error);
}

function normalizeTimeoutMs(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 10000;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError')
  );
}
