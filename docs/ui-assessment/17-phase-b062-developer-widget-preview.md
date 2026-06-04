# Phase B0.6.2 Developer Widget Preview

## Flags

`MaintenanceWorkorderTrackingPage.tsx` now has two local widget registry flags:

- `WORKORDER_WIDGET_SHADOW_MODE_ENABLED = false`
- `WORKORDER_WIDGET_DEV_PREVIEW_ENABLED = false`

The developer preview only renders when both flags are manually set to `true`.

## Location

The preview panel is inside the existing AI Operations Copilot assistant message body, directly below the existing `WorkspacePayloadInsight` block. It does not replace the KPI cards, table, analytics charts, workorder drawer, assistant text, structured insight blocks, or existing UI action diagnostics.

## Manual Enablement

For local developer validation only:

1. Open `src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx`.
2. Set `WORKORDER_WIDGET_SHADOW_MODE_ENABLED` to `true`.
3. Set `WORKORDER_WIDGET_DEV_PREVIEW_ENABLED` to `true`.
4. Start the UI locally and send a Copilot message that returns a `workspace_payload`.

Normal builds keep both flags disabled by default.

## Rendered Content

The panel is labeled `Developer Widget Registry Preview` and renders:

- widget count
- validation status
- validation error count
- validation warning count
- payload type, when present
- payload intent, when present
- widget output from `renderUiWidgetList`

The panel does not show raw JSON by default and does not expose stack traces.

## Safety

The preview model is built from the existing `previewRequest(...)` response payload. It does not add backend/API calls and does not change API contracts.

Read-only widget actions use a developer-only no-op handler. Clicking a preview action does not mutate page state, apply filters, open drawers, call backend services, or execute write-back behavior.

Normal users are unaffected because both flags default to `false`; with either flag disabled, the preview panel is not mounted and the existing layout remains unchanged.

## Rollback

1. Keep or reset both flags to `false`.
2. Remove `DeveloperWidgetRegistryPreview` and its gated render branch from `MaintenanceWorkorderTrackingPage.tsx`.
3. Remove `src/ui-registry/adapters/workorderWidgetPreviewModel.ts` and its exports from `src/ui-registry/index.ts`.
4. Remove `tests/ui-registry-workorder-dev-preview.test.tsx`.

## Remaining Gap

B0.6.2 is still developer-only preview rendering. A controlled region pilot still needs a separate feature flag, UX acceptance criteria, explicit region ownership, visual regression coverage, and a safe production rollout plan before any registry-rendered widget replaces or augments a normal user-facing region.
