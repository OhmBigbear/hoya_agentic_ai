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
  UiNarrativePanelWidget,
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
    case 'narrative_panel':
      return renderNarrativePanel(typedWidget, warnings);
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

function renderNarrativePanel(widget: UiNarrativePanelWidget, warnings: UiValidationIssue[]): React.ReactElement {
  const evidenceSourceCount = countEvidenceSources(widget);
  const secondarySections = [
    { title: 'Limitations', items: widget.limitations },
    { title: 'Risks', items: widget.risks },
    { title: 'Reasoning', items: widget.reasoning },
  ];

  return (
    <section
      aria-label="Maintenance Assessment"
      className="space-y-3 rounded-lg border border-cyan-400/20 bg-[#101827] p-3 text-slate-200"
      data-testid="maintenance-assessment"
      data-widget-id={widget.id}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-normal text-cyan-300/80">Maintenance Assessment</p>
          <h3 className="mt-1 text-sm font-semibold text-white">{widget.title ?? 'Maintenance Assessment'}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]" aria-label="Assessment status">
          <span className={getAssessmentBadgeClass('risk', widget.riskLevel)}>Risk Level {formatValue(widget.riskLevel ?? inferRiskLevel(widget))}</span>
          {widget.confidence !== undefined ? <span className={getAssessmentBadgeClass('confidence', widget.confidence)}>Confidence {formatValue(widget.confidence)}</span> : null}
          <span className={getAssessmentBadgeClass('impact', widget.businessImpactStatus)}>Business Impact {formatValue(widget.businessImpactStatus ?? (widget.businessImpact ? 'assessed' : 'pending'))}</span>
          {widget.validationRequired ? <span className={getAssessmentBadgeClass('validation', 'required')}>Validation Required</span> : null}
        </div>
      </div>
      {widget.description ? <p>{widget.description}</p> : null}
      {widget.assessmentHeader ? (
        <section aria-label="Assessment Header" className="rounded-lg border border-white/10 bg-[#0f1623] p-3" data-testid="maintenance-assessment-header">
          <h4 className="text-xs font-semibold uppercase tracking-normal text-slate-300">Assessment Header</h4>
          <p className="mt-2 text-sm leading-6 text-slate-100">{widget.assessmentHeader}</p>
        </section>
      ) : null}
      {widget.probableFailure ? (
        <section aria-label="Probable Failure / What Failed" className="rounded-lg border border-red-400/20 bg-red-500/10 p-3" data-testid="maintenance-assessment-probable-failure">
          <h4 className="text-xs font-semibold uppercase tracking-normal text-red-100">Probable Failure / What Failed</h4>
          <p className="mt-2 text-sm leading-6 text-red-50">{widget.probableFailure}</p>
        </section>
      ) : null}
      {widget.executiveSummary ? (
        <section aria-label="Executive Summary" className="rounded-lg border border-cyan-300/20 bg-cyan-500/10 p-3" data-testid="maintenance-assessment-executive-summary">
          <h4 className="text-xs font-semibold uppercase tracking-normal text-cyan-100">Executive Summary</h4>
          <p className="mt-2 text-sm leading-6 text-white">{widget.executiveSummary}</p>
        </section>
      ) : null}
      {renderKeyFindingsSection(widget.keyFindings)}
      {widget.businessImpact ? (
        <section aria-label="Business Impact" className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3" data-testid="maintenance-assessment-business-impact">
          <h4 className="text-xs font-semibold uppercase tracking-normal text-amber-100">Business Impact</h4>
          <p className="mt-2 text-sm leading-6 text-amber-50">{widget.businessImpact}</p>
        </section>
      ) : null}
      {renderNextStepsSection(widget.recommendedNextSteps)}
      {widget.bottomLine ? (
        <section aria-label="Bottom Line" className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3" data-testid="maintenance-assessment-bottom-line">
          <h4 className="text-xs font-semibold uppercase tracking-normal text-emerald-100">Bottom Line</h4>
          <p className="mt-2 text-sm leading-6 text-emerald-50">{widget.bottomLine}</p>
        </section>
      ) : null}
      {secondarySections.some((section) => section.items?.length) ? (
        <details className="rounded border border-white/10 bg-[#0f1623] p-2 text-xs text-slate-300" data-testid="maintenance-assessment-secondary-detail">
          <summary className="cursor-pointer select-none text-slate-200">Limitations and Additional narrative detail</summary>
          {secondarySections.map((section) => (
            <React.Fragment key={section.title}>
              {renderNarrativeListSection(section.title, section.items)}
            </React.Fragment>
          ))}
        </details>
      ) : null}
      {evidenceSourceCount > 0 ? (
        <details className="rounded border border-white/10 bg-[#0f1623] p-2 text-xs text-slate-300" data-testid="maintenance-assessment-evidence">
          <summary className="cursor-pointer select-none text-slate-200">Full Evidence / Evidence Sources ({evidenceSourceCount}) <span className="text-cyan-200">View Evidence</span></summary>
          {renderNarrativeListSection('Raw Evidence References', widget.evidence)}
          {renderEvidenceRefs(widget.evidenceRefs)}
        </details>
      ) : null}
      {widget.traceRefs?.length || widget.metadata ? (
        <details className="rounded border border-white/10 bg-[#0f1623] p-2 text-xs text-slate-400" data-testid="maintenance-assessment-tool-source-details">
          <summary className="cursor-pointer select-none text-slate-300">Tool Source Details</summary>
          {renderTraceRefs(widget.traceRefs)}
          {renderMetadataSummary(widget.metadata)}
        </details>
      ) : null}
      <WidgetValidationMessages messages={warnings} />
    </section>
  );
}

