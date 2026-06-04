# Phase B0 Widget Registry Implementation Plan

Phase B0 defines the implementation plan for a constrained widget registry foundation. It uses `maintenance.workorders` as the only pilot surface and does not introduce generalized adaptive UI rendering.

## 1. Scope

### In scope

- Pilot surface: `maintenance.workorders` only.
- Canonical route context: `/maintenance/workorders`.
- Read-only widgets only.
- Registered regions only.
- Allowlisted action targets only.
- Frontend-owned component mapping only.
- Runtime validation before rendering any normalized widget payload.
- Safe fallback rendering for invalid, incomplete, unknown, or unsupported payloads.
- Compatibility adapter from the current operations workspace preview/workspace payload shape to normalized widget payloads.

### Out of scope

- No arbitrary component rendering.
- No backend-driven unrestricted UI schema.
- No agent-provided executable actions.
- No backend-selected JSX, component imports, or module names.
- No mutation widgets, forms, prompt editors, tool toggles, approvals, or writeback actions.
- No route/sidebar behavior changes in the first implementation round.
- No visual styling changes to `maintenance.workorders`.
- No broad registry rollout to overview, production, engineering, admin, reports, or maintenance KB.

## 2. Target Architecture

### `SurfaceRegistry`

Owns stable surface metadata.

Responsibilities:

- register `surface_id`;
- declare canonical route and legacy aliases;
- connect a surface to allowed regions, widget slots, and action targets;
- expose lookup helpers for tests and adapters.

For Phase B0, it should register only:

```text
maintenance.workorders
```

### `RegionRegistry`

Owns region definitions for the pilot surface.

Responsibilities:

- define region IDs;
- define allowed widget types per region;
- define whether a region can receive agent-normalized widgets;
- reject unknown regions before rendering.

### `WidgetRegistry`

Owns frontend-approved widget type definitions.

Responsibilities:

- define allowed widget kinds;
- define required payload fields per widget kind;
- map widget kinds to frontend-owned renderers;
- define max rows, max series, max items, and fallback behavior.

The registry must not accept component names from backend or agent payloads.

### `WidgetSchemaValidator`

Validates normalized UI payloads at the application boundary.

Responsibilities:

- ensure each widget has an allowed `type`;
- ensure each widget references the current `surface_id`;
- ensure each widget targets a registered `region_id`;
- enforce bounded arrays for tables, charts, insights, evidence, and actions;
- reject executable fields, HTML payloads, function-like values, and unknown action targets;
- return structured validation results rather than throwing during render.

### `WidgetRenderer`

Renders only validated widgets.

Responsibilities:

- render registered widget kinds using local React components;
- pass only sanitized, normalized data to components;
- preserve the current `maintenance.workorders` layout and styling;
- isolate widget rendering to the current copilot/payload area until later phases prove safety.

### `WidgetFallback`

Renders safe states for validation failures or unsupported payloads.

Responsibilities:

- show an empty state for absent payloads;
- show an error state for invalid widget payloads;
- show a compact unsupported-widget state for unknown types;
- show an evidence-missing state when AI-generated insight content lacks trace or evidence references;
- avoid exposing raw internal schema unless explicitly in a development diagnostic area.

### `ActionTargetAllowlist`

Owns read-only UI action target eligibility.

Responsibilities:

- define the only action target IDs accepted for `maintenance.workorders`;
- map current local target IDs to stable proposed IDs;
- reject write-like actions;
- prevent action target references from becoming executable operations.

## 3. Proposed File And Module Layout

Use a small top-level registry area because this foundation should eventually serve multiple pages, while keeping the pilot surface definition close to the maintenance workorder domain.

Recommended files to add later:

