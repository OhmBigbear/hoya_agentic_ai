import React from 'react';

import { isActionTargetAllowed, isRegionAllowed } from './registry';
import { isSupportedWidgetType, validateWidget } from './validation';
import {
  EmptyWidgetFallback,
  InvalidWidgetFallback,
  UnsupportedWidgetFallback,
  WidgetValidationMessages,
  type UiWidgetFallbackMode,
} from './WidgetFallback';
import type {
  UiActionTargetId,
  UiDataTableWidget,
  UiEvidenceListWidget,
  UiEvidenceRef,
  UiInsightListWidget,
  UiKpiCardWidget,
  UiReadonlyActionListWidget,
  UiSummaryCardWidget,
  UiSurfaceDefinition,
  UiTrendChartWidget,
  UiValidationIssue,
  UiWidget,
} from './types';

export interface UiReadonlyActionEvent {
  widgetId: string;
  actionId: string;
  targetId: UiActionTargetId;
  metadata?: Record<string, unknown>;
}

export interface RenderUiWidgetOptions {
  surface?: UiSurfaceDefinition;
  fallbackMode?: UiWidgetFallbackMode;
  onReadonlyAction?: (event: UiReadonlyActionEvent) => void;
}

export function renderUiWidget(
  widget: unknown,
  options: RenderUiWidgetOptions = {},
): React.ReactElement {
  const fallbackMode = options.fallbackMode ?? 'compact';

  if (!isWidgetLike(widget)) {
    return <InvalidWidgetFallback fallbackMode={fallbackMode} messages={[issue('invalid_widget', 'Widget must be an object')]} />;
  }

  if (!isSupportedWidgetType(String(widget.type))) {
    return <UnsupportedWidgetFallback fallbackMode={fallbackMode} widgetType={String(widget.type ?? '')} />;
  }

  const validation = validateWidget(widget as UiWidget);
  const surfaceMessages = validateSurfaceConstraints(widget as UiWidget, options.surface);
  const errors = [...validation.errors, ...surfaceMessages];

  if (errors.length > 0) {
    return <InvalidWidgetFallback fallbackMode={fallbackMode} messages={errors} />;
  }

  const typedWidget = widget as UiWidget;
  const warnings = validation.warnings;

  switch (typedWidget.type) {
    case 'kpi_card':
      return renderKpiCard(typedWidget, warnings);
    case 'summary_card':
      return renderSummaryCard(typedWidget, warnings);
    case 'data_table':
      return renderDataTable(typedWidget, warnings);
    case 'trend_chart':
      return renderTrendChart(typedWidget, warnings);
    case 'insight_list':
      return renderInsightList(typedWidget, warnings);
    case 'evidence_list':
      return renderEvidenceList(typedWidget, warnings);
    case 'action_list_readonly':
      return renderReadonlyActionList(typedWidget, options, warnings);
    case 'empty_state':
      return (
        <section aria-label={typedWidget.title ?? 'Empty state'} data-widget-id={typedWidget.id}>
          <h3>{typedWidget.title ?? 'No data'}</h3>
          <p>{typedWidget.message ?? typedWidget.description ?? 'No data is available.'}</p>
        </section>
      );
    case 'error_state':
      return (
        <section aria-label={typedWidget.title ?? 'Error state'} data-widget-id={typedWidget.id} role="alert">
          <h3>{typedWidget.title ?? 'Unable to display data'}</h3>
          <p>{typedWidget.message ?? typedWidget.description ?? 'The widget data could not be displayed.'}</p>
          {typedWidget.errorCode ? <p>Error code: {typedWidget.errorCode}</p> : null}
        </section>
      );
    default:
      return <UnsupportedWidgetFallback fallbackMode={fallbackMode} />;
  }
}

export function renderUiWidgetList(
  widgets: unknown[],
  options: RenderUiWidgetOptions = {},
): React.ReactElement {
  if (!Array.isArray(widgets) || widgets.length === 0) {
    return <EmptyWidgetFallback />;
  }

  return (
    <div aria-label="UI widgets">
      {widgets.map((widget, index) => (
        <React.Fragment key={getWidgetKey(widget, index)}>
          {renderUiWidget(widget, options)}
        </React.Fragment>
      ))}
    </div>
  );
}

