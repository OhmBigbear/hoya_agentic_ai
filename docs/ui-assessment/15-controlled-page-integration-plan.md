# Phase B0.6 Controlled Page Integration Plan

## Scope

This plan covers future integration of the B0 `maintenance.workorders` widget registry pipeline into `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`.

No application code, tests, route/sidebar wiring, or package metadata should be changed during Phase B0.6. The page is treated as high-risk because it is large, stateful, currently dirty in the worktree, and already owns live API loading, local workspace synchronization, assistant preview rendering, table/chart focus, and drawer behavior.

## 1. Current Page Anatomy

### Major State Groups

`MaintenanceWorkorderTrackingPage` owns these state groups:

| State group | Local state | Purpose |
| --- | --- | --- |
| Maintenance page data | `workorders`, `summary`, `holdReasons`, `repeatFailures`, `stockRisk`, `loading`, `error` | API-backed page data and partial failure reporting |
| Filters and pagination | `filters`, `debouncedFilters`, `page`, `totalWorkorders` | Query construction, search, filter controls, page navigation |
| Workorder detail | `selectedWorkorderNo`, `detailState` | Drawer selection and lazy detail/history/parts loading |
| Copilot panel | `isCopilotOpen`, `inputMessage`, `isCopilotSending`, `copilotError`, `messages` | Assistant drawer visibility, input, request lifecycle, rendered conversation |
| Operations workspace runtime | `operationsWorkspace.state` plus `applyAction` / `applyActions` from `useOperationsWorkspaceRuntime()` | Local-only synchronization for selected entities, focused charts, highlighted rows, table sort, time range, action history |

Derived state:

- `kpis` from `buildKpis(summary, workorders, stockRisk)`.
- `mttrTrend` from `buildMttrTrend(summary)`.
- `frequencyData` from `buildFrequencyData(workorders, repeatFailures)`.
- `sortedWorkorders` from `sortWorkorders(workorders, operationsWorkspace.state.tableSorts.workorder_table)`.
- `selectedWorkorder` from the current page rows or cached detail state.
- `totalPages` from `totalWorkorders` and local `pageSize`.

### Data Sources

The page is production API-backed. The main page load uses Maintenance Runtime API calls from `src/services/maintenanceWorkorderApi.ts`. The copilot preview uses Agentic Core through `requestOperationsWorkspacePreview`.

There is no in-page fixture import and no explicit sample/mock dataset in `MaintenanceWorkorderTrackingPage.tsx`. The closest local fallback data is structural, not sample data:

- `emptySummary` provides zeroed dashboard defaults.
- loading skeletons are generated with fixed index arrays.
- chart colors are static.
- empty/error text handles API no-data or partial-failure states.

### API and Service Calls

Initial and filter/page-driven load:

- `getWorkorderTracking(query)`.
- `getMaintenanceDashboardSummary(summaryQuery)`.
- `getHoldReasonSummary({ limit: 10, department })`.
- `getRepeatFailureCandidates({ limit: 10, equipment_no })`.
- `getStockRiskSummary({ limit: 10 })`.

Detail drawer lazy load:

- `getWorkorderDetail(workorderNo)`.
- `getSparePartUsageByWorkorder(workorderNo)`.
- `getMachineMaintenanceHistory(equipmentNo, { limit: 5 })` when `equipment_no` exists.

Copilot preview:

- `previewRequest`, defaulting to `requestOperationsWorkspacePreview`.
- Request body is built from `inputMessage`, `buildOperationsWorkspacePreviewFilters(filters, operationsWorkspace.state, selectedWorkorder)`, and `limit: 5`.
- The `services` prop allows tests or callers to inject `requestOperationsWorkspacePreview`.

### Agent Preview and Workspace Payload Handling

`handleSendMessage` currently:

1. Appends a user `ChatMessage`.
2. Calls `previewRequest`.
3. Applies returned `preview.ui_actions` through `applyLiveUiActions`.
4. Appends an assistant `ChatMessage` containing:
   - `assistant_text`.
   - `insights`.
   - `ui_actions`.
   - `workspace_payload`.
   - local `actionResults`.

Structured assistant rendering is handled by `AssistantStructuredBlocks`:

- `WorkspacePayloadInsight` renders `workspacePayload` first.
- Then insight cards render and can call `onInsightSelected`.
- Then UI action previews render with applied/rejected/ignored badges.

`WorkspacePayloadInsight` renders the current legacy workspace payload directly:

