# Phase B Widget Registry Readiness

Phase B should begin with a small read-only registry pilot, not a full adaptive UI schema renderer.

## Readiness checklist

| area | status | readiness requirement |
| --- | --- | --- |
| Stable route map | Not ready | Add a route registry or equivalent metadata source before using backend-provided route/surface references |
| Stable surface IDs | Ready as proposal | Adopt `surface_id` values from `08-ui-surface-inventory.md` and keep them independent from current hash/path strings |
| Stable region IDs | Ready as proposal for `maintenance.workorders` | Register `maintenance.workorders` regions before accepting widget placement payloads |
| Supported widget types | Partially ready | Start with read-only `kpi_card`, `kpi_group`, `insight_card`, `recommendation_card`, `evidence_list`, `table_preview`, `bar_chart`, `line_chart`, and `action_preview` |
| Read-only UI action policy | Partially ready | Preserve current writeback blocking; move supported targets into registry metadata |
| Trace/evidence contract | Partially ready | Trace IDs and evidence fields exist, but there is no unified trace/evidence viewer or evidence rendering standard |
| Schema validation boundary | Not ready | Define local runtime validation for widget payloads before rendering backend-provided schema |
| Fallback rendering | Not ready | Define fallback UI for unknown widget type, unknown region, invalid payload, oversize payload, empty data, and unsupported action |
| Security allowlist | Partially ready | Current UI action validation is conservative; extend with registered widget kind and target allowlists |
| Test coverage | Partially ready | Existing maintenance workorder UI tests cover some runtime behavior; add registry, fallback, unknown payload, and route metadata tests |

## Minimum Phase B entry criteria

Phase B can start only as a constrained implementation if the first work item is registry scaffolding for `maintenance.workorders`. It should not start with arbitrary backend schema rendering.

Required first-step constraints:

- no writeback widgets;
- no backend-selected React components;
- no unregistered regions;
- no unbounded chart/table payloads;
- no mutation actions;
- no visual styling changes;
- no route behavior changes unless covered by the route registry migration plan.

## Recommended first implementation target

Use `maintenance.workorders` as the first target because it already has:

- API-backed maintenance data;
- Agentic Core preview response handling;
- read-only local UI action validation;
- chart/table/drawer synchronization;
- partial trace metadata;
- a concrete set of proposed regions and action targets.

The first implementation should create registry metadata for `maintenance.workorders` and use it to validate local widget/action target IDs. Rendering should remain equivalent to current behavior until validation and fallback tests pass.

## Initial widget type policy

| widget kind | allowed in Phase B | required metadata |
| --- | --- | --- |
| `kpi_card` | yes | label, value, unit or formatter, trend optional, evidence optional |
| `kpi_group` | yes | bounded list of KPI cards |
| `insight_card` | yes | title, summary, severity, confidence, evidence references |
| `recommendation_card` | yes | recommendation text, rationale, confidence, read-only action previews |
| `evidence_list` | yes | source label, source type, timestamp optional, trace/source IDs optional |
| `table_preview` | yes | bounded columns and rows, no editable cells |
| `bar_chart` | yes | bounded series, approved axes, no arbitrary renderer config |
| `line_chart` | yes | bounded series, approved axes, no arbitrary renderer config |
| `action_preview` | yes | read-only action description and validation result |
| form/input widgets | no | Defer until approval, audit, and mutation policy exist |
| prompt/tool editing widgets | no | Defer until control-plane contracts and audit are production-ready |

## Test coverage needed before expanding beyond pilot

- route registry maps every visible sidebar entry to a handled component or explicit unavailable state;
- `maintenance.workorders` exposes stable surface, region, slot, and action target IDs;
- unknown widget kinds render fallback without crashing;
- unknown region and slot IDs are rejected or ignored with explanation;
- oversized payloads are bounded;
- write-like actions remain rejected;
- trace/evidence references render safely when present and degrade clearly when missing;
- widget rendering does not alter existing visual styling or layout for current payloads.