| file | purpose |
| --- | --- |
| `src/ui-registry/types.ts` | Shared registry types: `SurfaceDefinition`, `RegionDefinition`, `WidgetDefinition`, `WidgetPayload`, `ValidationResult`, `ActionTargetDefinition` |
| `src/ui-registry/surfaces.ts` | `SurfaceRegistry` helpers and registered surface exports |
| `src/ui-registry/regions.ts` | generic region lookup helpers and region validation |
| `src/ui-registry/widgets.ts` | allowed widget type definitions and renderer registration metadata |
| `src/ui-registry/actionTargets.ts` | read-only action target allowlist helpers |
| `src/ui-registry/validation.ts` | local runtime validators for normalized widget payloads |
| `src/ui-registry/renderWidget.tsx` | `WidgetRenderer` and `WidgetFallback` entry point |
| `src/ui-registry/adapters/operationsWorkspacePayloadAdapter.ts` | adapter from current operations workspace preview payloads to normalized widget payloads |
| `src/pages/maintenance/workorders/workorderSurfaceDefinition.ts` | `maintenance.workorders` surface, regions, slots, and action targets |
| `src/pages/maintenance/workorders/workorderWidgetAdapters.ts` | maintenance-specific mapping from workorder insight payloads to normalized widgets |
| `tests/ui-registry/widget-registry.test.ts` | registry lookup and allowlist tests |
| `tests/ui-registry/widget-validation.test.ts` | validator and fallback tests |
| `tests/maintenance-workorders-widget-registry.test.tsx` | pilot integration test proving current rendering behavior remains stable |

Current project structure uses `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx` for the page. The proposed `src/pages/maintenance/workorders/` folder should be introduced only for registry metadata and adapters first, not for moving the page component.

## 4. Widget Types For First Implementation

Only these widget kinds should be registered in Phase B0/B1:

| widget type | purpose | required baseline fields |
| --- | --- | --- |
| `kpi_card` | single metric with label/value | `title`, `value`, optional `unit`, optional `trend`, optional `evidence_refs` |
| `summary_card` | short operational summary | `title`, `body`, optional `severity`, optional `confidence`, optional `evidence_refs` |
| `data_table` | bounded read-only rows/columns | `columns`, `rows`, optional `caption`, max row/column limits |
| `trend_chart` | bounded trend or categorical chart data | `title`, `series`, `x_axis`, `y_axis`, chart mode constrained by registry |
| `insight_list` | AI or rules-generated insight summaries | `items`, each with `title`, `summary`, `severity`, `confidence`, `evidence_refs` for AI-generated content |
| `evidence_list` | trace, source, tool, or document references | `items`, each with `label`, `source_type`, optional `trace_id`, optional `source_id` |
| `action_list_readonly` | proposed/applied UI actions as explanations only | `items`, each with `label`, `status`, `target_id`, `reason` |
| `empty_state` | absent or empty payload rendering | `title`, optional `message` |
| `error_state` | invalid or unsupported payload rendering | `title`, `message`, optional `validation_code` |

No widget in this list may accept raw HTML, JSX, component names, executable callbacks, or mutation instructions.

## 5. Surface And Region Model

Pilot surface:

```text
maintenance.workorders
```

Registered regions:

| region_id | allowed first widget types | notes |
| --- | --- | --- |
| `maintenance.workorders.kpi.summary` | `kpi_card`, `summary_card`, `empty_state`, `error_state` | Existing KPI area should not visually change in first round |
| `maintenance.workorders.filters` | `empty_state`, `error_state` | Region exists for action target validation; no adaptive widgets should replace filters yet |
| `maintenance.workorders.table` | `data_table`, `empty_state`, `error_state` | Read-only table previews only; no editable cells |
| `maintenance.workorders.drawer` | `summary_card`, `evidence_list`, `empty_state`, `error_state` | Drawer target only; avoid injecting new layout until later |
| `maintenance.workorders.charts` | `trend_chart`, `data_table`, `empty_state`, `error_state` | Parent chart region; child chart targets remain allowlisted |
| `maintenance.workorders.insights` | `insight_list`, `summary_card`, `empty_state`, `error_state` | Primary location for AI-generated insight widgets |
| `maintenance.workorders.copilot` | `summary_card`, `insight_list`, `evidence_list`, `action_list_readonly`, `empty_state`, `error_state` | Initial rendering area for normalized copilot payloads |
| `maintenance.workorders.evidence` | `evidence_list`, `empty_state`, `error_state` | Evidence fallback required when sources are missing |
| `maintenance.workorders.actions.readonly` | `action_list_readonly`, `empty_state`, `error_state` | Read-only explanations of proposed/applied/ignored/rejected UI actions |