- summary card.
- KPI cards.
- charts/tables through `WorkspacePayloadChartBlock`.
- recommendations.
- evidence.
- limitations.

This is the most natural future adapter source because `adaptWorkorderAgentPayloadToWidgets` was built for the current workorder agent payload shape, but it is also high-risk because it is inside the assistant conversation rendering path.

### Table, Chart, and Drawer Interactions

Table:

- `MaintenanceWorkorderTable` owns filter controls through props and calls `onFiltersChange`.
- Rows call `onOpenWorkorder(workorder)` on click and Enter key.
- Highlight and selected styles come from workspace state.
- Pagination uses `onPageChange`.
- Sorting is not controlled by table header UI; it is applied from `operationsWorkspace.state.tableSorts.workorder_table`.

Drawer:

- `openWorkorderDrawer(workorder, synchronize = true)` selects the workorder, optionally applies a local `open_detail_panel` workspace action, and lazily fetches detail/parts/history.
- Escape closes the drawer.
- `WorkorderDetailDrawer` and `WorkorderDetailPanel` render cached or fetched detail data.

Charts:

- `MaintenanceAnalyticsSection` contains MTTR, delay reasons, maintenance frequency, and maintenance history/stock risk cards.
- Chart cards call `handleChartFocus(chartId)`.
- `handleChartFocus` validates known local targets and applies `focus_chart` actions with related entity ids.
- Focused charts are visually ringed.
- Frequency chart bars use highlighted entity ids.

### Filters and Search State

`WorkorderFilters` includes:

- `search`.
- `status`.
- `machine`.
- `workType`.
- `priority`.
- `overdueOnly`.
- `waitingPartsOnly`.

Filter changes are debounced for 300ms before API reload. The debounced effect also resets `page` to `0`. `buildWorkorderQuery` maps UI filters to `MaintenanceQueryFilters` with `limit` and `offset`.

Agent preview filters are separate from Maintenance API filters. `buildOperationsWorkspacePreviewFilters` sends the current table filter state plus workspace context such as selected workorder, selected machine, focused chart, time range, selected insight, and highlighted entities.

### Action Handling

There are two local action layers:

1. Workspace runtime actions:
   - `operationsWorkspace.applyAction`.
   - `operationsWorkspace.applyActions`.
   - Used for row selection, chart focus, insight synchronization, rejected/ignored action recording, and applied live actions.

2. Page-specific action effects in `applyHoyaUiAction`:
   - `set_filter` mutates local filters.
   - `clear_filter` resets filters.
   - `open_detail_panel` opens the drawer only if the workorder exists in the current result set.
   - `focus_chart`, `set_time_range`, `highlight_entities`, and `sort_table` are treated as applied for workspace runtime handling.
   - unsupported action types are rejected.

Known local targets are limited by `isKnownOperationsWorkspaceTarget`:

- `workorder_table`.
- `workorder_drawer`.
- `maintenance_dashboard`.
- `mttr_trend_chart`.
- `delay_reasons_chart`.
- `maintenance_frequency_chart`.
- `maintenance_history_signals`.

The B0 widget registry action target ids are different and intentionally namespaced under `maintenance.workorders.actions.*`, so any bridge from readonly widget actions to existing local behavior must be explicit and small.

### Trace and Evidence Rendering

Current page-level trace/evidence behavior is limited:

- `WorkspacePayloadInsight` renders legacy `payload.evidence`.
- `WorkspacePayloadInsight` renders summary limitations.
- `AssistantStructuredBlocks` renders insight summaries and UI action validation/application results.
- The visible assistant message content, insight cards, workspace payload block, and action result badges are evidence-adjacent, but there is no generic trace viewer.
- B0 renderer can render `traceRefs` and `evidenceRefs` from widgets, but this is not integrated into the page.

### Test Hooks and `data-testid`

The page currently exposes these `data-testid` hooks:

- `maintenance-copilot-scroll-area`.
- `maintenance-copilot-empty-state`.
- `workspace-synchronization-diagnostics`.
- `workspace-payload-section`.

Existing tests reference the page/component exports and assistant markup, especially:

- `tests/operations-workspace-live-runtime-ui.test.tsx`.
- `tests/operations-workspace-synchronization-ui.test.tsx`.
- B0 registry tests under `tests/ui-registry*.test.tsx`.

Any future integration must avoid renaming these hooks or moving them when the feature flag is disabled.

## 2. Integration Insertion Points

