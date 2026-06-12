import {
  WORKORDER_AGENT_RUNTIME_BASE_URL,
  WORKORDER_AGENT_RUNTIME_ENDPOINT_URL,
  WORKORDER_AGENT_RUNTIME_PATH,
  WORKORDER_AGENT_RUNTIME_TIMEOUT_MS,
} from '../shared/config/env';
import {
  buildWorkorderRuntimeDiagnosticPayload,
  buildWorkorderRuntimeRequest,
  parseWorkorderRuntimeError,
  parseWorkorderRuntimeResponse,
  type WorkorderRuntimeContractDiagnostics,
  type WorkorderRuntimeRequestInput,
} from './workorderAgentRuntimeContract';

export type WorkorderAgentRuntimeSource = 'runtime' | 'fallback';
export type WorkorderAgentRuntimeStatus = 'success' | 'disabled' | 'timeout' | 'error' | 'invalid_response';
export type WorkorderAgentRuntimeRequest = WorkorderRuntimeRequestInput;
export type WorkorderAgentRuntimeEndpointMode = 'full_url' | 'base_url_path' | 'disabled';

export interface WorkorderAgentRuntimeEndpointResolution {
  mode: WorkorderAgentRuntimeEndpointMode;
  url: string | null;
  path?: string;
}

export interface WorkorderAgentRuntimeSuccess {
  status: 'success';
  source: 'runtime';
  payload: unknown;
  requestedAt: string;
  completedAt: string;
  diagnostics: WorkorderRuntimeContractDiagnostics;
}

export interface WorkorderAgentRuntimeFailure {
  status: Exclude<WorkorderAgentRuntimeStatus, 'success'>;
  source: 'fallback';
  errorReason: string;
  requestedAt: string;
  completedAt: string;
  payload: unknown;
  diagnostics: WorkorderRuntimeContractDiagnostics;
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
  const endpoint = resolveWorkorderAgentRuntimeEndpoint(options.baseUrl, options.path, options.endpointUrl);
  const timeoutMs = normalizeWorkorderAgentRuntimeTimeoutMs(options.timeoutMs ?? WORKORDER_AGENT_RUNTIME_TIMEOUT_MS);
  const runtimeRequest = buildWorkorderRuntimeRequest(request);
  const requestPayloadJson = JSON.stringify(runtimeRequest, null, 2);
  const baseDiagnostics: WorkorderRuntimeContractDiagnostics = {
    endpoint_mode: endpoint.mode,
    endpoint_url: endpoint.url ?? undefined,
    endpoint_path: endpoint.path,
    timeout_ms: timeoutMs,
    request_url: endpoint.url ?? undefined,
    request_payload: requestPayloadJson,
    request_source: runtimeRequest.request_source,
    client_trace_id: request.client_trace_id,
    payload_version: request.payload_version,
  };

