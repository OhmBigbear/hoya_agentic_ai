import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MaintenanceDashboardSummary } from '../src/types/maintenance';

const summary: MaintenanceDashboardSummary = {
  open_workorder_count: 0,
  overdue_workorder_count: 0,
  on_hold_workorder_count: 0,
  completed_workorder_count: 0,
  total_downtime_hours: 0,
  repeat_failure_candidate_count: 0,
  stock_risk_item_count: 0,
  mtbf_mttr: [],
  top_risk_machines: [],
  top_hold_reasons: [],
};

describe('workorder runtime preview wiring', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('renders idle diagnostics inside the default-collapsed developer details area when preview flags are enabled', async () => {
    vi.stubEnv('VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED', 'true');
    vi.stubEnv('VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED', 'true');
    vi.resetModules();

    const page = await import('../src/pages/maintenance/MaintenanceWorkorderTrackingPage');
    const markup = renderToStaticMarkup(
      <page.MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
        runtimeFetchDiagnostics={{
          status: 'idle',
          source: 'fixture',
        }}
        onRuntimeFetch={async () => {}}
      />,
    );

    expect(markup).toContain('Diagnostics / Developer details');
    expect(markup).toContain('data-testid="maintenance-copilot-diagnostics"');
    expect(markup).not.toMatch(/<details[^>]*data-testid="maintenance-copilot-diagnostics"[^>]*open/);
    expect(markup).toContain('data-testid="runtime-preview-diagnostics"');
    expect(markup).toContain('Runtime fetch');
    expect(markup).toContain('status idle source fixture');
    expect(markup).toContain('Fetch runtime');
    expect(markup).not.toContain('Developer Widget Registry Preview');
  });

  it('does not render standalone diagnostics when only the runtime flag is enabled', async () => {
    vi.stubEnv('VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED', 'true');
    vi.stubEnv('VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED', 'false');
    vi.resetModules();

    const page = await import('../src/pages/maintenance/MaintenanceWorkorderTrackingPage');
    const markup = renderToStaticMarkup(
      <page.MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
        runtimeFetchDiagnostics={{
          status: 'idle',
          source: 'fixture',
        }}
        onRuntimeFetch={async () => {}}
      />,
    );

    expect(markup).not.toContain('data-testid="runtime-preview-diagnostics"');
    expect(markup).not.toContain('Fetch runtime');
  });

  it('invokes the supplied runtime fetch handler from the diagnostics button', async () => {
    vi.resetModules();
    const page = await import('../src/pages/maintenance/MaintenanceWorkorderTrackingPage');
    const onRuntimeFetch = vi.fn(async () => {});
    const element = page.RuntimeFetchDiagnosticsPanel({
      source: 'fixture',
      runtimeStatus: {
        status: 'idle',
        source: 'fixture',
      },
      isRuntimeLoading: false,
      onRuntimeFetch,
    });
    const button = findElement(element, (candidate) => candidate.props?.children === 'Fetch runtime');

    expect(button?.props?.onClick).toBeTypeOf('function');
    button?.props?.onClick();
    expect(onRuntimeFetch).toHaveBeenCalledTimes(1);
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
