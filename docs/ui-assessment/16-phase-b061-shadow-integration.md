# Phase B0.6.1 Shadow Integration

## What changed

`MaintenanceWorkorderTrackingPage.tsx` now has a local `WORKORDER_WIDGET_SHADOW_MODE_ENABLED` flag and a shadow-only diagnostics path for the workorder widget registry pipeline.

When enabled, the page takes the existing Agentic Core `preview.workspace_payload` after the preview response is already available and runs:

1. `adaptWorkorderAgentPayloadToWidgets(payload)`
2. `validateWidgetList(widgets, maintenanceWorkordersSurface)`
3. internal diagnostics capture

The shared helper is `buildWorkorderWidgetShadowDiagnostics(payload, options?)` in `src/ui-registry/adapters/workorderShadowDiagnostics.ts`.

## Flag Behavior

`WORKORDER_WIDGET_SHADOW_MODE_ENABLED` defaults to `false`.

With the default value, the adapter and validation helper are not executed by the page. Developers can manually flip the local constant to validate real preview payloads without changing routes, API contracts, or visible UI.

## Why There Is No User-Visible Change

The integration point is inside `handleSendMessage`, after `previewRequest` returns and before the existing assistant message append. The current table, charts, drawer, KPI cards, assistant structured blocks, `WorkspacePayloadInsight`, and live UI action handling remain unchanged.

No widget renderer is called from the page. No widget fallback output is mounted. No readonly widget action callback is added.

## Diagnostics Captured

The internal diagnostics model captures:

- `adaptedWidgetCount`
- `validationValid`
- `errorCount`
- `warningCount`
- `lastPayloadType`
- `intent`

Unexpected adapter or validation failures are caught by the helper. The page remains usable and does not show a user-facing error. The page may emit a development-only `console.warn` when the flag is enabled.

## Remaining Gaps Before Visible Preview

- Add a separate developer-only preview flag before mounting `renderUiWidgetList`.
- Define layout constraints for assistant drawer rendering so generic widgets do not regress scroll width or density.
- Decide whether readonly widget actions stay non-interactive or map to explicit local-only page behavior.
- Extend tests to cover visible preview markup only after a preview flag exists.
- Collect real preview payload diagnostics before replacing or augmenting any production UI.

## Rollback

1. Set `WORKORDER_WIDGET_SHADOW_MODE_ENABLED` back to `false` if it was manually enabled.
2. Remove the helper import, diagnostics state setter, and guarded call from `MaintenanceWorkorderTrackingPage.tsx`.
3. Remove `src/ui-registry/adapters/workorderShadowDiagnostics.ts` and its exports from `src/ui-registry/index.ts` if the helper is no longer needed.
