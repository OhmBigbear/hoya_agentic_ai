# Spec022 Round 4: Workorder Runtime Widget Payload Mapping

Runtime workorder widgets are mapped through Hoya UI contracts before reaching the existing widget registry and safe renderer. Runtime payloads do not name React components or registry component implementations.

The primary rendering surface for these widgets is the main Station Maintenance Tracking / Workorder Tracking page content area. Runtime widgets must be visible to users in that main workorder surface, not only in Copilot chat messages or developer diagnostics.

The Copilot panel remains available as a conversational assistant and developer/operator diagnostics surface. It may show runtime fetch status, trace details, validation diagnostics, and preview rendering, but it is not the primary widget surface.

## Runtime Widget Contract

Each entry in the runtime response `widgets` array uses:

```json
{
  "id": "runtime-workorder-table",
  "payload_version": "1.0",
  "widget_type": "workorder_table",
  "title": "Runtime workorders",
  "summary": "Optional plain text summary",
  "payload": {},
  "trace_metadata": {},
  "diagnostics": {}
}
```

The runtime response envelope remains `payload_version: "2.0"` from the Workorder Agent endpoint. Widget payload contracts currently support only widget `payload_version: "1.0"`.

## Supported Widget Types

- `workorder_summary` maps to a registry `summary_card`.
- `workorder_table` maps to a registry `data_table`.
- `workorder_list` maps to a registry `data_table`.
- `workorder_status_insight` maps to a registry `insight_list`.
- `workorder_insight` is accepted as a runtime contract alias for `workorder_status_insight` and maps to a registry `insight_list`.

Unknown `widget_type`, unsupported widget `payload_version`, missing `payload`, and schema mismatches are rejected into runtime diagnostics and are not rendered. The main Workorder Tracking page must still show a safe fallback state when a runtime payload is unavailable, invalid, or contains no supported main-surface widgets.

## Main Surface Mapping

- `workorder_summary` renders in the main runtime summary region above the existing static KPI/table content.
- `workorder_table` and `workorder_list` render in the main runtime workorder list/table region.
- `workorder_status_insight` renders in the main runtime insight region when supplied.
- Error and empty widgets render through the safe renderer as main-surface fallback states.
- Existing static Maintenance Runtime API cards, table, and analytics remain available as the baseline Workorder Tracking page content.

## Readonly Actions

Runtime actions continue to use `readonly_actions` and must specify `mode: "readonly"`. Supported Round 4 action IDs are:

- `view_workorder`
- `view_machine`
- `view_history`
- `show_details`

Actions map to local navigation-only UI intents. They do not call mutation APIs, write back to backend systems, or change production data.

## Round 4C State Propagation

Round 4C publishes runtime-compatible widget payloads from the Copilot/runtime response into a page-scoped Workorder Tracking workspace state before rendering. The main Workorder Tracking page is the primary user-facing widget surface. The Copilot panel remains a secondary assistant, diagnostics, and developer preview surface.

State flow:

```text
Runtime Response
  -> Widget Extractor/Adapter
  -> Workorder Runtime Widget Store
  -> WorkorderRuntimeMainSurface
```

The page-scoped runtime widget store holds the latest adapted widgets, source (`runtime`, `fallback`, `fixture`, or `copilot`), payload identity, validation status, rejected widget count, runtime diagnostic count, widget types, trace id, agent id, run id, client trace id, runtime trace id, and payload version. New Copilot responses replace the current store when they include a workorder-compatible `workspace_payload`. Runtime fetches set the store to `loading`, then replace it with the runtime result or a safe invalid/error state.

The main `WorkorderRuntimeMainSurface` subscribes to this store and renders supported widgets above the baseline Maintenance Runtime API cards, table, and analytics. It no longer depends only on the standalone runtime diagnostics payload, so a Copilot response that adapts into workorder widgets can populate the main workspace immediately.

Fallback behavior:

- No runtime payload yet: show the empty main-surface state.
- Runtime payload received but no compatible widgets: show a safe no-compatible-widgets fallback.
- Invalid payload: mark validation invalid and show the main fallback instead of crashing.
- Unknown widget type, bad payload version, or schema mismatch: reject that widget into diagnostics and render any remaining valid widgets.
- Read-only actions remain navigation-only no-ops; mutation-style actions are rejected by the existing action registry.

## Known Limitations

- The widget store is intentionally scoped to the Workorder Tracking page instance and is not shared globally across app navigation.
- Runtime widgets are replaced wholesale by the latest compatible Copilot/runtime payload; there is no multi-run history in the main surface.
- The main surface renders the approved registry widget contracts only. Runtime payloads still cannot reference React component names or request arbitrary components.
- Runtime widget actions remain read-only/navigation-only; no write-back or mutation flow is implemented.

## Round 4D UX Polish Phase 1

Round 4D Phase 1 keeps the Round 4A/4B/4C runtime contracts, widget adapter behavior, workspace state propagation, diagnostics, readonly action policy, sidebar, top navigation, and shell layout unchanged. The work is presentation-layer only inside `WorkorderRuntimeMainSurface`.

Layout zones:

- Executive Summary: KPI-style cards for Total Matching Work Orders, Open Work Orders, Risk Candidates, and Confidence.
- Operational Insights: business-readable insight cards with severity, confidence, and recommendation areas.
- Workorder Analysis: grouped workorder sample/table rendering with an adjacent evidence summary.
- Recommended Actions: readonly recommendation cards backed by existing navigation-only action widgets.
- Developer diagnostics: collapsible trace, validation, rejected widget, runtime diagnostic, payload, agent, run, and widget type details.

User-facing hierarchy:

- The workspace now leads with operator context instead of registry/debug terminology.
- Runtime source and refresh controls remain in the surface header without changing runtime fetch behavior.
- KPI cards use a responsive 1/2/4-column grid so the main workspace stays readable beside the Copilot panel at 1366px, 1440px, and 1920px widths.
- Table and evidence content use constrained responsive grid tracks and horizontal overflow protection to avoid awkward stretching or overlap.
- Empty, loading, unavailable, invalid, and unsupported-payload states use operator-friendly messages before diagnostics.

Diagnostics strategy:

- Diagnostics remain present and visible in the rendered markup.
- Diagnostics are moved behind a `Developer diagnostics` disclosure so they no longer dominate the primary operator workflow.
- Rejected widgets and runtime diagnostics continue to be reported without exposing unsupported widget blocks as business content.
- The Copilot panel remains available as the secondary assistant and diagnostics surface.

Remaining polish backlog for Round 4D Phase 2:

- Add visual screenshot coverage at 1366px, 1440px, and 1920px with Copilot open.
- Tune KPI derivation once runtime payloads provide explicit total/open/risk fields instead of inferred table and summary values.
- Add richer evidence summaries when runtime widgets include source confidence, timestamp, and tool provenance fields.
- Add focused keyboard and accessibility review for readonly recommendation cards and diagnostics disclosure.
- Consider a compact density mode if future runtime payloads include larger workorder tables.