function renderNarrativeListSection(title: string, items?: string[]): React.ReactElement | null {
  if (!items?.length) {
    return null;
  }

  return (
    <section aria-label={title}>
      <h4 className="mt-3 text-xs font-semibold uppercase tracking-normal text-slate-300">{title}</h4>
      <ul>
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </section>
  );
}

function renderKeyFindingsSection(items?: string[]): React.ReactElement | null {
  if (!items?.length) {
    return null;
  }

  return (
    <section aria-label="Key Findings" className="space-y-2" data-testid="maintenance-assessment-key-findings">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-slate-300">Key Findings</h4>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`Key Findings-${index}`} className="rounded border border-white/10 bg-[#0f1623] p-2 text-xs leading-5 text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function renderNextStepsSection(items?: string[]): React.ReactElement | null {
  if (!items?.length) {
    return null;
  }

  return (
    <section aria-label="Recommended Next Steps" className="space-y-2" data-testid="maintenance-assessment-next-steps">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-slate-300">Recommended Next Steps</h4>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={`Recommended Next Steps-${index}`} className="flex gap-2 rounded border border-emerald-400/20 bg-emerald-500/10 p-2 text-xs leading-5 text-emerald-50">
            <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-emerald-300/40 text-[10px] text-emerald-100">OK</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function countEvidenceSources(widget: UiNarrativePanelWidget): number {
  const narrativeEvidenceCount = widget.evidence?.length ?? 0;
  const evidenceRefCount = widget.evidenceRefs?.length ?? 0;
  return Math.max(narrativeEvidenceCount, evidenceRefCount);
}

function inferRiskLevel(widget: UiNarrativePanelWidget): string {
  const text = [
    widget.executiveSummary,
    widget.businessImpact,
    ...(widget.keyFindings ?? []),
    ...(widget.risks ?? []),
  ].join(' ').toLowerCase();

  if (/critical|severe|urgent|blocked|outage/.test(text)) {
    return 'critical';
  }
  if (/high|elevated|overdue|risk|delay|downtime/.test(text)) {
    return 'high';
  }
  if (/medium|moderate|watch/.test(text)) {
    return 'medium';
  }
  if (/low|stable|normal/.test(text)) {
    return 'low';
  }
  return 'unknown';
}

function getAssessmentBadgeClass(type: 'risk' | 'confidence' | 'impact' | 'validation', value: unknown): string {
  const normalized = String(value ?? '').toLowerCase();
  const base = 'rounded border px-2 py-1 font-medium';

  if (type === 'validation') {
    return `${base} border-amber-400/30 bg-amber-500/15 text-amber-100`;
  }
  if (type === 'confidence' && normalized.includes('high')) {
    return `${base} border-emerald-400/30 bg-emerald-500/15 text-emerald-100`;
  }
  if (normalized.includes('critical') || normalized.includes('high') || normalized.includes('warning') || normalized.includes('elevated')) {
    return `${base} border-amber-400/30 bg-amber-500/15 text-amber-100`;
  }
  if (normalized.includes('low') || normalized.includes('normal') || normalized.includes('stable') || normalized.includes('assessed')) {
    return `${base} border-emerald-400/30 bg-emerald-500/15 text-emerald-100`;
  }
  return `${base} border-slate-500/30 bg-slate-700/50 text-slate-100`;
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
    <section aria-label={widget.title ?? 'Evidence'} data-widget-id={widget.id} data-testid="evidence-sources">
      <h3>{widget.title ?? 'Evidence Sources'} ({widget.evidenceRefs.length})</h3>
      {widget.description ? <p>{widget.description}</p> : null}
      <details data-testid="evidence-sources-detail">
        <summary>View Evidence</summary>
        {renderEvidenceRefs(widget.evidenceRefs)}
      </details>
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