Action target allowlist should include only stable IDs:

```text
maintenance.workorders.filters
maintenance.workorders.table
maintenance.workorders.drawer
maintenance.workorders.charts.mttr
maintenance.workorders.charts.hold_reasons
maintenance.workorders.charts.frequency
maintenance.workorders.charts.history_signals
maintenance.workorders.insights
maintenance.workorders.evidence
```

## 6. Agent Response Compatibility

The current operations workspace preview response should remain unchanged. Phase B0 should add an adapter that normalizes current payloads into registry-compatible widgets.

### Current payload fields observed

Current `OperationsWorkspacePreviewResponse` and workspace payload handling include:

- `assistant_text`
- `insights`
- `ui_actions`
- `workspace_payload`
- `trace`
- `metadata`
- `trace_id`
- `generated_by_agent_id`
- `source_tool_ids`
- `confidence`
- `created_at`

The current `workspace_payload` for workorders includes or supports:

- `payload_type`
- `intent`
- `summary`
- `kpi_cards`
- `charts`
- `tables`
- `recommendations`
- `evidence`
- `actions`
- `filters`
- `confidence`
- `severity`
- `limitations`
- `generated_at`

### Proposed normalized UI payload

The adapter should output a frontend-owned normalized payload:

```ts
type NormalizedWidgetPayload = {
  surface_id: 'maintenance.workorders';
  generated_at?: string;
  trace_id?: string;
  source_tool_ids?: string[];
  widgets: Array<{
    widget_id: string;
    type:
      | 'kpi_card'
      | 'summary_card'
      | 'data_table'
      | 'trend_chart'
      | 'insight_list'
      | 'evidence_list'
      | 'action_list_readonly'
      | 'empty_state'
      | 'error_state';
    region_id: string;
    title?: string;
    data: unknown;
    evidence_refs?: string[];
    trace_id?: string;
    confidence?: number;
  }>;
};
```

This type is illustrative. The implementation should place the real type in `src/ui-registry/types.ts` and keep the validator responsible for narrowing `data`.

### Mapping table

| current field | normalized widget output | target region | fallback if incomplete |
| --- | --- | --- | --- |
| `assistant_text` | `summary_card` | `maintenance.workorders.copilot` | If empty, render `empty_state` with no assistant summary |
| `insights` | `insight_list` | `maintenance.workorders.insights` or `maintenance.workorders.copilot` | Drop invalid items; if none remain, render `empty_state` |
| `workspace_payload.summary` | `summary_card` | `maintenance.workorders.copilot` | Use `assistant_text`; if both absent, `empty_state` |
| `workspace_payload.kpi_cards` | one or more `kpi_card` widgets | `maintenance.workorders.kpi.summary` | Drop invalid cards; preserve current KPI display outside registry until later |
| `workspace_payload.charts` | `trend_chart` or `data_table` | `maintenance.workorders.charts` | Render `data_table` preview when chart shape is unsupported; otherwise `error_state` |
| `workspace_payload.tables` | `data_table` | `maintenance.workorders.table` or `maintenance.workorders.copilot` | Bound rows/columns; invalid table becomes `error_state` |
| `workspace_payload.recommendations` | `insight_list` or `summary_card` | `maintenance.workorders.insights` | Require title/body; invalid items dropped |
| `workspace_payload.evidence` | `evidence_list` | `maintenance.workorders.evidence` or `maintenance.workorders.copilot` | Render evidence-missing fallback for AI insights when evidence is absent |
| `workspace_payload.actions` | `action_list_readonly` | `maintenance.workorders.actions.readonly` | Unknown/write-like targets are shown as rejected read-only explanations |
| `ui_actions` | `action_list_readonly` after existing validation | `maintenance.workorders.actions.readonly` | Preserve current apply/reject/ignore behavior; render only explanation rows |
| `trace`, `trace_id`, `source_tool_ids` | metadata attached to widgets and evidence entries | all AI-generated widget regions | Missing trace is allowed for non-AI empty states, but AI insight widgets must show degraded evidence state |
| `confidence`, `severity`, `limitations` | metadata on `summary_card` or `insight_list` | `maintenance.workorders.insights` | Missing confidence should display as unknown, not fabricated |

