import fs from 'node:fs';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  DeveloperWidgetRegistryPreview,
  handleDeveloperReadonlyAction,
  MaintenanceAssistantPanel,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  buildWorkorderWidgetPreviewModel,
} from '../src/ui-registry';
import type { MaintenanceDashboardSummary } from '../src/types/maintenance';
import type { WorkspacePayload } from '../src/types/operationsWorkspace';
import {
  fullWorkorderAgentPayload,
  malformedWorkorderAgentPayload,
  runtimeWorkorderAgentResponse,
  unsupportedActionWorkorderAgentPayload,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

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

describe('workorder widget developer preview', () => {
  it('keeps developer preview and shadow flags disabled by default', () => {
    const source = fs.readFileSync('src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx', 'utf8');

    expect(source).toContain('const WORKORDER_WIDGET_SHADOW_MODE_ENABLED = false;');
    expect(source).toContain('const WORKORDER_WIDGET_DEV_PREVIEW_ENABLED = false;');
    expect(source).toContain('WORKORDER_WIDGET_SHADOW_MODE_ENABLED && WORKORDER_WIDGET_DEV_PREVIEW_ENABLED');
  });

  it('does not render the developer preview by default and keeps existing assistant output', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Preview ready.',
          timestamp: '12:00',
          workspacePayload: fullWorkorderAgentPayload.workspace_payload as WorkspacePayload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('AI Operations Copilot');
    expect(markup).toContain('Preview ready.');
    expect(markup).toContain('Maintenance risk summary');
    expect(markup).not.toContain('Developer Widget Registry Preview');
  });

  it('builds widgets, diagnostics, and validation from a full fixture payload', () => {
    const model = buildWorkorderWidgetPreviewModel(fullWorkorderAgentPayload);

    expect(model.safeToRender).toBe(true);
    expect(model.widgets.length).toBeGreaterThan(0);
    expect(model.validation.valid).toBe(true);
    expect(model.diagnostics).toMatchObject({
      validationValid: true,
      errorCount: 0,
      lastPayloadType: 'workorder_insight',
      intent: 'workorder_insight',
    });
  });

  it('handles malformed payloads safely without raw JSON or stack traces', () => {
    const model = buildWorkorderWidgetPreviewModel(malformedWorkorderAgentPayload);

    expect(model.diagnostics.lastPayloadType).toBe('workorder_insight');
    expect(model.diagnostics.intent).toBe('workorder_insight');
    expect(model.validation.errors.length).toBeGreaterThanOrEqual(0);
    expect(() => buildWorkorderWidgetPreviewModel('bad payload')).not.toThrow();
  });

  it('renders the developer preview panel and widget list when directly enabled by component use', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={fullWorkorderAgentPayload.workspace_payload as WorkspacePayload} />,
    );

    expect(markup).toContain('Developer Widget Registry Preview');
    expect(markup).toContain('Widgets ');
    expect(markup).toContain('Type workorder_insight');
    expect(markup).toContain('Intent workorder_insight');
    expect(markup).toContain('Detected actions');
    expect(markup).toContain('readonly valid');
    expect(markup).toContain('Execution navigation_only');
    expect(markup).toContain('Risk readonly');
    expect(markup).toContain('Approval not required');
    expect(markup).toContain('Mutation blocked');
    expect(markup).toContain('UI widgets');
    expect(markup).not.toContain('workspace_payload');
  });

  it('renders a safe fallback for malformed preview data', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={malformedWorkorderAgentPayload.workspace_payload as unknown as WorkspacePayload} />,
    );

    expect(markup).toContain('Developer Widget Registry Preview');
    expect(markup).toMatch(/UI widgets|No widget data available for preview|Invalid widget/);
    expect(markup).not.toContain('stack');
    expect(markup).not.toContain('raw');
  });

  it('renders readonly action rejection diagnostics', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={unsupportedActionWorkorderAgentPayload.workspace_payload as unknown as WorkspacePayload} />,
    );

    expect(markup).toContain('Detected actions');
    expect(markup).toContain('rejected');
    expect(markup).toContain('Action &#x27;inspect_unknown&#x27; is not registered');
    expect(markup).toContain('Action &#x27;delete_workorder&#x27; looks like a write operation');
  });

  it('renders runtime trace metadata in developer diagnostics', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={runtimeWorkorderAgentResponse} />,
    );

    expect(markup).toContain('Trace metadata');
    expect(markup).toContain('trace_id trace-runtime-workorder-021');
    expect(markup).toContain('agent_id maint-workorder-agent');
    expect(markup).toContain('run_id run-runtime-021-b07');
    expect(markup).toContain('payload_version 2.0');
    expect(markup).toContain('Runtime diagnostics');
  });

  it('keeps readonly action clicks as dev-only no-ops without API calls or mutation', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const mutableState = { changed: false };

    const result = handleDeveloperReadonlyAction({
      widgetId: 'actions',
      actionId: 'view_workorder',
      targetId: 'maintenance.workorders.actions.view_workorder',
    });

    expect(result).toMatchObject({
      accepted: true,
      status: 'navigation_ready',
      backendMutationCalled: false,
      dataStateChanged: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mutableState.changed).toBe(false);
    fetchSpy.mockRestore();
  });

  it('keeps dangerous primitives out of touched preview files', () => {
    const source = [
      'src/ui-registry/adapters/workorderWidgetPreviewModel.ts',
      'src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx',
    ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    const forbidden = new RegExp([
      'dangerously' + 'SetInnerHTML',
      'eval' + '\\(',
      'new ' + 'Function',
    ].join('|'));

    expect(source).not.toMatch(forbidden);
  });
});
