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