### Fallback behavior when payload is incomplete

- Missing `workspace_payload`: render `assistant_text` and validated `ui_actions` as current behavior allows.
- Missing `assistant_text`: use `workspace_payload.summary` if present.
- Missing evidence for AI-generated insight: render the insight only with an evidence-missing indicator and no source claims.
- Unknown chart shape: render a bounded `data_table` preview if rows are available.
- Unknown region: reject the widget and render an `error_state` in the copilot payload region.
- Unknown widget type: render `error_state` through `WidgetFallback`.
- Oversized rows, columns, series, evidence, or actions: truncate to registry limits and include a validation result.

## 7. Safety Model

### Widget type allowlist

Only registered widget types may render:

```text
kpi_card
summary_card
data_table
trend_chart
insight_list
evidence_list
action_list_readonly
empty_state
error_state
```

### Region allowlist

Widgets may target only registered `maintenance.workorders.*` regions listed in this plan. Unknown region IDs must not render into arbitrary page areas.

### Action target allowlist

Actions may reference only registered read-only `maintenance.workorders.*` action target IDs. Current local target names such as `workorder_table`, `mtbf_mttr_chart`, and `delay_reasons_chart` should be adapted to stable IDs at the boundary.

### Prohibited behavior

- no arbitrary JSX or component import;
- no HTML injection;
- no `eval`, dynamic function execution, or script execution;
- no backend-provided event handlers;
- no mutation requests triggered by widgets;
- no form submission widgets;
- no local storage writes from widget payloads;
- no route changes from widget payloads in Phase B0.

### Read-only action policy

Allowed action rendering is explanatory only:

- show proposed action intent;
- show validation status;
- show target region/action target;
- show whether the existing runtime applied, rejected, or ignored the action;
- do not expose an executable button for agent-provided actions.

### Trace and evidence requirements

AI-generated insight widgets should include:

- `trace_id` or explicit evidence-missing fallback;
- confidence if provided by backend;
- evidence references when claims are source-backed;
- source tool IDs when present;
- generated timestamp when present.

The UI must not fabricate trace IDs, source IDs, confidence, or evidence labels.

## 8. Testing Strategy

Recommended tests:

| test area | expected coverage |
| --- | --- |
| Registry lookup | registered `maintenance.workorders` surface, regions, widgets, and action targets resolve correctly |
| Invalid widget type fallback | unknown widget kind renders `error_state` and does not crash |
| Invalid region fallback | unknown region rejects widget and routes fallback to safe copilot payload area |
| Payload validation | missing required fields, oversized arrays, malformed chart/table data, and invalid evidence references are handled |
| Rendering unchanged | existing `maintenance.workorders` page behavior remains visually and functionally equivalent for current API/c copilot flows |
| Action target allowlist | allowed targets pass, legacy local target IDs adapt, write-like or unknown targets reject |
| Evidence fallback | AI insights without trace/evidence render degraded evidence state rather than unsupported source claims |
| Adapter compatibility | current `workspace_payload` maps to normalized widgets without backend changes |
| No executable payloads | HTML strings, component names, functions, and event handler fields are ignored or rejected |