| Pipeline element | Candidate insertion point | Classification | Reasoning |
| --- | --- | --- | --- |
| `adaptWorkorderAgentPayloadToWidgets` | Inside `handleSendMessage` after `preview` returns, deriving widgets from `preview.workspace_payload` and storing non-rendered diagnostic state | Medium risk | Close to the source payload and easy to keep shadow-only, but `handleSendMessage` already controls chat append, action application, error handling, and send lifecycle |
| `adaptWorkorderAgentPayloadToWidgets` | Inside `AssistantStructuredBlocks` or a child wrapper, deriving widgets from `message.workspacePayload` during render | Low risk for shadow-only, medium risk if rendered | Avoids changing request/action lifecycle and can be pure, but repeated render-time adaptation may complicate diagnostics and tests |
| `validateWidgetList` | Immediately after adaptation with `maintenanceWorkordersSurface` | Low risk | Pure validation with no UI mutation; validation result can be logged/stored only when flag-enabled |
| `validateWidgetList` | Inside render path before `renderUiWidgetList` | Medium risk | Ensures rendered widgets are checked, but validation fallback behavior and visible diagnostics can affect markup |
| `renderUiWidgetList` | Developer-only preview below current `WorkspacePayloadInsight` in assistant structured blocks | Medium risk | Keeps existing payload UI intact and adds a contained visual preview only when flag-enabled; assistant drawer width and scroll behavior are still visual regression risks |
| `renderUiWidgetList` | Replace `WorkspacePayloadInsight` | High risk | Would change existing user-facing assistant output and likely break tests/expectations |
| `renderUiWidgetList` | Replace KPI cards, table, chart section, or drawer regions | High risk | These regions are live, API-backed, interactive, styled, and synchronized; registry renderer is generic and not a layout-compatible production replacement yet |
| `maintenanceWorkordersSurface` | Pass as `surface` to validation and renderer wherever widgets are adapted/rendered | Low risk | Static definition and currently marked `rendering: 'not_integrated'`; should be imported only in flag-gated code during coding rounds |
| readonly action callback | No-op callback that records selected readonly action in local diagnostic state | Low risk | Does not mutate filters, drawer, workspace runtime, or backend state |
| readonly action callback | Explicit map to existing local preview/filter behavior for `filter_by_machine`, `filter_by_status`, `filter_by_priority`, `preview_workorder`, `preview_machine`, `open_copilot_context` | Medium risk | Can reuse existing local behavior, but it crosses action vocabularies and must be narrowly tested |
| readonly action callback | Generic passthrough to `applyLiveUiActions` or `operationsWorkspace.applyAction` | High risk | B0 target ids and current workspace action targets do not match; generic passthrough could silently mutate state incorrectly |

## 3. Recommended Integration Strategy

Recommended strategy: **A. Shadow mode only** for the first coding round.

Rationale:

- The page is already dirty and high-risk.
- The current user-facing assistant payload renderer is functional and tested.
- The B0 renderer is generic and unstyled relative to the current production page.
- Shadow mode can prove adapter compatibility against real `preview.workspace_payload` without layout or behavior changes.
- It allows measurement of malformed payloads, validation errors, dropped unsupported actions, and widget counts before any visible UI is exposed.

After shadow mode proves stable, the next safest visible step is **B. Developer-only preview panel** inside the assistant structured block, gated behind a separate developer flag or the same flag plus development mode. Strategies C and D should be deferred until B0 shadow and dev-only behavior are proven by tests.

## 4. Feature Flag and Safety Switch Design

Flag name: `VITE_MAINTENANCE_WORKORDERS_WIDGET_REGISTRY`.

Default state: disabled.

Recommended interpretation:

- Enabled only when the env value is exactly `1`, `true`, or `enabled`.
- Any missing, empty, or unrecognized value is disabled.

Where it should live:

- Centralize parsing in the existing environment/config layer, likely `src/shared/config/env`.
- Export a boolean such as `MAINTENANCE_WORKORDERS_WIDGET_REGISTRY_ENABLED`.
- The page should consume only the boolean, not parse `import.meta.env` directly.

Instant disable path:

- Set `VITE_MAINTENANCE_WORKORDERS_WIDGET_REGISTRY=0` or remove the env var.
- Rebuild/redeploy the UI artifact.
- If a runtime-config mechanism exists later, the same boolean should be backed by runtime config so disable does not require rebuilding.

Disabled contract:

- No new imports should execute adaptation/rendering in the page path when disabled, except inert flag import.
- No new state should affect rendering.
- No extra backend/API calls.
- No changes to existing table, chart, drawer, filter, assistant, workspace synchronization, or test hook markup.
- No visible layout changes.

