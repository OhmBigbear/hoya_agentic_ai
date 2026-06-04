import { describe, expect, it } from 'vitest';

import {
  createWidgetRegistry,
  getWidgetRegistryEntry,
  validateSurfaceDefinition,
  validateWidget,
} from '../src/ui-registry';
import type { UiSurfaceDefinition, UiWidget, UiWidgetRegistryEntry } from '../src/ui-registry';

const widgetEntries: UiWidgetRegistryEntry[] = [
  { type: 'kpi_card', label: 'KPI card' },
  { type: 'action_list_readonly', label: 'Read-only actions' },
];

const surface: UiSurfaceDefinition = {
  id: 'maintenance.workorders',
  regions: [
    { id: 'summary' },
    { id: 'actions' },
    { id: 'evidence' },
  ],
  actionTargets: [
    { id: 'workorder_table' },
  ],
};

describe('ui registry contracts', () => {
  it('looks up registered widget types', () => {
    const registry = createWidgetRegistry(widgetEntries);

    expect(getWidgetRegistryEntry(registry, 'kpi_card')).toEqual({ type: 'kpi_card', label: 'KPI card' });
  });

  it('returns undefined for unknown widget types', () => {
    const registry = createWidgetRegistry(widgetEntries);

    expect(getWidgetRegistryEntry(registry, 'unknown_widget')).toBeUndefined();
  });

  it('validates a valid surface definition successfully', () => {
    const result = validateSurfaceDefinition(surface);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails validation for duplicate region ids', () => {
    const result = validateSurfaceDefinition({
      id: 'maintenance.workorders',
      regions: [
        { id: 'summary' },
        { id: 'summary' },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('duplicate_region_id');
  });

  it('fails widget validation for invalid regions when a surface is provided', () => {
    const widget: UiWidget = {
      id: 'open-workorders',
      type: 'kpi_card',
      regionId: 'missing-region',
    };

    const result = validateWidget(widget, surface);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('region_not_allowed');
  });

  it('fails read-only action widgets with targets not allowed by the surface', () => {
    const widget: UiWidget = {
      id: 'readonly-actions',
      type: 'action_list_readonly',
      regionId: 'actions',
      actions: [
        { id: 'open-external', label: 'Open external system', targetId: 'external_writeback' },
      ],
    };

    const result = validateWidget(widget, surface);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('action_target_not_allowed');
  });

  it('warns when insight lists omit evidence and trace metadata', () => {
    const widget: UiWidget = {
      id: 'risk-insights',
      type: 'insight_list',
      regionId: 'summary',
      insights: [
        { id: 'repeat-failure', title: 'Repeat failure risk' },
      ],
    };

    const result = validateWidget(widget, surface);

    expect(result.valid).toBe(true);
    expect(result.warnings.map((warning) => warning.code)).toContain('missing_insight_metadata');
  });

  it('fails evidence lists without evidence refs', () => {
    const widget: UiWidget = {
      id: 'evidence',
      type: 'evidence_list',
      regionId: 'evidence',
      evidenceRefs: [],
    };

    const result = validateWidget(widget, surface);

    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain('missing_evidence_refs');
  });
});
