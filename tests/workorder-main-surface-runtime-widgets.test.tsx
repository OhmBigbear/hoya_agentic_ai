import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  buildWorkorderRuntimeWidgetWorkspaceState,
  WorkorderRuntimeMainSurface,
  handleMainSurfaceReadonlyAction,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  runtimeWorkorderAgentResponse,
  unknownWidgetRuntimeWorkorderAgentResponse,
  unsafeRuntimeWorkorderAgentResponse,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

describe('workorder runtime main surface widgets', () => {
  it('publishes a Copilot runtime payload into workspace widget state', () => {
    const workspaceState = buildWorkorderRuntimeWidgetWorkspaceState({
      payload: runtimeWorkorderAgentResponse,
      source: 'copilot',
      completedAt: '2026-06-05T02:20:01.000Z',
      runtimeTraceId: 'trace-runtime-workorder-021',
      clientTraceId: 'client-trace-main-surface',
      payloadVersion: '2.0',
    });

    expect(workspaceState).toMatchObject({
      status: 'ready',
      source: 'copilot',
      payloadVersion: '2.0',
      payloadType: 'workorder_agent_response',
      intent: 'workorder_insight',
      rejectedWidgetCount: 0,
      diagnostics: {
        validationStatus: 'valid',
        traceId: 'trace-runtime-workorder-021',
        agentId: 'maint-workorder-agent',
        runId: 'run-runtime-021-b07',
        runtimeTraceId: 'trace-runtime-workorder-021',
        clientTraceId: 'client-trace-main-surface',
        payloadVersion: '2.0',
      },
    });
    expect(workspaceState.widgets.length).toBeGreaterThan(0);
    expect(workspaceState.widgetTypes).toEqual([
      'workorder_summary',
      'workorder_table',
      'workorder_status_insight',
    ]);
  });

  it('renders Copilot-published workspace widgets in the main Workorder Tracking surface', () => {
    const workspaceState = buildWorkorderRuntimeWidgetWorkspaceState({
      payload: runtimeWorkorderAgentResponse,
      source: 'copilot',
      runtimeTraceId: 'trace-runtime-workorder-021',
      payloadVersion: '2.0',
    });
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        workspaceState={workspaceState}
        runtimeStatus={{
          status: 'idle',
          source: 'fixture',
        }}
      />,
    );

    expect(markup).toContain('data-testid="workorder-runtime-main-widgets"');
    expect(markup).toContain('copilot');
    expect(markup).toContain('WO-RUNTIME-100');
    expect(markup).toContain('trace_id trace-runtime-workorder-021');
    expect(markup).toContain('agent_id maint-workorder-agent');
    expect(markup).not.toContain('Developer Widget Registry Preview');
  });

  it('renders valid runtime widgets in the main Workorder Tracking surface', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: runtimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup).toContain('data-testid="workorder-runtime-main-surface"');
    expect(markup).toContain('data-testid="workorder-runtime-main-widgets"');
    expect(markup).toContain('Workorder Intelligence Workspace');
    expect(markup).toContain('data-testid="workorder-runtime-executive-summary"');
    expect(markup).toContain('Total Matching Work Orders');
    expect(markup).toContain('Open Work Orders');
    expect(markup).toContain('Risk Candidates');
    expect(markup).toContain('Confidence');
    expect(markup).toContain('data-testid="workorder-runtime-operational-insights"');
    expect(markup).toContain('Runtime workorders');
    expect(markup).toContain('data-testid="workorder-runtime-workorder-analysis"');
    expect(markup).toContain('data-testid="workorder-runtime-evidence-summary"');
    expect(markup).toContain('WO-RUNTIME-100');
    expect(markup).toContain('Open corrective concentration');
    expect(markup).toContain('Recommendation');
    expect(markup).toContain('data-testid="workorder-runtime-readonly-recommendations"');
    expect(markup).toContain('data-testid="workorder-runtime-readonly-action-card"');
    expect(markup).toContain('Developer diagnostics');
  });

  it('does not make the Copilot diagnostics preview the only runtime widget renderer', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: runtimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup).toContain('Workorder Intelligence Workspace');
    expect(markup).not.toContain('Developer Widget Registry Preview');
    expect(markup).not.toContain('data-testid="developer-widget-registry-preview"');
  });

  it('keeps diagnostics accessible without making them the primary workspace content', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: runtimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup.indexOf('Executive Summary')).toBeLessThan(markup.indexOf('Developer diagnostics'));
    expect(markup).toContain('data-testid="workorder-runtime-main-diagnostics"');
    expect(markup).toContain('trace_id trace-runtime-workorder-021');
    expect(markup).toContain('runtime_diagnostics 1');
  });

  it('uses responsive grid classes for the operator workspace while Copilot remains available', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: runtimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup).toContain('sm:grid-cols-2 xl:grid-cols-4');
    expect(markup).toContain('2xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]');
    expect(markup).toContain('xl:grid-cols-3');
    expect(markup).not.toContain('AI Operations Copilot');
  });

  it('keeps main-surface runtime action handling read-only', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = handleMainSurfaceReadonlyAction({
      widgetId: 'runtime-readonly-actions',
      actionId: 'view_workorder',
      targetId: 'maintenance.workorders.actions.view_workorder',
      metadata: {
        target: 'WO-RUNTIME-100',
        executionPolicy: {
          executionMode: 'readonly_noop',
          mutationAllowed: false,
        },
      },
    });

    expect(result.status).toBe('navigation_ready');
    expect(result.accepted).toBe(true);
    expect(result.backendMutationCalled).toBe(false);
    expect(result.dataStateChanged).toBe(false);
    expect(result.executionPolicy).toMatchObject({
      executionMode: 'navigation_only',
      mutationAllowed: false,
      requiresApproval: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fetchSpy.mock.calls.some(([, init]) => {
      const method = typeof init === 'object' && init ? String(init.method ?? 'GET').toUpperCase() : 'GET';
      return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    })).toBe(false);
    fetchSpy.mockRestore();

    const unsafeMarkup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: unsafeRuntimeWorkorderAgentResponse,
        }}
      />,
    );
    expect(unsafeMarkup).not.toContain('Delete WO-RUNTIME-100');
    expect(unsafeMarkup).not.toContain('Execute machine action');
  });

  it('falls back safely for invalid or unknown runtime widget payloads in the main surface', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: unknownWidgetRuntimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup).toContain('data-testid="workorder-runtime-main-surface"');
    expect(markup).toContain('data-testid="workorder-runtime-main-fallback"');
    expect(markup).toContain('runtime widget payload');
    expect(markup).toContain('WO-RUNTIME-100');
    expect(markup).not.toContain('Unsafe mutation form');
    expect(markup).not.toContain('Bad version');
    expect(markup).not.toContain('Unsupported widget');
    expect(markup).not.toContain('Invalid widget');
  });

  it('accepts workorder_insight as a runtime widget_type alias', () => {
    const workspaceState = buildWorkorderRuntimeWidgetWorkspaceState({
      payload: {
        ...runtimeWorkorderAgentResponse,
        widgets: [{
          id: 'runtime-insight-alias',
          payload_version: '1.0',
          widget_type: 'workorder_insight',
          title: 'Runtime insight alias',
          payload: {
            insights: [{
              id: 'runtime-insight-alias-item',
              title: 'Alias insight rendered',
              summary: 'The emitted workorder_insight widget type maps safely to an insight list.',
              severity: 'warning',
            }],
          },
        }],
      },
      source: 'runtime',
    });
    const markup = renderToStaticMarkup(<WorkorderRuntimeMainSurface workspaceState={workspaceState} />);

    expect(workspaceState.status).toBe('ready');
    expect(workspaceState.widgetTypes).toEqual(['workorder_insight']);
    expect(markup).toContain('Operational Insights');
    expect(markup).toContain('Alias insight rendered');
    expect(markup).not.toContain('Unsupported widget');
  });

  it('does not crash when an invalid payload reaches the main surface', () => {
    const workspaceState = buildWorkorderRuntimeWidgetWorkspaceState({
      payload: 'not a runtime payload',
      source: 'runtime',
    });
    const markup = renderToStaticMarkup(<WorkorderRuntimeMainSurface workspaceState={workspaceState} />);

    expect(workspaceState.status).toBe('invalid');
    expect(markup).toContain('data-testid="workorder-runtime-main-fallback"');
    expect(markup).toContain('Runtime payload needs review');
    expect(markup).toContain('Runtime data was received');
    expect(markup).toContain('Developer diagnostics');
    expect(markup).not.toContain('data-testid="workorder-runtime-main-widgets"');
  });
});
