import { describe, expect, it, vi } from 'vitest';

import {
  buildWorkorderAgentRuntimeUrl,
  normalizeWorkorderAgentRuntimeTimeoutMs,
  requestWorkorderAgentRuntime,
  resolveWorkorderAgentRuntimeEndpoint,
} from '../src/services/workorderAgentRuntimeApi';
import {
  buildWorkorderRuntimeRequest,
  parseWorkorderRuntimeError,
  parseWorkorderRuntimeResponse,
} from '../src/services/workorderAgentRuntimeContract';
import {
  buildWorkorderWidgetPreviewModel,
} from '../src/ui-registry';
import {
  runtimeWorkorderAgentResponse,
  unsafeRuntimeWorkorderAgentResponse,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';
import {
  workorderRuntimeSmokeErrorResponse,
  workorderRuntimeSmokeMalformedResponse,
  workorderRuntimeSmokeRequest,
  workorderRuntimeSmokeResponse,
} from './fixtures/workorder-runtime-contract-smoke.fixture';

const runtimeRequest = {
  query: 'show maintenance blockers',
  selected_workorder_id: 'WO-100',
  selected_machine_id: 'MACHINE-7A',
  surface_id: 'maintenance.workorders',
  request_source: 'hoya_ui.developer_diagnostics',
  context: {
    filters: { status: 'open' },
  },
  client_trace_id: 'client-trace-021-b09',
  payload_version: '1.0',
};

const legacyRuntimeRequest = {
  question: 'show maintenance blockers',
  selected_workorder_id: 'WO-100',
  machine_id: 'MACHINE-7A',
  surface_id: 'maintenance.workorders',
  request_source: 'hoya_ui.developer_diagnostics',
  context_metadata: {
    filters: { status: 'open' },
  },
};

describe('workorder agent runtime API', () => {
  it('builds runtime URLs from environment-style base URL and path', () => {
    expect(buildWorkorderAgentRuntimeUrl('https://agentic-core.example.com/', '/api/workorder-agent/runtime')).toBe(
      'https://agentic-core.example.com/api/workorder-agent/runtime',
    );
    expect(buildWorkorderAgentRuntimeUrl('', '/ignored', 'https://agentic-core.example.com/custom/runtime')).toBe(
      'https://agentic-core.example.com/custom/runtime',
    );
    expect(buildWorkorderAgentRuntimeUrl('', '/api/workorder-agent/runtime')).toBeNull();
  });

  it('resolves full URL endpoint mode', () => {
    expect(resolveWorkorderAgentRuntimeEndpoint(
      'https://ignored.example.com',
      '/ignored',
      'https://agentic-core.example.com/custom/runtime',
    )).toEqual({
      mode: 'full_url',
      url: 'https://agentic-core.example.com/custom/runtime',
    });
  });

  it('resolves base URL and path endpoint mode', () => {
    expect(resolveWorkorderAgentRuntimeEndpoint(
      'https://agentic-core.example.com/',
      'api/workorder-agent/runtime',
      '',
    )).toEqual({
      mode: 'base_url_path',
      url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      path: '/api/workorder-agent/runtime',
    });
  });

  it('resolves no endpoint as disabled mode', () => {
    expect(resolveWorkorderAgentRuntimeEndpoint('', '/api/workorder-agent/runtime', '')).toEqual({
      mode: 'disabled',
      url: null,
      path: '/api/workorder-agent/runtime',
    });
  });

  it('parses timeout configuration with fallback for invalid values', () => {
    expect(normalizeWorkorderAgentRuntimeTimeoutMs(2500)).toBe(2500);
    expect(normalizeWorkorderAgentRuntimeTimeoutMs('3000')).toBe(3000);
    expect(normalizeWorkorderAgentRuntimeTimeoutMs(Number.NaN)).toBe(10000);
    expect(normalizeWorkorderAgentRuntimeTimeoutMs('not-a-number')).toBe(10000);
    expect(normalizeWorkorderAgentRuntimeTimeoutMs(0)).toBe(10000);
  });

  it('builds the valid canonical passive runtime request shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(runtimeWorkorderAgentResponse), { status: 200 }),
    );

    await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl,
      now: fixedClock(),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://agentic-core.example.com/api/workorder-agent/runtime');
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toEqual(runtimeRequest);
  });

  it('keeps B0.8 request aliases backward compatible', async () => {
    const request = buildWorkorderRuntimeRequest(legacyRuntimeRequest, () => 'legacy-client-trace');

    expect(request).toEqual({
      query: 'show maintenance blockers',
      selected_workorder_id: 'WO-100',
      selected_machine_id: 'MACHINE-7A',
      surface_id: 'maintenance.workorders',
      request_source: 'hoya_ui.developer_diagnostics',
      context: {
        filters: { status: 'open' },
      },
      client_trace_id: 'legacy-client-trace',
      payload_version: '1.0',
    });
  });

  it('parses valid runtime response shapes', () => {
    const parsed = parseWorkorderRuntimeResponse(runtimeWorkorderAgentResponse, {
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      client_trace_id: 'client-trace-021-b09',
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.payload).toEqual(runtimeWorkorderAgentResponse);
    expect(parsed.diagnostics).toMatchObject({
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      client_trace_id: 'client-trace-021-b09',
      runtime_trace_id: 'trace-runtime-workorder-021',
      payload_version: '2.0',
    });
  });

  it('handles successful runtime payload envelopes', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify(runtimeWorkorderAgentResponse), { status: 200 })),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'success',
      source: 'runtime',
      requestedAt: '2026-06-05T00:00:00.000Z',
      completedAt: '2026-06-05T00:00:01.000Z',
    });
    expect(result.status === 'success' ? result.payload : null).toEqual(runtimeWorkorderAgentResponse);
    expect(result.diagnostics).toMatchObject({
      endpoint_mode: 'base_url_path',
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      endpoint_path: '/api/workorder-agent/runtime',
      timeout_ms: 10000,
      request_source: 'hoya_ui.developer_diagnostics',
      client_trace_id: 'client-trace-021-b09',
      runtime_trace_id: 'trace-runtime-workorder-021',
      payload_version: '2.0',
    });
  });

  it('handles disabled mode without calling the backend', async () => {
    const fetchImpl = vi.fn();
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: '',
      fetchImpl,
      now: fixedClock(),
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'disabled',
      source: 'fallback',
      errorReason: 'Workorder Agent runtime endpoint is not configured',
    });
    expect(buildWorkorderWidgetPreviewModel(result.payload).diagnostics.runtimeDiagnostics[0]).toMatchObject({
      code: 'runtime_disabled',
      section: 'runtime_fetch',
    });
    expect(result.diagnostics).toMatchObject({
      endpoint_mode: 'disabled',
      endpoint_path: '/api/workorder-agent/runtime',
      timeout_ms: 10000,
      request_source: 'hoya_ui.developer_diagnostics',
      client_trace_id: 'client-trace-021-b09',
      payload_version: '1.0',
      error_code: 'runtime_disabled',
    });
  });

  it('parses runtime error response shapes', () => {
    const parsed = parseWorkorderRuntimeError({
      error: {
        error_code: 'agent_unavailable',
        message: 'agent unavailable',
        retryable: true,
        trace_id: 'trace-error-021',
        details: { queue_depth: 12 },
      },
    });

    expect(parsed).toEqual({
      error_code: 'agent_unavailable',
      message: 'agent unavailable',
      retryable: true,
      trace_id: 'trace-error-021',
      details: { queue_depth: 12 },
    });
  });

  it('handles runtime HTTP errors as diagnostics-only fallback payloads', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          error: {
            error_code: 'agent_unavailable',
            message: 'agent unavailable',
            retryable: true,
            trace_id: 'trace-error-021',
            details: { queue_depth: 12 },
          },
        }), { status: 503, statusText: 'Service Unavailable' }),
      ),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'error',
      source: 'fallback',
      errorReason: 'agent unavailable',
    });
    const model = buildWorkorderWidgetPreviewModel(result.payload);
    expect(model.safeToRender).toBe(true);
    expect(model.diagnostics.validationValid).toBe(false);
    expect(model.diagnostics.runtimeDiagnostics.map((diagnostic) => diagnostic.code)).toContain('agent_unavailable');
    expect(result.diagnostics).toMatchObject({
      endpoint_mode: 'base_url_path',
      runtime_trace_id: 'trace-error-021',
      error_code: 'agent_unavailable',
    });
  });

  it('turns malformed runtime responses into diagnostics-only payloads', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'not a runtime envelope' }), { status: 200 })),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'invalid_response',
      source: 'fallback',
      errorReason: 'Runtime response did not match the Workorder Agent payload envelope',
    });
    const model = buildWorkorderWidgetPreviewModel(result.payload);
    expect(model.safeToRender).toBe(true);
    expect(model.diagnostics.runtimeDiagnostics[0]).toMatchObject({
      code: 'runtime_invalid_response',
      section: 'runtime_fetch',
    });
    expect(result.diagnostics).toMatchObject({
      error_code: 'runtime_invalid_response',
      client_trace_id: 'client-trace-021-b09',
    });
  });

  it('handles timeout errors as diagnostics-only fallback payloads', async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));

    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      timeoutMs: 1,
      fetchImpl,
      now: fixedClock(),
    });

    expect(result.status).toBe('timeout');
    expect(result.source).toBe('fallback');
    expect(result.status === 'timeout' ? result.errorReason : '').toContain('timed out');
    expect(result.diagnostics).toMatchObject({
      error_code: 'runtime_timeout',
      timeout_ms: 1,
      client_trace_id: 'client-trace-021-b09',
    });
  });

  it('uses the runtime contract smoke fixture for a valid request and response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(workorderRuntimeSmokeResponse), { status: 200 }),
    );

    const result = await requestWorkorderAgentRuntime(workorderRuntimeSmokeRequest, {
      endpointUrl: 'https://agentic-core.example.com/custom/runtime',
      timeoutMs: 5000,
      fetchImpl,
      now: fixedClock(),
    });

    expect(fetchImpl.mock.calls[0][0]).toBe('https://agentic-core.example.com/custom/runtime');
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toEqual(workorderRuntimeSmokeRequest);
    expect(result.status).toBe('success');
    expect(result.diagnostics).toMatchObject({
      endpoint_mode: 'full_url',
      endpoint_url: 'https://agentic-core.example.com/custom/runtime',
      timeout_ms: 5000,
      request_source: 'hoya_ui.contract_smoke',
      client_trace_id: 'client-trace-smoke-022',
      runtime_trace_id: 'trace-runtime-smoke-022',
    });
  });

  it('uses the runtime contract smoke fixture for error responses', async () => {
    const result = await requestWorkorderAgentRuntime(workorderRuntimeSmokeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(workorderRuntimeSmokeErrorResponse), { status: 503, statusText: 'Service Unavailable' }),
      ),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'error',
      source: 'fallback',
      errorReason: 'agent unavailable',
    });
    expect(result.diagnostics).toMatchObject({
      runtime_trace_id: 'trace-runtime-smoke-error-022',
      error_code: 'agent_unavailable',
    });
  });

  it('uses the runtime contract smoke fixture for malformed responses', async () => {
    const result = await requestWorkorderAgentRuntime(workorderRuntimeSmokeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify(workorderRuntimeSmokeMalformedResponse), { status: 200 })),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'invalid_response',
      source: 'fallback',
      errorReason: 'Runtime response did not match the Workorder Agent payload envelope',
    });
    expect(result.diagnostics).toMatchObject({
      error_code: 'runtime_invalid_response',
      request_source: 'hoya_ui.contract_smoke',
      client_trace_id: 'client-trace-smoke-022',
    });
  });

  it('runtime responses normalize through the existing widget adapter', () => {
    const model = buildWorkorderWidgetPreviewModel(runtimeWorkorderAgentResponse);

    expect(model.safeToRender).toBe(true);
    expect(model.diagnostics.traceMetadata).toMatchObject({
      trace_id: 'trace-runtime-workorder-021',
      agent_id: 'maint-workorder-agent',
      run_id: 'run-runtime-021-b07',
      payload_version: '2.0',
    });
    expect(model.widgets.some((widget) => widget.id === 'runtime-open-workorders')).toBe(true);
  });

  it('unsafe runtime actions remain rejected by the existing adapter boundary', () => {
    const model = buildWorkorderWidgetPreviewModel(unsafeRuntimeWorkorderAgentResponse);

    expect(model.diagnostics.actionValidationValid).toBe(false);
    expect(model.diagnostics.rejectedActionCount).toBe(2);
    expect(JSON.stringify(model.widgets)).not.toContain('delete_workorder');
  });
});

function fixedClock(): () => string {
  const values = ['2026-06-05T00:00:00.000Z', '2026-06-05T00:00:01.000Z'];
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}
