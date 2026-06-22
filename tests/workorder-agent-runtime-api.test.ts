import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  delete process.env.VITE_WORKORDER_AGENT_RUNTIME_PATH;
  delete process.env.VITE_WORKORDER_AGENT_RUNTIME_TIMEOUT_MS;
});

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
  agenticCoreFastPathCostIntelligenceResponse,
  agenticCoreWorkspaceRuntimeResponse,
  agenticCoreWorkspaceRuntimeResponseV1Alias,
  runtimeWorkorderAgentResponse,
  spec027hStructuredTriageOnlyRuntimeResponse,
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
  workorder_no: 'WO-100',
  surface_id: 'maintenance.workorders',
  request_source: 'hoya_ui.developer_diagnostics',
  context: {
    workspace_state: {
      selected_workorder_id: 'WO-100',
      selected_machine_id: 'MACHINE-7A',
    },
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
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toEqual({
      query: 'show maintenance blockers',
      workorder_no: 'WO-100',
      surface_id: 'maintenance.workorders',
      request_source: 'hoya_ui.developer_diagnostics',
      context: {
        workspace_state: {
          selected_workorder_id: 'WO-100',
          selected_machine_id: 'MACHINE-7A',
        },
        filters: { status: 'open' },
      },
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).not.toHaveProperty('selected_workorder_id');
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).not.toHaveProperty('selected_machine_id');
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).not.toHaveProperty('client_trace_id');
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).not.toHaveProperty('payload_version');
  });

  it('keeps B0.8 request aliases backward compatible', async () => {
    const request = buildWorkorderRuntimeRequest(legacyRuntimeRequest, () => 'legacy-client-trace');

    expect(request).toEqual({
      query: 'show maintenance blockers',
      workorder_no: 'WO-100',
      surface_id: 'maintenance.workorders',
      request_source: 'hoya_ui.developer_diagnostics',
      context: {
        filters: { status: 'open' },
        workspace_state: {
          selected_workorder_id: 'WO-100',
          selected_machine_id: 'MACHINE-7A',
        },
      },
    });
  });

  it('omits session_id when absent, null, or empty', () => {
    expect(buildWorkorderRuntimeRequest(runtimeRequest)).not.toHaveProperty('session_id');
    expect(buildWorkorderRuntimeRequest({ ...runtimeRequest, session_id: null as unknown as string })).not.toHaveProperty('session_id');
    expect(buildWorkorderRuntimeRequest({ ...runtimeRequest, session_id: '   ' })).not.toHaveProperty('session_id');
  });

  it('includes session_id when provided', () => {
    expect(buildWorkorderRuntimeRequest({ ...runtimeRequest, session_id: ' session-workorder-026b ' })).toMatchObject({
      session_id: 'session-workorder-026b',
    });
  });

  it('includes RCA approval creation only when explicitly requested in context', () => {
    const defaultRequest = buildWorkorderRuntimeRequest(runtimeRequest, () => 'default-trace');
    const approvalRequest = buildWorkorderRuntimeRequest({
      ...runtimeRequest,
      context: {
        ...runtimeRequest.context,
        create_approval_request: true,
      },
      request_source: 'hoya_ui.rca_approval_request',
    }, () => 'approval-trace');

    expect(defaultRequest.context).toEqual({
      filters: { status: 'open' },
      workspace_state: {
        selected_workorder_id: 'WO-100',
        selected_machine_id: 'MACHINE-7A',
      },
    });
    expect(defaultRequest.context).not.toHaveProperty('create_approval_request');
    expect(approvalRequest.context).toMatchObject({
      filters: { status: 'open' },
      create_approval_request: true,
      workspace_state: {
        selected_workorder_id: 'WO-100',
        selected_machine_id: 'MACHINE-7A',
      },
    });
    expect(approvalRequest.request_source).toBe('hoya_ui.rca_approval_request');
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

  it('extracts top-level session_id from runtime responses', () => {
    const parsed = parseWorkorderRuntimeResponse({
      ...runtimeWorkorderAgentResponse,
      session_id: ' session-workorder-026b ',
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.session_id).toBe('session-workorder-026b');
  });

  it('returns parsed session_id from successful runtime requests', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/runtime/workorder-agent',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          ...runtimeWorkorderAgentResponse,
          session_id: 'session-workorder-026b',
        }), { status: 200 }),
      ),
      now: fixedClock(),
    });

    expect(result.status).toBe('success');
    expect(result.status === 'success' ? result.session_id : undefined).toBe('session-workorder-026b');
  });

  it('accepts Agentic Core workspace_payload runtime responses', () => {
    const parsed = parseWorkorderRuntimeResponse(agenticCoreWorkspaceRuntimeResponse, {
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      client_trace_id: 'client-trace-022-r5b',
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.payload).toEqual(agenticCoreWorkspaceRuntimeResponse);
    expect(parsed.diagnostics).toMatchObject({
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      client_trace_id: 'client-trace-022-r5b',
      runtime_trace_id: 'trace-agentic-core-workspace-022',
      payload_version: '1.0',
    });
  });

  it('normalizes workspace_payload payload_version v1 as 1.0', () => {
    const parsed = parseWorkorderRuntimeResponse(agenticCoreWorkspaceRuntimeResponseV1Alias, {
      client_trace_id: 'client-trace-022-r5b',
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.diagnostics).toMatchObject({
      runtime_trace_id: 'trace-agentic-core-workspace-022',
      payload_version: '1.0',
    });
  });

  it('accepts Agentic Core fast path cost_intelligence response envelopes', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(agenticCoreFastPathCostIntelligenceResponse), { status: 200 }),
      ),
      now: fixedClock(),
    });

    expect(result.status).toBe('success');
    expect(result.source).toBe('runtime');
    expect(result.status === 'success' ? result.payload : null).toEqual(agenticCoreFastPathCostIntelligenceResponse);
    expect(result.diagnostics).toMatchObject({
      runtime_trace_id: 'trace-fast-path-cost-intelligence-023',
      payload_version: '1.0',
    });
    expect(result.diagnostics.error_code).toBeUndefined();
  });

  it('accepts SPEC-027H additive runtime envelopes without legacy widgets', () => {
    const parsed = parseWorkorderRuntimeResponse(spec027hStructuredTriageOnlyRuntimeResponse, {
      client_trace_id: 'client-trace-spec027h-triage',
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.payload).toEqual(spec027hStructuredTriageOnlyRuntimeResponse);
    expect(parsed.diagnostics).toMatchObject({
      runtime_trace_id: 'trace-spec027h-structured-triage-only',
      payload_version: '2.7',
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

  it('handles successful Agentic Core workspace_payload envelopes', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify(agenticCoreWorkspaceRuntimeResponse), { status: 200 })),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'success',
      source: 'runtime',
      requestedAt: '2026-06-05T00:00:00.000Z',
      completedAt: '2026-06-05T00:00:01.000Z',
    });
    expect(result.status === 'success' ? result.payload : null).toEqual(agenticCoreWorkspaceRuntimeResponse);
    expect(result.diagnostics).toMatchObject({
      endpoint_mode: 'base_url_path',
      endpoint_url: 'https://agentic-core.example.com/api/workorder-agent/runtime',
      runtime_trace_id: 'trace-agentic-core-workspace-022',
      payload_version: '1.0',
    });
    expect(result.diagnostics.error_code).toBeUndefined();
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
      endpoint_path: '/api/runtime/workorder-agent',
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

  it('handles 400 responses as rejected runtime requests with response body diagnostics', async () => {
    const rejectedBody = {
      detail: [
        {
          loc: ['body', 'selected_workorder_id'],
          msg: 'extra fields not permitted',
          type: 'value_error.extra',
        },
      ],
    };
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/runtime/workorder-agent',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify(rejectedBody), { status: 400, statusText: 'Bad Request' }),
      ),
      now: fixedClock(),
    });

    expect(result).toMatchObject({
      status: 'error',
      source: 'fallback',
      errorReason: 'Runtime request rejected',
    });
    expect(result.diagnostics).toMatchObject({
      endpoint_path: '/api/runtime/workorder-agent',
      request_url: 'https://agentic-core.example.com/api/runtime/workorder-agent',
      request_payload: JSON.stringify(buildWorkorderRuntimeRequest(runtimeRequest), null, 2),
      error_code: 'runtime_request_rejected',
      response_status: 400,
      http_status: 400,
      response_body: JSON.stringify(rejectedBody),
    });
    expect(buildWorkorderWidgetPreviewModel(result.payload).diagnostics.runtimeDiagnostics[0]).toMatchObject({
      code: 'runtime_request_rejected',
      message: 'Runtime request rejected',
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
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body))).toEqual({
      query: 'Summarize current maintenance blockers',
      workorder_no: 'WO-SMOKE-100',
      surface_id: 'maintenance.workorders',
      request_source: 'hoya_ui.contract_smoke',
      context: {
        include_narrative: true,
        include_cost_estimate: true,
        demo_mode: 'cost_intelligence',
        workspace_state: {
          selected_workorder_id: 'WO-SMOKE-100',
          selected_machine_id: 'POLISHING-7A',
        },
        filters: { status: 'open' },
      },
    });
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

  it('fast path cost_intelligence responses normalize through the existing widget adapter with warnings', () => {
    const model = buildWorkorderWidgetPreviewModel(agenticCoreFastPathCostIntelligenceResponse);

    expect(model.safeToRender).toBe(true);
    expect(model.diagnostics.traceMetadata).toMatchObject({
      trace_id: 'trace-fast-path-cost-intelligence-023',
      agent_id: 'workorder-agent',
      run_id: 'run-fast-path-cost-intelligence-023',
      payload_version: 'v1',
    });
    expect(model.diagnostics.runtimeDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'fast_path',
          section: 'cost_intelligence',
        }),
        expect.objectContaining({
          code: 'cost_estimate_context_mismatch',
          section: 'cost_estimate',
          severity: 'warning',
        }),
      ]),
    );
    expect(model.widgets.some((widget) => widget.id === 'fast-path-cost-summary')).toBe(true);
  });

  it('Agentic Core workspace_payload responses normalize through the existing widget adapter', () => {
    const model = buildWorkorderWidgetPreviewModel(agenticCoreWorkspaceRuntimeResponse);

    expect(model.safeToRender).toBe(true);
    expect(model.diagnostics.traceMetadata).toMatchObject({
      trace_id: 'trace-agentic-core-workspace-022',
      agent_id: 'workorder-agent',
      payload_version: '1.0',
    });
    expect(model.diagnostics.lastPayloadType).toBe('workorder_insight');
    expect(model.diagnostics.intent).toBe('workorder_insight');
    expect(model.widgets.some((widget) => widget.id === 'maintenance.workorders.adapter.summary')).toBe(true);
    expect(model.widgets.some((widget) => widget.id === 'maintenance.workorders.adapter.insights')).toBe(true);
    expect(model.widgets.some((widget) => widget.id === 'maintenance.workorders.adapter.evidence')).toBe(true);
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
