import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  buildApprovalReviewHref,
  buildWorkorderRuntimeWidgetWorkspaceState,
  getWorkorderRcaApprovalMetadata,
  RuntimeApprovalRequestButton,
  WorkorderRuntimeMainSurface,
  handleMainSurfaceReadonlyAction,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  agenticCoreWorkspaceRuntimeResponse,
  agenticCoreWorkspaceRuntimeResponseWithApproval,
  approvalRuntimeWorkorderAgentResponse,
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

  it('renders Agentic Core workspace_payload responses without requiring cards or charts', () => {
    const workspaceState = buildWorkorderRuntimeWidgetWorkspaceState({
      payload: agenticCoreWorkspaceRuntimeResponse,
      source: 'runtime',
      runtimeTraceId: 'trace-agentic-core-workspace-022',
      clientTraceId: 'client-trace-022-r5b',
      payloadVersion: '1.0',
    });
    const markup = renderToStaticMarkup(<WorkorderRuntimeMainSurface workspaceState={workspaceState} />);

    expect(workspaceState).toMatchObject({
      status: 'ready',
      payloadVersion: '1.0',
      payloadType: 'workorder_insight',
      intent: 'workorder_insight',
      rejectedWidgetCount: 0,
      diagnostics: {
        validationStatus: 'valid',
        traceId: 'trace-agentic-core-workspace-022',
        agentId: 'workorder-agent',
        clientTraceId: 'client-trace-022-r5b',
        payloadVersion: '1.0',
      },
    });
    expect(markup).toContain('data-testid="workorder-runtime-main-widgets"');
    expect(markup).toContain('Runtime workorder operating picture');
    expect(markup).toContain('Review POLISHING-7A corrective queue');
    expect(markup).toContain('Inspect the open corrective queue before any CMMS write-back.');
    expect(markup).toContain('Agentic Core workorder query');
    expect(markup).toContain('Developer diagnostics');
    expect(markup).not.toContain('Runtime payload needs review');
    expect(markup).not.toContain('Runtime response did not match the Workorder Agent payload envelope');
    expect(markup).not.toContain('Runtime widgets are unavailable');
  });

  it('renders returned RCA approval metadata with the safety boundary and Approval Inbox route', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: approvalRuntimeWorkorderAgentResponse,
        }}
      />,
    );

    expect(markup).toContain('data-testid="workorder-runtime-approval-panel"');
    expect(markup).toContain('Approval Required');
    expect(markup).toContain('Approval Type: Maintenance RCA');
    expect(markup).toContain('task-rca-100');
    expect(markup).toContain('approval-rca-100');
    expect(markup).toContain('pending');
    expect(markup).toContain('Human review required before promoting RCA advisory output.');
    expect(markup).toContain('href="http://localhost:8100/approval-inbox?task_id=task-rca-100"');
    expect(markup).toContain('Open Approval Inbox');
    expect(markup).toContain('data-testid="workorder-runtime-approval-safety-boundary"');
    expect(markup).toContain('Advisory only');
    expect(markup).toContain('No final RCA');
    expect(markup).toContain('No corrective action execution');
    expect(markup).toContain('No preventive action execution');
    expect(markup).toContain('No CMMS write-back');
    expect(markup).toContain('No workorder creation');
    expect(markup).not.toContain('&gt;Approve&lt;');
    expect(markup).not.toContain('&gt;Reject&lt;');
    expect(markup).not.toContain('/approve');
    expect(markup).not.toContain('/reject');
  });

  it('resolves relative approval review routes against Agentic Core without creating decision links', () => {
    expect(buildApprovalReviewHref('/approval-inbox?task_id=task-1', 'https://agentic-core.example.com')).toBe(
      'https://agentic-core.example.com/approval-inbox?task_id=task-1',
    );
    expect(buildApprovalReviewHref('https://control.example.com/approval-inbox?task_id=task-1', 'https://ignored.example.com')).toBe(
      'https://control.example.com/approval-inbox?task_id=task-1',
    );
    expect(buildApprovalReviewHref(undefined, 'https://agentic-core.example.com')).toBeNull();
  });

  it('invokes the explicit approval request action separately from normal runtime refresh', () => {
    const onRuntimeFetch = vi.fn(async () => {});
    const onApprovalRequest = vi.fn(async () => {});
    const element = RuntimeApprovalRequestButton({ isLoading: false, onApprovalRequest });
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: runtimeWorkorderAgentResponse,
        }}
        onRuntimeFetch={onRuntimeFetch}
        onApprovalRequest={onApprovalRequest}
      />,
    );
    const approvalButton = findElement(element, (candidate) => elementText(candidate).includes('Request Human Approval'));

    expect(markup).toContain('Request Human Approval');
    expect(markup).toContain('Refresh runtime');
    expect(approvalButton?.props?.onClick).toBeTypeOf('function');
    approvalButton?.props?.onClick();
    expect(onApprovalRequest).toHaveBeenCalledTimes(1);
    expect(onRuntimeFetch).not.toHaveBeenCalled();
  });

  it('normalizes optional approval metadata from runtime payloads', () => {
    expect(getWorkorderRcaApprovalMetadata(approvalRuntimeWorkorderAgentResponse)).toEqual({
      approvalRequired: true,
      approvalType: 'maintenance_rca',
      approvalId: 'approval-rca-100',
      taskId: 'task-rca-100',
      status: 'pending',
      reason: 'Human review required before promoting RCA advisory output.',
      reviewRoute: '/approval-inbox?task_id=task-rca-100',
    });
    expect(getWorkorderRcaApprovalMetadata(runtimeWorkorderAgentResponse)).toBeNull();
  });

  it('preserves approval metadata on Agentic Core workspace_payload responses', () => {
    const markup = renderToStaticMarkup(
      <WorkorderRuntimeMainSurface
        runtimeStatus={{
          status: 'success',
          source: 'runtime',
          payload: agenticCoreWorkspaceRuntimeResponseWithApproval,
        }}
      />,
    );

    expect(getWorkorderRcaApprovalMetadata(agenticCoreWorkspaceRuntimeResponseWithApproval)).toMatchObject({
      approvalRequired: true,
      approvalType: 'maintenance_rca',
      approvalId: 'approval-agentic-core-022',
      taskId: 'task-agentic-core-022',
      reviewRoute: '/approval-inbox?task_id=task-agentic-core-022',
    });
    expect(markup).toContain('data-testid="workorder-runtime-approval-panel"');
    expect(markup).toContain('task-agentic-core-022');
    expect(markup).toContain('Open Approval Inbox');
    expect(markup).not.toContain('&gt;Approve&lt;');
    expect(markup).not.toContain('&gt;Reject&lt;');
    expect(markup).not.toContain('/approve');
    expect(markup).not.toContain('/reject');
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

function findElement(
  node: unknown,
  predicate: (element: React.ReactElement) => boolean,
): React.ReactElement | null {
  if (!React.isValidElement(node)) {
    return null;
  }

  if (predicate(node)) {
    return node;
  }

  const children = React.Children.toArray(node.props.children);
  for (const child of children) {
    const found = findElement(child, predicate);
    if (found) {
      return found;
    }
  }

  return null;
}

function elementText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (!React.isValidElement(node)) {
    return '';
  }
  return React.Children.toArray(node.props.children).map(elementText).join(' ');
}