function renderKpiCard(widget: UiKpiCardWidget, warnings: UiValidationIssue[]): React.ReactElement {
  return (
    <section aria-label={widget.title ?? 'KPI'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'KPI'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      <p>
        <strong>{formatValue(widget.value)}</strong>
        {widget.unit ? <span> {widget.unit}</span> : null}
      </p>
      {widget.trend ? <p>Trend: {widget.trend}</p> : null}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderSummaryCard(widget: UiSummaryCardWidget, warnings: UiValidationIssue[]): React.ReactElement {
  return (
    <section aria-label={widget.title ?? 'Summary'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Summary'}</h3>
      {widget.summary ? <p>{widget.summary}</p> : null}
      {widget.items?.length ? (
        <dl>
          {widget.items.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              <dt>{item.label}</dt>
              <dd>{formatValue(item.value)}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderDataTable(widget: UiDataTableWidget, warnings: UiValidationIssue[]): React.ReactElement {
  const columns = widget.columns ?? [];
  const rows = widget.rows ?? [];

  return (
    <section aria-label={widget.title ?? 'Data table'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Data table'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      {columns.length > 0 ? (
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.id}>{formatValue(row[column.field ?? column.id])}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length}>No rows available.</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : <p>No columns available.</p>}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderTrendChart(widget: UiTrendChartWidget, warnings: UiValidationIssue[]): React.ReactElement {
  return (
    <section aria-label={widget.title ?? 'Trend chart'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Trend chart'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      {widget.series?.length ? (
        <ul aria-label="Trend series">
          {widget.series.map((series) => (
            <li key={series.id}>
              <strong>{series.label ?? series.id}</strong>
              <ol>
                {series.points.map((point, index) => (
                  <li key={`${series.id}-${point.x}-${index}`}>
                    {formatValue(point.x)}: {formatValue(point.y)}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      ) : <p>No trend data available.</p>}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderInsightList(widget: UiInsightListWidget, warnings: UiValidationIssue[]): React.ReactElement {
  return (
    <section aria-label={widget.title ?? 'Insights'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Insights'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      {widget.insights?.length ? (
        <ul>
          {widget.insights.map((insight) => (
            <li key={insight.id}>
              <h4>{insight.title}</h4>
              {insight.severity ? <p>Severity: {insight.severity}</p> : null}
              {insight.summary ? <p>{insight.summary}</p> : null}
              {renderMetadataSummary(insight.metadata)}
              {renderEvidenceRefs(insight.evidenceRefs)}
              {renderTraceRefs(insight.traceRefs)}
            </li>
          ))}
        </ul>
      ) : <p>No insights available.</p>}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderEvidenceList(widget: UiEvidenceListWidget, warnings: UiValidationIssue[]): React.ReactElement {
  return (
    <section aria-label={widget.title ?? 'Evidence'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Evidence'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      {renderEvidenceRefs(widget.evidenceRefs)}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderReadonlyActionList(
  widget: UiReadonlyActionListWidget,
  options: RenderUiWidgetOptions,
  warnings: UiValidationIssue[],
): React.ReactElement {
  const actions = (widget.actions ?? []).filter((action) => isReadonlyActionTargetAllowed(options.surface, action.targetId));

  return (
    <section aria-label={widget.title ?? 'Read-only actions'} data-widget-id={widget.id}>
      <h3>{widget.title ?? 'Read-only actions'}</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      {actions.length > 0 ? (
        <ul>
          {actions.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                onClick={() => options.onReadonlyAction?.({
                  widgetId: widget.id,
                  actionId: action.id,
                  targetId: action.targetId,
                  metadata: action.metadata,
                })}
              >
                {action.label}
              </button>
              {action.description ? <p>{action.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : <p>No read-only actions available.</p>}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderEvidenceRefs(evidenceRefs?: UiEvidenceRef[]): React.ReactElement | null {
  if (!evidenceRefs?.length) {
    return null;
  }

  return (
    <ul aria-label="Evidence references">
      {evidenceRefs.map((evidence) => (
        <li key={evidence.id}>
          <span>{evidence.label ?? evidence.id}</span>
          {evidence.source ? <span> Source: {evidence.source}</span> : null}
          {evidence.href ? <span> Reference: {evidence.href}</span> : null}
          {renderMetadataSummary(evidence.metadata)}
        </li>
      ))}
    </ul>
  );
}

function renderTraceRefs(traceRefs?: UiWidget['traceRefs']): React.ReactElement | null {
  if (!traceRefs?.length) {
    return null;
  }

  return (
    <ul aria-label="Trace references">
      {traceRefs.map((trace) => (
        <li key={trace.id}>
          <span>{trace.label ?? trace.id}</span>
          {trace.source ? <span> Source: {trace.source}</span> : null}
          {renderMetadataSummary(trace.metadata)}
        </li>
      ))}
    </ul>
  );
}

function renderMetadataSummary(metadata?: Record<string, unknown>): React.ReactElement | null {
  const scalarEntries = Object.entries(metadata ?? {}).filter(([, value]) => isScalarValue(value));

  if (scalarEntries.length === 0) {
    return null;
  }

  return (
    <dl aria-label="Metadata">
      {scalarEntries.map(([key, value]) => (
        <React.Fragment key={key}>
          <dt>{key}</dt>
          <dd>{formatValue(value)}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function validateSurfaceConstraints(widget: UiWidget, surface: UiSurfaceDefinition | undefined): UiValidationIssue[] {
  if (!surface) {
    return [];
  }

  const errors: UiValidationIssue[] = [];
  const region = surface.regions.find((item) => item.id === widget.regionId);

  if (!isRegionAllowed(surface, widget.regionId)) {
    errors.push(issue(
      'region_not_allowed',
      `Widget region '${widget.regionId}' is not allowed on surface '${surface.id}'`,
      'regionId',
    ));
    return errors;
  }

  if (region?.allowedWidgetTypes && !region.allowedWidgetTypes.includes(widget.type)) {
    errors.push(issue(
      'widget_type_not_allowed_in_region',
      `Widget type '${widget.type}' is not allowed in region '${widget.regionId}'`,
      'type',
    ));
  }

  return errors;
}

function isReadonlyActionTargetAllowed(
  surface: UiSurfaceDefinition | undefined,
  targetId: UiActionTargetId,
): boolean {
  return surface ? isActionTargetAllowed(surface, targetId) : true;
}

function getWidgetKey(widget: unknown, index: number): string {
  if (isWidgetLike(widget) && typeof widget.id === 'string' && widget.id.trim()) {
    return widget.id;
  }

  return `widget-${index}`;
}

function isWidgetLike(widget: unknown): widget is Partial<UiWidget> {
  return typeof widget === 'object' && widget !== null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '[non-scalar value]';
}

function isScalarValue(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function issue(code: string, message: string, path?: string): UiValidationIssue {
  return { code, message, path };
}
