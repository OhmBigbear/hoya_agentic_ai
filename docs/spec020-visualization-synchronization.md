# Spec 020 Visualization Synchronization

Round 5C moves the Operations Workspace from independent dashboard mutations to a synchronized conversational visualization model. The behavior is local to the Hoya UI runtime and does not mutate backend APIs, ToolRuntime, or uploaded tools.

## Synchronization Model

The shared state lives in `OperationsWorkspaceState`. Existing fields remain intact, with synchronized fields layered on top:

- `selectedMachineId`
- `selectedWorkorderId`
- `selectedInsightId`
- `selectedChartId`
- `synchronizedEntityContext`
- `synchronizedTimeRange`
- `visualizationFocusTarget`
- `activeInsightIds`

All UI actions continue through the read-only local runtime. Accepted actions update visualization state and action history. Rejected synchronization actions are also recorded in history so the Copilot panel can explain why a target was ignored.

## Shared Visualization Context

`synchronizeVisualizationContext()` is the common helper for aligning table, chart, drawer, insight, and time range state. It derives:

- selected machine and workorder IDs
- active insight IDs
- focused chart ID
- highlighted entity IDs
- the current visualization focus target
- the synchronized time range

`deriveEntityContext()` normalizes the selected entity from explicit action metadata, entity IDs, or existing context. `buildVisualizationFocusState()` records which surface currently owns focus.

## Focus Model

Focus is intentionally lightweight:

- focused charts keep the existing subtle cyan ring/glow
- selected or highlighted workorder rows use the existing cyan emphasis
- selected insight cards use a compact cyan border/background
- diagnostics show the current synchronized focus without changing layout

No sidebar, navigation, backend contract, or visual theme changes are required.

## Entity Synchronization

Minimum synchronized interactions:

- Table row selection opens the existing drawer and updates selected workorder and machine context.
- Insight selection highlights related entities, focuses a related chart, marks the insight active, and opens a matching workorder drawer when the entity is visible locally.
- Chart focus records the selected chart and propagates related entity highlights back to the table.
- Time range actions update both `timeRange` and `synchronizedTimeRange` for subsequent Copilot preview context.

## Safety Rules

- Unknown targets and charts are rejected locally and written to action history.
- Empty or malformed entity payloads are rejected by the existing UI action validation.
- Entity references that are not visible in the current local result set do not force backend refreshes or writeback.
- Synchronization is local-only. It does not call mutation APIs and does not change ToolRuntime behavior.

## Diagnostics

The assistant panel includes compact collapsible diagnostics:

- selected entity context
- focused chart
- active insight count
- synchronized time range
- highlighted entity count

Applied action summaries remain visible in assistant messages.

## Known Limitations

- Entity validity is checked only against the current local result set where the UI has enough data.
- Chart-to-entity relationships use current dashboard rows and simple local derivation.
- Time range synchronization is stored for UI and preview context; it does not trigger a backend data reload yet.
- Detail drawer opening still uses the existing read-only detail fetch behavior.

## Next Step: 5D Explainability

Round 5D should explain why each synchronized focus change occurred, including source insight, evidence, related entities, and rejected synchronization reasons in a user-facing trace.
