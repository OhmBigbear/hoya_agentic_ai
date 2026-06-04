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
  const endpoint = buildWorkorderAgentRuntimeUrl(options.baseUrl, options.path, options.endpointUrl);
  const endpointPath = options.path ?? WORKORDER_AGENT_RUNTIME_PATH;
  const runtimeRequest = buildWorkorderRuntimeRequest(request);
  const baseDiagnostics: WorkorderRuntimeContractDiagnostics = {
    endpoint_url: endpoint ?? undefined,
    endpoint_path: endpointPath,
    client_trace_id: runtimeRequest.client_trace_id,
    payload_version: runtimeRequest.payload_version,
  };

  if (!endpoint) {
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
      body: JSON.stringify(runtimeRequest),
      signal: controller.signal,
    });
    const payload = await parseRuntimeJsonResponse(response);
    const completedAt = now();

    if (!response.ok) {
      const error = parseWorkorderRuntimeError(payload, `Workorder Agent runtime request failed with ${response.status} ${response.statusText}`);
      return runtimeFailure(
        'error',
        error.error_code,
        error.message,
        {
          ...baseDiagnostics,
          runtime_trace_id: error.trace_id,
          error_code: error.error_code,
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
        diagnostics: parsed.diagnostics,
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

function normalizeTimeoutMs(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 10000;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError')
  );
}
