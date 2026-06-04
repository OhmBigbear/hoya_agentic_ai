# Stable Surface And Region ID Proposal

Stable IDs are required before a widget registry, adaptive UI schema renderer, or agent-driven UI action target registry can be introduced.

## Naming conventions

### `surface_id`

Format:

```text
<domain>.<surface>
```

Rules:

- lowercase ASCII only;
- dot-separated namespaces;
- nouns, not route strings;
- stable across route migration;
- unique per routed work surface;
- no UI layout terms unless the surface itself is a layout product.

Examples:

- `maintenance.workorders`
- `maintenance.knowledge_base`
- `production.performance`
- `engineering.raw_data`
- `admin.agents_config`

### `region_id`

Format:

```text
<surface_id>.<region>
```

Rules:

- identifies a stable on-screen area inside a surface;
- should survive component refactors;
- should describe purpose, not implementation;
- can be hierarchical for chart or drawer subregions;
- should not include user-specific state or selected entity IDs.

Examples:

- `maintenance.workorders.kpi.summary`
- `maintenance.workorders.filters`
- `maintenance.workorders.table`
- `maintenance.workorders.drawer`

### `widget_slot_id`

Format:

```text
<region_id>.<slot>
```

Rules:

- identifies where an approved widget type can render;
- must be declared by the frontend;
- must include max count, supported widget kinds, and fallback behavior in the future registry;
- should be stable for tests and backend schema references.

Examples:

- `maintenance.workorders.insights.primary`
- `maintenance.workorders.evidence.list`
- `maintenance.workorders.charts.mttr.primary`
- `maintenance.workorders.copilot.payload`

### `action_target_id`

Format:

```text
<surface_id>.<target>
```

Rules:

- identifies a read-only UI action target;
- must be allowlisted per surface;
- should map to a specific runtime capability such as filter, select, focus, highlight, open, sort, or time range;
- must not represent a backend mutation.

Examples:

- `maintenance.workorders.filters`
- `maintenance.workorders.table`
- `maintenance.workorders.drawer`
- `maintenance.workorders.charts.mttr`

## Reference surface: `maintenance.workorders`

Canonical route:

```text
/maintenance/workorders
```

Legacy alias:

```text
#station-maintenance-tracking
```

Backing component:

```text
src/app/components/StationMaintenanceTracking.tsx
src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx
```

## Proposed regions

| region_id | purpose | current implementation area | Phase B readiness |
| --- | --- | --- | --- |
| `maintenance.workorders.kpi.summary` | maintenance dashboard summary KPIs | summary cards fed by dashboard summary API | Ready for read-only KPI widget registration |
| `maintenance.workorders.filters` | workorder query/filter controls | date, status, priority, equipment filters | Ready as action target; widgets should not replace controls yet |
| `maintenance.workorders.table` | workorder row list and sort/highlight target | workorder table | Ready as read-only action target and table preview anchor |
| `maintenance.workorders.drawer` | selected workorder details | workorder detail drawer | Ready as open/select action target |
| `maintenance.workorders.charts.mttr` | MTBF/MTTR analytics | MTBF/MTTR chart | Ready as chart focus target |
| `maintenance.workorders.charts.hold_reasons` | hold reason distribution | hold reason chart | Ready as chart focus target |
| `maintenance.workorders.charts.frequency` | machine/workorder frequency | maintenance frequency chart | Ready as chart focus target |
| `maintenance.workorders.charts.history_signals` | inventory and repeat failure context | history signals chart/card | Ready as chart focus target |
| `maintenance.workorders.copilot` | maintenance copilot conversation | right-side copilot panel | Ready for payload and evidence widgets with constraints |
| `maintenance.workorders.insights` | generated insights and recommendations | workspace payload insight blocks | Ready for read-only insight widgets |
| `maintenance.workorders.evidence` | source evidence, tool references, and trace links | partial evidence rendering in payload and messages | Needs unified trace/evidence contract |
| `maintenance.workorders.sync_diagnostics` | local action status and synchronization diagnostics | collapsible diagnostics/action history | Useful for development; production display needs operator-friendly wording |

## Proposed widget slots

| widget_slot_id | allowed initial widget kinds | notes |
| --- | --- | --- |
| `maintenance.workorders.kpi.summary.primary` | `kpi_card`, `kpi_group` | Read-only summary values only |
| `maintenance.workorders.insights.primary` | `insight_card`, `recommendation_card` | Requires confidence and evidence metadata |
| `maintenance.workorders.evidence.list` | `evidence_list` | Must support empty/fallback state |
| `maintenance.workorders.charts.mttr.primary` | `line_chart`, `bar_chart`, `table_preview` | Frontend chooses approved renderer from registry |
| `maintenance.workorders.charts.hold_reasons.primary` | `bar_chart`, `table_preview` | No arbitrary chart config |
| `maintenance.workorders.charts.frequency.primary` | `bar_chart`, `table_preview` | No arbitrary chart config |
| `maintenance.workorders.table.preview` | `table_preview` | Read-only, bounded rows and columns |
| `maintenance.workorders.copilot.payload` | `insight_card`, `evidence_list`, `table_preview`, `action_preview` | Copilot payload area only |

## Proposed read-only action targets

| action_target_id | supported action families | existing local equivalent |
| --- | --- | --- |
| `maintenance.workorders.filters` | set filter, set time range | operations workspace filters |
| `maintenance.workorders.table` | select row, highlight rows, sort table | `workorder_table` target |
| `maintenance.workorders.drawer` | open selected workorder | selected workorder drawer |
| `maintenance.workorders.charts.mttr` | focus chart | `mtbf_mttr_chart` target |
| `maintenance.workorders.charts.hold_reasons` | focus chart | `delay_reasons_chart` target |
| `maintenance.workorders.charts.frequency` | focus chart | `maintenance_frequency_chart` target |
| `maintenance.workorders.charts.history_signals` | focus chart | `maintenance_history_signals` target |
| `maintenance.workorders.insights` | activate insight | active insight state |
| `maintenance.workorders.evidence` | open evidence or trace reference | not fully implemented |

## ID stability rules for Phase B

- Backend payloads may reference only registered `surface_id`, `region_id`, `widget_slot_id`, and `action_target_id` values.
- Unknown IDs must render a safe fallback or be ignored with an operator-readable explanation.
- IDs must not be generated from display labels.
- Visual component names must not leak into IDs.
- IDs must remain stable across route migration from hashes to paths.