## 5. No-Regression Contract

The following must remain unchanged when the flag is disabled:

- Existing table behavior:
  - API-backed rows, loading skeletons, empty state, pagination, row click, Enter key, highlight and selected styling.
  - Sorting by `operationsWorkspace.state.tableSorts.workorder_table`.

- Existing chart behavior:
  - Four chart cards remain rendered by `MaintenanceAnalyticsSection`.
  - Chart focus target ids and visual focus ring remain unchanged.
  - Highlighted frequency bars remain based on workspace entity ids.

- Existing drawer behavior:
  - Row selection opens the drawer.
  - Detail, parts, and machine history are lazily fetched and cached.
  - Escape and close button dismiss the drawer.
  - Partial detail failures are shown as they are today.

- Existing filters:
  - Search/status/machine/work type/priority/overdue/parts controls remain unchanged.
  - 300ms debounce and page reset remain unchanged.
  - `buildWorkorderQuery` output remains unchanged.

- Existing workorder preview behavior:
  - Copilot sends the same request payload to the same preview endpoint.
  - `preview.ui_actions` continue to flow through `applyLiveUiActions`.
  - `preview.workspace_payload` continues to render through `WorkspacePayloadInsight`.
  - Existing insight click synchronization remains unchanged.

- Existing test expectations:
  - Current `data-testid` hooks remain.
  - Existing server-rendered assistant markup remains when flag-disabled.
  - Current unit tests continue to pass without updates to expected disabled behavior.

- Existing user-facing layout:
  - No layout, spacing, panel width, or visible copy changes unless the flag is explicitly enabled.

## 6. Test Plan for Next Coding Round

Add or update tests only in the next coding round, not in B0.6.

Exact tests to add/update:

| Case | Expected assertion |
| --- | --- |
| Flag disabled equals current behavior | Rendering a message with `workspacePayload` still includes `workspace-payload-section`, existing payload text, existing action/insight blocks, and no widget preview wrapper or `aria-label="UI widgets"` from the registry renderer |
| Flag enabled renders widget preview | Rendering a message with `workspacePayload` and the flag enabled shows a contained widget preview with `renderUiWidgetList`, `maintenanceWorkordersSurface`, and generated `data-widget-id` values |
| Malformed payload safe fallback | A malformed `workspacePayload` or malformed widget adapter input renders only safe registry fallback/normalized widgets and does not throw |
| Unsupported action target not rendered | A payload containing unsupported readonly action targets does not render buttons for unsupported targets; allowed `maintenance.workorders.actions.*` targets remain |
| Readonly callback does not mutate by default | Invoking a readonly action in B0.6.1/B0.6.2 records or ignores the event without changing filters, drawer selection, workspace state, or sending fetch requests |
| Explicit readonly mappings mutate only mapped local state | In B0.6.3, `filter_by_machine`, `filter_by_status`, and `filter_by_priority` may map to existing local filter changes only when explicitly tested; preview-only targets may open local preview context only when explicitly mapped |
| No backend/API calls added | Spy on `fetch`; widget adaptation/rendering must not add calls beyond the existing maintenance API and copilot preview calls |
| No dangerous primitives | Existing source scan for `dangerouslySetInnerHTML`, `eval(`, and `new Function` should include any page integration wrapper code |
| Disabled import/render stability | With the flag disabled, tests should verify `adaptWorkorderAgentPayloadToWidgets`, `validateWidgetList`, and `renderUiWidgetList` are not needed to produce the current UI result |
| Existing hooks preserved | `maintenance-copilot-scroll-area`, `maintenance-copilot-empty-state`, `workspace-synchronization-diagnostics`, and `workspace-payload-section` remain present in current scenarios |

Candidate test locations:

- Add page-level flag tests near `tests/operations-workspace-synchronization-ui.test.tsx` or a new focused page integration test.
- Keep pure adapter/renderer coverage in the existing `tests/ui-registry*.test.tsx` suite.

## 7. Recommended Coding Sequence

### B0.6.1 Feature Flag and Shadow Adapter Only

- Add centralized flag parsing.
- Import B0 registry functions only where necessary.
- Adapt `preview.workspace_payload` to widgets in shadow mode after successful preview response or in a pure helper.
- Validate with `validateWidgetList(widgets, maintenanceWorkordersSurface)`.
- Store only non-rendered diagnostics if needed, such as widget count and validation status.
- No visual output.
- No readonly action callbacks.
- No backend/API calls.

