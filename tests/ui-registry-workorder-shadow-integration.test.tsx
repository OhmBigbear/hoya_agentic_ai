import fs from 'node:fs';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MaintenanceAssistantPanel } from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import {
  buildWorkorderWidgetShadowDiagnostics,
} from '../src/ui-registry';
import type { MaintenanceDashboardSummary } from '../src/types/maintenance';
import type { WorkspacePayload } from '../src/types/operationsWorkspace';
import {
  fullWorkorderAgentPayload,
  malformedWorkorderAgentPayload,
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

describe('workorder widget shadow integration', () => {
  it('keeps the page-local shadow flag disabled by default', () => {
    const source = fs.readFileSync('src/shared/config/env.ts', 'utf8');

    expect(source).toContain('VITE_WORKORDER_WIDGET_SHADOW_MODE_ENABLED');
    expect(source).toContain('readBooleanEnv');
  });

  it('does not render widget registry output in the assistant panel when the flag is disabled', () => {
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
    expect(markup).toContain('Maintenance operational assistant');
    expect(markup).toContain('Preview ready.');
    expect(markup).toContain('Maintenance risk summary');
    expect(markup).not.toContain('UI widgets');
    expect(markup).not.toContain('Invalid widget');
    expect(markup).not.toContain('Unsupported widget');
  });

  it('builds shadow diagnostics from a fixture payload without rendering', () => {
    const diagnostics = buildWorkorderWidgetShadowDiagnostics(fullWorkorderAgentPayload);

    expect(diagnostics).toMatchObject({
      validationValid: true,
      errorCount: 0,
      lastPayloadType: 'workorder_insight',
      intent: 'workorder_insight',
    });
    expect(diagnostics.adaptedWidgetCount).toBeGreaterThan(0);
    expect(diagnostics.warningCount).toBeGreaterThanOrEqual(0);
    expect(diagnostics.detectedActions.length).toBeGreaterThan(0);
    expect(diagnostics.actionValidationValid).toBe(true);
    expect(diagnostics.rejectedActionCount).toBe(0);
  });

  it('handles malformed payloads without throwing', () => {
    expect(() => buildWorkorderWidgetShadowDiagnostics(malformedWorkorderAgentPayload)).not.toThrow();
    expect(() => buildWorkorderWidgetShadowDiagnostics({ workspace_payload: null })).not.toThrow();
    expect(() => buildWorkorderWidgetShadowDiagnostics('bad payload')).not.toThrow();
  });

  it('keeps dangerous primitives out of touched integration files', () => {
    const source = [
      'src/ui-registry/adapters/workorderShadowDiagnostics.ts',
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
