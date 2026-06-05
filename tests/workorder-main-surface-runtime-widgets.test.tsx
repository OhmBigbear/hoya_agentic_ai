import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  WorkorderRuntimeMainSurface,
  handleMainSurfaceReadonlyAction,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  runtimeWorkorderAgentResponse,
  unknownWidgetRuntimeWorkorderAgentResponse,
  unsafeRuntimeWorkorderAgentResponse,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

describe('workorder runtime main surface widgets', () => {
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
    expect(markup).toContain('Runtime summary');
    expect(markup).toContain('Open runtime workorders');
    expect(markup).toContain('Runtime workorders');
    expect(markup).toContain('WO-RUNTIME-100');
    expect(markup).toContain('Runtime status insight');
    expect(markup).toContain('Open corrective concentration');
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

    expect(markup).toContain('Workorder Tracking Runtime View');
    expect(markup).not.toContain('Developer Widget Registry Preview');
    expect(markup).not.toContain('data-testid="developer-widget-registry-preview"');
  });

  it('keeps main-surface runtime action handling read-only', () => {
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
});