### B0.6.2 Hidden or Developer-Only Widget Preview Panel

- Add a contained developer-only preview under the existing assistant workspace payload block.
- Render with `renderUiWidgetList(widgets, { surface: maintenanceWorkordersSurface })`.
- Keep `WorkspacePayloadInsight` as the canonical user-facing rendering.
- Ensure the panel is absent when disabled.
- Ensure assistant scroll and layout remain stable.

### B0.6.3 Controlled Readonly Action Mapping

- Add an explicit readonly action callback.
- Start with no-op diagnostics.
- Map only allowlisted registry action targets to existing local preview/filter behavior:
  - `maintenance.workorders.actions.filter_by_machine`.
  - `maintenance.workorders.actions.filter_by_status`.
  - `maintenance.workorders.actions.filter_by_priority`.
  - optional preview-only workorder/machine context if it does not fetch new data or mutate backend state.
- Do not pass readonly action events generically into `applyLiveUiActions`.

### B0.6.4 Optional Small Region Pilot

- Pilot one non-critical, contained region only after B0.6.1-B0.6.3 are green.
- Preferred pilot: assistant-only evidence or insight preview, not table/charts/drawer.
- Keep legacy rendering visible and authoritative until visual parity and accessibility are proven.

### B1 Route/Sidebar Cleanup or Broader Page Integration

- Route/sidebar cleanup and broader page integration belong after B0.6.
- Table, KPI, chart, or drawer replacement should be B1+ work with dedicated visual, interaction, and regression tests.

## 8. Risks and Rollback

Page complexity risk:

- The page combines API loading, debounced filters, local workspace state, assistant preview, UI action application, chart focus, and drawer fetches in one file. Seemingly small changes in the assistant flow can affect page state.

Dirty file risk:

- The worktree already has dirty `package.json`, `scripts/test-operations-workspace-ui.mjs`, and `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`.
- Future coding should inspect diffs before editing and avoid broad format/rewrite operations.

Visual regression risk:

- The current page uses a dense, custom dark layout. The B0 renderer is generic semantic markup. Direct replacement would likely degrade visual quality and layout fit.

Test fragility risk:

- Existing tests assert assistant rendered text and synchronization behavior. Adding visible widget output may change server-rendered markup and brittle text matching.

Data contract mismatch risk:

- Current copilot payload is `workspace_payload`; B0 adapts the current shape but backend payloads may be incomplete, malformed, or evolve differently from registry widgets.
- Registry readonly action targets are namespaced and do not match current `UiActionPreview.target` ids.

Rollback strategy:

- Primary rollback is disable `VITE_MAINTENANCE_WORKORDERS_WIDGET_REGISTRY`.
- B0.6.1 should be removable by reverting only flag/shadow helper changes.
- B0.6.2 preview panel should be isolated enough to remove without touching existing `WorkspacePayloadInsight`.
- B0.6.3 action mapping should be isolated in one explicit callback/helper so it can be disabled independently.
- Do not make table/chart/drawer replacement changes until rollback can be limited to a small component boundary.

## 9. Acceptance Criteria Before Coding B0.6.1

Go criteria:

- The current dirty worktree is reviewed and the B0.6.1 diff scope is limited to the flag, one small adapter/validation helper, and focused tests.
- Product/engineering agrees the first implementation is shadow-only with no visible UI.
- `VITE_MAINTENANCE_WORKORDERS_WIDGET_REGISTRY` defaults disabled.
- Disabled behavior has explicit tests proving current assistant payload rendering remains unchanged.
- B0 registry exports are stable from `src/ui-registry/index.ts`.
- No route/sidebar changes are included.
- No package dependency changes are required.
- No backend/API contract change is required.

No-go criteria:

- Any need to rewrite `MaintenanceWorkorderTrackingPage.tsx` broadly.
- Any requirement to replace table, chart, drawer, KPI, or existing assistant payload UI in B0.6.1.
- Any new backend/API call from widget rendering.
- Any generic action passthrough from registry readonly actions to existing workspace actions.
- Any inability to prove flag-disabled behavior is unchanged.

## Recommendation Summary

Use **A. Shadow mode only** for the first integration step. The safest first coding round is **B0.6.1 feature flag plus shadow adapter/validation only**, with no visible rendering and no action callback behavior. The highest-risk areas are `handleSendMessage`, `AssistantStructuredBlocks`, `WorkspacePayloadInsight`, `applyLiveUiActions`, and any attempt to replace the live table/chart/drawer regions.
