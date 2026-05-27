# Spec 020 Hoya UI Conversational Visualization Runtime

This implementation adds the Hoya UI side of the conversational visualization runtime for Maintenance Workorder Tracking. Agentic Core remains the source for Copilot preview generation; Hoya UI owns only response normalization, UI action validation, and local visualization state changes.

## Relationship With Agentic Core

Hoya UI calls the Agentic Core read-only preview endpoint:

`POST /api/operations-workspace/copilot/preview`

The frontend base URL is configured by `VITE_AGENTIC_CORE_API_BASE_URL` and defaults to `http://localhost:8100`. The API response is treated as a structured preview, not a command stream. Hoya UI does not write back to Agentic Core, the Maintenance Runtime API, or any production system.

The Agentic Core `app-ts` implementation was used as a reference for shared contracts and runtime behavior. The copied Hoya modules live in:

- `src/types/operationsWorkspace.ts`
- `src/services/operationsWorkspaceContracts.ts`
- `src/services/operationsWorkspaceRuntime.ts`
- `src/services/operationsWorkspaceCopilotApi.ts`
- `src/hooks/useOperationsWorkspaceRuntime.ts`

## UI Action Flow

1. The existing Maintenance Copilot panel sends the user message and current local context to Agentic Core.
2. `operationsWorkspaceCopilotApi` normalizes `assistant_text`, `insights`, and `ui_actions`.
3. Contract validation marks each action preview as valid or rejected.
4. The Copilot panel renders assistant text, insights, and a UI action summary.
5. Valid actions with known Hoya targets are applied to local visualization state.
6. Invalid, writeback-like, or unknown-target actions do not mutate local state.

## Supported Mutations

These mutations are frontend-only:

- `set_filter`: updates Maintenance Workorder table filters.
- `clear_filter`: clears table filters.
- `sort_table`: updates local table sorting.
- `open_detail_panel`: opens the existing workorder detail drawer when the workorder is in the current result set.
- `focus_chart`: applies a subtle focus ring to a known chart card.
- `set_time_range`: stores local runtime time range state for preview context.
- `highlight_entities`: highlights matching workorder rows by workorder, equipment, or internal ID.

Known targets are limited to the Maintenance Workorder Tracking surface: `workorder_table`, `workorder_drawer`, `maintenance_dashboard`, `mttr_trend_chart`, `delay_reasons_chart`, `maintenance_frequency_chart`, and `maintenance_history_signals`.

## Safety Rules

- Writeback-like actions such as create, update, delete, approve, commit, write, or mutate are rejected.
- Unknown action types are rejected.
- Unknown Hoya UI targets are ignored safely.
- Invalid action payloads are rendered in the Copilot action summary but do not mutate state.
- No backend mutation calls are introduced.
- The implementation does not execute production commands.

## Known Limitations

- `open_detail_panel` only opens workorders present in the current local result set.
- `set_time_range` is stored in local runtime state but does not yet reload Maintenance Runtime API data.
- Chart focus is intentionally non-invasive and limited to a visual ring.
- Row highlighting is best effort and only matches currently rendered rows.

## Next Step

The next phase is 5C synchronization: align Agentic Core generated targets, entity IDs, and time range semantics with the Hoya UI runtime so action previews become consistent across customer deployments.
