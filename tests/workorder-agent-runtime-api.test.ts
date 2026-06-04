import { describe, expect, it, vi } from 'vitest';

import {
  buildWorkorderAgentRuntimeUrl,
  requestWorkorderAgentRuntime,
} from '../src/services/workorderAgentRuntimeApi';
import {
  buildWorkorderWidgetPreviewModel,
} from '../src/ui-registry';
import {
  runtimeWorkorderAgentResponse,
  unsafeRuntimeWorkorderAgentResponse,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

const runtimeRequest = {
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

  it('builds the correct passive runtime request', async () => {
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
  });

  it('handles runtime HTTP errors as diagnostics-only fallback payloads', async () => {
    const result = await requestWorkorderAgentRuntime(runtimeRequest, {
      baseUrl: 'https://agentic-core.example.com',
      path: '/api/workorder-agent/runtime',
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'agent unavailable' } }), { status: 503, statusText: 'Service Unavailable' }),
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
    expect(model.diagnostics.runtimeDiagnostics.map((diagnostic) => diagnostic.code)).toContain('runtime_error');
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