  if (!endpoint.url) {
    const completedAt = now();
    return runtimeFailure(
      'disabled',
      'runtime_disabled',
      'Workorder Agent runtime endpoint is not configured',
      { ...baseDiagnostics, error_code: 'runtime_disabled' },
      requestedAt,
      completedAt,
      'info',
    );
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpoint.url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runtimeRequest),
      signal: controller.signal,
    });
    const { payload, responseBody } = await parseRuntimeJsonResponse(response);
    const completedAt = now();

    if (!response.ok) {
      const error = parseWorkorderRuntimeError(payload, `Workorder Agent runtime request failed with ${response.status} ${response.statusText}`);
      const isRejectedRequest = response.status === 400;
      return runtimeFailure(
        'error',
        isRejectedRequest ? 'runtime_request_rejected' : error.error_code,
        isRejectedRequest ? 'Runtime request rejected' : error.message,
        {
          ...baseDiagnostics,
          runtime_trace_id: error.trace_id,
          error_code: isRejectedRequest ? 'runtime_request_rejected' : error.error_code,
          response_status: response.status,
          http_status: response.status,
          response_body: responseBody,
        },
        requestedAt,
        completedAt,
      );
    }

    const parsed = parseWorkorderRuntimeResponse(payload, baseDiagnostics);
    if (!parsed.ok) {
      return {
        status: 'invalid_response',
        source: 'fallback',
        errorReason: parsed.reason ?? 'Runtime response did not match the Workorder Agent payload envelope',
        requestedAt,
        completedAt,
        payload: parsed.payload,
        diagnostics: {
          ...parsed.diagnostics,
          response_status: response.status,
          http_status: response.status,
          response_body: responseBody,
        },
      };
    }

    return {
      status: 'success',
      source: 'runtime',
      payload: parsed.payload,
      requestedAt,
      completedAt,
      diagnostics: parsed.diagnostics,
    };
  } catch (error) {
    const completedAt = now();
    if (isAbortError(error)) {
      return runtimeFailure(
        'timeout',
        'runtime_timeout',
        `Workorder Agent runtime request timed out after ${timeoutMs} ms`,
        { ...baseDiagnostics, error_code: 'runtime_timeout' },
        requestedAt,
        completedAt,
      );
    }
    return runtimeFailure(
      'error',
      'runtime_error',
      error instanceof Error ? error.message : 'Workorder Agent runtime request failed',
      { ...baseDiagnostics, error_code: 'runtime_error' },
      requestedAt,
      completedAt,
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function buildWorkorderAgentRuntimeUrl(
  baseUrl = WORKORDER_AGENT_RUNTIME_BASE_URL,
  path = WORKORDER_AGENT_RUNTIME_PATH,
  endpointUrl = WORKORDER_AGENT_RUNTIME_ENDPOINT_URL,
): string | null {
  return resolveWorkorderAgentRuntimeEndpoint(baseUrl, path, endpointUrl).url;
}

export function resolveWorkorderAgentRuntimeEndpoint(
  baseUrl = WORKORDER_AGENT_RUNTIME_BASE_URL,
  path = WORKORDER_AGENT_RUNTIME_PATH,
  endpointUrl = WORKORDER_AGENT_RUNTIME_ENDPOINT_URL,
): WorkorderAgentRuntimeEndpointResolution {
  const trimmedEndpointUrl = endpointUrl.trim();
  if (trimmedEndpointUrl) {
    return {
      mode: 'full_url',
      url: trimmedEndpointUrl,
    };
  }

  const trimmedBaseUrl = baseUrl.trim();
  const normalizedPath = normalizeRuntimePath(path);
  if (!trimmedBaseUrl) {
    return {
      mode: 'disabled',
      url: null,
      path: normalizedPath,
    };
  }

  const normalizedBase = trimmedBaseUrl.replace(/\/+$/, '');
  return {
    mode: 'base_url_path',
    url: `${normalizedBase}${normalizedPath}`,
    path: normalizedPath,
  };
}

export function normalizeWorkorderAgentRuntimeTimeoutMs(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 10000;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10000;
  }

  return 10000;
}

async function parseRuntimeJsonResponse(response: Response): Promise<{ payload: unknown; responseBody: string }> {
  const text = await response.text();
  if (!text) {
    return { payload: {}, responseBody: '' };
  }

  try {
    return { payload: JSON.parse(text), responseBody: text };
  } catch {
    return { payload: { error: { message: text } }, responseBody: text };
  }
}

function runtimeFailure(
  status: WorkorderAgentRuntimeFailure['status'],
  code: string,
  errorReason: string,
  diagnostics: WorkorderRuntimeContractDiagnostics,
  requestedAt: string,
  completedAt: string,
  severity: 'info' | 'warning' | 'error' = 'error',
): WorkorderAgentRuntimeFailure {
  return {
    status,
    source: 'fallback',
    errorReason,
    requestedAt,
    completedAt,
    payload: buildWorkorderRuntimeDiagnosticPayload(code, errorReason, severity, diagnostics),
    diagnostics,
  };
}

function normalizeRuntimePath(path: string): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return '';
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError')
  );
}
