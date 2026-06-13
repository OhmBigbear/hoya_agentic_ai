import fs from 'node:fs';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  renderUiWidget,
  renderUiWidgetList,
} from '../src/ui-registry';
import type { UiWidget } from '../src/ui-registry';

const regions = maintenanceWorkordersRegionIds;
const actionTargets = maintenanceWorkordersActionTargetIds;

describe('ui registry widget renderer', () => {
  it('renders kpi_card', () => {
    const markup = render(widget({
      id: 'open-workorders',
      type: 'kpi_card',
      regionId: regions[0],
      title: 'Open workorders',
      value: 12,
      unit: 'orders',
      trend: 'up',
    }));

    expect(markup).toContain('Open workorders');
    expect(markup).toContain('12');
    expect(markup).toContain('orders');
    expect(markup).toContain('Trend: up');
  });

  it('renders summary_card', () => {
    const markup = render(widget({
      id: 'summary',
      type: 'summary_card',
      regionId: regions[0],
      title: 'Workorder summary',
      summary: 'Current maintenance workload',
      items: [{ label: 'Overdue', value: 3 }],
    }));

    expect(markup).toContain('Workorder summary');
    expect(markup).toContain('Current maintenance workload');
    expect(markup).toContain('Overdue');
    expect(markup).toContain('3');
  });

  it('renders narrative_panel as a Maintenance Assessment with expandable detail sections', () => {
    const markup = render(widget({
      id: 'narrative',
      type: 'narrative_panel',
      regionId: regions[6],
      title: 'Agent narrative',
      executiveSummary: 'The open corrective queue is concentrated on POLISHING-7A.',
      keyFindings: ['Two high-priority workorders are open.'],
      businessImpact: 'The line has elevated downtime exposure.',
      recommendedNextSteps: ['Review WO-RUNTIME-100 with the maintenance lead.'],
      risks: ['Downtime could extend into the next shift.'],
      evidence: ['runtime workorder query'],
      reasoning: ['The same equipment appears in workorder and spare-part signals.'],
      confidence: 'high',
    }));

    expect(markup).toContain('data-testid="maintenance-assessment"');
    expect(markup).toContain('Maintenance Assessment');
    expect(markup).toContain('Risk Level high');
    expect(markup).toContain('Confidence high');
    expect(markup).toContain('Business Impact assessed');
    expect(markup).toContain('Agent narrative');
    expect(markup).toContain('Executive Summary');
    expect(markup).toContain('Key Findings');
    expect(markup).toContain('Business Impact');
    expect(markup).toContain('Recommended Next Steps');
    expect(markup).toContain('data-testid="maintenance-assessment-executive-summary"');
    expect(markup).toContain('data-testid="maintenance-assessment-key-findings"');
    expect(markup).toContain('data-testid="maintenance-assessment-next-steps"');
    expect(markup).toContain('data-testid="maintenance-assessment-secondary-detail"');
    expect(markup).not.toMatch(/data-testid="maintenance-assessment-secondary-detail"[^>]*open/);
    expect(markup).toContain('Risks');
    expect(markup).toContain('Reasoning');
    expect(markup).toContain('Evidence Sources (1)');
    expect(markup).toContain('View Evidence');
    expect(markup).not.toMatch(/data-testid="maintenance-assessment-evidence"[^>]*open/);
  });

  it('renders narrative_panel when optional sections are missing', () => {
    const markup = render(widget({
      id: 'narrative-partial',
      type: 'narrative_panel',
      regionId: regions[6],
      title: 'Agent narrative',
      executiveSummary: 'Only summary text is available.',
    }));

    expect(markup).toContain('Only summary text is available.');
    expect(markup).not.toContain('Additional narrative detail');
    expect(markup).not.toContain('Key Findings');
  });

  it('renders data_table', () => {
    const markup = render(widget({
      id: 'workorder-table',
      type: 'data_table',
      regionId: regions[2],
      title: 'Workorders',
      columns: [
        { id: 'workorder', label: 'Workorder', field: 'workorder_no' },
        { id: 'status', label: 'Status' },
      ],
      rows: [{ workorder_no: 'WO-100', status: 'open' }],
    }));

    expect(markup).toContain('<table>');
    expect(markup).toContain('Workorder');
    expect(markup).toContain('WO-100');
    expect(markup).toContain('open');
  });

  it('renders trend_chart as an accessible textual representation', () => {
    const markup = render(widget({
      id: 'downtime-trend',
      type: 'trend_chart',
      regionId: regions[4],
      title: 'Downtime trend',
      series: [{
        id: 'downtime',
        label: 'Downtime hours',
        points: [
          { x: 'Mon', y: 1.5 },
          { x: 'Tue', y: null },
        ],
      }],
    }));

    expect(markup).toContain('Downtime trend');
    expect(markup).toContain('Trend series');
    expect(markup).toContain('Downtime hours');
    expect(markup).toContain('Mon: 1.5');
    expect(markup).toContain('Tue: N/A');
  });

  it('renders insight_list with warning metadata safely', () => {
    const markup = render(widget({
      id: 'insights',
      type: 'insight_list',
      regionId: regions[5],
      title: 'Insights',
      insights: [{
        id: 'repeat-failure',
        title: 'Repeat failure risk',
        severity: 'warning',
        summary: 'Machine has repeated failures.',
        metadata: {
          confidence: 0.82,
          privateContext: { shouldNotDump: true },
        },
      }],
    }));

    expect(markup).toContain('Repeat failure risk');
    expect(markup).toContain('Severity: warning');
    expect(markup).toContain('confidence');
    expect(markup).toContain('0.82');
    expect(markup).toContain('missing_insight_metadata');
    expect(markup).not.toContain('shouldNotDump');
  });

  it('renders evidence_list as collapsed evidence sources', () => {
    const markup = render(widget({
      id: 'evidence',
      type: 'evidence_list',
      regionId: regions[7],
      title: 'Evidence',
      evidenceRefs: [{
        id: 'ev-1',
        label: 'Workorder WO-100',
        source: 'maintenance_db',
        href: '/workorders/WO-100',
        metadata: { rowCount: 1, raw: { hidden: true } },
      }],
    }));

    expect(markup).toContain('Evidence (1)');
    expect(markup).toContain('View Evidence');
    expect(markup).toContain('data-testid="evidence-sources-detail"');
    expect(markup).not.toMatch(/data-testid="evidence-sources-detail"[^>]*open/);
    expect(markup).toContain('Workorder WO-100');
    expect(markup).toContain('Source: maintenance_db');
    expect(markup).toContain('/workorders/WO-100');
    expect(markup).toContain('rowCount');
    expect(markup).not.toContain('hidden');
  });

  it('renders empty_state', () => {
    const markup = render(widget({
      id: 'empty',
      type: 'empty_state',
      regionId: regions[0],
      title: 'No workorders',
      message: 'No matching workorders.',
    }));

    expect(markup).toContain('No workorders');
    expect(markup).toContain('No matching workorders.');
  });

  it('renders error_state', () => {
    const markup = render(widget({
      id: 'error',
      type: 'error_state',
      regionId: regions[0],
      title: 'Unable to load',
      message: 'Data unavailable.',
      errorCode: 'READ_ONLY_PREVIEW_FAILED',
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Unable to load');
    expect(markup).toContain('READ_ONLY_PREVIEW_FAILED');
  });

  it('renders fallback for unsupported and invalid widgets', () => {
    const unsupportedMarkup = renderToStaticMarkup(renderUiWidget({
      id: 'bad-type',
      type: 'html_widget',
      regionId: regions[0],
    }, { surface: maintenanceWorkordersSurface, fallbackMode: 'verbose' }));
    const invalidMarkup = renderToStaticMarkup(renderUiWidget({
      id: '',
      type: 'kpi_card',
      regionId: regions[0],
    }, { surface: maintenanceWorkordersSurface, fallbackMode: 'verbose' }));

    expect(unsupportedMarkup).toContain('Unsupported widget');
    expect(unsupportedMarkup).toContain('html_widget');
    expect(invalidMarkup).toContain('Invalid widget');
    expect(invalidMarkup).toContain('missing_widget_id');
  });

  it('renders fallback when a widget uses a region outside the provided surface', () => {
    const markup = renderToStaticMarkup(renderUiWidget({
      id: 'wrong-region',
      type: 'kpi_card',
      regionId: 'maintenance.workorders.unknown',
      title: 'Wrong region',
    }, { surface: maintenanceWorkordersSurface, fallbackMode: 'verbose' }));

    expect(markup).toContain('Invalid widget');
    expect(markup).toContain('region_not_allowed');
    expect(markup).not.toContain('Wrong region');
  });

  it('renders allowed action_list_readonly buttons', () => {
    const markup = render(widget({
      id: 'actions',
      type: 'action_list_readonly',
      regionId: regions[8],
      title: 'Actions',
      actions: [{
        id: 'preview',
        label: 'Preview workorder',
        targetId: actionTargets[0],
      }],
    }));

    expect(markup).toContain('<button type="button">Preview workorder</button>');
  });

  it('does not render or call action_list_readonly actions with invalid targets', () => {
    const onReadonlyAction = vi.fn();
    const element = renderUiWidget(widget({
      id: 'actions',
      type: 'action_list_readonly',
      regionId: regions[8],
      title: 'Actions',
      actions: [
        {
          id: 'preview',
          label: 'Preview workorder',
          targetId: actionTargets[0],
        },
        {
          id: 'approve',
          label: 'Approve workorder',
          targetId: 'maintenance.workorders.actions.approve_workorder',
        },
      ],
    }), { surface: maintenanceWorkordersSurface, onReadonlyAction });

    const markup = renderToStaticMarkup(element);
    const buttons = findElementsByType(element, 'button');

    expect(markup).toContain('Preview workorder');
    expect(markup).not.toContain('Approve workorder');
    expect(buttons).toHaveLength(1);

    buttons[0].props.onClick();

    expect(onReadonlyAction).toHaveBeenCalledTimes(1);
    expect(onReadonlyAction).toHaveBeenCalledWith({
      widgetId: 'actions',
      actionId: 'preview',
      targetId: actionTargets[0],
      metadata: undefined,
    });
  });

  it('renders widget lists and empty list fallback', () => {
    const listMarkup = renderToStaticMarkup(renderUiWidgetList([
      widget({
        id: 'open-workorders',
        type: 'kpi_card',
        regionId: regions[0],
        title: 'Open workorders',
        value: 12,
      }),
    ], { surface: maintenanceWorkordersSurface }));
    const emptyMarkup = renderToStaticMarkup(renderUiWidgetList([]));

    expect(listMarkup).toContain('UI widgets');
    expect(listMarkup).toContain('Open workorders');
    expect(emptyMarkup).toContain('No widget data');
  });

  it('does not use dangerous rendering primitives in renderer files', () => {
    const rendererSource = fs.readFileSync('src/ui-registry/renderWidget.tsx', 'utf8');
    const fallbackSource = fs.readFileSync('src/ui-registry/WidgetFallback.tsx', 'utf8');

    expect(`${rendererSource}\n${fallbackSource}`).not.toMatch(/dangerouslySetInnerHTML|eval\(|new Function/);
  });
});

function render(input: UiWidget): string {
  return renderToStaticMarkup(renderUiWidget(input, { surface: maintenanceWorkordersSurface }));
}

function widget(input: UiWidget): UiWidget {
  return input;
}

function findElementsByType(element: React.ReactNode, type: string): React.ReactElement[] {
  if (!React.isValidElement(element)) {
    return [];
  }

  const matches = element.type === type ? [element] : [];
  const children = React.Children.toArray(element.props.children);

  return [
    ...matches,
    ...children.flatMap((child) => findElementsByType(child, type)),
  ];
}
