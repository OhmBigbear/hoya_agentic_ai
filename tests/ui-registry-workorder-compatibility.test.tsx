import fs from 'node:fs';
import path from 'node:path';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  adaptWorkorderAgentPayloadToWidgets,
  maintenanceWorkordersActionTargetIds,
  maintenanceWorkordersRegionIds,
  maintenanceWorkordersSurface,
  renderUiWidgetList,
  validateWidget,
} from '../src/ui-registry';
import type { UiReadonlyActionEvent, UiWidget } from '../src/ui-registry';
import {
  errorWorkorderAgentPayload,
  fullWorkorderAgentPayload,
  htmlInjectionWorkorderAgentPayload,
  malformedWorkorderAgentPayload,
  minimalWorkorderAgentPayload,
  unsupportedActionWorkorderAgentPayload,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

const allowedRegions = new Set<string>(maintenanceWorkordersRegionIds);
const allowedTypes = new Set(maintenanceWorkordersSurface.regions.flatMap((region) => region.allowedWidgetTypes ?? []));
const allowedActionTargets = new Set<string>(maintenanceWorkordersActionTargetIds);

describe('maintenance workorder registry compatibility harness', () => {
  it('adapts, validates, and renders a full workorder agent payload without fallback', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(fullWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const markup = renderToStaticMarkup(renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface }));

    expect(markup).toContain('UI widgets');
    expect(markup).toContain('Maintenance risk summary');
    expect(markup).toContain('Open corrective workorders are concentrated on MACHINE-7A.');
    expect(markup).toContain('Open workorders');
    expect(markup).toContain('WO-100');
    expect(markup).toContain('Downtime trend');
    expect(markup).toContain('Repeat failure risk');
    expect(markup).toContain('Evidence');
    expect(markup).toContain('Preview WO-100');
    expect(markup).not.toContain('Unsupported widget');
    expect(markup).not.toContain('Invalid widget');
  });

  it('adapts, validates, and renders a minimal payload safely', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(minimalWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const markup = renderToStaticMarkup(renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface }));

    expect(widgets.length).toBeGreaterThan(0);
    expect(markup).toContain('No urgent workorders');
    expect(markup).toContain('No urgent maintenance workorder preview is available for the selected filters.');
    expect(markup).not.toContain('Invalid widget');
  });

  it('maps an error payload to an operator-safe error state', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(errorWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const markup = renderToStaticMarkup(renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface }));

    expect(widgets).toHaveLength(1);
    expect(widgets[0]).toMatchObject({
      type: 'error_state',
      title: 'Unable to adapt workorder preview',
      message: 'Workorder preview is temporarily unavailable.',
      errorCode: 'WORKORDER_PREVIEW_UNAVAILABLE',
    });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Workorder preview is temporarily unavailable.');
    expect(markup).not.toContain('Error summary should not render');
  });

  it('drops unsupported action targets while valid read-only actions remain callable', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(unsupportedActionWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const actionWidget = findWidget(widgets, 'action_list_readonly');
    const actionTargets = actionWidget?.actions?.map((action) => action.targetId) ?? [];

    expect(actionTargets).toEqual([
      'maintenance.workorders.actions.preview_workorder',
      'maintenance.workorders.actions.filter_by_status',
      'maintenance.workorders.actions.preview_machine',
    ]);
    actionTargets.forEach((targetId) => expect(allowedActionTargets.has(targetId)).toBe(true));

    const onReadonlyAction = vi.fn<(event: UiReadonlyActionEvent) => void>();
    const element = renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface, onReadonlyAction });
    const markup = renderToStaticMarkup(element);
    const buttons = findElementsByType(element, 'button');

    expect(markup).toContain('Preview WO-102');
    expect(markup).toContain('Filter open status');
    expect(markup).toContain('Preview machine');
    expect(markup).not.toContain('Approve WO-102');
    expect(markup).not.toContain('Delete WO-102');
    expect(markup).not.toContain('Close workorder');
    expect(buttons.map((button) => button.props.children)).toEqual([
      'Preview WO-102',
      'Filter open status',
      'Preview machine',
    ]);

    buttons[0].props.onClick();

    expect(onReadonlyAction).toHaveBeenCalledTimes(1);
    expect(onReadonlyAction).toHaveBeenCalledWith(expect.objectContaining({
      actionId: 'preview-wo-102',
      targetId: 'maintenance.workorders.actions.preview_workorder',
    }));
  });

  it('maps malformed payload content to safe renderable widgets', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(malformedWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const markup = renderToStaticMarkup(renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface }));

    expect(widgets.length).toBeGreaterThan(0);
    expect(widgets.every((widget) => widget.type === 'empty_state' || widget.type === 'error_state')).toBe(false);
    expect(markup).toContain('Evidence');
    expect(markup).toContain('Bad chart');
    expect(markup).not.toContain('Invalid widget');
    expect(markup).not.toContain('Unsupported widget');
  });

  it('emits only maintenance.workorders regions and supported widget types', () => {
    const widgets = [
      ...adaptWorkorderAgentPayloadToWidgets(fullWorkorderAgentPayload),
      ...adaptWorkorderAgentPayloadToWidgets(minimalWorkorderAgentPayload),
      ...adaptWorkorderAgentPayloadToWidgets(errorWorkorderAgentPayload),
      ...adaptWorkorderAgentPayloadToWidgets(unsupportedActionWorkorderAgentPayload),
      ...adaptWorkorderAgentPayloadToWidgets(malformedWorkorderAgentPayload),
    ];

    widgets.forEach((widget) => {
      expect(allowedRegions.has(widget.regionId)).toBe(true);
      expect(allowedTypes.has(widget.type)).toBe(true);
    });
    assertAllWidgetsValidate(widgets);
  });

  it('renders script-like payload strings as escaped text and keeps forbidden source primitives out', () => {
    const widgets = adaptWorkorderAgentPayloadToWidgets(htmlInjectionWorkorderAgentPayload);
    assertAllWidgetsValidate(widgets);

    const markup = renderToStaticMarkup(renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface }));

    expect(markup).toContain('&lt;script&gt;window.__workorderCompatExecuted = true&lt;/script&gt;');
    expect(markup).toContain('&lt;img src=x onerror=&quot;window.__workorderCompatExecuted = true&quot;&gt;');
    expect(markup).toContain('&lt;b&gt;Unsafe-looking insight&lt;/b&gt;');
    expect(markup).not.toContain('<script>');
    expect(markup).not.toContain('<img src=x');
    expect(markup).not.toContain('<b>Unsafe-looking insight</b>');

    const source = readSourceTree('src/ui-registry')
      + '\n'
      + fs.readFileSync('tests/ui-registry-workorder-compatibility.test.tsx', 'utf8');
    const forbidden = new RegExp([
      'dangerously' + 'SetInnerHTML',
      'eval' + '\\(',
      'new ' + 'Function',
    ].join('|'));

    expect(source).not.toMatch(forbidden);
  });
});

function assertAllWidgetsValidate(widgets: UiWidget[]): void {
  expect(widgets.length).toBeGreaterThan(0);
  widgets.forEach((widget) => {
    const result = validateWidget(widget, maintenanceWorkordersSurface);
    expect(result.errors).toEqual([]);
  });
}

function findWidget<TType extends UiWidget['type']>(
  widgets: UiWidget[],
  type: TType,
): Extract<UiWidget, { type: TType }> | undefined {
  return widgets.find((widget): widget is Extract<UiWidget, { type: TType }> => widget.type === type);
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

function readSourceTree(root: string): string {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return readSourceTree(entryPath);
    }
    if (!entry.isFile() || !/\.[cm]?[tj]sx?$/.test(entry.name)) {
      return [];
    }
    return fs.readFileSync(entryPath, 'utf8');
  }).join('\n');
}