Testing should avoid snapshot-only confidence. Prefer explicit assertions on rendered fallback states, validation results, and unchanged current controls.

## 9. Migration Sequence

### B0.1 Types and registry contracts

- Add shared registry types.
- Add static definitions for widget kinds, validation results, and surface/region/action target records.
- Add no rendering integration yet.

### B0.2 `maintenance.workorders` surface definition

- Add pilot surface definition with regions and action targets.
- Include legacy local target mapping for current runtime compatibility.
- Add tests for lookup and allowlist behavior.

### B0.3 Renderer and fallback

- Add `WidgetRenderer` and `WidgetFallback`.
- Render only locally constructed test payloads at first.
- Keep current page rendering unchanged.

### B0.4 Adapter from current workorder agent payload to widgets

- Add adapter for `OperationsWorkspacePreviewResponse` and current `workspace_payload`.
- Normalize to registered widget payloads.
- Keep backend contract unchanged.

### B0.5 Tests

- Add unit tests for registry, validation, fallback, allowlist, and adapter behavior.
- Add focused page test proving `maintenance.workorders` still renders current content and controls.

### B0.6 Optional documentation update

- Update Phase B readiness docs with actual implemented registry files and any adjusted constraints.
- Do not expand to other surfaces until pilot acceptance criteria are met.

## 10. Risks And Rollback

### Route/sidebar drift risk

The route/sidebar model is still split between `App.tsx` and `Sidebar.tsx`. Registry work must not assume route consistency across the whole app. The pilot should bind to `maintenance.workorders` by explicit surface ID, not by route inference alone.

Rollback: remove the pilot surface registration and adapter references. Leave route/sidebar code untouched.

### Accidental behavior change risk

`MaintenanceWorkorderTrackingPage.tsx` is already modified before this task. Integrating widgets directly into that page could accidentally change production behavior.

Rollback: keep initial registry modules side-effect-free; integrate through a narrow adapter only after tests pass.

### Existing modified file risk

Pre-existing tracked modifications must not be overwritten:

```text
package.json
scripts/test-operations-workspace-ui.mjs
src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx
```

Rollback: avoid editing these files in B0.1 and B0.2. If later integration requires the page file, inspect the existing diff first and make only minimal additive changes.

### Local/static data masking production readiness

Most other app surfaces are static/sample/local-only. Their presence can make the registry look broadly applicable before production contracts exist.

Rollback: keep the surface registry allowlist to `maintenance.workorders` only. Do not register static surfaces for rendering until each has a data and evidence contract.

### Backend schema drift risk

The backend does not yet emit the normalized widget schema. The adapter must tolerate missing or differently shaped current fields.

Rollback: treat adapter output as optional. If validation fails, fall back to current assistant text and current action summaries.

## 11. Acceptance Criteria Before Coding Starts

Coding should start only when the following are accepted:

- `maintenance.workorders` is the only pilot surface.
- The first implementation round is registry metadata and validation contracts, not page rendering changes.
- Widget types are limited to:
  - `kpi_card`
  - `summary_card`
  - `data_table`
  - `trend_chart`
  - `insight_list`
  - `evidence_list`
  - `action_list_readonly`
  - `empty_state`
  - `error_state`
- Regions are limited to the `maintenance.workorders.*` IDs listed in this plan.
- Agent-provided actions remain read-only explanations and cannot execute arbitrary behavior.
- Backend response shape remains unchanged for the first adapter implementation.
- Unknown widget types, unknown regions, invalid payloads, missing evidence, and unsupported action targets have explicit fallback behavior.
- Tests will be added before expanding beyond metadata and adapter scaffolding.
- Pre-existing tracked changes are treated as user-owned and are not overwritten.

